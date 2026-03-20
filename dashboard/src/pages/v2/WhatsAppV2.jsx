import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { MessageCircle, Search, User, Hash, Globe2, Send, Loader2 } from 'lucide-react';
import V2Shell from './V2Shell';

function TranslationTooltip({ text }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative inline-block ml-1.5">
            <button onClick={() => setOpen(!open)} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
                className="text-zinc-600 hover:text-emerald-400 transition-colors align-middle">
                <Globe2 className="w-3.5 h-3.5" />
            </button>
            {open && text && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-zinc-800 text-zinc-200 text-xs p-3 rounded-lg border border-zinc-700 shadow-xl z-50 pointer-events-none">
                    <p className="font-semibold text-emerald-400 mb-1 text-[10px] uppercase tracking-wider">Translation</p>
                    <p className="whitespace-pre-wrap">{text}</p>
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
                    if (!seen.has(log.phone)) {
                        seen.add(log.phone);
                        threads.push({
                            phone: log.phone,
                            name: log.leads?.name || 'Unknown Lead',
                            lastMessage: log.message_in || log.message_out || '—',
                            lastTime: log.created_at,
                            isInbound: !!log.message_in
                        });
                    }
                });
                setThreads(threads);
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
        <V2Shell>
            <div className="flex h-screen overflow-hidden">
                {/* Thread list */}
                <div className="w-72 flex-shrink-0 border-r border-zinc-800 bg-zinc-900/20 flex flex-col">
                    <div className="p-4 border-b border-zinc-800">
                        <h2 className="text-sm font-bold text-zinc-300 flex items-center gap-2 mb-3">
                            <MessageCircle className="w-4 h-4 text-emerald-500" /> WhatsApp CX
                        </h2>
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                                className="w-full pl-8 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-600" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-6 text-center text-zinc-600 text-xs animate-pulse">Loading threads...</div>
                        ) : filtered.length === 0 ? (
                            <div className="p-6 text-center text-zinc-700 text-xs">No conversations</div>
                        ) : (
                            filtered.map(t => (
                                <button key={t.phone} onClick={() => { setActive(t); fetchMessages(t.phone); }}
                                    className={`w-full text-left p-4 border-b border-zinc-800/40 hover:bg-zinc-800/30 transition-all ${active?.phone === t.phone ? 'bg-zinc-800/50 border-l-2 border-emerald-500 pl-3.5' : 'border-l-2 border-transparent'}`}>
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className="text-xs font-semibold text-zinc-200 truncate">{t.name}</span>
                                        <span className="text-[10px] text-zinc-600">{fmt(t.lastTime)}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-zinc-600 mb-1">
                                        <Hash className="w-2.5 h-2.5" /> {t.phone.replace('@c.us', '')}
                                    </div>
                                    <p className="text-[11px] text-zinc-500 truncate">{t.lastMessage}</p>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat pane */}
                <div className="flex-1 flex flex-col bg-zinc-950">
                    {active ? (
                        <>
                            {/* Chat header */}
                            <div className="px-5 py-3 bg-zinc-900/80 border-b border-zinc-800 flex items-center gap-3 flex-shrink-0">
                                <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                                    <User className="w-4 h-4 text-zinc-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-zinc-200">{active.name}</p>
                                    <p className="text-[10px] text-zinc-500">{active.phone.replace('@c.us', '')}</p>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-3">
                                {messages.map(log => (
                                    <div key={log.id}>
                                        {log.message_out && (
                                            <div className="flex justify-end">
                                                <div className="bg-emerald-700 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[70%] shadow-sm">
                                                    <p className="text-sm whitespace-pre-wrap">{log.message_out}</p>
                                                    <p className="text-[10px] text-emerald-200 text-right mt-1">{fmt(log.created_at)}</p>
                                                </div>
                                            </div>
                                        )}
                                        {log.message_in && (
                                            <div className="flex justify-start">
                                                <div className="bg-zinc-800 border border-zinc-700/50 text-zinc-200 px-4 py-2.5 rounded-2xl rounded-tl-sm max-w-[70%] shadow-sm">
                                                    <div className="flex items-center gap-1">
                                                        <p className="text-sm whitespace-pre-wrap">{log.message_in}</p>
                                                        {log.translated_message && log.translated_message !== log.message_in && (
                                                            <TranslationTooltip text={log.translated_message} />
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-zinc-500 text-right mt-1">{fmt(log.created_at)}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div ref={endRef} />
                            </div>

                            {/* Reply area */}
                            <div className="p-4 bg-zinc-900/80 border-t border-zinc-800 space-y-3 flex-shrink-0">
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Draft in English → Translates to Arabic</span>
                                        {isTranslating && <span className="text-[10px] text-zinc-500 animate-pulse">Translating...</span>}
                                    </div>
                                    <input value={englishReply} onChange={e => handleTranslate(e.target.value)} disabled={isSending}
                                        placeholder="Type in English..."
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-all" />
                                </div>
                                <div className="flex gap-3 items-end">
                                    <textarea value={replyText} onChange={e => setReplyText(e.target.value)} disabled={isSending}
                                        placeholder="Final Arabic message..."
                                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 resize-none min-h-[42px] max-h-28"
                                        rows={1} />
                                    <button onClick={handleSend} disabled={isSending || !replyText.trim()}
                                        className="h-[42px] px-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold rounded-xl flex items-center gap-2 transition-all flex-shrink-0">
                                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center flex-col gap-4 text-center p-8">
                            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                <MessageCircle className="w-8 h-8 text-emerald-500/40" />
                            </div>
                            <div>
                                <p className="text-zinc-300 font-semibold">WhatsApp CX Console</p>
                                <p className="text-sm text-zinc-600 mt-1">Select a conversation to view messages</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </V2Shell>
    );
}
