import { CreditCard, AlertCircle, Copy, Check, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Payment() {
    const [copied, setCopied] = useState(false);
    const stcNumber = "966507913514";

    const handleCopy = () => {
        navigator.clipboard.writeText(stcNumber);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <header>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <CreditCard className="h-8 w-8 text-blue-500" />
                    Subscription & Payment
                </h1>
                <p className="text-zinc-500 mt-1">Manage your website subscription and billing</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-surface border border-zinc-800/60 p-8 rounded-3xl h-fit shadow-2xl"
                >
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-white">Current Plan</h2>
                        <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold rounded-full uppercase tracking-widest">
                            Active
                        </div>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
                            <div>
                                <p className="text-2xl font-black text-white">Starter Plan</p>
                                <p className="text-sm text-zinc-500">Monthly auto-renewal</p>
                            </div>
                            <p className="text-xl font-bold text-blue-500"> SAR 99 <span className="text-xs text-zinc-600">/mo</span></p>
                        </div>
                    </div>

                    <ul className="space-y-4 mb-8">
                        {[
                            "Unlimited Edits",
                            "Custom Domain (.com / .net)",
                            "Ultra-Fast Hosting",
                            "24/7 AI Support",
                            "SSL Certificate included"
                        ].map((feature, i) => (
                            <li key={i} className="flex items-center gap-3 text-zinc-400 text-sm font-medium">
                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                {feature}
                            </li>
                        ))}
                    </ul>

                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-200/80 leading-relaxed font-medium">
                            We are currently upgrading our automated checkout system. Online payments will be available soon.
                        </p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative group"
                >
                    <div className="absolute inset-x-4 -top-4 bottom-4 bg-blue-600/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="bg-[#5c2d91]/10 border border-[#5c2d91]/30 p-8 rounded-3xl shadow-2xl relative z-10 backdrop-blur-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-14 w-14 rounded-2xl bg-[#5c2d91] flex items-center justify-center shadow-lg shadow-[#5c2d91]/20">
                                <span className="text-white font-black text-xl italic uppercase font-serif tracking-tighter leading-none select-none">STC</span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white uppercase tracking-widest opacity-50">STC Pay Gateway</p>
                                <h2 className="text-2xl font-black text-white">Manual Payment</h2>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <p className="text-zinc-300 font-medium leading-relaxed">
                                To renew or activate your subscription, please transfer the money directly via **STC Pay**.
                            </p>

                            <div className="bg-black/40 border border-zinc-800 p-6 rounded-2xl space-y-4">
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">STC Pay Number</p>
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-2xl font-black text-white tracking-widest">{stcNumber}</span>
                                    <button
                                        onClick={handleCopy}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${copied
                                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                                            }`}
                                    >
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        {copied ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-sm text-zinc-400 font-medium">After transferring, please share the receipt here:</p>
                                <button className="w-full flex items-center justify-center gap-3 py-4 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-2xl transition-all shadow-lg shadow-[#25D366]/20 group">
                                    <MessageSquare className="h-5 w-5 transition-transform group-hover:scale-110" />
                                    Send Screenshot to WhatsApp
                                </button>
                            </div>

                            <div className="text-center pt-4">
                                <p className="text-xs font-black text-[#5c2d91] uppercase tracking-[0.2em] animate-pulse">Coming Soon: Automatic Checkout</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="bg-surface border border-zinc-800/60 p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border-dashed">
                <div className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-full bg-zinc-800 flex items-center justify-center text-4xl shadow-inner border border-zinc-700">
                        🇸🇦
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white">Local Support</h3>
                        <p className="text-sm text-zinc-500 font-medium">Our Riyadh-based team is here to help you 24/7</p>
                    </div>
                </div>
                <button className="px-10 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-black rounded-2xl transition-all border border-zinc-700">
                    CONTACT SUPPORT
                </button>
            </div>
        </div>
    );
}
