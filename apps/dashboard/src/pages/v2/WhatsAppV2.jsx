import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useSearchParams } from 'react-router-dom';
import { MessageCircle, Search, User, Hash, Globe2, Send, Loader2, Sparkles } from 'lucide-react';

function TranslationTooltip({ text }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative inline-block ml-1.5">
            <button onClick={() => setOpen(!open)} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
                className="text-zinc-600 hover:text-amber-500 transition-colors align-middle p-1 rounded-md hover:bg-white/5">
                <Globe2 className="w-3.5 h-3.5" />
            </button>
            {open && text && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 glass-card p-4 rounded-2xl border-t border-white/10 shadow-2xl z-[100] animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                        <p className="font-black text-amber-500 text-[9px] uppercase tracking-[0.2em]">Live Translation</p>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed font-medium">{text}</p>
                </div>
            )}
        </div>
    );
}

export default function WhatsAppV2() {
    const [threads, setThreads] = useState([]);
    const [active, setActive] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [englishReply, setEnglishReply] = useState('');
    const [replyText, setReplyText] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [searchParams] = useSearchParams();
    const phoneParam = searchParams.get('phone');
    const endRef = useRef(null);

    useEffect(() => {
        fetchThreads();
        const ch = supabase.channel('v2:whatsapp')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_logs' }, () => {
                fetchThreads();
                if (active) fetchMessages(active.phone);
            }).subscribe();
        return () => supabase.removeChannel(ch);
    }, [active]);

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    async function fetchThreads() {
        try {
            const { data, error } = await supabase
                .from('chat_logs')
                .select('id, phone, message_in, message_out, translated_message, created_at, leads(name)')
                .order('created_at', { ascending: false });

            const rows = error ? (await supabase.from('chat_logs').select('id, phone, message_in, message_out, translated_message, created_at').order('created_at', { ascending: false })).data : data;

            if (rows) {
                const seen = new Set();
                const threads = [];
                rows.forEach(log => {
                    const cleanPhone = log.phone.replace('@c.us', '');
                    if (!seen.has(log.phone)) {
                        seen.add(log.phone);
                        threads.push({
                            phone: log.phone,
                            cleanPhone: cleanPhone,
                            name: log.leads?.name || 'Unknown Lead',
                            lastMessage: log.message_in || log.message_out || '—',
                            lastTime: log.created_at,
                            isInbound: !!log.message_in
                        });
                    }
                });
                setThreads(threads);

                // Auto-select if phone param is present
                if (phoneParam && !active) {
                    const target = threads.find(t => t.cleanPhone === phoneParam || t.phone === phoneParam);
                    if (target) {
                        setActive(target);
                        fetchMessages(target.phone);
                    }
                }
            }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }

    async function fetchMessages(phone) {
        const { data } = await supabase.from('chat_logs').select('*').eq('phone', phone).order('created_at', { ascending: true });
        if (data) setMessages(data);
    }

    async function handleTranslate(text) {
        setEnglishReply(text);
        if (!text.trim()) { setReplyText(''); return; }
        setIsTranslating(true);
        try {
            const res = await fetch('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, targetLang: 'Arabic' }) });
            const d = await res.json();
            if (d.translatedText) setReplyText(d.translatedText);
        } catch { } finally { setIsTranslating(false); }
    }

    async function handleSend() {
        if (!active || !replyText.trim() || isSending) return;
        setIsSending(true);
        try {
            const res = await fetch('/api/send-message', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: active.phone, message: replyText }) });
            if (res.ok) { setEnglishReply(''); setReplyText(''); fetchMessages(active.phone); }
            else alert('Failed to send. Check WhatsApp service.');
        } catch { alert('Error sending message.'); } finally { setIsSending(false); }
    }

    const filtered = threads.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.phone.includes(search));
    const fmt = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <>
            <div className="flex h-screen overflow-hidden">
                {/* Thread list */}
                <div className="w-80 flex-shrink-0 border-r border-white/5 bg-obsidian-surface-low/30 backdrop-blur-md flex flex-col relative z-20">
                    <div className="p-6 border-b border-white/5 bg-obsidian-surface-low/50">
                        <h2 className="text-xs font-black text-white flex items-center gap-3 mb-4 uppercase tracking-[0.2em]">
                            <MessageCircle className="w-4 h-4 text-amber-500" /> WhatsApp Console
                        </h2>
                        <div className="relative group">
                            <Search className="w-4 h-4 text-zinc-600 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-amber-500 transition-colors" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="SEARCH THREADS..."
                                className="w-full pl-10 pr-4 py-2.5 bg-obsidian-dark/50 border border-white/5 rounded-xl text-[10px] font-bold text-white placeholder-zinc-700 focus:outline-none focus:border-amber-500/50 uppercase tracking-widest transition-all" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="p-8 text-center">
                                <Loader2 className="w-5 h-5 text-amber-500 animate-spin mx-auto mb-2 opacity-40" />
                                <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Inlining Context...</span>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="p-12 text-center">
                                <MessageCircle className="w-8 h-8 text-zinc-900 mx-auto mb-3 opacity-40" />
                                <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest leading-loose">No Active<br/>Engagements</p>
                            </div>
                        ) : (
                            filtered.map(t => (
                                <button key={t.phone} onClick={() => { setActive(t); fetchMessages(t.phone); }}
                                    className={`w-full text-left p-5 border-b border-white/5 hover:bg-white/[0.02] transition-all relative group ${active?.phone === t.phone ? 'bg-amber-500/[0.03]' : ''}`}>
                                    {active?.phone === t.phone && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                                    )}
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className={`text-[11px] font-black uppercase tracking-tight truncate ${active?.phone === t.phone ? 'text-amber-500' : 'text-zinc-200 group-hover:text-white'}`}>{t.name}</span>
                                        <span className="text-[9px] text-zinc-600 font-bold">{fmt(t.lastTime)}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[9px] text-zinc-600 font-bold uppercase tracking-widest mb-2 opacity-60">
                                        <Hash className="w-2.5 h-2.5" /> {t.phone.replace('@c.us', '')}
                                    </div>
                                    <p className={`text-[11px] truncate leading-relaxed ${active?.phone === t.phone ? 'text-white font-medium' : 'text-zinc-500'}`}>{t.lastMessage}</p>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat pane */}
                <div className="flex-1 flex flex-col bg-obsidian-dark relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.02] via-transparent to-transparent pointer-events-none" />
                    {active ? (
                        <>
                            {/* Chat header */}
                            <div className="px-8 py-4 bg-obsidian-surface-medium/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between flex-shrink-0 z-10 sticky top-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-obsidian-surface-high border border-white/10 flex items-center justify-center shadow-inner group">
                                        <User className="w-6 h-6 text-zinc-500 group-hover:text-amber-500 transition-colors" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-white uppercase tracking-tight">{active.name}</h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{active.phone.replace('@c.us', '')}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase tracking-widest">
                                        Active Hook
                                    </div>
                                </div>
                            </div>
                            
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-6 flex flex-col custom-scrollbar relative">
                                {messages.map(log => (
                                    <div key={log.id}>
                                        {log.message_out && (
                                            <div className="flex justify-end pr-2">
                                                <div className="bg-obsidian-surface-highest border border-white/10 text-white px-5 py-3.5 rounded-3xl rounded-tr-sm max-w-[65%] shadow-xl relative group">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
                                                    <p className="text-[13px] whitespace-pre-wrap leading-relaxed relative z-10">{log.message_out}</p>
                                                    <p className="text-[9px] text-zinc-500 font-bold mt-2.5 flex items-center justify-end gap-1.5 uppercase tracking-widest relative z-10">
                                                        {fmt(log.created_at)}
                                                        <span className="w-1 h-1 rounded-full bg-amber-500" />
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {log.message_in && (
                                            <div className="flex justify-start pl-2">
                                                <div className="glass-card border-t border-white/10 text-zinc-100 px-5 py-3.5 rounded-3xl rounded-tl-sm max-w-[65%] shadow-lg relative group">
                                                    <div className="flex items-start gap-2 relative z-10">
                                                        <p className="text-[13px] whitespace-pre-wrap leading-relaxed flex-1">{log.message_in}</p>
                                                        {log.translated_message && log.translated_message !== log.message_in && (
                                                            <TranslationTooltip text={log.translated_message} />
                                                        )}
                                                    </div>
                                                    <p className="text-[9px] text-zinc-600 font-bold mt-2.5 flex items-center gap-1.5 uppercase tracking-widest relative z-10">
                                                        {fmt(log.created_at)}
                                                        <span className="w-1 h-1 rounded-full bg-zinc-800" />
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div ref={endRef} />
                            </div>

                            {/* Reply area */}
                            <div className="p-8 bg-obsidian-surface-medium/50 backdrop-blur-xl border-t border-white/5 space-y-4 flex-shrink-0 relative z-10">
                                <div className="absolute inset-0 bg-gradient-to-t from-amber-500/[0.01] to-transparent pointer-events-none" />
                                <div className="relative group">
                                    <div className="flex items-center justify-between mb-2 px-1">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                            <span className="text-[9px] text-amber-500 font-black uppercase tracking-[0.2em] shadow-amber-500/20">Bilingual Engine Draft</span>
                                        </div>
                                        {isTranslating && (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="w-2.5 h-2.5 text-zinc-500 animate-spin" />
                                                <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Compiling...</span>
                                            </div>
                                        )}
                                    </div>
                                    <input value={englishReply} onChange={e => handleTranslate(e.target.value)} disabled={isSending}
                                        placeholder="INPUT ENGLISH SEQUENCE..."
                                        className="w-full bg-obsidian-dark/80 border border-white/10 rounded-2xl px-5 py-3.5 text-[11px] font-bold text-white placeholder-zinc-700 focus:outline-none focus:border-amber-500/50 focus:bg-obsidian-dark transition-all uppercase tracking-widest" />
                                </div>
                                <div className="flex gap-4 items-end">
                                    <textarea value={replyText} onChange={e => setReplyText(e.target.value)} disabled={isSending}
                                        placeholder="TARGET ARABIC OUTPUT..."
                                        className="flex-1 bg-obsidian-surface-high/50 border border-white/10 rounded-2xl px-5 py-4 text-[13px] text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-emerald-500/50 resize-none min-h-[56px] max-h-48 leading-relaxed font-medium transition-all"
                                        rows={1} />
                                    <button onClick={handleSend} disabled={isSending || !replyText.trim()}
                                        className="h-14 px-8 bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:from-zinc-800 disabled:to-zinc-900 disabled:opacity-40 text-black text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl flex items-center gap-3 transition-all flex-shrink-0 shadow-lg shadow-amber-500/10 active:scale-95">
                                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        Execute
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center flex-col gap-6 text-center p-12 relative">
                            <div className="w-24 h-24 rounded-[2.5rem] bg-obsidian-surface-high border border-white/5 flex items-center justify-center relative group">
                                <div className="absolute inset-0 bg-amber-500/10 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <MessageCircle className="w-10 h-10 text-amber-500/20 relative z-10" />
                            </div>
                            <div>
                                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em]">Communication Void</h3>
                                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-3 opacity-60">Initialize a thread to view telemetry</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
