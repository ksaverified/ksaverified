import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
    Target, TrendingUp, AlertTriangle, CheckCircle, Clock,
    Search, Filter, Star, Globe, Camera, MessageSquare,
    Zap, ChevronRight, BarChart3, PieChart, ArrowUpRight,
    ArrowDownRight, RefreshCw, Eye, X, Send, Bell
} from 'lucide-react';
import {
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip
} from 'recharts';

const PRIORITY_CONFIG = {
    hot: { label: 'Hot', color: '#ef4444', bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: Zap },
    warm: { label: 'Warm', color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: TrendingUp },
    cold: { label: 'Cold', color: '#6366f1', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400', icon: AlertTriangle }
};

const GAP_TYPES = {
    no_website: { label: 'No Website', icon: Globe, weight: 30 },
    outdated_website: { label: 'Outdated Website', icon: Globe, weight: 25 },
    low_reviews: { label: 'Low Reviews', icon: Star, weight: 35 },
    no_photos: { label: 'No Photos', icon: Camera, weight: 15 },
    no_hours: { label: 'Missing Hours', icon: Clock, weight: 20 },
    no_responses: { label: 'No Review Responses', icon: MessageSquare, weight: 15 }
};

export default function MapGapDashboard() {
    const navigate = useNavigate();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [selectedLead, setSelectedLead] = useState(null);
    const [stats, setStats] = useState({});

    useEffect(() => {
        fetchLeads();
        const ch = supabase.channel('mapgap:dashboard')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, fetchLeads)
            .subscribe();
        return () => supabase.removeChannel(ch);
    }, []);

    async function fetchLeads() {
        try {
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .order('updated_at', { ascending: false })
                .limit(500);

            if (error) throw error;
            setLeads(data || []);
            calculateStats(data || []);
        } catch (e) {
            console.error('Error fetching leads:', e);
        } finally {
            setLoading(false);
        }
    }

    function calculateStats(leads) {
        const total = leads.length;
        const hotCount = leads.filter(l => l.priority === 'hot' || l.map_gap_analysis?.priorityLevel === 'hot').length;
        const warmCount = leads.filter(l => l.priority === 'warm' || l.map_gap_analysis?.priorityLevel === 'warm').length;
        const coldCount = leads.filter(l => l.priority === 'cold' || l.map_gap_analysis?.priorityLevel === 'cold').length;

        const avgScore = leads.reduce((sum, l) => {
            const score = l.conversion_score || l.map_gap_analysis?.scores?.conversionScore || 0;
            return sum + score;
        }, 0) / (total || 1);

        const noWebsite = leads.filter(l => !l.website && !l.website_html).length;
        const lowReviews = leads.filter(l => (l.review_count || 0) < 20).length;

        // Gap distribution
        const gapCounts = {};
        leads.forEach(l => {
            const gaps = l.map_gap_analysis?.gaps || [];
            gaps.forEach(g => {
                gapCounts[g.type] = (gapCounts[g.type] || 0) + 1;
            });
        });

        setStats({
            total, hotCount, warmCount, coldCount, avgScore,
            noWebsite, lowReviews, gapCounts
        });
    }

    const filteredLeads = leads.filter(l => {
        const matchSearch = !search || 
            l.name?.toLowerCase().includes(search.toLowerCase()) ||
            l.address?.toLowerCase().includes(search.toLowerCase());
        const priority = l.priority || l.map_gap_analysis?.priorityLevel || 'warm';
        const matchPriority = priorityFilter === 'all' || priority === priorityFilter;
        return matchSearch && matchPriority;
    });

    // Chart data
    const priorityPieData = [
        { name: 'Hot', value: stats.hotCount || 0, color: '#ef4444' },
        { name: 'Warm', value: stats.warmCount || 0, color: '#f59e0b' },
        { name: 'Cold', value: stats.coldCount || 0, color: '#6366f1' }
    ];

    const gapBarData = Object.entries(stats.gapCounts || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([type, count]) => ({
            name: GAP_TYPES[type]?.label || type,
            count,
            fill: GAP_TYPES[type]?.weight >= 30 ? '#ef4444' : GAP_TYPES[type]?.weight >= 20 ? '#f59e0b' : '#6366f1'
        }));

    const scoreDistribution = [
        { range: '0-20', count: leads.filter(l => (l.conversion_score || 0) < 20).length },
        { range: '20-40', count: leads.filter(l => (l.conversion_score || 0) >= 20 && (l.conversion_score || 0) < 40).length },
        { range: '40-60', count: leads.filter(l => (l.conversion_score || 0) >= 40 && (l.conversion_score || 0) < 60).length },
        { range: '60-80', count: leads.filter(l => (l.conversion_score || 0) >= 60 && (l.conversion_score || 0) < 80).length },
        { range: '80-100', count: leads.filter(l => (l.conversion_score || 0) >= 80).length }
    ];

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
                                <h1 className="text-lg font-bold text-white">Map Gap System</h1>
                                <p className="text-xs text-zinc-500">Lead Qualification & Priority Management</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search leads..."
                                className="pl-9 pr-4 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 w-64"
                            />
                        </div>
                        <select
                            value={priorityFilter}
                            onChange={e => setPriorityFilter(e.target.value)}
                            className="px-3 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-xl text-sm text-zinc-300 focus:outline-none focus:border-amber-500/50"
                        >
                            <option value="all">All Priorities</option>
                            <option value="hot">Hot Only</option>
                            <option value="warm">Warm Only</option>
                            <option value="cold">Cold Only</option>
                        </select>
                        <button
                            onClick={fetchLeads}
                            className="p-2 bg-zinc-900/50 border border-zinc-700/50 rounded-xl hover:bg-zinc-800/50 transition-colors"
                        >
                            <RefreshCw className={`w-4 h-4 text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </header>

            <div className="p-6 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        label="Total Leads"
                        value={stats.total || 0}
                        icon={Target}
                        color="#6366f1"
                    />
                    <StatCard
                        label="Hot Leads"
                        value={stats.hotCount || 0}
                        icon={Zap}
                        color="#ef4444"
                        trend={stats.hotCount > 0 ? '+' + Math.round((stats.hotCount / stats.total) * 100) + '%' : '0%'}
                    />
                    <StatCard
                        label="Avg Score"
                        value={Math.round(stats.avgScore || 0)}
                        suffix="/100"
                        icon={BarChart3}
                        color="#f59e0b"
                    />
                    <StatCard
                        label="No Website"
                        value={stats.noWebsite || 0}
                        icon={Globe}
                        color="#10b981"
                    />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Priority Distribution */}
                    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5">
                        <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                            <PieChart className="w-4 h-4 text-amber-500" />
                            Priority Distribution
                        </h3>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPie>
                                    <Pie
                                        data={priorityPieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={75}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {priorityPieData.map((entry, index) => (
                                            <Cell key={index} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#18181b',
                                            border: '1px solid #3f3f46',
                                            borderRadius: '8px',
                                            color: '#fff'
                                        }}
                                    />
                                </RechartsPie>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-4 mt-2">
                            {priorityPieData.map(item => (
                                <div key={item.name} className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-xs text-zinc-400">{item.name}: {item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Gap Distribution */}
                    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5">
                        <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-amber-500" />
                            Gap Analysis
                        </h3>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={gapBarData} layout="vertical">
                                    <XAxis type="number" hide />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        tick={{ fill: '#a1a1aa', fontSize: 11 }}
                                        width={100}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#18181b',
                                            border: '1px solid #3f3f46',
                                            borderRadius: '8px',
                                            color: '#fff'
                                        }}
                                    />
                                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                        {gapBarData.map((entry, index) => (
                                            <Cell key={index} fill={entry.fill} />
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
                                    <XAxis
                                        dataKey="range"
                                        tick={{ fill: '#a1a1aa', fontSize: 10 }}
                                        axisLine={{ stroke: '#3f3f46' }}
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#18181b',
                                            border: '1px solid #3f3f46',
                                            borderRadius: '8px',
                                            color: '#fff'
                                        }}
                                    />
                                    <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Leads Table */}
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                            <Target className="w-4 h-4 text-amber-500" />
                            Lead Prioritization ({filteredLeads.length} leads)
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-zinc-800/50">
                                    <th className="px-5 py-3 text-left text-xs font-bold text-amber-500/80 uppercase tracking-wider">Business</th>
                                    <th className="px-5 py-3 text-left text-xs font-bold text-amber-500/80 uppercase tracking-wider">Priority</th>
                                    <th className="px-5 py-3 text-left text-xs font-bold text-amber-500/80 uppercase tracking-wider">Score</th>
                                    <th className="px-5 py-3 text-left text-xs font-bold text-amber-500/80 uppercase tracking-wider">Gaps</th>
                                    <th className="px-5 py-3 text-left text-xs font-bold text-amber-500/80 uppercase tracking-wider">Status</th>
                                    <th className="px-5 py-3 text-right text-xs font-bold text-amber-500/80 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/30">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-12 text-center text-zinc-500">
                                            Loading leads...
                                        </td>
                                    </tr>
                                ) : filteredLeads.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-12 text-center text-zinc-500">
                                            No leads match your filters
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLeads.map(lead => {
                                        const priority = lead.priority || lead.map_gap_analysis?.priorityLevel || 'warm';
                                        const score = lead.conversion_score || lead.map_gap_analysis?.scores?.conversionScore || 0;
                                        const gaps = lead.map_gap_analysis?.gaps || [];
                                        const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.warm;
                                        const PriorityIcon = config.icon;

                                        return (
                                            <tr key={lead.place_id} className="hover:bg-zinc-800/30 transition-colors">
                                                <td className="px-5 py-4">
                                                    <div>
                                                        <p className="text-sm font-semibold text-zinc-100">{lead.name}</p>
                                                        <p className="text-xs text-zinc-500 mt-0.5">{lead.address?.slice(0, 50) || 'No address'}</p>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${config.bg} ${config.border} ${config.text}`}>
                                                        <PriorityIcon className="w-3.5 h-3.5" />
                                                        {config.label}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full"
                                                                style={{
                                                                    width: `${score}%`,
                                                                    backgroundColor: score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444'
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="text-sm font-mono text-zinc-300">{score}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {gaps.slice(0, 3).map((gap, i) => (
                                                            <span key={i} className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded">
                                                                {GAP_TYPES[gap.type]?.label || gap.type}
                                                            </span>
                                                        ))}
                                                        {gaps.length > 3 && (
                                                            <span className="px-2 py-0.5 bg-zinc-800 text-zinc-500 text-xs rounded">
                                                                +{gaps.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="text-xs text-zinc-500 capitalize">{lead.status || 'unknown'}</span>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <button
                                                        onClick={() => navigate(`/admin-v2/pipeline/${lead.place_id}`)}
                                                        className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold transition-colors"
                                                    >
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, suffix = '', icon: Icon, color, trend }) {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
                    <p className="text-2xl font-bold text-white mt-1">
                        {value}{suffix && <span className="text-sm text-zinc-400 ml-1">{suffix}</span>}
                    </p>
                    {trend && (
                        <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                            <ArrowUpRight className="w-3 h-3" />
                            {trend}
                        </p>
                    )}
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                </div>
            </div>
        </div>
    );
}
