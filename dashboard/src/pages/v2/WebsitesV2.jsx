import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Globe, ExternalLink, Code, Search, Eye, X, RefreshCcw, Sparkles, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import V2Shell from './V2Shell';

const STATUSES = ['all', 'scouted', 'published', 'pitched', 'warmed', 'interest_confirmed', 'completed', 'invalid'];

const GENERIC_IDS = [
    '1497366216548-37526070297c', // Hero original
    '1522071820081-009f0129c71c', // About original
    '1556761175-4b46a572b786', // Services original
    '1454165804606-c3d57bc86b40', // Common hero secondary
    '1507136566006-bb7aef5537d8', // Common about secondary 
    '1559339352-11d035aa65de', // Common service secondary
    '1511707171634-5f897ff02aa9', // Common alternate secondary
];

const CATEGORIES = [
    'all',
    'Salon & Barber',
    'Repair & Electronics',
    'Food & Restaurant',
    'Fashion & Boutique',
    'Medical & Clinic',
    'Supermarket & Retail',
    'Carwash & Auto',
    'Spa & Care',
    'Gym & Fitness',
    'Flowers & Gifts',
    'Construction',
    'Default / Generic'
];

function getCategory(lead) {
    const str = ((lead.types || []).join(' ') + ' ' + (lead.name || '')).toLowerCase();
    if (str.includes('hair') || str.includes('barber') || str.includes('salon') || str.includes('saloon') || str.includes('grooming') || str.includes('حلاقة') || str.includes('صالون')) return 'Salon & Barber';
    if (str.includes('repair') || str.includes('electronics') || str.includes('computer')) return 'Repair & Electronics';
    if (str.includes('restaurant') || str.includes('cafe') || str.includes('food') || str.includes('hot pot') || str.includes('hotpot') || str.includes('kitchen') || str.includes('dining') || str.includes('grill') || str.includes('bakery') || str.includes('pizza') || str.includes('burger') || str.includes('sushi') || str.includes('diner') || str.includes('eatery') || str.includes('sweets') || str.includes('مطعم') || str.includes('مقهى') || str.includes('مخبز')) return 'Food & Restaurant';
    if (str.includes('boutique') || str.includes('fashion') || str.includes('dress') || str.includes('clothes') || str.includes('ملابس') || str.includes('ازياء')) return 'Fashion & Boutique';
    if (str.includes('clinic') || str.includes('medical') || str.includes('doctor') || str.includes('health') || str.includes('عيادة') || str.includes('طبي') || str.includes('dental') || str.includes('dentist') || str.includes('hospital') || str.includes('optical') || str.includes('optics') || str.includes('glasses') || str.includes('eye') || str.includes('optometrist') || str.includes('بصريات') || str.includes('نظارات')) return 'Medical & Clinic';
    if (str.includes('supermarket') || str.includes('grocery') || str.includes('store') || str.includes('market') || str.includes('بقالة') || str.includes('سوبر')) return 'Supermarket & Retail';
    if (str.includes('carwash') || str.includes('car wash') || str.includes('detailing') || str.includes('غسيل')) return 'Carwash & Auto';
    if (str.includes('spa') || str.includes('massage') || str.includes('beauty parlor') || str.includes('سبا')) return 'Spa & Care';
    if (str.includes('sport') || str.includes('gym') || str.includes('fitness') || str.includes('رياضة')) return 'Gym & Fitness';
    if (str.includes('flower') || str.includes('gift') || str.includes('ورد') || str.includes('هدايا')) return 'Flowers & Gifts';
    if (str.includes('construct') || str.includes('contractor') || str.includes('build') || str.includes('مقاول') || str.includes('بناء')) return 'Construction';
    return 'Default / Generic';
}

export default function WebsitesV2() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [previewHtml, setPreviewHtml] = useState(null);
    const [previewName, setPreviewName] = useState('');
    const [shuffling, setShuffling] = useState(null);

    useEffect(() => {
        fetchWebsites();
    }, []);

    async function fetchWebsites() {
        try {
            const { data } = await supabase
                .from('leads')
                .select('place_id, name, status, vercel_url, website_html, photos, updated_at')
                .not('vercel_url', 'is', null)
                .order('updated_at', { ascending: false });
            if (data) setLeads(data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }

    async function shuffleImages(lead) {
        if (!lead.website_html) return;
        setShuffling(lead.place_id);
        
        try {
            let html = lead.website_html;
            const validPhotos = (lead.photos || []).filter(p => !p.includes('maps/vt/icon') && !p.includes('streetview')); // filter out map icons
            let photoIndex = 0;
            let externalPhotos = [];
            
            // Check if we need more photos from Pexels
            const genericMatches = GENERIC_IDS.filter(id => html.includes(id));
            if (genericMatches.length > validPhotos.length) {
                try {
                    const query = encodeURIComponent(lead.name.split(' ').slice(0, 2).join(' ') || 'business'); // Simplify query
                    const pexelsRes = await fetch(`https://api.pexels.com/v1/search?query=${query}&per_page=3&orientation=landscape`, {
                        headers: {
                            Authorization: import.meta.env.VITE_PEXELS_API_KEY
                        }
                    });
                    
                    if (pexelsRes.ok) {
                        const data = await pexelsRes.json();
                        externalPhotos = data.photos.map(p => p.src.large2x || p.src.large);
                    }
                } catch (err) {
                    console.error("Pexels fetch failed:", err);
                }
            }

            GENERIC_IDS.forEach((id) => {
                // Match both images.unsplash.com and source.unsplash.com variants
                const regex = new RegExp(`https?://(?:images\\.unsplash\\.com/photo-|source\\.unsplash\\.com/)${id}[^"']*`, 'g');
                if (html.includes(id)) {
                    // 1. Try valid Google photos first
                    // 2. Try Pexels search results
                    // 3. Fallback to reliable random placeholder
                    
                    let replacementUrl = '';
                    if (photoIndex < validPhotos.length) {
                        replacementUrl = validPhotos[photoIndex];
                        photoIndex++;
                    } else if (externalPhotos.length > 0) {
                        replacementUrl = externalPhotos.pop(); 
                    } else {
                        // Use a guaranteed random placeholder from Picsum if Pexels fails
                        replacementUrl = `https://picsum.photos/seed/${Math.floor(Math.random()*10000)}/1000/800`;
                    }
                    
                    // Add some query params for caching/resizing if it's not a generic fallback
                    if (!replacementUrl.includes('picsum.photos')) {
                        // Ensure https if somehow missing
                        if (replacementUrl.startsWith('//')) replacementUrl = 'https:' + replacementUrl;
                    }
                    
                    html = html.replace(regex, replacementUrl);
                }
            });

            const { error } = await supabase
                .from('leads')
                .update({ website_html: html })
                .eq('place_id', lead.place_id);

            if (!error) {
                setLeads(prev => prev.map(l => l.place_id === lead.place_id ? { ...l, website_html: html } : l));
            }
        } catch (e) { console.error(e); } finally { setShuffling(null); }
    }

    async function repairAll() {
        const toFix = leads.filter(l => GENERIC_IDS.some(id => l.website_html?.includes(id)));
        if (!confirm(`Repair ${toFix.length} sites by replacing generic images?`)) return;
        setLoading(true);
        for (const lead of toFix) await shuffleImages(lead);
        setLoading(false);
        alert('Repair complete!');
    }

    const filtered = leads.filter(l => {
        const matchSearch = !search || l.name?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || l.status === statusFilter;
        const matchCat = categoryFilter === 'all' || getCategory(l) === categoryFilter;
        return matchSearch && matchStatus && matchCat;
    });

    const statusStyle = (status) => {
        const map = {
            scouted: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
            published: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            pitched: 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]',
            warmed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            interest_confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            completed: 'bg-green-500/10 text-green-400 border-green-500/20 font-black',
            invalid: 'bg-red-500/10 text-red-500 border-red-500/20',
        };
        return map[status] || 'bg-obsidian-surface-high text-zinc-500 border-white/5';
    };

    return (
        <V2Shell>
            <div className="p-6 space-y-5">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                            <Globe className="w-6 h-6 text-amber-500" /> Web Assets
                        </h1>
                        <p className="text-[11px] text-zinc-400 font-black uppercase tracking-widest mt-1.5 opacity-90">{leads.length} Instances Synchronized via Vercel Edge</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {leads.some(l => GENERIC_IDS.some(id => l.website_html?.includes(id))) && (
                            <button onClick={repairAll}
                                className="flex items-center gap-2 px-4 py-2.5 bg-obsidian-surface-high hover:bg-obsidian-surface-highest border border-amber-500/30 rounded-xl text-[10px] font-black text-amber-500 uppercase tracking-widest transition-all shadow-lg">
                                <Sparkles className="w-4 h-4" /> Hard Fix {leads.filter(l => GENERIC_IDS.some(id => l.website_html?.includes(id))).length} Generic Sites
                            </button>
                        )}
                        <div className="relative group">
                            <Search className="w-4 h-4 text-zinc-600 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-amber-500 transition-colors" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="SEARCH ASSETS..."
                                className="pl-10 pr-4 py-2.5 bg-obsidian-surface-high/50 border border-white/5 rounded-xl text-[11px] font-bold text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 w-64 uppercase tracking-widest transition-all" />
                        </div>
                        <div className="flex gap-2">
                            <div className="relative">
                                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                                    className="px-4 pr-10 py-2.5 bg-obsidian-bg border border-white/5 rounded-xl text-[10px] font-bold text-zinc-100 focus:outline-none focus:border-amber-500/50 max-w-[160px] truncate uppercase tracking-widest appearance-none cursor-pointer">
                                    <option value="all" className="bg-[#111319] text-white">ALL CATEGORIES</option>
                                    {CATEGORIES.filter(c => c !== 'all').map(c => <option key={c} value={c} className="bg-[#111319] text-white">{c.toUpperCase()}</option>)}
                                </select>
                                <ChevronDown className="w-3 h-3 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>

                            <div className="relative">
                                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                                    className="px-4 pr-10 py-2.5 bg-obsidian-bg border border-white/5 rounded-xl text-[10px] font-bold text-zinc-100 focus:outline-none focus:border-amber-500/50 uppercase tracking-widest appearance-none cursor-pointer">
                                    <option value="all" className="bg-[#111319] text-white">ALL STATUSES</option>
                                    {STATUSES.filter(s => s !== 'all').map(s => <option key={s} value={s} className="bg-[#111319] text-white">{s.toUpperCase()}</option>)}
                                </select>
                                <ChevronDown className="w-3 h-3 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => <div key={i} className="h-64 bg-obsidian-surface-high/20 rounded-3xl border border-white/5 animate-pulse" />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-32 text-center glass-card rounded-3xl border-t border-white/5">
                        <Globe className="w-12 h-12 text-zinc-800 mx-auto mb-4 opacity-40" />
                        <p className="text-zinc-400 text-[11px] font-black uppercase tracking-[0.2em]">No Synchronized Assets Found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filtered.map(lead => (
                            <div key={lead.place_id}
                                className="glass-card border-t border-white/5 hover:border-amber-500/30 rounded-3xl overflow-hidden transition-all group flex flex-col shadow-xl hover:-translate-y-1 duration-300 relative group">
                                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                {/* Browser chrome */}
                                <div className="bg-obsidian-surface-low border-b border-white/5 px-4 py-3 flex items-center gap-3">
                                    <div className="flex gap-1.5 opacity-60">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
                                    </div>
                                    <div className="flex-1 text-[9px] text-zinc-400 font-black uppercase tracking-widest truncate text-center pr-6 opacity-80 group-hover:text-amber-500 group-hover:opacity-100 transition-all">
                                        {lead.vercel_url?.replace('https://', '').toUpperCase()}
                                    </div>
                                    <button onClick={() => shuffleImages(lead)} disabled={shuffling === lead.place_id}
                                        className={`w-7 h-7 flex items-center justify-center rounded-lg hover:bg-obsidian-surface-high border border-transparent hover:border-white/10 transition-all ${shuffling === lead.place_id ? 'animate-spin text-amber-500' : 'text-zinc-600 hover:text-amber-500'}`}>
                                        <RefreshCcw className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                {/* Card body */}
                                <div className="p-6 flex-1 flex flex-col relative z-10">
                                    <div className="flex-1">
                                        <Link to={`/admin-v2/pipeline/${lead.place_id}`} className="block group/link">
                                            <h3 className="text-sm font-black text-zinc-100 group-hover:text-white group-hover/link:text-amber-500 truncate uppercase tracking-tight leading-tight transition-colors">
                                                {lead.name}
                                            </h3>
                                        </Link>
                                        <div className="flex items-center gap-2 mt-2.5">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-inner ${statusStyle(lead.status)}`}>
                                                {lead.status}
                                            </span>
                                            <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">{getCategory(lead)}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 mt-6">
                                        {lead.website_html && (
                                            <button onClick={() => { setPreviewHtml(lead.website_html); setPreviewName(lead.name); }}
                                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-obsidian-surface-high/50 hover:bg-obsidian-surface-highest text-zinc-400 hover:text-zinc-100 text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/5 transition-all shadow-sm">
                                                <Eye className="w-4 h-4 opacity-60" /> Preview
                                            </button>
                                        )}
                                        <a href={lead.vercel_url} target="_blank" rel="noreferrer"
                                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-500/5 hover:bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.05)]">
                                            <ExternalLink className="w-4 h-4" /> Live Site
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* HTML Preview Modal */}
            {previewHtml && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-obsidian-dark/95 backdrop-blur-xl transition-all duration-300 animate-in fade-in zoom-in-95">
                    <div className="glass-card border-t border-white/10 rounded-[2.5rem] w-full max-w-7xl h-[92vh] flex flex-col overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
                        <div className="px-8 py-5 bg-obsidian-surface-low/80 border-b border-white/5 flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-obsidian-surface-high border border-white/10 flex items-center justify-center shadow-inner">
                                    <Eye className="w-5 h-5 text-amber-500" />
                                </div>
                                <div>
                                    <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">{previewName}</h2>
                                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mt-1 opacity-90 flex items-center gap-2">
                                        <Sparkles className="w-3 h-3 text-amber-500" /> Autonomous Preview Render
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setPreviewHtml(null)} 
                                    className="w-10 h-10 rounded-2xl bg-obsidian-surface-high hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-zinc-500 hover:text-red-500 transition-all flex items-center justify-center shadow-lg group">
                                    <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 bg-white relative">
                            <iframe srcDoc={previewHtml} className="w-full h-full border-none" sandbox="allow-scripts allow-same-origin" />
                        </div>
                    </div>
                </div>
            )}
        </V2Shell>
    );
}
