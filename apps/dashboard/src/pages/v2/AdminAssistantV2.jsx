import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, RefreshCw } from 'lucide-react';

export default function AdminAssistantV2() {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hello! I am your KSAVerified Admin Assistant. I have real-time access to the database. Ask me about recent leads, who I've talked to, or what I'm currently doing." }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const endRef = useRef(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = { role: 'user', content: input.trim() };
        const newMessages = [...messages, userMsg];
        
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            // We only send the conversation history to the API, excluding the initial greeting for brevity if desired,
            // but for simplicity, we send the whole thing.
            const response = await fetch('/api/admin-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })) })
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data = await response.json();
            
            setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: "⚠️ Sorry, I encountered an error connecting to the intelligence server." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] max-w-5xl mx-auto p-6 md:p-10 relative">
                
                {/* Header */}
                <div className="flex items-center gap-6 mb-10 glass-card border-t border-white/5 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-50" />
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-xl shadow-amber-500/20 group-hover:scale-110 transition-transform duration-500">
                        <Bot className="w-9 h-9 text-black stroke-[2.5]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight uppercase italic mb-1">Neural Administrator</h1>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] opacity-80">Quantum analytic interface for high-fidelity database operations</p>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 glass-card border-t border-white/5 rounded-[3rem] overflow-hidden flex flex-col mb-8 shadow-3xl relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.01] to-transparent pointer-events-none" />
                    
                    <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar relative z-10">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex gap-6 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
                                    msg.role === 'user' 
                                        ? 'bg-amber-500 text-black shadow-amber-500/20' 
                                        : 'bg-obsidian-surface-highest border border-white/5 text-amber-500 shadow-xl'
                                }`}>
                                    {msg.role === 'user' ? <User className="w-5 h-5 stroke-[2.5]" /> : <Bot className="w-5 h-5 stroke-[2.5]" />}
                                </div>
                                <div className={`max-w-[70%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`rounded-3xl px-7 py-4 shadow-2xl ${
                                        msg.role === 'user' 
                                            ? 'bg-amber-500/10 border border-amber-500/20 rounded-tr-sm backdrop-blur-md' 
                                            : 'bg-obsidian-surface-medium/50 border border-white/5 rounded-tl-sm backdrop-blur-xl'
                                    }`}>
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-2 opacity-40 text-zinc-500">
                                            {msg.role === 'user' ? 'PRIORITY OPERATOR' : 'ANALYSIS ENGINE'}
                                        </p>
                                        <div className="text-[14px] text-zinc-100 whitespace-pre-wrap leading-relaxed tracking-tight group-hover:text-white transition-colors font-medium">
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {isLoading && (
                            <div className="flex gap-6 animate-pulse">
                                <div className="w-10 h-10 rounded-xl bg-obsidian-surface-highest border border-white/5 text-amber-500 shadow-xl flex items-center justify-center shrink-0">
                                    <Bot className="w-5 h-5 stroke-[2.5]" />
                                </div>
                                <div className="max-w-[70%] rounded-3xl px-7 py-4 bg-obsidian-surface-medium/50 border border-white/5 rounded-tl-sm flex items-center gap-3 shadow-2xl">
                                    <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                                    <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Synchronizing Intelligence Nodes...</span>
                                </div>
                            </div>
                        )}
                        <div ref={endRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-8 bg-black/20 border-t border-white/5 backdrop-blur-2xl relative z-10 transition-all focus-within:bg-black/40">
                        <form onSubmit={handleSend} className="relative flex items-center max-w-4xl mx-auto group/input">
                            <input 
                                type="text" 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Issue command or query database..."
                                className="w-full bg-obsidian-surface-highest/50 border border-white/5 rounded-full pr-20 py-5 text-[14px] text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-amber-500/40 focus:ring-4 focus:ring-amber-500/5 transition-all shadow-3xl uppercase tracking-wide px-8"
                                disabled={isLoading}
                            />
                            <button 
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="absolute right-2.5 w-14 h-14 bg-amber-500 hover:bg-amber-400 disabled:opacity-20 disabled:grayscale text-black rounded-full transition-all flex items-center justify-center shadow-xl shadow-amber-500/20 active:scale-90 group/send"
                            >
                                <Send className="w-5 h-5 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform stroke-[2.5]" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
