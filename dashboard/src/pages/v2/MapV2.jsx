import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { APIProvider, Map as GoogleMap, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import {
    ExternalLink, Filter, Eye, MousePointer2, Map, Loader2,
    Tag, CalendarClock, Play, Pause, RotateCcw, ChevronRight,
} from 'lucide-react';
import V2Shell from './V2Shell';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '';

const MAP_STYLES = [
    { elementType: 'geometry', stylers: [{ color: '#080a0f' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#4a5568' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#080a0f' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a1f2e' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2d3748' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
    { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#2d3748' }, { weight: 0.5 }] },
];

// Cosmetic mapping: DB status value → display label + color
const LEAD_STATUS_META = {
    scouted:            { label: 'Scouted',    color: '#6366f1' },
    published:          { label: 'Published',  color: '#8b5cf6' },
    pitched:            { label: 'Pitched',    color: '#f59e0b' },
    warmed:             { label: 'Warmed',     color: '#3b82f6' },
    interest_confirmed: { label: 'Interested', color: '#10b981' },
    completed:          { label: 'Closed',     color: '#22c55e' },
    error:              { label: 'Error',      color: '#ef4444' },
    invalid:            { label: 'Invalid',    color: '#3f3f46' },
};

const STATUS_ORDER = ['scouted', 'published', 'pitched', 'warmed', 'interest_confirmed', 'completed', 'invalid', 'error'];

function getStatusColor(status) {
    return (LEAD_STATUS_META[status] || { color: '#52525b' }).color;
}

function getCustomerColor(lead) {
    const logins = lead.login_count || 0;
    const views  = lead.views || 0;
    if (logins > 0) return '#f59e0b';   // amber — active login
    if (views > 0)  return '#6366f1';   // indigo — retargeted/viewed
    return '#52525b';                   // zinc — cold
}

// ─── Map auto-bounds ────────────────────────────────────────────────────────
function MapUpdater({ leads }) {
    const map = useMap();
    useEffect(() => {
        if (!map || leads.length === 0) return;
        const bounds = new window.google.maps.LatLngBounds();
        leads.forEach(l => {
            const lat = parseFloat(l.lat), lng = parseFloat(l.lng);
            if (!isNaN(lat) && !isNaN(lng)) bounds.extend({ lat, lng });
        });
        map.fitBounds(bounds, { padding: 80 });
        window.google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
            if (map.getZoom() > 14) map.setZoom(14);
        });
    }, [map, leads]);
    return null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function startOfDay(d) {
    const r = new Date(d); r.setHours(0, 0, 0, 0); return r;
}
function fmtDate(d) {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function MapV2() {
    const navigate = useNavigate();

    // Data
    const [leads, setLeads]     = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);

    // Mode: 'customer' | 'status' | 'timeline'
    const [mode, setMode] = useState('customer');

    // Mode 1 sub-filter
    const [customerFilter, setCustomerFilter] = useState('all');

    // Mode 3 — date filter + playback
    const [dateFilter, setDateFilter]     = useState('all');
    const [playbackDate, setPlaybackDate] = useState(null);   // Date object | null
    const [isPlaying, setIsPlaying]       = useState(false);
    const [playbackMin, setPlaybackMin]   = useState(null);
    const [playbackMax, setPlaybackMax]   = useState(null);
    const [playbackSpeed, setPlaybackSpeed] = useState('slow'); // 'slow' | 'normal' | 'fast'
    const intervalRef = useRef(null);

    // Speed config: { ms: interval delay, step: days per tick }
    const SPEED_CONFIG = { slow: { ms: 1200, step: 1 }, normal: { ms: 500, step: 1 }, fast: { ms: 120, step: 3 } };

    useEffect(() => {
        fetchLeads();
        const ch = supabase.channel('v2:map')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, fetchLeads)
            .subscribe();
        return () => supabase.removeChannel(ch);
    }, []);

    async function fetchLeads() {
        try {
            const { data } = await supabase
                .from('leads')
                .select('*')
                .not('lat', 'is', null)
                .not('lng', 'is', null);
            if (data) {
                setLeads(data);
                // Compute playback bounds from data
                const dates = data.map(l => new Date(l.created_at)).filter(d => !isNaN(d));
                if (dates.length) {
                    const min = new Date(Math.min(...dates));
                    const max = new Date(Math.max(...dates));
                    setPlaybackMin(startOfDay(min));
                    setPlaybackMax(max);
                    setPlaybackDate(startOfDay(min));
                }
            }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }

    // ── Playback control ────────────────────────────────────────────────────
    const stopPlayback = useCallback(() => {
        clearInterval(intervalRef.current);
        setIsPlaying(false);
    }, []);

    const startPlayback = useCallback((speed) => {
        // Safe check for React SyntheticEvent (event.nativeEvent exists if it's an event object)
        const activeSpeed = (speed && typeof speed === 'string') ? speed : playbackSpeed;
        const cfg = SPEED_CONFIG[activeSpeed];
        if (!cfg) return; 
        
        setIsPlaying(true);
        intervalRef.current = setInterval(() => {
            setPlaybackDate(prev => {
                if (!prev || !playbackMax) return prev;
                const next = new Date(prev.getTime() + cfg.step * 24 * 60 * 60 * 1000);
                if (next > playbackMax) {
                    clearInterval(intervalRef.current);
                    setIsPlaying(false);
                    return playbackMax;
                }
                return next;
            });
        }, cfg.ms);
    }, [playbackMax, playbackSpeed]);

    const resetPlayback = useCallback(() => {
        stopPlayback();
        if (playbackMin) setPlaybackDate(new Date(playbackMin));
    }, [stopPlayback, playbackMin]);

    useEffect(() => () => clearInterval(intervalRef.current), []);

    // ── Filtered leads per mode ─────────────────────────────────────────────
    const visibleLeads = (() => {
        if (mode === 'customer') {
            return leads.filter(l => {
                if (customerFilter === 'viewed')  return (l.views || 0) > 0;
                if (customerFilter === 'engaged') return (l.login_count || 0) > 0;
                return true;
            });
        }
        if (mode === 'status') {
            return leads; // show all, color by status
        }
        if (mode === 'timeline') {
            const now = new Date();
            let dateFiltered = leads;
            if (dateFilter !== 'all') {
                const cutoff = new Date(now);
                if (dateFilter === 'today') cutoff.setHours(0, 0, 0, 0);
                if (dateFilter === 'week')  cutoff.setDate(now.getDate() - 7);
                if (dateFilter === 'month') cutoff.setDate(now.getDate() - 30);
                dateFiltered = leads.filter(l => new Date(l.created_at) >= cutoff);
            }
            // Apply playback cursor if present
            if (playbackDate) {
                return dateFiltered.filter(l => new Date(l.created_at) <= playbackDate);
            }
            return dateFiltered;
        }
        return leads;
    })();

    // Marker color per mode
    function markerColor(lead) {
        if (mode === 'status')   return getStatusColor(lead.status);
        if (mode === 'customer') return getCustomerColor(lead);
        // timeline: color by status too
        return getStatusColor(lead.status);
    }

    // Playback progress 0-1
    const playbackProgress = (() => {
        if (!playbackMin || !playbackMax || !playbackDate) return 0;
        const total = playbackMax - playbackMin;
        if (total === 0) return 1;
        return Math.min(1, (playbackDate - playbackMin) / total);
    })();

    if (!GOOGLE_MAPS_API_KEY) {
        return (
            <V2Shell>
                <div className="p-6 flex items-center justify-center h-96">
                    <div className="text-center text-zinc-500">
                        <Map className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p className="font-medium">Google Maps API key not configured</p>
                        <p className="text-sm mt-1">Add VITE_GOOGLE_PLACES_API_KEY to .env</p>
                    </div>
                </div>
            </V2Shell>
        );
    }

    return (
        <V2Shell>
            <div className="p-8 h-screen flex flex-col gap-4 overflow-hidden">

                {/* ── Header ── */}
                <div className="flex items-center justify-between flex-shrink-0">
                    <div>
                        <h1 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                            <Map className="w-6 h-6 text-amber-500" /> Geospatial Intelligence
                        </h1>
                        <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest mt-1.5 opacity-60">
                            {visibleLeads.length} leads visible · Riyadh Metropolitan Area
                        </p>
                    </div>

                    {/* ── Mode selector ── */}
                    <div className="flex items-center gap-2 p-1 bg-obsidian-surface-low border border-white/5 rounded-2xl shadow-xl">
                        {[
                            { id: 'customer', label: 'Customer Interaction', icon: MousePointer2 },
                            { id: 'status',   label: 'Lead Status',          icon: Tag },
                            { id: 'timeline', label: 'Date & Timeline',      icon: CalendarClock },
                        ].map(m => (
                            <button
                                key={m.id}
                                onClick={() => { setMode(m.id); stopPlayback(); }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                    ${mode === m.id
                                        ? 'bg-amber-500/10 border border-amber-500/25 text-amber-400 shadow-inner'
                                        : 'text-zinc-500 hover:text-zinc-300 border border-transparent'}`}
                            >
                                <m.icon className="w-3.5 h-3.5" /> {m.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Mode 1 sub-filters ── */}
                {mode === 'customer' && (
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {[
                            { key: 'all',     label: 'ALL SOURCES', icon: Filter },
                            { key: 'viewed',  label: 'RETARGETED',  icon: Eye },
                            { key: 'engaged', label: 'ACTIVE LOGIN', icon: MousePointer2 },
                        ].map(f => (
                            <button key={f.key} onClick={() => setCustomerFilter(f.key)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all shadow-lg
                                    ${customerFilter === f.key
                                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-amber-500/5'
                                        : 'bg-obsidian-surface-low border-white/5 text-zinc-500 hover:text-zinc-300 hover:border-white/10'}`}>
                                <f.icon className="w-3.5 h-3.5" /> {f.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* ── Mode 3 date filter ── */}
                {mode === 'timeline' && (
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {[
                            { key: 'today', label: 'TODAY' },
                            { key: 'week',  label: 'THIS WEEK' },
                            { key: 'month', label: 'THIS MONTH' },
                            { key: 'all',   label: 'ALL TIME' },
                        ].map(f => (
                            <button key={f.key} onClick={() => { setDateFilter(f.key); resetPlayback(); }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all shadow-lg
                                    ${dateFilter === f.key
                                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                        : 'bg-obsidian-surface-low border-white/5 text-zinc-500 hover:text-zinc-300 hover:border-white/10'}`}>
                                <CalendarClock className="w-3.5 h-3.5" /> {f.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* ── Map card ── */}
                <div className="flex-1 rounded-[2.5rem] overflow-hidden border border-white/5 relative shadow-inner bg-obsidian-dark min-h-0">
                    {loading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-obsidian-dark/95 backdrop-blur-xl">
                            <div className="text-center">
                                <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3 opacity-40" />
                                <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Compiling Spatial Data...</span>
                            </div>
                        </div>
                    )}

                    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                        <GoogleMap
                            defaultCenter={{ lat: 24.7136, lng: 46.6753 }}
                            defaultZoom={11}
                            mapId="ksa_verified_v2_map"
                            options={{ mapTypeControl: false, streetViewControl: false, styles: MAP_STYLES }}
                        >
                            <MapUpdater leads={visibleLeads} />

                            {visibleLeads.map(lead => {
                                const lat = parseFloat(lead.lat), lng = parseFloat(lead.lng);
                                if (isNaN(lat) || isNaN(lng)) return null;
                                const color = markerColor(lead);
                                return (
                                    <AdvancedMarker key={lead.place_id} position={{ lat, lng }} onClick={() => setSelected(lead)}>
                                        <div
                                            className="w-3.5 h-3.5 rounded-full border-2 border-white/60 cursor-pointer hover:scale-150 transition-transform duration-150"
                                            style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}90` }}
                                        />
                                    </AdvancedMarker>
                                );
                            })}

                            {selected && (
                                <InfoWindow
                                    position={{ lat: parseFloat(selected.lat), lng: parseFloat(selected.lng) }}
                                    onCloseClick={() => setSelected(null)}
                                >
                                    <div className="p-4 bg-obsidian-surface-high text-white min-w-[240px] rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.05] to-transparent pointer-events-none" />
                                        <h3 className="text-xs font-black uppercase tracking-tight mb-1 relative z-10">{selected.name}</h3>
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-4 truncate max-w-[240px] opacity-60 relative z-10">{selected.address}</p>

                                        {/* Status badge */}
                                        <div className="flex items-center gap-2 mb-4 relative z-10">
                                            <div className="w-2 h-2 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: getStatusColor(selected.status) }} />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                                {(LEAD_STATUS_META[selected.status] || { label: selected.status || 'Unknown' }).label}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3 mb-4 relative z-10">
                                            <div className="bg-obsidian-dark/50 p-2.5 rounded-xl border border-white/5 text-center">
                                                <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest mb-1">Views</p>
                                                <p className="text-xs font-black text-amber-500">{selected.views || 0}</p>
                                            </div>
                                            <div className="bg-obsidian-dark/50 p-2.5 rounded-xl border border-white/5 text-center">
                                                <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest mb-1">Logins</p>
                                                <p className="text-xs font-black text-emerald-500">{selected.login_count || 0}</p>
                                            </div>
                                            <div className="bg-obsidian-dark/50 p-2.5 rounded-xl border border-white/5 text-center">
                                                <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest mb-1">Sync</p>
                                                <div className="flex justify-center">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mt-1" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2 relative z-10">
                                            {selected.vercel_url && (
                                                <a href={selected.vercel_url} target="_blank" rel="noreferrer"
                                                    className="flex items-center justify-center gap-2 py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-black uppercase tracking-widest rounded-xl w-full transition-all shadow-lg active:scale-95">
                                                    <ExternalLink className="w-3.5 h-3.5" /> Teleport to Site
                                                </a>
                                            )}
                                            <button onClick={() => navigate(`/admin-v2/pipeline/${selected.place_id}`)}
                                                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-obsidian-surface-highest border border-white/10 hover:border-amber-500/50 text-white text-[10px] font-black uppercase tracking-widest rounded-xl w-full transition-all active:scale-95">
                                                <Eye className="w-3.5 h-3.5 text-amber-500" /> Deep Profile
                                            </button>
                                        </div>
                                    </div>
                                </InfoWindow>
                            )}
                        </GoogleMap>
                    </APIProvider>

                    {/* ── Status Legend (mode = status) ── */}
                    {mode === 'status' && (
                        <div className="absolute bottom-5 left-5 z-10 bg-obsidian-surface-high/90 backdrop-blur-xl border border-white/8 rounded-2xl px-4 py-3 shadow-2xl">
                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-2.5">Lead Status</p>
                            <div className="flex flex-col gap-1.5">
                                {STATUS_ORDER.filter(s => s !== 'error').map(s => {
                                    const meta = LEAD_STATUS_META[s];
                                    const count = leads.filter(l => l.status === s).length;
                                    return (
                                        <div key={s} className="flex items-center gap-2.5">
                                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: meta.color, boxShadow: `0 0 6px ${meta.color}80` }} />
                                            <span className="text-[10px] font-bold text-zinc-300 w-20">{meta.label}</span>
                                            <span className="text-[9px] font-black text-zinc-600 ml-auto">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Customer Interaction Legend ── */}
                    {mode === 'customer' && (
                        <div className="absolute bottom-5 left-5 z-10 bg-obsidian-surface-high/90 backdrop-blur-xl border border-white/8 rounded-2xl px-4 py-3 shadow-2xl">
                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-2.5">Engagement</p>
                            {[
                                { color: '#f59e0b', label: 'Active Login' },
                                { color: '#6366f1', label: 'Retargeted' },
                                { color: '#52525b', label: 'Cold' },
                            ].map(({ color, label }) => (
                                <div key={label} className="flex items-center gap-2.5 mb-1.5 last:mb-0">
                                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}80` }} />
                                    <span className="text-[10px] font-bold text-zinc-300">{label}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Timeline Playback (mode = timeline) ── */}
                    {mode === 'timeline' && playbackMin && playbackMax && (
                        <div className="absolute bottom-5 left-5 right-5 z-10 bg-obsidian-surface-high/90 backdrop-blur-xl border border-white/8 rounded-2xl px-5 py-4 shadow-2xl">
                            <div className="flex items-center gap-4">
                                {/* Controls */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button onClick={resetPlayback}
                                        className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 flex items-center justify-center text-zinc-400 hover:text-white transition-all">
                                        <RotateCcw className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={isPlaying ? stopPlayback : () => startPlayback()}
                                        className="w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 shadow-lg shadow-amber-500/20 flex items-center justify-center text-black transition-all active:scale-95">
                                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                                    </button>
                                    {/* Speed selector */}
                                    <div className="flex items-center gap-1 ml-1">
                                        {[['slow','1×'],['normal','2×'],['fast','5×']].map(([key, label]) => (
                                            <button key={key}
                                                onClick={() => {
                                                    setPlaybackSpeed(key);
                                                    if (isPlaying) { stopPlayback(); setTimeout(() => startPlayback(key), 50); }
                                                }}
                                                className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all
                                                    ${playbackSpeed === key
                                                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                                                        : 'bg-white/5 border-white/8 text-zinc-500 hover:text-zinc-300'}`}>
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Scrubber */}
                                <div className="flex-1 flex flex-col gap-1.5">
                                    <div className="flex justify-between">
                                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{fmtDate(playbackMin)}</span>
                                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">{playbackDate ? fmtDate(playbackDate) : '—'}</span>
                                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{fmtDate(playbackMax)}</span>
                                    </div>
                                    {/* Track */}
                                    <div className="relative h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500"
                                            style={{ width: `${playbackProgress * 100}%` }}
                                        />
                                        {/* Draggable thumb — click on track to seek */}
                                        <input
                                            type="range" min={0} max={100} step={0.1}
                                            value={playbackProgress * 100}
                                            onChange={e => {
                                                stopPlayback();
                                                const t = parseFloat(e.target.value) / 100;
                                                const ts = playbackMin.getTime() + t * (playbackMax.getTime() - playbackMin.getTime());
                                                setPlaybackDate(new Date(ts));
                                            }}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                    </div>
                                </div>

                                {/* Count badge */}
                                <div className="flex-shrink-0 flex items-center gap-1.5">
                                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                                    <span className="text-sm font-black text-white">{visibleLeads.length}</span>
                                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">leads</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </V2Shell>
    );
}
