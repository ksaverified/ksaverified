import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Network, Activity, Clock } from 'lucide-react';

const AGENTS = [
  { id: 'scout', name: 'Scout' },
  { id: 'creator', name: 'Creator' },
  { id: 'retoucher', name: 'Retoucher' },
  { id: 'publisher', name: 'Publisher' },
  { id: 'auditor', name: 'Auditor' },
  { id: 'certifier', name: 'Certifier' },
  { id: 'marketingAudit', name: 'Marketing Audit' },
  { id: 'closer', name: 'Closer' },
  { id: 'chatbot', name: 'Chatbot' },
  { id: 'biller', name: 'Biller' }
];

export default function AgentStatusBar() {
  const [agentStatus, setAgentStatus] = useState({});

  useEffect(() => {
    async function fetchAgentLogs() {
      // Query the latest log for each service
      const statusMap = {};
      
      try {
        const { data, error } = await supabase
          .from('logs')
          .select('agent, created_at')
          .order('created_at', { ascending: false })
          .limit(200); // Fetch recent logs to find the latest per agent

        if (error) throw error;
        
        // Find newest log per service
        if (data) {
           data.forEach(log => {
             if (log.agent && !statusMap[log.agent]) {
               statusMap[log.agent] = new Date(log.created_at);
             }
           });
        }
      } catch (err) {
        console.error('Error fetching agent logs', err);
      }
      setAgentStatus(statusMap);
    }

    fetchAgentLogs();
    const interval = setInterval(fetchAgentLogs, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (dateInstance) => {
    if (!dateInstance) return 'Offline';
    const seconds = Math.floor((new Date() - dateInstance) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ${minutes % 60}m ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const isActive = (dateInstance) => {
    if (!dateInstance) return false;
    // Active if logged within the last 5 minutes (300 seconds)
    return (new Date() - dateInstance) / 1000 < 300;
  };

  return (
    <div className="flex items-center gap-6 overflow-x-auto pb-2 scrollbar-hide">
      <div className="flex items-center gap-2 text-zinc-500 min-w-max border-r border-zinc-800 pr-4">
        <Network className="w-4 h-4" />
        <span className="text-xs uppercase tracking-wider font-semibold">AI Workforce</span>
      </div>

      <div className="flex gap-4 min-w-max">
        {AGENTS.map(agent => {
          const lastActive = agentStatus[agent.id];
          const active = isActive(lastActive);
          
          return (
            <div key={agent.id} className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 rounded-lg py-1.5 px-3">
              {/* LED Indicator */}
              <div className="relative flex items-center justify-center">
                {active ? (
                  <>
                    <span className="absolute w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping opacity-75"></span>
                    <span className="relative w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                  </>
                ) : (
                  <span className="relative w-2 h-2 bg-red-500/80 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.5)]"></span>
                )}
              </div>
              
              <div className="flex flex-col">
                <span className="text-xs font-medium text-zinc-300">{agent.name}</span>
                <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono">
                  {formatTimeAgo(lastActive)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
