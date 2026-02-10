import React, { useState } from 'react';
import { useStore } from '../store';
import { formatCurrency } from '../utils';

export const History = () => {
  const { state, deleteTrade } = useStore();
  const [filter, setFilter] = useState('All');

  const filteredTrades = state.trades
    .filter(trade => {
      if (filter === 'All') return true;
      if (filter === 'Wins') return trade.resultAmount > 0;
      if (filter === 'Losses') return trade.resultAmount < 0;
      if (filter === 'Rule Broken') return !trade.ruleFollowed;
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Trade History</h1>
          <p className="text-slate-400 mt-1">Review all your past executions.</p>
        </div>
        
        <div className="flex gap-2 bg-surface p-1 rounded-lg border border-border">
          {['All', 'Wins', 'Losses', 'Rule Broken'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === f 
                  ? 'bg-primary text-white' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#09090b]/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium text-slate-400">Date</th>
                <th className="px-6 py-4 font-medium text-slate-400">Instrument</th>
                <th className="px-6 py-4 font-medium text-slate-400">Direction</th>
                <th className="px-6 py-4 font-medium text-slate-400">Result</th>
                <th className="px-6 py-4 font-medium text-slate-400">R:R</th>
                <th className="px-6 py-4 font-medium text-slate-400">Emotion</th>
                <th className="px-6 py-4 font-medium text-slate-400 text-center">Plan</th>
                <th className="px-6 py-4 font-medium text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    No trades found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredTrades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 text-white">
                      {new Date(trade.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300">
                        {trade.instrument}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={trade.direction === 'Buy' ? 'text-blue-400' : 'text-rose-400'}>
                        {trade.direction}
                      </span>
                    </td>
                    <td className={`px-6 py-4 font-medium ${trade.resultAmount >= 0 ? 'text-success' : 'text-danger'}`}>
                      {trade.resultAmount >= 0 ? '+' : ''}{formatCurrency(trade.resultAmount)}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {trade.resultAmount > 0 ? `1 : ${trade.rrAchieved.toFixed(1)}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {trade.emotionBefore} → {trade.emotionAfter}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {trade.ruleFollowed ? (
                        <span className="inline-block w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.8)]" title="Followed Plan"></span>
                      ) : (
                        <span className="inline-block w-2 h-2 rounded-full bg-danger shadow-[0_0_8px_rgba(244,63,94,0.8)]" title="Broke Rule"></span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button onClick={() => deleteTrade(trade.id)} className="text-slate-500 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity">
                         Delete
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
