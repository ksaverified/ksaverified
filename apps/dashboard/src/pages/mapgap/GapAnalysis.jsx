import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
    Target, AlertTriangle, Globe, Star, Camera, Clock, MessageSquare,
    Filter, Search, ChevronDown, X, Zap, TrendingUp, CheckCircle
} from 'lucide-react';

const GAP_CONFIG = {
    no_website: {
        label: 'Missing Website',
        description: 'Business has no online presence via website',
        icon: Globe,
        color: '#ef4444',
        severity: 'critical',
        recommendation: 'Professional website at 19 SAR/month'
    },
    outdated_website: {
        label: 'Outdated Website',
        description: 'Website appears to be built before 2020',
        icon: Globe,
        color: '#f59e0b',
        severity: 'high',
        recommendation: 'Website refresh with modern design'
    },
    low_reviews: {
        label: 'Low Review Count',
        description: 'Fewer than 20 reviews on Google',
        icon: Star,
        color: '#f59e0b',
        severity: 'high',
        recommendation: 'Review management system at 29 SAR/month'
    },
    no_photos: {
        label: 'Missing Photos',
        description: 'No business photos on Google listing',
        icon: Camera,
        color: '#6366f1',
        severity: 'medium',
        recommendation: 'Add professional business photos'
    },
    no_hours: {
        label: 'Missing Hours',
        description: 'Business hours not listed',
        icon: Clock,
        color: '#6366f1',
        severity: 'medium',
        recommendation: 'Complete Google Business Profile'
    },
    no_responses: {
        label: 'No Review Responses',
        description: 'Not responding to customer reviews',
        icon: MessageSquare,
        color: '#6366f1',
        severity: 'medium',
        recommendation: 'Review response strategy'
    }
};

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export default function GapAnalysis() {
    const navigate = useNavigate();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedGap, setSelectedGap] = useState(null);
    const [search, setSearch] = useState('');
    const [severityFilter, setSeverityFilter] = useState('all');
    const [gapStats, setGapStats] = useState({});

    useEffect(() => {
        fetchLeads();
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
            calculateGapStats(data || []);
        } catch (e) {
            console.error('Error:', e);
        } finally {
            setLoading(false);
        }
    }

    function calculateGapStats(leads) {
        const stats = {};
        Object.keys(GAP_CONFIG).forEach(type => {
            stats[type] = { count: 0, leads: [] };
        });

        leads.forEach(lead => {
            const gaps = lead.map_gap_analysis?.gaps || [];
            gaps.forEach(gap => {
                if (stats[gap.type]) {
                    stats[gap.type].count++;
                    stats[gap.type].leads.push(lead);
                }
            });
        });

        setGapStats(stats);
    }

    // Group leads by their worst gap
    const leadsByGap = Object.entries(gapStats).reduce((acc, [gapType, data]) => {
        acc[gapType] = data.leads;
        return acc;
    }, {});

    const filteredLeads = selectedGap
        ? (leadsByGap[selectedGap] || [])
        : leads;

    const displayLeads = filteredLeads.filter(l => {
        if (!search) return true;
        return l.name?.toLowerCase().includes(search.toLowerCase()) ||
               l.address?.toLowerCase().includes(search.toLowerCase());
    }).filter(l => {
        if (severityFilter === 'all') return true;
        const gaps = l.map_gap_analysis?.gaps || [];
        return gaps.some(g => GAP_CONFIG[g.type]?.severity === severityFilter);
    });

    // Sort gaps by impact
    const sortedGapTypes = Object.entries(gapStats)
        .sort((a, b) => b[1].count - a[1].count)
        .filter(([_, data]) => data.count > 0);

    return (
        <div className="min-h-screen bg-obsidian-bg text-white font-['Inter',sans-serif]">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-obsidian-bg/95 backdrop-blur-md border-b border-zinc-800/50">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin-v3/mapgap')}
                            className="text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                            ← Back to Dashboard
                        </button>
                        <div className="h-6 w-px bg-zinc-700" />
                        <h1 className="text-lg font-bold text-white">Gap Analysis</h1>
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
                            value={severityFilter}
                            onChange={e => setSeverityFilter(e.target.value)}
                            className="px-3 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-xl text-sm text-zinc-300 focus:outline-none focus:border-amber-500/50"
                        >
                            <option value="all">All Severities</option>
                            <option value="critical">Critical</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                        </select>
                    </div>
                </div>
            </header>

            <div className="p-6 space-y-6">
                {/* Gap Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedGapTypes.map(([gapType, data]) => {
                        const config = GAP_CONFIG[gapType];
                        if (!config) return null;
                        const Icon = config.icon;
                        const isSelected = selectedGap === gapType;

                        return (
                            <button
                                key={gapType}
                                onClick={() => setSelectedGap(isSelected ? null : gapType)}
                                className={`p-5 rounded-2xl border text-left transition-all ${
                                    isSelected
                                        ? 'bg-zinc-800/80 border-amber-500/50'
                                        : 'bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-800/50'
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                                            style={{ backgroundColor: `${config.color}20` }}
                                        >
                                            <Icon className="w-5 h-5" style={{ color: config.color }} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-white">{config.label}</h3>
                                            <p className="text-xs text-zinc-500 mt-0.5">{data.count} leads affected</p>
                                        </div>
                                    </div>
                                    <span
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                            config.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                                            config.severity === 'high' ? 'bg-amber-500/20 text-amber-400' :
                                            'bg-indigo-500/20 text-indigo-400'
                                        }`}
                                    >
                                        {config.severity}
                                    </span>
                                </div>
                                <p className="text-xs text-zinc-400 mt-3">{config.description}</p>
                            </button>
                        );
                    })}
                </div>

                {/* Selected Gap Details */}
                {selectedGap && (
                    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-semibold text-white">
                                    Leads with: {GAP_CONFIG[selectedGap]?.label}
                                </h3>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                    Recommendation: {GAP_CONFIG[selectedGap]?.recommendation}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedGap(null)}
                                className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4 text-zinc-500" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Leads Table */}
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-zinc-800/50">
                        <h3 className="text-sm font-semibold text-zinc-300">
                            {selectedGap ? 'Affected Leads' : 'All Leads with Gaps'} ({displayLeads.length})
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-zinc-800/50">
                                    <th className="px-5 py-3 text-left text-xs font-bold text-amber-500/80 uppercase tracking-wider">Business</th>
                                    <th className="px-5 py-3 text-left text-xs font-bold text-amber-500/80 uppercase tracking-wider">Gaps Found</th>
                                    <th className="px-5 py-3 text-left text-xs font-bold text-amber-500/80 uppercase tracking-wider">Score</th>
                                    <th className="px-5 py-3 text-left text-xs font-bold text-amber-500/80 uppercase tracking-wider">Priority</th>
                                    <th className="px-5 py-3 text-right text-xs font-bold text-amber-500/80 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/30">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-12 text-center text-zinc-500">Loading...</td>
                                    </tr>
                                ) : displayLeads.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-12 text-center text-zinc-500">No leads found</td>
                                    </tr>
                                ) : (
                                    displayLeads.map(lead => {
                                        const gaps = lead.map_gap_analysis?.gaps || [];
                                        const score = lead.conversion_score || 0;
                                        const priority = lead.priority || 'warm';

                                        return (
                                            <tr key={lead.place_id} className="hover:bg-zinc-800/30 transition-colors">
                                                <td className="px-5 py-4">
                                                    <div>
                                                        <p className="text-sm font-semibold text-zinc-100">{lead.name}</p>
                                                        <p className="text-xs text-zinc-500 mt-0.5">{lead.address?.slice(0, 50)}</p>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {gaps.map((gap, i) => {
                                                            const config = GAP_CONFIG[gap.type];
                                                            if (!config) return null;
                                                            return (
                                                                <span
                                                                    key={i}
                                                                    className="px-2 py-0.5 rounded text-xs"
                                                                    style={{
                                                                        backgroundColor: `${config.color}20`,
                                                                        color: config.color
                                                                    }}
                                                                >
                                                                    {config.label}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-12 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full"
                                                                style={{
                                                                    width: `${score}%`,
                                                                    backgroundColor: score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444'
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-mono text-zinc-300">{score}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                                        priority === 'hot' ? 'bg-red-500/20 text-red-400' :
                                                        priority === 'warm' ? 'bg-amber-500/20 text-amber-400' :
                                                        'bg-indigo-500/20 text-indigo-400'
                                                    }`}>
                                                        {priority}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <button
                                                        onClick={() => navigate(`/admin-v2/pipeline/${lead.place_id}`)}
                                                        className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold transition-colors"
                                                    >
                                                        Manage
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
