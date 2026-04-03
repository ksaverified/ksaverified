import { Globe, Users, Activity } from 'lucide-react';

export default function EcosystemMetrics() {
    return (
        <div className="p-8 h-full overflow-y-auto">
            <div className="max-w-[1200px] mx-auto text-center mt-20">
                <Activity className="w-16 h-16 text-indigo-500 mx-auto mb-6 opacity-80" />
                <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">Ecosystem Modules</h1>
                <p className="text-zinc-400 max-w-lg mx-auto mb-10">Detailed analytics for deployed websites, global SEO impacts, and recurring subscriptions will aggregate here.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    <div className="p-6 border border-white/5 rounded-3xl bg-obsidian-surface-high">
                        <Globe className="w-6 h-6 text-blue-400 mb-4" />
                        <h3 className="font-bold text-lg mb-2">Websites Network</h3>
                        <p className="text-xs text-zinc-500">Monitoring uptime and Vercel analytics for all generated storefronts.</p>
                    </div>
                    <div className="p-6 border border-white/5 rounded-3xl bg-obsidian-surface-high">
                        <Activity className="w-6 h-6 text-emerald-400 mb-4" />
                        <h3 className="font-bold text-lg mb-2">SEO Dominance</h3>
                        <p className="text-xs text-zinc-500">Keyword ranking improvements across the business directory.</p>
                    </div>
                    <div className="p-6 border border-white/5 rounded-3xl bg-obsidian-surface-high">
                        <Users className="w-6 h-6 text-purple-400 mb-4" />
                        <h3 className="font-bold text-lg mb-2">Subscribers</h3>
                        <p className="text-xs text-zinc-500">Recurring revenue monitoring and MRR metrics.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
