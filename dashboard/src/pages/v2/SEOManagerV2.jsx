import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Globe, Search, Filter, ArrowUpDown, 
    ExternalLink, Edit3, CheckCircle, AlertCircle, 
    BarChart, Activity, RefreshCw, Eye, CloudLightning
} from 'lucide-react';
import V2Shell from './V2Shell';

export default function SEOManagerV2() {
    const navigate = useNavigate();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterIndexing, setFilterIndexing] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [indexing, setIndexing] = useState(false);

    const fetchSEOData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/seo?action=global');
            const result = await response.json();
            if (result.success) {
                setLeads(result.data);
            }
        } catch (error) {
            console.error('[SEO Manager] Fetch error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handlePingGoogle = async () => {
        if (!confirm('This will notify Google to re-crawl the entire platform sitemap. Continue?')) return;
        
        setIndexing(true);
        try {
            const response = await fetch('/api/seo?action=ping-google', { method: 'POST' });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            alert('Error indexing platform: ' + err.message);
        } finally {
            setIndexing(false);
        }
    };

    useEffect(() => {
        fetchSEOData();
    }, [fetchSEOData]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const runAudit = async (placeId) => {
        try {
            const response = await fetch(`/api/seo?action=audit&id=${placeId}`, { method: 'POST' });
            if (response.ok) fetchSEOData();
        } catch (error) {
            console.error('[SEO Audit] Error:', error);
        }
    };

    const filteredLeads = leads
        .filter(l => {
            const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                (l.vercel_url && l.vercel_url.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesStatus = filterStatus === 'all' || l.status === filterStatus;
            const matchesIndexing = filterIndexing === 'all' || l.indexing_status === filterIndexing;
            return matchesSearch && matchesStatus && matchesIndexing;
        })
        .sort((a, b) => {
            const aVal = a[sortConfig.key] || 0;
            const bVal = b[sortConfig.key] || 0;
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

    return (
        <V2Shell>
            <div className="p-6 space-y-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-white italic tracking-tighter flex items-center gap-3">
                            <Globe className="w-8 h-8 text-amber-500" />
                            Global SEO Manager
                        </h1>
                        <p className="text-zinc-500 mt-1 font-medium">Monitor and automate SEO health across all {leads.length} assets.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handlePingGoogle}
                            disabled={indexing || loading}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 transition-all text-xs font-black uppercase tracking-widest disabled:opacity-50 shadow-lg shadow-amber-500/5"
                        >
                            <CloudLightning className={`w-4 h-4 ${indexing ? 'animate-pulse' : ''}`} />
                            {indexing ? 'Indexing...' : 'Index Platform'}
                        </button>
                        <button onClick={fetchSEOData} className="p-2.5 rounded-xl border border-white/5 bg-obsidian-surface-high/50 hover:bg-obsidian-surface-highest transition-all shadow-xl">
                            <RefreshCw className={`w-4 h-4 text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="glass-card rounded-3xl p-6 border-t border-white/5">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Web Assets</p>
                        <p className="text-3xl font-black text-white">{leads.length}</p>
                    </div>
                    <div className="glass-card rounded-3xl p-6 border-t border-white/5">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Avg SEO Score</p>
                        <p className="text-3xl font-black text-emerald-500">
                            {leads.length ? Math.round(leads.reduce((acc, l) => acc + (l.seo_score || 0), 0) / leads.length) : 0}%
                        </p>
                    </div>
                    <div className="glass-card rounded-3xl p-6 border-t border-white/5">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Indexed Sites</p>
                        <p className="text-3xl font-black text-blue-500">
                            {leads.filter(l => l.indexing_status === 'indexed').length}
                        </p>
                    </div>
                    <div className="glass-card rounded-3xl p-6 border-t border-white/5">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Low Health Alerts</p>
                        <p className="text-3xl font-black text-amber-500">
                            {leads.filter(l => (l.seo_score || 0) < 60).length}
                        </p>
                    </div>
                </div>

                <div className="glass-card rounded-3xl border border-white/5 overflow-hidden">
                    <div className="px-6 py-5 border-b border-white/5 bg-obsidian-surface-high/20 flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input 
                                type="text"
                                placeholder="Search business name or URL..."
                                className="w-full bg-obsidian-surface-high/50 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-amber-500/50 transition-all text-zinc-200"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-zinc-500 mr-1" />
                            <select 
                                className="bg-obsidian-surface-high/50 border border-white/5 rounded-xl py-2 px-3 text-xs font-bold text-zinc-300 focus:outline-none focus:border-amber-500"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="all">Status: All</option>
                                <option value="published">Published</option>
                                <option value="pitched">Pitched</option>
                                <option value="warmed">Warmed</option>
                            </select>
                            <select 
                                className="bg-obsidian-surface-high/50 border border-white/5 rounded-xl py-2 px-3 text-xs font-bold text-zinc-300 focus:outline-none focus:border-amber-500"
                                value={filterIndexing}
                                onChange={(e) => setFilterIndexing(e.target.value)}
                            >
                                <option value="all">Indexing: All</option>
                                <option value="indexed">Indexed</option>
                                <option value="not_indexed">Not Indexed</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-obsidian-surface-high/10 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">
                                    <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('name')}>
                                        <div className="flex items-center gap-2">Business Name <ArrowUpDown className="w-3 h-3" /></div>
                                    </th>
                                    <th className="px-6 py-4">URL</th>
                                    <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('status')}>
                                        <div className="flex items-center gap-2">Status <ArrowUpDown className="w-3 h-3" /></div>
                                    </th>
                                    <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('indexing_status')}>
                                        <div className="flex items-center gap-2">Google Indexing <ArrowUpDown className="w-3 h-3" /></div>
                                    </th>
                                    <th className="px-6 py-4 cursor-pointer hover:text-white text-right" onClick={() => handleSort('seo_score')}>
                                        <div className="flex items-center gap-2 justify-end">SEO Health <ArrowUpDown className="w-3 h-3" /></div>
                                    </th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredLeads.map(lead => (
                                    <tr key={lead.place_id} className="hover:bg-amber-500/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-zinc-100 uppercase tracking-tight">{lead.name}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <a href={lead.vercel_url} target="_blank" rel="noreferrer" className="text-xs text-zinc-500 hover:text-amber-500 transition-colors flex items-center gap-1.5 truncate max-w-[200px]">
                                                {lead.vercel_url?.replace('https://', '')} <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-1 rounded-md ${
                                                lead.status === 'published' ? 'bg-emerald-500/10 text-emerald-500' :
                                                lead.status === 'pitched' ? 'bg-amber-500/10 text-amber-500' :
                                                'bg-zinc-500/10 text-zinc-500'
                                            }`}>
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {lead.indexing_status === 'indexed' ? (
                                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                ) : lead.indexing_status === 'pending' ? (
                                                    <Activity className="w-4 h-4 text-amber-500 animate-pulse" />
                                                ) : (
                                                    <AlertCircle className="w-4 h-4 text-zinc-500" />
                                                )}
                                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{lead.indexing_status || 'not_indexed'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <div className="text-right">
                                                    <p className={`text-sm font-black ${
                                                        lead.seo_score >= 80 ? 'text-emerald-500' :
                                                        lead.seo_score >= 50 ? 'text-amber-500' : 'text-red-500'
                                                    }`}>{lead.seo_score || 0}%</p>
                                                    <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter">Health Score</p>
                                                </div>
                                                <div className="w-24 h-1.5 bg-obsidian-surface-lowest rounded-full overflow-hidden border border-white/5">
                                                    <div className={`h-full rounded-full transition-all ${
                                                        lead.seo_score >= 80 ? 'bg-emerald-500' :
                                                        lead.seo_score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                                    }`} style={{ width: `${lead.seo_score || 0}%` }} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => runAudit(lead.place_id)}
                                                    className="p-2 rounded-lg bg-obsidian-surface-high border border-white/5 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all hover:shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                                                    title="Run SEO Audit"
                                                >
                                                    <BarChart className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => navigate(`/admin-v2/pipeline/${lead.place_id}`)}
                                                    className="p-2 rounded-lg bg-obsidian-surface-high border border-white/5 text-zinc-400 hover:text-amber-400 hover:border-amber-500/30 transition-all hover:shadow-[0_0_10px_rgba(245,158,11,0.1)]"
                                                    title="Edit SEO Metadata"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => window.open(`${window.location.origin}/customers/login?token=managed&id=${lead.place_id}`, '_blank')}
                                                    className="p-2 rounded-lg bg-obsidian-surface-high border border-white/5 text-zinc-400 hover:text-blue-400 hover:border-blue-500/30 transition-all hover:shadow-[0_0_10px_rgba(59,130,246,0.1)]"
                                                    title="View as Customer"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredLeads.length === 0 && (
                            <div className="py-20 text-center">
                                <div className="p-4 bg-obsidian-surface-high/50 rounded-2xl border border-white/5 inline-block mb-4">
                                    <Search className="w-8 h-8 text-zinc-700 mx-auto" />
                                </div>
                                <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-xs">No matching websites found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </V2Shell>
    );
}
