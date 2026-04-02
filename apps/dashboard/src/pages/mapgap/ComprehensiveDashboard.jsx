import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, supabaseAdmin } from '../../lib/supabase';
import {
    Target, TrendingUp, AlertTriangle, CheckCircle, Clock, Search,
    Globe, Camera, MessageSquare, Zap, ChevronRight, BarChart3,
    PieChart, ArrowUpRight, RefreshCw, Users, Phone, MapPin, Eye,
    Shield, Activity, Flame, Star, Send, Database, Bell, LogOut,
    BarChart2, ArrowRight, Filter, Map as MapIcon, Settings,
    DollarSign, TrendingDown, ArrowDownRight, Target as TargetIcon,
    Wrench, Image, Calendar, MessageCircle, Check, X, AlertCircle,
    EyeOff, FileText, ExternalLink, Plus, Minus
} from 'lucide-react';
import {
    PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
    AreaChart, Area, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const GAP_TYPES = {
    no_website: { label: 'No Website', icon: Globe, color: '#ef4444', weight: 30, desc: 'Business has no online presence' },
    outdated_website: { label: 'Outdated Website', icon: FileText, color: '#f97316', weight: 25, desc: 'Website needs modernization' },
    low_reviews: { label: 'Low Reviews', icon: Star, color: '#f59e0b', weight: 35, desc: 'Review count below competitor average' },
    no_photos: { label: 'No Photos', icon: Image, color: '#eab308', weight: 15, desc: 'Missing business photos on Google' },
    no_hours: { label: 'Missing Hours', icon: Clock, color: '#84cc16', weight: 20, desc: 'Operating hours not listed' },
    no_responses: { label: 'No Responses', icon: MessageSquare, color: '#22c55e', weight: 15, desc: 'No review responses posted' },
    no_address: { label: 'Missing Address', icon: MapPin, color: '#06b6d4', weight: 10, desc: 'Address information incomplete' },
    no_phone: { label: 'Missing Phone', icon: Phone, color: '#8b5cf6', weight: 10, desc: 'Contact number not available' }
};

const PRIORITY_CONFIG = {
    hot: { label: 'Hot', color: '#ef4444', bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: Zap },
    warm: { label: 'Warm', color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: TrendingUp },
    cold: { label: 'Cold', color: '#6366f1', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400', icon: AlertTriangle }
};

const PIPELINE_STAGES = [
    { key: 'scouted', label: 'Scouted', color: '#6366f1' },
    { key: 'published', label: 'Published', color: '#8b5cf6' },
    { key: 'pitched', label: 'Pitched', color: '#f59e0b' },
    { key: 'warmed', label: 'Warmed', color: '#3b82f6' },
    { key: 'interest_confirmed', label: 'Interested', color: '#10b981' },
    { key: 'completed', label: 'Closed', color: '#22c55e' },
];

const AGENTS = [
    { key: 'scout', label: 'Scout', icon: '🔍', desc: 'Finds business gaps' },
    { key: 'creator', label: 'Creator', icon: '🎨', desc: 'Builds websites' },
    { key: 'publisher', label: 'Publisher', icon: '🚀', desc: 'Deploys to production' },
    { key: 'chatbot', label: 'Chatbot', icon: '💬', desc: 'Handles inquiries' },
    { key: 'closer', label: 'Closer', icon: '🤝', desc: 'Converts leads' },
];

function timeAgo(dateStr) {
    if (!dateStr) return 'Never';
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

function formatNumber(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n?.toString() || '0';
}

export default function ComprehensiveDashboard() {
    const navigate = useNavigate();
    const [now, setNow] = useState(Date.now());
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedGapFilter, setSelectedGapFilter] = useState('all');
    const [agentLogs, setAgentLogs] = useState({});
    const [viewMode, setViewMode] = useState('overview');
    const [recentLogs, setRecentLogs] = useState([]);
    const [selectedLead, setSelectedLead] = useState(null);
    
    const [stats, setStats] = useState({
        total: 0,
        hotCount: 0, warmCount: 0, coldCount: 0,
        avgScore: 0,
        gapCounts: {},
        newToday: 0,
        websiteCount: 0,
        hotLeads: 0, closedLeads: 0, pitched: 0,
        totalGaps: 0,
        avgGapsPerLead: 0
    });

    const fetchData = useCallback(async () => {
        try {
            const { data: leadsData, error } = await supabase
                .from('leads')
                .select('*')
                .order('updated_at', { ascending: false })
                .limit(500);
            
            if (error) {
                console.error('Lead fetch error:', error);
                // Try alternative approach
                const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/leads?select=*&order=updated_at.desc&limit=500`, {
                    headers: { 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY }
                });
                if (resp.ok) {
                    const data = await resp.json();
                    setLeads(Array.isArray(data) ? data : data.value || []);
                    calculateStats(Array.isArray(data) ? data : data.value || []);
                }
                return;
            }
            
            if (leadsData) {
                setLeads(leadsData);
                
                // Calculate priority counts
                const hotCount = leadsData.filter(l => l.priority === 'hot' || l.map_gap_analysis?.priorityLevel === 'hot').length;
                const warmCount = leadsData.filter(l => l.priority === 'warm' || l.map_gap_analysis?.priorityLevel === 'warm').length;
                const coldCount = leadsData.filter(l => l.priority === 'cold' || l.map_gap_analysis?.priorityLevel === 'cold').length;
                
                // Average score
                const avgScore = leadsData.reduce((sum, l) => 
                    sum + (l.conversion_score || l.map_gap_analysis?.scores?.conversionScore || 0), 0) / (leadsData.length || 1);
                
                // Count gaps across all leads
                const gapCounts = {};
                let totalGaps = 0;
                leadsData.forEach(l => {
                    const gaps = l.map_gap_analysis?.gaps || [];
                    gaps.forEach(g => {
                        gapCounts[g.type] = (gapCounts[g.type] || 0) + 1;
                        totalGaps++;
                    });
                });
                
                // Today's new leads
                const today = new Date(); today.setHours(0, 0, 0, 0);
                const newToday = leadsData.filter(l => new Date(l.created_at) >= today).length;
                
                setStats({
                    total: leadsData.length,
                    hotCount, warmCount, coldCount,
                    avgScore: Math.round(avgScore),
                    gapCounts,
                    newToday,
                    websiteCount: leadsData.filter(l => l.vercel_url).length,
                    hotLeads: leadsData.filter(l => l.status === 'interest_confirmed').length,
                    closedLeads: leadsData.filter(l => l.status === 'completed').length,
                    pitched: leadsData.filter(l => l.status === 'pitched').length,
                    totalGaps,
                    avgGapsPerLead: Math.round((totalGaps / leadsData.length) * 10) / 10
                });
            }
            
            // Fetch agent logs
            const { data: logs } = await supabaseAdmin
                .from('logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);
            
            if (logs) {
                setRecentLogs(logs.slice(0, 15));
                const lastByAgent = logs.reduce((acc, log) => {
                    if (!acc[log.agent] || new Date(log.created_at) > new Date(acc[log.agent].created_at)) {
                        acc[log.agent] = log;
                    }
                    return acc;
                }, {});
                setAgentLogs(lastByAgent);
            }
        } catch (e) {
            console.error('Error fetching data:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const poll = setInterval(fetchData, 60000);
        const clock = setInterval(() => setNow(Date.now()), 2000);
        const ch = supabase.channel('dashboard:gap-centric')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, fetchData)
            .subscribe();
        return () => {
            clearInterval(poll);
            clearInterval(clock);
            supabase.removeChannel(ch);
        };
    }, [fetchData]);

    // Filter leads by gap type
    const filteredLeads = leads.filter(l => {
        const matchSearch = !search || 
            l.name?.toLowerCase().includes(search.toLowerCase()) ||
            l.address?.toLowerCase().includes(search.toLowerCase());
        
        const gaps = l.map_gap_analysis?.gaps || [];
        const hasGap = selectedGapFilter === 'all' || gaps.some(g => g.type === selectedGapFilter);
        
        return matchSearch && hasGap;
    });

    // Gap analysis data for charts
    const gapAnalysisData = Object.entries(stats.gapCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => ({
            type,
            ...GAP_TYPES[type],
            count,
            percentage: Math.round((count / stats.total) * 100) || 0
        }));

    // Priority distribution
    const priorityPieData = [
        { name: 'Hot', value: stats.hotCount || 0, color: '#ef4444' },
        { name: 'Warm', value: stats.warmCount || 0, color: '#f59e0b' },
        { name: 'Cold', value: stats.coldCount || 0, color: '#6366f1' }
    ];

    // Score distribution
    const scoreDistribution = [
        { range: '0-20', count: leads.filter(l => (l.conversion_score || 0) < 20).length },
        { range: '20-40', count: leads.filter(l => (l.conversion_score || 0) >= 20 && (l.conversion_score || 0) < 40).length },
        { range: '40-60', count: leads.filter(l => (l.conversion_score || 0) >= 40 && (l.conversion_score || 0) < 60).length },
        { range: '60-80', count: leads.filter(l => (l.conversion_score || 0) >= 60 && (l.conversion_score || 0) < 80).length },
        { range: '80+', count: leads.filter(l => (l.conversion_score || 0) >= 80).length }
    ];

    // Pipeline data
    const pipelineByStage = PIPELINE_STAGES.reduce((acc, s) => {
        acc[s.key] = filteredLeads.filter(l => l.status === s.key);
        return acc;
    }, {});

    const errors = Object.values(agentLogs).filter(l => l.status === 'error');

    // Generate briefing
    const briefing = (() => {
        let msg = [];
        if (stats.newToday > 0) msg.push(`${stats.newToday} new leads scouted`);
        if (stats.totalGaps > 0) msg.push(`${stats.totalGaps} total gaps identified`);
        if (gapAnalysisData[0]) msg.push(`Top gap: ${gapAnalysisData[0].label} (${gapAnalysisData[0].count})`);
        if (stats.hotLeads > 0) msg.push(`${stats.hotLeads} high-intent opportunities`);
        if (errors.length > 0) msg.push(`${errors.length} errors need attention`);
        if (msg.length === 0) msg.push('All systems nominal — no critical actions');
        return msg.join(' • ');
    })();

    return (
        <div className="min-h-screen bg-obsidian-bg text-white font-['Inter',sans-serif]">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-obsidian-bg/95 backdrop-blur-md border-b border-zinc-800/50">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                <Target className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-white">Gap Intelligence Hub</h1>
                                <p className="text-xs text-zinc-500">Comprehensive Gap Analysis & Lead Management</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-zinc-900/50 p-1 rounded-xl">
                        {['overview', 'gaps', 'pipeline', 'agents'].map(mode => (
                            <button key={mode} onClick={() => setViewMode(mode)} 
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all capitalize ${viewMode === mode ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'}`}>
                                {mode}
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..." 
                                className="pl-9 pr-4 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 w-64" />
                        </div>
                        <select value={selectedGapFilter} onChange={e => setSelectedGapFilter(e.target.value)} 
                            className="px-3 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-xl text-sm text-zinc-300 focus:outline-none focus:border-amber-500/50">
                            <option value="all">All Gaps</option>
                            {Object.entries(GAP_TYPES).map(([key, val]) => (
                                <option key={key} value={key}>{val.label}</option>
                            ))}
                        </select>
                        <button onClick={fetchData} className="p-2 bg-zinc-900/50 border border-zinc-700/50 rounded-xl hover:bg-zinc-800/50 transition-colors">
                            <RefreshCw className={`w-4 h-4 text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </header>

            <div className="p-6 space-y-6">
                {/* Briefing Banner */}
                <div className="relative rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/5 p-5 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_50%,rgba(245,158,11,0.1),transparent_60%)]" />
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                                <AlertTriangle className="w-6 h-6 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-amber-500/80 uppercase tracking-widest">System Briefing</p>
                                <p className="text-lg font-semibold text-white mt-1">{loading ? 'Analyzing gaps...' : briefing}</p>
                            </div>
                        </div>
                        {errors.length > 0 && (
                            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-2">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                <span className="text-sm font-bold text-red-400">{errors.length} Errors</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* OVERVIEW MODE */}
                {viewMode === 'overview' && (
                    <>
                        {/* Main KPI Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                            <KPICard label="Total Leads" value={stats.total} icon={Users} color="#6366f1" trend={`+${stats.newToday} today`} />
                            <KPICard label="Hot Leads" value={stats.hotCount} icon={Zap} color="#ef4444" trend="High priority" />
                            <KPICard label="Avg Score" value={stats.avgScore} suffix="/100" icon={TargetIcon} color="#f59e0b" />
                            <KPICard label="Total Gaps" value={stats.totalGaps} icon={AlertTriangle} color="#f97316" trend={`${stats.avgGapsPerLead} avg/lead`} />
                            <KPICard label="No Website" value={stats.gapCounts.no_website || 0} icon={Globe} color="#ef4444" />
                            <KPICard label="Low Reviews" value={stats.gapCounts.low_reviews || 0} icon={Star} color="#f59e0b" />
                            <KPICard label="No Photos" value={stats.gapCounts.no_photos || 0} icon={Image} color="#eab308" />
                            <KPICard label="Closed" value={stats.closedLeads} icon={CheckCircle} color="#22c55e" trend="Revenue" />
                        </div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Priority Distribution */}
                            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5">
                                <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                                    <PieChart className="w-4 h-4 text-amber-500" />
                                    Lead Priority
                                </h3>
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsPie>
                                            <Pie data={priorityPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                                                {priorityPieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff' }} />
                                        </RechartsPie>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex justify-center gap-4 mt-2">
                                    {priorityPieData.map(item => (
                                        <div key={item.name} className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="text-xs text-zinc-400">{item.name}: {item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Gap Distribution */}
                            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5">
                                <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                    Gap Distribution
                                </h3>
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={gapAnalysisData.slice(0, 6)} layout="vertical">
                                            <XAxis type="number" hide />
                                            <YAxis type="category" dataKey="label" tick={{ fill: '#a1a1aa', fontSize: 10 }} width={90} />
                                            <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff' }} 
                                                formatter={(value, name, props) => [`${value} leads (${props.payload.percentage}%)`, 'Gaps']} />
                                            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                                {gapAnalysisData.slice(0, 6).map((entry, index) => (
                                                    <Cell key={index} fill={entry.color} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Score Distribution */}
                            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5">
                                <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-amber-500" />
                                    Score Distribution
                                </h3>
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={scoreDistribution}>
                                            <XAxis dataKey="range" tick={{ fill: '#a1a1aa', fontSize: 10 }} axisLine={{ stroke: '#3f3f46' }} />
                                            <YAxis hide />
                                            <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff' }} />
                                            <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Gap Breakdown Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(GAP_TYPES).slice(0, 8).map(([key, gap]) => {
                                const count = stats.gapCounts[key] || 0;
                                const Icon = gap.icon;
                                const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                                return (
                                    <div key={key} className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 hover:border-zinc-700/50 transition-all cursor-pointer group"
                                        onClick={() => { setSelectedGapFilter(key); setViewMode('gaps'); }}>
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${gap.color}20` }}>
                                                <Icon className="w-5 h-5" style={{ color: gap.color }} />
                                            </div>
                                            <span className="text-xs font-bold text-zinc-500">{percentage}%</span>
                                        </div>
                                        <p className="text-lg font-bold text-white">{count}</p>
                                        <p className="text-xs text-zinc-500 mt-1">{gap.label}</p>
                                        <div className="mt-3 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all" style={{ width: `${percentage}%`, backgroundColor: gap.color }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Leads Table */}
                        <LeadsTable leads={filteredLeads} loading={loading} navigate={navigate} />
                    </>
                )}

                {/* GAPS MODE */}
                {viewMode === 'gaps' && (
                    <>
                        {/* Gap Detail Analysis */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {Object.entries(GAP_TYPES).map(([key, gap]) => {
                                const count = stats.gapCounts[key] || 0;
                                const Icon = gap.icon;
                                const leadsWithGap = filteredLeads.filter(l => 
                                    (l.map_gap_analysis?.gaps || []).some(g => g.type === key)
                                );
                                
                                return (
                                    <div key={key} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${gap.color}20` }}>
                                                <Icon className="w-6 h-6" style={{ color: gap.color }} />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-white">{gap.label}</h3>
                                                <p className="text-sm text-zinc-500">{gap.desc}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold" style={{ color: gap.color }}>{count}</p>
                                                <p className="text-xs text-zinc-500">leads affected</p>
                                            </div>
                                        </div>
                                        
                                        {/* Top leads with this gap */}
                                        <div className="space-y-2">
                                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Top Opportunities</p>
                                            {leadsWithGap.slice(0, 3).map(lead => (
                                                <div key={lead.place_id} className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-xl hover:bg-zinc-800/50 transition-colors cursor-pointer"
                                                    onClick={() => navigate(`/admin/pipeline/${lead.place_id}`)}>
                                                    <div>
                                                        <p className="text-sm font-semibold text-zinc-200">{lead.name}</p>
                                                        <p className="text-xs text-zinc-500">{lead.address?.slice(0, 40) || 'No address'}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-mono text-zinc-400">Score: {lead.conversion_score || 0}</span>
                                                        <ExternalLink className="w-4 h-4 text-zinc-500" />
                                                    </div>
                                                </div>
                                            ))}
                                            {leadsWithGap.length === 0 && (
                                                <p className="text-sm text-zinc-600 text-center py-4">No leads with this gap</p>
                                            )}
                                            {leadsWithGap.length > 3 && (
                                                <button onClick={() => setSelectedGapFilter(key)} className="w-full py-2 text-xs font-bold text-amber-500 hover:text-amber-400">
                                                    View all {leadsWithGap.length} leads →
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Leads Table */}
                        <LeadsTable leads={filteredLeads} loading={loading} navigate={navigate} />
                    </>
                )}

                {/* PIPELINE MODE */}
                {viewMode === 'pipeline' && (
                    <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-hide">
                        {PIPELINE_STAGES.map(stage => {
                            const stageLeads = pipelineByStage[stage.key] || [];
                            return (
                                <div key={stage.key} className="flex-shrink-0 w-[280px] flex flex-col">
                                    <div className="flex items-center justify-between mb-4 px-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{stage.label}</span>
                                        </div>
                                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">{stageLeads.length}</span>
                                    </div>
                                    <div className="flex-1 space-y-3 min-h-[500px] p-2 rounded-2xl bg-zinc-900/30 border border-zinc-800/20">
                                        {stageLeads.slice(0, 10).map(lead => {
                                            const gaps = lead.map_gap_analysis?.gaps || [];
                                            const score = lead.conversion_score || 0;
                                            return (
                                                <div key={lead.place_id} className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/30 hover:border-amber-500/30 hover:bg-zinc-800/30 transition-all cursor-pointer group"
                                                    onClick={() => navigate(`/admin/pipeline/${lead.place_id}`)}>
                                                    <p className="text-xs font-bold text-zinc-200 group-hover:text-amber-300 transition-colors truncate">{lead.name}</p>
                                                    
                                                    {/* Gaps badges */}
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {gaps.slice(0, 2).map((gap, i) => {
                                                            const GapIcon = GAP_TYPES[gap.type]?.icon || AlertTriangle;
                                                            return (
                                                                <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-zinc-800 text-zinc-400 text-[9px] rounded">
                                                                    <GapIcon className="w-3 h-3" />
                                                                    {GAP_TYPES[gap.type]?.label || gap.type}
                                                                </span>
                                                            );
                                                        })}
                                                        {gaps.length > 2 && (
                                                            <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-500 text-[9px] rounded">
                                                                +{gaps.length - 2}
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex items-center justify-between mt-3">
                                                        <div className="flex items-center gap-1.5">
                                                            <Phone className="w-3 h-3 text-zinc-600" />
                                                            <span className="text-[10px] text-zinc-500">{lead.phone?.slice(-4) || 'N/A'}</span>
                                                        </div>
                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${score >= 70 ? 'bg-emerald-500/20 text-emerald-400' : score >= 40 ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-700 text-zinc-400'}`}>
                                                            {score}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {stageLeads.length > 10 && (
                                            <div className="text-[10px] text-zinc-600 text-center py-2 font-bold uppercase">
                                                + {stageLeads.length - 10} more
                                            </div>
                                        )}
                                        {stageLeads.length === 0 && (
                                            <div className="py-12 flex flex-col items-center justify-center text-[10px] text-zinc-700 font-bold uppercase tracking-widest border border-dashed border-zinc-800 rounded-xl space-y-2">
                                                <Users className="w-4 h-4 opacity-20" />
                                                <span>No Leads</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* AGENTS MODE */}
                {viewMode === 'agents' && (
                    <>
                        {/* Agent Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {AGENTS.map(agent => {
                                const lastLog = agentLogs[agent.key];
                                const isError = lastLog?.status === 'error';
                                const isWorking = lastLog && !isError && (now - new Date(lastLog.created_at).getTime() < 300000);
                                const statusColor = isError ? '#ef4444' : isWorking ? '#10b981' : '#52525b';
                                const statusText = isError ? 'Error' : isWorking ? 'Active' : 'Idle';
                                
                                return (
                                    <div key={agent.key} className={`p-5 rounded-2xl border transition-all ${isError ? 'bg-red-500/10 border-red-500/30' : isWorking ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-zinc-900/50 border-zinc-800/50'}`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-3xl">{agent.icon}</span>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
                                                {isWorking && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75" />}
                                            </div>
                                        </div>
                                        <p className="text-base font-bold text-white">{agent.label}</p>
                                        <p className="text-xs text-zinc-500 mb-3">{agent.desc}</p>
                                        <div className="flex items-center justify-between">
                                            <span className={`text-xs font-bold ${isError ? 'text-red-400' : isWorking ? 'text-emerald-400' : 'text-zinc-500'}`}>{statusText}</span>
                                            <span className="text-[10px] text-zinc-600">{timeAgo(lastLog?.created_at)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden">
                            <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-amber-500" />
                                    Recent Agent Activity
                                </h3>
                                <button onClick={() => navigate('/admin/logs')} className="text-xs text-amber-500 hover:text-amber-400 font-semibold">
                                    View All →
                                </button>
                            </div>
                            <div className="divide-y divide-zinc-800/30">
                                {recentLogs.map(log => (
                                    <div key={log.id} className="px-5 py-3 hover:bg-zinc-800/20 transition-colors flex items-center gap-4">
                                        <span className="text-lg">{AGENTS.find(a => a.key === log.agent)?.icon || '🤖'}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-zinc-200 truncate">{log.action || 'No action'}</p>
                                            <p className="text-[10px] text-zinc-500">{log.agent} • {timeAgo(log.created_at)}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.status === 'error' ? 'bg-red-500/20 text-red-400' : log.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-700 text-zinc-400'}`}>
                                            {log.status || 'pending'}
                                        </span>
                                    </div>
                                ))}
                                {recentLogs.length === 0 && (
                                    <div className="px-5 py-12 text-center text-zinc-500">No recent activity</div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Quick Navigation */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-4">
                    {[
                        { label: 'Pipeline', icon: BarChart2, path: '/admin/pipeline', color: '#6366f1' },
                        { label: 'Map View', icon: MapIcon, path: '/admin/map', color: '#8b5cf6' },
                        { label: 'WhatsApp', icon: MessageCircle, path: '/admin/whatsapp', color: '#10b981' },
                        { label: 'Analytics', icon: TrendingUp, path: '/admin/analytics', color: '#f59e0b' },
                        { label: 'Websites', icon: Globe, path: '/admin/websites', color: '#3b82f6' },
                        { label: 'Settings', icon: Settings, path: '/admin/settings', color: '#64748b' },
                    ].map(item => (
                        <button key={item.path} onClick={() => navigate(item.path)} 
                            className="flex items-center gap-3 p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-800/30 hover:border-zinc-700 transition-all group">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color}20` }}>
                                <item.icon className="w-5 h-5" style={{ color: item.color }} />
                            </div>
                            <span className="text-sm font-semibold text-zinc-300 group-hover:text-white">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function KPICard({ label, value, suffix = '', icon: Icon, color, trend }) {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-3 hover:border-zinc-700/50 transition-all">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</p>
                    <p className="text-xl font-bold text-white mt-1 flex items-baseline gap-1">
                        {formatNumber(value)}{suffix && <span className="text-sm text-zinc-400 font-normal">{suffix}</span>}
                    </p>
                    {trend && <p className="text-[9px] text-zinc-600 mt-1">{trend}</p>}
                </div>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                </div>
            </div>
        </div>
    );
}

function LeadsTable({ leads, loading, navigate }) {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                    <Target className="w-4 h-4 text-amber-500" />
                    Lead Analysis ({leads.length} leads)
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-zinc-800/50">
                            <th className="px-4 py-3 text-left text-xs font-bold text-amber-500/80 uppercase tracking-wider">Business</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-amber-500/80 uppercase tracking-wider">Priority</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-amber-500/80 uppercase tracking-wider">Score</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-amber-500/80 uppercase tracking-wider">Gaps Identified</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-amber-500/80 uppercase tracking-wider">Pipeline</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-amber-500/80 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/30">
                        {loading ? (
                            <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-500">Loading...</td></tr>
                        ) : leads.length === 0 ? (
                            <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-500">No leads match filters</td></tr>
                        ) : (
                            leads.slice(0, 20).map(lead => {
                                const priority = lead.priority || lead.map_gap_analysis?.priorityLevel || 'warm';
                                const score = lead.conversion_score || lead.map_gap_analysis?.scores?.conversionScore || 0;
                                const gaps = lead.map_gap_analysis?.gaps || [];
                                const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.warm;
                                const PriorityIcon = config.icon;
                                const pipelineStage = PIPELINE_STAGES.find(s => s.key === lead.status) || { label: lead.status, color: '#52525b' };
                                
                                return (
                                    <tr key={lead.place_id} className="hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="text-sm font-semibold text-zinc-100">{lead.name}</p>
                                                <p className="text-xs text-zinc-500 mt-0.5">{lead.phone || 'No phone'}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold border ${config.bg} ${config.border} ${config.text}`}>
                                                <PriorityIcon className="w-3 h-3" />
                                                {config.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full" style={{ 
                                                        width: `${score}%`, 
                                                        backgroundColor: score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444' 
                                                    }} />
                                                </div>
                                                <span className="text-xs font-mono text-zinc-300">{score}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {gaps.slice(0, 3).map((gap, i) => {
                                                    const GapIcon = GAP_TYPES[gap.type]?.icon || AlertTriangle;
                                                    const gapColor = GAP_TYPES[gap.type]?.color || '#6366f1';
                                                    return (
                                                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium" 
                                                            style={{ backgroundColor: `${gapColor}20`, color: gapColor }}>
                                                            <GapIcon className="w-3 h-3" />
                                                            {GAP_TYPES[gap.type]?.label || gap.type}
                                                        </span>
                                                    );
                                                })}
                                                {gaps.length > 3 && (
                                                    <span className="px-2 py-0.5 bg-zinc-800 text-zinc-500 text-[10px] rounded">
                                                        +{gaps.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold" 
                                                style={{ backgroundColor: `${pipelineStage.color}20`, color: pipelineStage.color }}>
                                                {pipelineStage.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {lead.vercel_url && (
                                                    <a href={lead.vercel_url} target="_blank" rel="noreferrer" 
                                                        className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">
                                                        <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                                                    </a>
                                                )}
                                                <button onClick={() => navigate(`/admin/pipeline/${lead.place_id}`)} 
                                                    className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold transition-colors">
                                                    Details
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
