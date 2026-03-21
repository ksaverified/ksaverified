import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
    ChevronLeft, Globe, Phone, Mail, MapPin, 
    Calendar, Clock, CreditCard, Unlock, Lock,
    CheckCircle, AlertTriangle, User, Hash,
    ExternalLink, Edit2, Save, X, BarChart2,
    Monitor, Tablet, Smartphone, Search
} from 'lucide-react';
import V2Shell from './V2Shell';

const STAGES = [
    { key: 'scouted', label: 'Scouted', color: '#6366f1', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400' },
    { key: 'published', label: 'Published', color: '#8b5cf6', bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
    { key: 'pitched', label: 'Pitched', color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
    { key: 'warmed', label: 'Warmed', color: '#3b82f6', bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' },
    { key: 'interest_confirmed', label: 'Interested', color: '#10b981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
    { key: 'completed', label: 'Closed', color: '#22c55e', bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400' },
];

function getStage(key) {
    return STAGES.find(s => s.key === key) || { color: '#52525b', bg: 'bg-zinc-800', border: 'border-zinc-700', text: 'text-zinc-400', label: key };
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-SA', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function DeviceIcon({ device }) {
    const d = device?.toLowerCase() || '';
    if (d.includes('mobile') || d.includes('phone')) return <Smartphone className="w-3.5 h-3.5" />;
    if (d.includes('tablet')) return <Tablet className="w-3.5 h-3.5" />;
    return <Monitor className="w-3.5 h-3.5" />;
}

export default function LeadDetailV2() {
    const { placeId } = useParams();
    const navigate = useNavigate();
    const [lead, setLead] = useState(null);
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Edit states
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});

    // Unlock states
    const [unlockHours, setUnlockHours] = useState('0'); // '0' = permanent
    const [subPrice, setSubPrice] = useState('99');

    const fetchData = useCallback(async () => {
        try {
            const { data: leadData } = await supabase.from('leads').select('*').eq('place_id', placeId).single();
            if (leadData) {
                setLead(leadData);
                setEditData(leadData);
                setSubPrice(leadData.subscription_price || '99');
            }

            const { data: visitsData } = await supabase.from('visits')
                .select('*')
                .eq('lead_id', placeId)
                .order('created_at', { ascending: false })
                .limit(10);
            if (visitsData) setVisits(visitsData);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [placeId]);

    useEffect(() => {
        fetchData();
        const ch = supabase.channel(`lead:${placeId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leads', filter: `place_id=eq.${placeId}` }, fetchData)
            .subscribe();
        return () => supabase.removeChannel(ch);
    }, [fetchData, placeId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase.from('leads').update({
                mobile: editData.mobile,
                contact_name: editData.contact_name,
                contact_mobile: editData.contact_mobile,
                contact_email: editData.contact_email,
                area: editData.area,
                neighborhood: editData.neighborhood,
                subscription_price: parseFloat(subPrice) || 99,
                updated_at: new Date().toISOString()
            }).eq('place_id', placeId);

            if (error) throw error;
            setIsEditing(false);
            fetchData();
        } catch (e) {
            alert('Failed to save: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleUnlock = async () => {
        setSaving(true);
        try {
            let unlockUntil = null;
            if (unlockHours !== '0') {
                const now = new Date();
                now.setHours(now.getHours() + parseInt(unlockHours));
                unlockUntil = now.toISOString();
            }

            const { error } = await supabase.from('leads').update({
                is_unlocked: true,
                unlock_until: unlockUntil,
                updated_at: new Date().toISOString()
            }).eq('place_id', placeId);

            if (error) throw error;
            fetchData();
        } catch (e) {
            alert('Failed to unlock: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleLock = async () => {
        setSaving(true);
        try {
            const { error } = await supabase.from('leads').update({
                is_unlocked: false,
                unlock_until: null,
                updated_at: new Date().toISOString()
            }).eq('place_id', placeId);

            if (error) throw error;
            fetchData();
        } catch (e) {
            alert('Failed to lock: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <V2Shell>
            <div className="h-full flex items-center justify-center text-zinc-500 animate-pulse">Loading lead details...</div>
        </V2Shell>
    );

    if (!lead) return (
        <V2Shell>
            <div className="p-6">
                <button onClick={() => navigate('/admin-v2/pipeline')} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Back to Pipeline
                </button>
                <div className="mt-20 text-center">
                    <AlertTriangle className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white">Lead Not Found</h2>
                    <p className="text-zinc-500">The lead you're looking for doesn't exist or has been removed.</p>
                </div>
            </div>
        </V2Shell>
    );

    const stage = getStage(lead.status);
    const isCurrentlyUnlocked = lead.is_unlocked && (!lead.unlock_until || new Date(lead.unlock_until) > new Date());

    return (
        <V2Shell>
            <div className="p-6 max-w-6xl mx-auto space-y-6 pb-20">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <button onClick={() => navigate('/admin-v2/pipeline')} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-2 text-xs font-medium">
                            <ChevronLeft className="w-3.5 h-3.5" /> PIPELINE
                        </button>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-white">{lead.name}</h1>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${stage.bg} ${stage.border} ${stage.text}`}>
                                {stage.label}
                            </span>
                        </div>
                        <p className="text-zinc-500 flex items-center gap-1.5 text-sm">
                            <MapPin className="w-3.5 h-3.5" /> {lead.address}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {lead.vercel_url && (
                            <a href={lead.vercel_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-sm font-semibold transition-all">
                                <Globe className="w-4 h-4" /> View Site <ExternalLink className="w-3 h-3" />
                            </a>
                        )}
                        {!isEditing ? (
                            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-semibold transition-all">
                                <Edit2 className="w-4 h-4" /> Edit Info
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-zinc-500 hover:text-white text-sm font-semibold">Cancel</button>
                                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-sm font-bold transition-all disabled:opacity-50">
                                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-6">
                    {/* Left Column: Info & Visits */}
                    <div className="col-span-8 space-y-6">
                        {/* Business Details Card */}
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-2">
                                <Hash className="w-4 h-4 text-zinc-500" />
                                <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">Business Information</h3>
                            </div>
                            <div className="p-6 grid grid-cols-2 gap-x-12 gap-y-6">
                                <div className="space-y-4">
                                    <DetailItem label="Official Phone" value={lead.phone} icon={Phone} isEditing={isEditing} 
                                        renderEdit={() => <input className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm" value={editData.phone || ''} readOnly />} />
                                    <DetailItem label="Mobile Number" value={lead.mobile} icon={Smartphone} isEditing={isEditing}
                                        renderEdit={() => <input className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-sm focus:border-indigo-500 outline-none" 
                                            value={editData.mobile || ''} onChange={e => setEditData({...editData, mobile: e.target.value})} />} />
                                    <DetailItem label="Area / City" value={lead.area} icon={MapPin} isEditing={isEditing}
                                        renderEdit={() => <input className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-sm focus:border-indigo-500 outline-none" 
                                            value={editData.area || ''} onChange={e => setEditData({...editData, area: e.target.value})} />} />
                                    <DetailItem label="Neighborhood" value={lead.neighborhood} icon={Search} isEditing={isEditing}
                                        renderEdit={() => <input className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-sm focus:border-indigo-500 outline-none" 
                                            value={editData.neighborhood || ''} onChange={e => setEditData({...editData, neighborhood: e.target.value})} />} />
                                </div>
                                <div className="space-y-4">
                                    <DetailItem label="Contact Name" value={lead.contact_name} icon={User} isEditing={isEditing}
                                        renderEdit={() => <input className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-sm focus:border-indigo-500 outline-none" 
                                            value={editData.contact_name || ''} onChange={e => setEditData({...editData, contact_name: e.target.value})} />} />
                                    <DetailItem label="Contact Mobile" value={lead.contact_mobile} icon={Phone} isEditing={isEditing}
                                        renderEdit={() => <input className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-sm focus:border-indigo-500 outline-none" 
                                            value={editData.contact_mobile || ''} onChange={e => setEditData({...editData, contact_mobile: e.target.value})} />} />
                                    <DetailItem label="Contact Email" value={lead.contact_email} icon={Mail} isEditing={isEditing}
                                        renderEdit={() => <input className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-sm focus:border-indigo-500 outline-none" 
                                            value={editData.contact_email || ''} onChange={e => setEditData({...editData, contact_email: e.target.value})} />} />
                                    <div className="pt-2">
                                        <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block mb-1">Coordinates</label>
                                        <p className="text-xs text-zinc-400 font-mono">{lead.lat}, {lead.lng}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Visits Table */}
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <BarChart2 className="w-4 h-4 text-zinc-500" />
                                    <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">Recent Website Visits</h3>
                                </div>
                                <div className="text-[10px] font-bold text-zinc-600 bg-zinc-800/50 px-2 py-1 rounded-lg">LAST 10</div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-zinc-800 bg-zinc-900/30">
                                            <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Time</th>
                                            <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">IP Address</th>
                                            <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Location</th>
                                            <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Device</th>
                                            <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Browser</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800/50">
                                        {visits.map(v => (
                                            <tr key={v.id} className="hover:bg-zinc-800/20 transition-colors">
                                                <td className="px-6 py-3">
                                                    <p className="text-xs text-zinc-300 font-medium">{formatDate(v.created_at).split(',')[1]}</p>
                                                    <p className="text-[10px] text-zinc-600">{formatDate(v.created_at).split(',')[0]}</p>
                                                </td>
                                                <td className="px-6 py-3 text-xs text-zinc-400 font-mono">{v.ip_address || '—'}</td>
                                                <td className="px-6 py-3 text-xs text-zinc-400">{v.location || '—'}</td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                                                        <DeviceIcon device={v.device} /> {v.device || 'Unknown'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-xs text-zinc-500 truncate max-w-[120px]" title={v.browser}>
                                                    {v.browser?.split(' ')[0] || '—'}
                                                </td>
                                            </tr>
                                        ))}
                                        {visits.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center text-zinc-600 text-sm italic">No visit data recorded yet</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Billing & Status */}
                    <div className="col-span-4 space-y-6">
                        {/* Status & Timing Card */}
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Pipeline & Timing</h3>
                            <div className="space-y-4">
                                <TimingItem label="Scouted At" date={lead.created_at} icon={Clock} />
                                <TimingItem label="Website Created" date={lead.website_created_at || lead.created_at} icon={Calendar} />
                                <TimingItem label="Last Retouched" date={lead.website_retouched_at} icon={Edit2} />
                                <div className="pt-2 flex items-center justify-between">
                                    <span className="text-xs text-zinc-500">First Visit</span>
                                    <span className="text-xs text-zinc-300 font-medium">{formatDate(visits[visits.length-1]?.created_at)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-zinc-500">Last Visit</span>
                                    <span className="text-xs text-emerald-400 font-bold">{visits[0] ? formatDate(visits[0].created_at) : '—'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Subscription & Billing Card */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5 shadow-lg relative overflow-hidden">
                            {isCurrentlyUnlocked && (
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                            )}
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Subscription & Unlock</h3>
                                {isCurrentlyUnlocked ? (
                                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold">
                                        <Unlock className="w-3 h-3" /> UNLOCKED
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-800 text-zinc-500 border border-zinc-700 rounded-full text-[10px] font-bold">
                                        <Lock className="w-3 h-3" /> LOCKED
                                    </span>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block mb-2">Monthly Subscription Price</label>
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <input type="number" value={subPrice} onChange={e => setSubPrice(e.target.value)}
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all" />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 font-bold text-xs uppercase tracking-widest">SAR</span>
                                        </div>
                                        <button onClick={handleSave} disabled={saving} className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all">
                                            <Save className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Interaction Status</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-zinc-400">Interest Confirmed</span>
                                        <button onClick={() => setLead({...lead, interest_confirmed: !lead.interest_confirmed})} 
                                            className={`w-10 h-5 rounded-full transition-all relative ${lead.interest_confirmed ? 'bg-indigo-500' : 'bg-zinc-800 text-zinc-600'}`}>
                                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${lead.interest_confirmed ? 'right-1' : 'left-1'}`} />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-zinc-400">Free Week</span>
                                        <select value={lead.free_week_status || 'not_started'} onChange={e => setLead({...lead, free_week_status: e.target.value})}
                                            className="bg-transparent text-xs text-zinc-300 font-bold outline-none cursor-pointer">
                                            <option value="not_started">Not Started</option>
                                            <option value="active">Active</option>
                                            <option value="ended">Ended</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-2 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <select value={unlockHours} onChange={e => setUnlockHours(e.target.value)}
                                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-300 font-bold outline-none focus:border-emerald-500 transition-all">
                                            <option value="0">Permanent Unlock</option>
                                            <option value="2">2 Hours</option>
                                            <option value="24">24 Hours (1 Day)</option>
                                            <option value="72">72 Hours (3 Days)</option>
                                            <option value="168">168 Hours (1 Week)</option>
                                            <option value="720">720 Hours (1 Month)</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={handleLock} disabled={saving || !isCurrentlyUnlocked} 
                                            className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-bold rounded-xl transition-all disabled:opacity-30">
                                            Lock Website
                                        </button>
                                        <button onClick={handleUnlock} disabled={saving || isCurrentlyUnlocked} 
                                            className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl transition-all disabled:opacity-30 shadow-lg shadow-emerald-500/20">
                                            Unlock Now
                                        </button>
                                    </div>
                                    {isCurrentlyUnlocked && lead.unlock_until && (
                                        <p className="text-[10px] text-center text-amber-500 font-bold uppercase tracking-widest mt-1">
                                            EXPIRES: {formatDate(lead.unlock_until)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Totals Metric Card */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Total Visits</p>
                                <p className="text-2xl font-bold text-white">{lead.visit_count || visits.length || 0}</p>
                            </div>
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 text-left">
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Conversion</p>
                                <p className="text-2xl font-bold text-emerald-400">
                                    {lead.status === 'completed' ? '100%' : '0%'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </V2Shell>
    );
}

function DetailItem({ label, value, icon: Icon, isEditing, renderEdit }) {
    return (
        <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest flex items-center gap-1.5">
                <Icon className="w-3 h-3 text-zinc-600" /> {label}
            </label>
            {isEditing ? renderEdit() : <p className="text-sm text-zinc-200 font-medium truncate">{value || '—'}</p>}
        </div>
    );
}

function TimingItem({ label, date, icon: Icon }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-500">
                <Icon className="w-3.5 h-3.5" />
                <span className="text-xs">{label}</span>
            </div>
            <span className="text-xs text-zinc-300 font-medium" title={date}>
                {date ? formatDate(date).split(',')[0] : '—'}
            </span>
        </div>
    );
}
