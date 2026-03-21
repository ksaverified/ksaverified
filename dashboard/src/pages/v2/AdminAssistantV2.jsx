import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import V2Shell from './V2Shell';

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
        <V2Shell>
            <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] max-w-4xl mx-auto p-4 md:p-6">
                
                {/* Header */}
                <div className="flex items-center gap-3 mb-6 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                    <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                        <Bot className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">System Administrator Chatbot</h1>
                        <p className="text-sm text-zinc-400">Ask me anything about pipeline activity, leads, or recent conversations.</p>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 bg-zinc-900/30 rounded-xl border border-zinc-800 overflow-hidden flex flex-col mb-4">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                    msg.role === 'user' 
                                        ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' 
                                        : 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-400'
                                }`}>
                                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                </div>
                                <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                                    msg.role === 'user' 
                                        ? 'bg-emerald-600/10 border border-emerald-500/20 rounded-tr-sm' 
                                        : 'bg-zinc-800 border border-zinc-700/50 rounded-tl-sm'
                                }`}>
                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-60 text-zinc-400">
                                        {msg.role === 'user' ? 'You' : 'System Bot'}
                                    </p>
                                    <div className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {isLoading && (
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                                    <Bot className="w-4 h-4" />
                                </div>
                                <div className="max-w-[80%] rounded-2xl px-5 py-3 bg-zinc-800 border border-zinc-700/50 rounded-tl-sm flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                                    <span className="text-sm text-zinc-400">Analyzing database...</span>
                                </div>
                            </div>
                        )}
                        <div ref={endRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-zinc-950/50 border-t border-zinc-800">
                        <form onSubmit={handleSend} className="relative flex items-center max-w-3xl mx-auto">
                            <input 
                                type="text" 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about recent leads, missing replies, or current status..."
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-full pl-5 pr-14 py-3.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                                disabled={isLoading}
                            />
                            <button 
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-full transition-colors flex items-center justify-center"
                            >
                                <Send className="w-4 h-4 ml-0.5" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </V2Shell>
    );
}
