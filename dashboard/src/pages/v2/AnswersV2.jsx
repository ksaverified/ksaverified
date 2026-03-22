import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { BookOpen, MessageSquare, CheckCircle, Edit3, Save, X } from 'lucide-react';
import V2Shell from './V2Shell';

export default function AnswersV2() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [englishInput, setEnglishInput] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);

    useEffect(() => {
        fetchPending();
        const ch = supabase.channel('v2:answers')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_logs' }, fetchPending)
            .subscribe();
        return () => supabase.removeChannel(ch);
    }, []);

    async function fetchPending() {
        try {
            const { data } = await supabase
                .from('chat_logs')
                .select('id, message_in, message_out, translated_message, status, created_at, phone, leads(name)')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });
            if (data) setLogs(data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }

    async function handleApprove(id) {
        await supabase.from('chat_logs').update({ status: 'approved' }).eq('id', id);
        setLogs(prev => prev.filter(l => l.id !== id));
    }

    async function handleSave(id) {
        if (!editValue.trim()) return;
        await supabase.from('chat_logs').update({ status: 'corrected', corrected_text: editValue }).eq('id', id);
        setEditingId(null); setEditValue(''); setEnglishInput('');
        setLogs(prev => prev.filter(l => l.id !== id));
    }

    async function handleTranslate(text) {
        setEnglishInput(text);
        if (!text.trim()) return;
        setIsTranslating(true);
        try {
            const res = await fetch('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, targetLang: 'Arabic' }) });
            const d = await res.json();
            if (d.translatedText) setEditValue(d.translatedText);
        } catch { } finally { setIsTranslating(false); }
    }

    return (
        <V2Shell>
            <div className="p-8 space-y-8 max-w-5xl mx-auto">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                        <BookOpen className="w-6 h-6 text-amber-500" /> Neural Training Console
                    </h1>
                    <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest mt-1.5 opacity-60">
                        Reviewing Latent Space Projections — Calibrate the Bilingual Engine for Maximum Precision
                    </p>
                </div>

                {loading ? (
                    <div className="py-24 text-center">
                        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3 opacity-40" />
                        <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Accessing Knowledge Base...</span>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="py-32 text-center glass-card border-dashed border-zinc-800 rounded-[2.5rem]">
                        <MessageSquare className="w-12 h-12 text-zinc-900 mx-auto mb-4 opacity-40" />
                        <p className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em]">Entropy Neutralized</p>
                        <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-2">Zero pending telemetry requires intervention</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {logs.map(log => (
                            <div key={log.id} className="glass-card border-t border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.02] to-transparent pointer-events-none" />
                                {/* Header */}
                                <div className="px-8 py-4 bg-obsidian-surface-medium/50 border-b border-white/5 flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-obsidian-surface-high border border-white/10 flex items-center justify-center">
                                            <span className="text-[10px] font-black text-amber-500">{log.leads?.name?.substring(0, 1) || 'U'}</span>
                                        </div>
                                        <div>
                                            <span className="text-[11px] font-black text-white uppercase tracking-tight">{log.leads?.name || 'Inbound Terminal'}</span>
                                            <span className="text-[10px] text-zinc-600 font-bold ml-3 uppercase tracking-widest opacity-60">+{log.phone?.replace('@c.us', '')}</span>
                                        </div>
                                    </div>
                                    <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest opacity-40">{new Date(log.created_at).toLocaleString()}</span>
                                </div>

                                {/* Conversation */}
                                <div className="p-8 space-y-6 relative z-10">
                                    {/* Inbound */}
                                    <div className="flex justify-start">
                                        <div className="bg-obsidian-surface-high/50 border border-white/10 rounded-3xl rounded-tl-sm px-6 py-4 max-w-[80%] shadow-lg">
                                            <p className="text-[9px] text-zinc-600 mb-2.5 font-black uppercase tracking-widest">Inbound Signal</p>
                                            <p className="text-[13px] text-zinc-200 whitespace-pre-wrap leading-relaxed">{log.message_in}</p>
                                            {log.translated_message && log.translated_message !== log.message_in && (
                                                <div className="mt-4 pt-4 border-t border-white/5">
                                                    <p className="text-[12px] text-amber-500/70 italic font-medium leading-relaxed">{log.translated_message}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {/* Outbound */}
                                    <div className="flex justify-end">
                                        <div className="bg-obsidian-surface-highest border border-white/10 rounded-3xl rounded-tr-sm px-6 py-4 max-w-[80%] shadow-xl relative overflow-hidden group/out">
                                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.05] to-transparent pointer-events-none" />
                                            <p className="text-[9px] text-amber-500/50 mb-2.5 font-black uppercase tracking-widest relative z-10">Synthetic Output</p>
                                            {editingId === log.id ? (
                                                <div className="space-y-5 min-w-[320px] relative z-10">
                                                    <div>
                                                        <p className="text-[9px] text-amber-500/30 font-black uppercase tracking-widest mb-2 px-1">Source Logic (English)</p>
                                                        <input value={englishInput} onChange={e => handleTranslate(e.target.value)} autoFocus
                                                            placeholder="SEQUENCE INPUT..." className="w-full bg-obsidian-dark/80 border border-white/5 rounded-xl px-4 py-3 text-[11px] text-white focus:outline-none focus:border-amber-500/50 uppercase tracking-widest transition-all" />
                                                        {isTranslating && (
                                                            <div className="flex items-center gap-2 mt-2 px-1">
                                                                <Loader2 className="w-2.5 h-2.5 text-amber-500 animate-spin" />
                                                                <span className="text-[9px] text-zinc-700 font-bold uppercase tracking-widest">Compiling...</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] text-amber-500/30 font-black uppercase tracking-widest mb-2 px-1">Target Manifold (Arabic)</p>
                                                        <textarea value={editValue} onChange={e => setEditValue(e.target.value)}
                                                            className="w-full bg-obsidian-dark/80 border border-white/10 rounded-xl p-4 text-[13px] text-white focus:outline-none focus:border-emerald-500/30 min-h-[100px] resize-none leading-relaxed transition-all" />
                                                    </div>
                                                    <div className="flex justify-end gap-3">
                                                        <button onClick={() => setEditingId(null)} className="px-4 py-2 text-[10px] font-black text-zinc-600 hover:text-white uppercase tracking-widest transition-colors">Abort</button>
                                                        <button onClick={() => handleSave(log.id)} disabled={!editValue.trim()}
                                                            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-black text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center gap-2 transition-all shadow-lg active:scale-95">
                                                            <Save className="w-4 h-4" /> Commit Training
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-[13px] text-zinc-100 whitespace-pre-wrap leading-relaxed relative z-10">{log.message_out}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions footer */}
                                {editingId !== log.id && (
                                    <div className="px-8 py-5 border-t border-white/5 bg-obsidian-surface-medium/30 flex justify-end gap-4 relative z-10">
                                        <button onClick={() => { setEditingId(log.id); setEditValue(log.message_out || ''); setEnglishInput(''); }}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-obsidian-surface-high border border-white/5 hover:border-amber-500/50 text-zinc-400 hover:text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 group">
                                            <Edit3 className="w-3.5 h-3.5" /> Calibrate Manifold
                                        </button>
                                        <button onClick={() => handleApprove(log.id)}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95">
                                            <CheckCircle className="w-3.5 h-3.5" /> High Fidelity
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </V2Shell>
    );
}
