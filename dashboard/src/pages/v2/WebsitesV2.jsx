import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Globe, ExternalLink, Code, Search, Eye, X, RefreshCcw, Sparkles } from 'lucide-react';
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
            pitched: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            warmed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            interest_confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            completed: 'bg-green-500/10 text-green-400 border-green-500/20',
            invalid: 'bg-red-500/10 text-red-400 border-red-500/20',
        };
        return map[status] || 'bg-zinc-800 text-zinc-400 border-zinc-700';
    };

    return (
        <V2Shell>
            <div className="p-6 space-y-5">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Globe className="w-6 h-6 text-indigo-400" /> Generated Websites
                        </h1>
                        <p className="text-sm text-zinc-500 mt-0.5">{leads.length} sites published via Vercel</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {leads.some(l => GENERIC_IDS.some(id => l.website_html?.includes(id))) && (
                            <button onClick={repairAll}
                                className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg text-xs font-bold text-amber-400 transition-all">
                                <Sparkles className="w-3.5 h-3.5" /> Repair {leads.filter(l => GENERIC_IDS.some(id => l.website_html?.includes(id))).length} Similar Sites
                            </button>
                        )}
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                                className="pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 w-48" />
                        </div>
                        <div className="flex gap-1.5">
                            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                                className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-zinc-600 max-w-[150px] truncate">
                                <option value="all">All Categories</option>
                                {CATEGORIES.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                                className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-zinc-600">
                                <option value="all">All Statuses</option>
                                {STATUSES.filter(s => s !== 'all').map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => <div key={i} className="h-52 bg-zinc-900/50 rounded-xl border border-zinc-800 animate-pulse" />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-24 text-center">
                        <Globe className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                        <p className="text-zinc-500 text-sm">No websites match this filter</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filtered.map(lead => (
                            <div key={lead.place_id}
                                className="bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 rounded-xl overflow-hidden transition-all group flex flex-col">
                                {/* Browser chrome */}
                                <div className="bg-zinc-900 border-b border-zinc-800 px-3 py-2 flex items-center gap-2">
                                    <div className="flex gap-1 opacity-60">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                                    </div>
                                    <div className="flex-1 text-[10px] text-zinc-600 font-mono truncate text-center pr-6">
                                        {lead.vercel_url?.replace('https://', '')}
                                    </div>
                                    <button onClick={() => shuffleImages(lead)} disabled={shuffling === lead.place_id}
                                        className={`p-1 rounded hover:bg-zinc-800 transition-colors ${shuffling === lead.place_id ? 'animate-spin text-amber-500' : 'text-zinc-600'}`}>
                                        <RefreshCcw className="w-3 h-3" />
                                    </button>
                                </div>
                                {/* Card body */}
                                <div className="p-4 flex-1 flex flex-col">
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-white truncate">{lead.name}</h3>
                                        <span className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusStyle(lead.status)}`}>
                                            {lead.status}
                                        </span>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        {lead.website_html && (
                                            <button onClick={() => { setPreviewHtml(lead.website_html); setPreviewName(lead.name); }}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition-all">
                                                <Code className="w-3.5 h-3.5" /> Preview
                                            </button>
                                        )}
                                        <a href={lead.vercel_url} target="_blank" rel="noreferrer"
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/20 text-xs font-medium rounded-lg transition-all">
                                            <ExternalLink className="w-3.5 h-3.5" /> Vercel
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
                    <div className="bg-zinc-950 border border-zinc-700 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
                        <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-zinc-400">
                                <Eye className="w-4 h-4 text-indigo-400" />
                                <span className="font-medium">{previewName}</span>
                                <span className="text-zinc-600">— HTML Preview</span>
                            </div>
                            <button onClick={() => setPreviewHtml(null)} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 bg-white">
                            <iframe srcDoc={previewHtml} className="w-full h-full border-none" sandbox="allow-scripts allow-same-origin" />
                        </div>
                    </div>
                </div>
            )}
        </V2Shell>
    );
}
