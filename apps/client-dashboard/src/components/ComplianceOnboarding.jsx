import React from 'react';
import { Shield, ExternalLink, ChevronRight, Lock } from 'lucide-react';

export default function ComplianceOnboarding({ onAccept }) {
    return (
        <div className="fixed inset-0 z-[100] bg-obsidian-dark flex items-center justify-center p-6 backdrop-blur-xl">
            <div className="max-w-xl w-full glass-card rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-500">
                <div className="bg-amber-500/10 border-b border-white/5 p-8 text-center relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/20">
                            <Shield className="w-8 h-8 text-black" />
                        </div>
                        <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">Google Compliance Disclosure</h2>
                        <p className="text-amber-500 text-[10px] font-black tracking-[0.3em] uppercase underline decoration-2 underline-offset-4">Mandatory Policy 2026</p>
                    </div>
                </div>

                <div className="p-10 space-y-8">
                    <div className="space-y-6">
                        <section className="space-y-3">
                            <h3 className="text-xs font-black text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Official GBP Policy
                            </h3>
                            <div className="bg-obsidian-surface-high/30 rounded-2xl p-5 border border-white/5">
                                <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                                    <span className="text-white font-bold">Important:</span> Google Business Profile is a <span className="text-emerald-400 font-bold">free service</span> provided by Google. The fees charged by ksaverified.com are exclusively for our automated SEO tools, website hosting, and management dashboard services.
                                </p>
                            </div>
                        </section>

                        <section className="space-y-3">
                            <h3 className="text-xs font-black text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Your Ownership
                            </h3>
                            <div className="bg-obsidian-surface-high/30 rounded-2xl p-5 border border-white/5">
                                <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                                    To manage your profile, you will sign in with your own Google credentials. You will remain the <span className="text-white font-bold italic">Primary Owner</span> of your business profile at all times. ksaverified.com only acts as a technical manager.
                                </p>
                            </div>
                        </section>
                    </div>

                    <div className="space-y-4 pt-4">
                        <button 
                            onClick={onAccept}
                            className="w-full bg-amber-500 hover:bg-amber-400 text-black py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                            I Understand & Proceed <ChevronRight className="w-4 h-4" />
                        </button>
                        <p className="text-[10px] text-zinc-500 text-center font-bold uppercase tracking-widest opacity-60">
                            By clicking, you acknowledge Google's Third-Party Disclosure.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
