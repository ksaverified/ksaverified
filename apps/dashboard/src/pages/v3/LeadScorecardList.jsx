import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Globe, Star, MapPin, AlertTriangle, CheckCircle, Zap } from 'lucide-react';

export default function LeadScorecardList() {
    const navigate = useNavigate();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeads = async () => {
            const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
            if (data) setLeads(data);
            setLoading(false);
        };
        fetchLeads();
    }, []);

    const calculateGapScore = (lead) => {
        let score = 100;
        let gaps = [];
        if (!lead.website) { score -= 30; gaps.push('No Website'); }
        if ((lead.rating || 0) < 4.0) { score -= 20; gaps.push('Low Rating'); }
        if ((lead.review_count || 0) < 10) { score -= 20; gaps.push('Few Reviews'); }
        if (!lead.phone_number) { score -= 30; gaps.push('No Phone'); }
        return { score, gaps };
    };

    const getGrade = (score) => {
        if (score >= 90) return { letter: 'A', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
        if (score >= 70) return { letter: 'B', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' };
        if (score >= 50) return { letter: 'C', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
        if (score >= 30) return { letter: 'D', color: 'text-amber-600', bg: 'bg-amber-600/10', border: 'border-amber-600/20' };
        return { letter: 'F', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' };
    };

    if (loading) {
        return <div className="p-10 text-center text-zinc-500 font-bold uppercase tracking-widest">Loading Scorecards...</div>;
    }

    return (
        <div className="p-8 pb-32 h-full">
            <div className="max-w-[1600px] mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-black tracking-tighter uppercase mb-2">Lead Scorecards</h1>
                    <p className="text-sm text-zinc-400 font-medium">Prioritize prospects based on their digital presence gaps and immediate needs.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {leads.map(lead => {
                        const { score, gaps } = calculateGapScore(lead);
                        const grade = getGrade(score);

                        return (
                            <div key={lead.place_id} className="glass-card rounded-[24px] p-6 border border-white/5 relative overflow-hidden group hover:border-white/20 transition-all">
                                {/* Grade Watermark */}
                                <div className={`absolute -bottom-6 -right-6 text-9xl font-black opacity-5 ${grade.color} pointer-events-none group-hover:scale-110 transition-transform`}>
                                    {grade.letter}
                                </div>

                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-black text-white leading-tight truncate w-48">{lead.name}</h3>
                                        <div className="flex items-center gap-1.5 mt-1.5">
                                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                            <span className="text-xs font-bold text-white">{lead.rating || 'New'} <span className="text-zinc-500 font-normal">({lead.review_count || 0})</span></span>
                                        </div>
                                    </div>
                                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border shadow-inner ${grade.bg} ${grade.border}`}>
                                        <span className={`text-2xl font-black leading-none ${grade.color}`}>{grade.letter}</span>
                                        <span className={`text-[8px] font-black uppercase tracking-widest ${grade.color}`}>Score</span>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-6">
                                    {gaps.length > 0 ? (
                                        gaps.map((gap, i) => (
                                            <div key={i} className="flex items-center gap-2 text-xs font-bold text-red-400 bg-red-500/5 px-3 py-1.5 rounded-lg border border-red-500/10">
                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                {gap}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/5 px-3 py-1.5 rounded-lg border border-emerald-500/10">
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            Perfect Digital Presence
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3 relative z-10">
                                    <button 
                                        onClick={() => {
                                            alert(`Initiating automations for ${lead.name}`);
                                            navigate('/boss/pipeline/' + lead.place_id);
                                        }}
                                        className="py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-[11px] font-black uppercase tracking-widest transition-all text-center flex items-center justify-center gap-1.5 shadow-lg">
                                        <Zap className="w-3.5 h-3.5" /> Automate
                                    </button>
                                    <button 
                                        onClick={() => navigate('/boss/pipeline/' + lead.place_id)}
                                        className="py-2.5 rounded-xl bg-obsidian-surface-highest border border-white/10 hover:bg-white/5 text-zinc-300 text-[11px] font-black uppercase tracking-widest transition-all text-center">
                                        View Details
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
