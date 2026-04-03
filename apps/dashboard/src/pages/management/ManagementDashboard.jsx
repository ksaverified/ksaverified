import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { LayoutDashboard } from 'lucide-react';
import AgentStatusBar from '../../components/management/AgentStatusBar';
import LeadsMap from '../../components/management/LeadsMap';
import LeadListTable from '../../components/management/LeadListTable';

export default function ManagementDashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch leads on mount
  useEffect(() => {
    async function fetchLeads() {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching leads:', error);
      } else {
        setLeads(data || []);
      }
      setLoading(false);
    }
    fetchLeads();
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <LayoutDashboard className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">KSA Verified Management</h1>
              <p className="text-xs text-zinc-400">Global System Overview & Agent Telemetry</p>
            </div>
          </div>
        </div>
        
        {/* Agent Status Bar */}
        <div className="px-6 py-3 border-t border-zinc-800/50 bg-black/20">
          <AgentStatusBar />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-6 max-w-[1600px] mx-auto space-y-6">
        
        {/* Map Section */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl relative flex flex-col h-[600px]">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm z-10 flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Pipeline Map
            </h2>
            <div className="text-xs text-zinc-400 font-mono bg-black/30 px-3 py-1 rounded-full border border-zinc-800">
              Total Signals: {leads.length}
            </div>
          </div>
          <div className="flex-1 relative">
            <LeadsMap leads={leads} loading={loading} />
          </div>
        </section>

        {/* List Section */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Lead Directory</h2>
          </div>
          <LeadListTable leads={leads} loading={loading} />
        </section>

      </main>
    </div>
  );
}
