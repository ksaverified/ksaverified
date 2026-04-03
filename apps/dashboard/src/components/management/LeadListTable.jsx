import React, { useState } from 'react';
import { ExternalLink, Star, Phone, Globe, Hash } from 'lucide-react';

export default function LeadListTable({ leads, loading }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLeads = leads.filter(l => 
    l.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.industry?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Table Header / Controls */}
      <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <input 
            type="text" 
            placeholder="Search leads..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-sm text-white px-4 py-2 rounded-lg outline-none focus:border-indigo-500 transition-colors w-64"
          />
        </div>
        <div className="text-sm text-zinc-400">
          Showing <span className="text-white font-medium">{filteredLeads.length}</span> leads
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto scrollbar-hide">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-zinc-900 sticky top-0 z-10 border-b border-zinc-800 shadow-sm">
            <tr className="text-zinc-400 uppercase tracking-wider text-[11px] font-semibold">
              <th className="px-6 py-4 font-medium">Business Name</th>
              <th className="px-6 py-4 font-medium">Sector</th>
              <th className="px-6 py-4 font-medium">Contact</th>
              <th className="px-6 py-4 font-medium text-center">Rating</th>
              <th className="px-6 py-4 font-medium text-center">Reviews</th>
              <th className="px-6 py-4 font-medium">Status / GAP</th>
              <th className="px-6 py-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-zinc-500">Loading directory...</td>
              </tr>
            ) : filteredLeads.slice(0, 100).map((lead) => (
              <tr key={lead.place_id} className="hover:bg-zinc-800/30 transition-colors cursor-pointer group">
                {/* 1. Name */}
                <td className="px-6 py-4">
                  <div className="font-semibold text-zinc-200">{lead.name}</div>
                  <div className="text-[11px] text-zinc-500 font-mono truncate w-48">{lead.place_id}</div>
                </td>
                
                {/* 2. Sector */}
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-300">
                    {lead.industry || (lead.types && lead.types[0]) || 'Unknown'}
                  </span>
                </td>

                {/* 3. Contact (Has phone? Has website?) */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-md ${lead.phone ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      <Phone strokeWidth={2.5} className="w-3.5 h-3.5" />
                    </div>
                    <div className={`p-1.5 rounded-md ${lead.website ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      <Globe strokeWidth={2.5} className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </td>

                {/* 4. Rating */}
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-medium text-amber-400">{lead.rating || '-'}</span>
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500/20" />
                  </div>
                </td>

                {/* 5. Reviews */}
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-zinc-400">
                    <span>{lead.review_count || 0}</span>
                    <Hash className="w-3 h-3 text-zinc-600" />
                  </div>
                </td>

                {/* 6. Status */}
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider
                    ${lead.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                      lead.status === 'pitched' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      lead.status === 'invalid' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}>
                    {lead.status || 'NEW'}
                  </span>
                </td>

                {/* 7. Action */}
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={(e) => { e.stopPropagation(); window.open(`/admin-v2/pipeline/${lead.place_id}`, '_blank'); }}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredLeads.length > 100 && (
          <div className="p-4 text-center text-xs text-zinc-500 border-t border-zinc-800">
            Showing first 100 results to maintain performance.
          </div>
        )}
      </div>
    </div>
  );
}
