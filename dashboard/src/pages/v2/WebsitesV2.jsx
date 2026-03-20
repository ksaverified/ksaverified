import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Globe, ExternalLink, Code, Search, Eye, X, Activity } from 'lucide-react';
import V2Shell from './V2Shell';

const STATUSES = ['all', 'website_created', 'pitched', 'replied', 'interested', 'closed'];

export default function WebsitesV2() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [previewHtml, setPreviewHtml] = useState(null);
    const [previewName, setPreviewName] = useState('');

    useEffect(() => {
        fetchWebsites();
    }, []);

    async function fetchWebsites() {
        try {
            const { data } = await supabase
                .from('leads')
                .select('place_id, name, status, vercel_url, website_html, login_count, last_login_at, updated_at')
                .not('vercel_url', 'is', null)
                .order('updated_at', { ascending: false });
            if (data) setLeads(data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }

    const filtered = leads.filter(l => {
        const matchSearch = !search || l.name?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || l.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const statusStyle = (status) => {
        const map = {
            website_created: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            pitched: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            replied: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            interested: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            closed: 'bg-green-500/10 text-green-400 border-green-500/20',
        };
        return map[status] || 'bg-zinc-800 text-zinc-400 border-zinc-700';
    };

    return (
        <V2Shell>
            <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Globe className="w-6 h-6 text-indigo-400" /> Generated Websites
                        </h1>
                        <p className="text-sm text-zinc-500 mt-0.5">{leads.length} sites published via Vercel</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                                className="pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 w-48" />
                        </div>
                        <div className="flex gap-1.5">
                            {STATUSES.map(s => (
                                <button key={s} onClick={() => setStatusFilter(s)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all
                                        ${statusFilter === s ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}>
                                    {s === 'website_created' ? 'created' : s}
                                </button>
                            ))}
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
                                </div>
                                {/* Card body */}
                                <div className="p-4 flex-1 flex flex-col">
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-white truncate">{lead.name}</h3>
                                        <span className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusStyle(lead.status)}`}>
                                            {lead.status}
                                        </span>
                                        {lead.login_count > 0 && (
                                            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-400">
                                                <Activity className="w-3 h-3" />
                                                {lead.login_count} client logins · {new Date(lead.last_login_at).toLocaleDateString('en-SA')}
                                            </div>
                                        )}
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
