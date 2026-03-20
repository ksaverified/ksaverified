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
            <div className="p-6 space-y-5">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-indigo-400" /> AI Training — Answers Review
                    </h1>
                    <p className="text-sm text-zinc-500 mt-0.5">
                        Review AI replies to incoming WhatsApp messages. Approve good answers or correct mistakes to train the model.
                    </p>
                </div>

                {loading ? (
                    <div className="py-12 text-center text-zinc-600 animate-pulse">Loading pending replies...</div>
                ) : logs.length === 0 ? (
                    <div className="py-16 text-center border border-dashed border-zinc-800 rounded-xl">
                        <MessageSquare className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                        <p className="text-zinc-400 font-medium">All caught up!</p>
                        <p className="text-sm text-zinc-600 mt-1">No pending AI responses need review.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {logs.map(log => (
                            <div key={log.id} className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
                                {/* Header */}
                                <div className="px-5 py-3 bg-zinc-900/50 border-b border-zinc-800 flex items-center justify-between">
                                    <div>
                                        <span className="text-sm font-semibold text-zinc-200">{log.leads?.name || 'Unknown Lead'}</span>
                                        <span className="text-xs text-zinc-600 ml-3">{log.phone?.replace('@c.us', '')}</span>
                                    </div>
                                    <span className="text-[11px] text-zinc-600">{new Date(log.created_at).toLocaleString()}</span>
                                </div>

                                {/* Conversation */}
                                <div className="p-5 space-y-3">
                                    {/* Inbound */}
                                    <div className="flex justify-start">
                                        <div className="bg-zinc-800 border border-zinc-700/40 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                                            <p className="text-[10px] text-zinc-500 mb-1 font-semibold uppercase tracking-wider">Lead asked</p>
                                            <p className="text-sm text-zinc-200 whitespace-pre-wrap">{log.message_in}</p>
                                            {log.translated_message && log.translated_message !== log.message_in && (
                                                <p className="text-xs text-indigo-300 italic mt-2 pt-2 border-t border-zinc-700/40">{log.translated_message}</p>
                                            )}
                                        </div>
                                    </div>
                                    {/* Outbound */}
                                    <div className="flex justify-end">
                                        <div className="bg-indigo-900/30 border border-indigo-500/20 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
                                            <p className="text-[10px] text-indigo-400 mb-1 font-semibold uppercase tracking-wider">AI replied</p>
                                            {editingId === log.id ? (
                                                <div className="space-y-3 min-w-[280px]">
                                                    <div>
                                                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-1">Compose in English</p>
                                                        <input value={englishInput} onChange={e => handleTranslate(e.target.value)} autoFocus
                                                            placeholder="Type English..." className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" />
                                                        {isTranslating && <span className="text-[10px] text-zinc-600 animate-pulse">Translating...</span>}
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-1">Arabic Correction</p>
                                                        <textarea value={editValue} onChange={e => setEditValue(e.target.value)}
                                                            className="w-full bg-zinc-950 border border-indigo-500/40 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none min-h-[80px] resize-none" />
                                                    </div>
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors">Cancel</button>
                                                        <button onClick={() => handleSave(log.id)} disabled={!editValue.trim()}
                                                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all">
                                                            <Save className="w-3.5 h-3.5" /> Save Training
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-indigo-100 whitespace-pre-wrap">{log.message_out}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions footer */}
                                {editingId !== log.id && (
                                    <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950/40 flex justify-end gap-2">
                                        <button onClick={() => { setEditingId(log.id); setEditValue(log.message_out || ''); setEnglishInput(''); }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition-all">
                                            <Edit3 className="w-3.5 h-3.5" /> Edit & Train
                                        </button>
                                        <button onClick={() => handleApprove(log.id)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium rounded-lg transition-all">
                                            <CheckCircle className="w-3.5 h-3.5" /> Good Answer
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
