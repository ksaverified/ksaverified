import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
    Target, AlertTriangle, ExternalLink, Globe, Star, Image, Clock, MessageSquare, MapPin, Phone, Zap, TrendingUp
} from 'lucide-react';

const GAP_TYPES = {
    no_website: { label: 'No Website', icon: Globe, color: '#ef4444' },
    outdated_website: { label: 'Outdated Website', icon: Globe, color: '#f97316' },
    low_reviews: { label: 'Low Reviews', icon: Star, color: '#f59e0b' },
    no_photos: { label: 'No Photos', icon: Image, color: '#eab308' },
    no_hours: { label: 'Missing Hours', icon: Clock, color: '#84cc16' },
    no_responses: { label: 'No Responses', icon: MessageSquare, color: '#22c55e' },
    no_address: { label: 'Missing Address', icon: MapPin, color: '#06b6d4' },
    no_phone: { label: 'Missing Phone', icon: Phone, color: '#8b5cf6' }
};

const PRIORITY_CONFIG = {
    hot: { label: 'Hot', bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: Zap },
    warm: { label: 'Warm', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: TrendingUp },
    cold: { label: 'Cold', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400', icon: AlertTriangle }
};

const PIPELINE_STAGES = [
    { key: 'scouted', label: 'Scouted', color: '#6366f1' },
    { key: 'published', label: 'Published', color: '#8b5cf6' },
    { key: 'pitched', label: 'Pitched', color: '#f59e0b' },
    { key: 'warmed', label: 'Warmed', color: '#3b82f6' },
    { key: 'interest_confirmed', label: 'Interested', color: '#10b981' },
    { key: 'completed', label: 'Closed', color: '#22c55e' },
];

export default function BossLeadAnalysis() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    const gapFilter = searchParams.get('gap');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const { data: leadsData, error } = await supabase
                .from('leads')
                .select('*')
                .order('updated_at', { ascending: false })
                .limit(500);
            
            if (error) {
                console.error('Lead fetch error:', error);
                const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/leads?select=*&order=updated_at.desc&limit=500`, {
                    headers: { 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY }
                });
                if (resp.ok) {
                    const data = await resp.json();
                    setLeads(Array.isArray(data) ? data : data.value || []);
                }
            } else if (leadsData) {
                setLeads(leadsData);
            }
        } catch (e) {
            console.error('Error fetching data:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredLeads = gapFilter 
        ? leads.filter(l => (l.map_gap_analysis?.gaps || []).some(g => g.type === gapFilter))
        : leads;

    return (
        <div className="min-h-screen bg-obsidian-bg text-white font-['Inter',sans-serif] p-6 animate-in fade-in duration-700">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col min-h-[85vh]">
                <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                            <Target className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Lead Analysis Grid</h2>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Top 500 Opportunities</p>
                        </div>
                    </div>
                </div>
                
                <div className="overflow-x-auto flex-1">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-800/50 bg-black/20">
                                <th className="px-6 py-4 text-left text-xs font-bold text-amber-500/80 uppercase tracking-wider">Business</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-amber-500/80 uppercase tracking-wider">Priority</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-amber-500/80 uppercase tracking-wider">Score</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-amber-500/80 uppercase tracking-wider">Gaps Identified</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-amber-500/80 uppercase tracking-wider">Pipeline</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-amber-500/80 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/30">
                            {loading ? (
                                <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-500 font-mono text-sm">Loading 500 signals...</td></tr>
                            ) : filteredLeads.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-500 font-mono text-sm">No leads match filters</td></tr>
                            ) : (
                                filteredLeads.map(lead => {
                                    const priority = lead.priority || lead.map_gap_analysis?.priorityLevel || 'warm';
                                    const score = lead.conversion_score || lead.map_gap_analysis?.scores?.conversionScore || 0;
                                    const gaps = lead.map_gap_analysis?.gaps || [];
                                    const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.warm;
                                    const PriorityIcon = config.icon;
                                    const pipelineStage = PIPELINE_STAGES.find(s => s.key === lead.status) || { label: lead.status, color: '#52525b' };
                                    
                                    return (
                                        <tr key={lead.place_id} className="hover:bg-zinc-800/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-semibold text-zinc-100 group-hover:text-amber-400 transition-colors">{lead.name}</p>
                                                    <p className="text-xs text-zinc-500 mt-0.5">{lead.phone || 'No phone'}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${config.bg} ${config.border} ${config.text}`}>
                                                    <PriorityIcon className="w-3.5 h-3.5" />
                                                    {config.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-20 h-1.5 bg-zinc-800/50 rounded-full overflow-hidden border border-zinc-700/30">
                                                        <div className="h-full rounded-full" style={{ 
                                                            width: `${score}%`, 
                                                            backgroundColor: score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444' 
                                                        }} />
                                                    </div>
                                                    <span className="text-xs font-mono text-zinc-300 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700/50">{score}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 gap-1.5 flex flex-wrap max-w-sm mt-3">
                                                {gaps.slice(0, 3).map((gap, i) => {
                                                    const GapIcon = GAP_TYPES[gap.type]?.icon || AlertTriangle;
                                                    const gapColor = GAP_TYPES[gap.type]?.color || '#6366f1';
                                                    return (
                                                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium" 
                                                            style={{ backgroundColor: `${gapColor}20`, color: gapColor, border: `1px solid ${gapColor}30` }}>
                                                            <GapIcon className="w-3 h-3" />
                                                            {GAP_TYPES[gap.type]?.label || gap.type}
                                                        </span>
                                                    );
                                                })}
                                                {gaps.length > 3 && (
                                                    <span className="px-2 py-0.5 bg-zinc-800 text-zinc-500 text-[10px] rounded border border-zinc-700/50">
                                                        +{gaps.length - 3}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border" 
                                                    style={{ backgroundColor: `${pipelineStage.color}15`, color: pipelineStage.color, borderColor: `${pipelineStage.color}30` }}>
                                                    {pipelineStage.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {lead.vercel_url && (
                                                        <a href={lead.vercel_url} target="_blank" rel="noreferrer" 
                                                            className="p-2 bg-zinc-800/80 hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-700/50">
                                                            <ExternalLink className="w-4 h-4 text-zinc-400" />
                                                        </a>
                                                    )}
                                                    {/* BOOM ✅ Detailed Bug Fix HERE. Routing directly to /boss/pipeline instead of /admin/pipeline */}
                                                    <button onClick={() => navigate(`/boss/pipeline/${lead.place_id}`)} 
                                                        className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5">
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
        </div>
    );
}
