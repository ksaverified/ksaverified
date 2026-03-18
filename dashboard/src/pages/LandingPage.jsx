import React from 'react';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-[#080809] text-white flex flex-col items-center justify-center p-6 text-center">
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent mb-4">
                KSA Verified
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl mb-8">
                Premium AI-powered business websites for Saudi entrepreneurs. 
                Professional, fast, and local.
            </p>
            <div className="flex gap-4">
                <a href="/manage" className="px-8 py-3 bg-primary hover:bg-blue-500 rounded-xl font-bold transition-all">
                    Admin Access
                </a>
                <a href="/client-dashboard/login" className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold transition-all border border-zinc-700">
                    Client Login
                </a>
            </div>
            
            <div className="mt-20 p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 max-w-lg">
                <h2 className="text-2xl font-bold mb-4">Launch Your Presence for FREE</h2>
                <ul className="text-left space-y-3 mb-6">
                    <li className="flex items-center gap-2">✅ 1 Week Free Trial</li>
                    <li className="flex items-center gap-2">✅ Automatic WhatsApp Lead Sync</li>
                    <li className="flex items-center gap-2">✅ Professional Analytics</li>
                    <li className="flex items-center gap-2">✅ 19 SAR/mo (First Year)</li>
                </ul>
                <p className="text-sm text-zinc-500 uppercase tracking-widest font-bold">No commitment. Cancel anytime.</p>
            </div>
        </div>
    );
};

export default LandingPage;
