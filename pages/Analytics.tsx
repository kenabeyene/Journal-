import React, { useMemo } from 'react';
import { useStore } from '../store';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis } from 'recharts';
import { formatCurrency } from '../utils';

export const Analytics = () => {
  const { state } = useStore();
  const trades = state.trades;

  // Aggregate Performance by Instrument
  const instrumentData = useMemo(() => {
    const acc: Record<string, { name: string, profit: number, count: number }> = {};
    trades.forEach(t => {
      if (!acc[t.instrument]) acc[t.instrument] = { name: t.instrument, profit: 0, count: 0 };
      acc[t.instrument].profit += t.resultAmount;
      acc[t.instrument].count += 1;
    });
    return Object.values(acc).sort((a, b) => b.profit - a.profit);
  }, [trades]);

  // Aggregate by Session
  const sessionData = useMemo(() => {
    const acc: Record<string, { name: string, value: number }> = {};
    trades.forEach(t => {
      if (t.resultAmount > 0) {
          if (!acc[t.session]) acc[t.session] = { name: t.session, value: 0 };
          acc[t.session].value += t.resultAmount;
      }
    });
    return Object.values(acc);
  }, [trades]);

  // Emotion Analysis (Rule Breaking)
  const emotionData = useMemo(() => {
     const acc: Record<string, { emotion: string, mistakes: number }> = {};
     trades.forEach(t => {
         if (!t.ruleFollowed) {
             if(!acc[t.emotionBefore]) acc[t.emotionBefore] = { emotion: t.emotionBefore, mistakes: 0};
             acc[t.emotionBefore].mistakes += 1;
         }
     });
     return Object.values(acc).sort((a,b) => b.mistakes - a.mistakes);
  }, [trades]);

  // Duration vs Profit Scatter
  const scatterData = useMemo(() => {
      return trades.filter(t => t.durationMinutes > 0).map(t => ({
          x: t.durationMinutes,
          y: t.resultAmount,
          z: 1 // size
      }));
  }, [trades]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Analytics & Psychology</h1>
        <p className="text-slate-400 mt-1">Identify your edge and your leaks.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PnL by Instrument */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Net PnL by Instrument</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={instrumentData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                <XAxis type="number" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <YAxis dataKey="name" type="category" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: '#27272a', opacity: 0.4}}
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fafafa', borderRadius: '8px' }}
                  formatter={(value: number) => [formatCurrency(value), 'Net PnL']}
                />
                <Bar dataKey="profit" radius={[0, 4, 4, 0]} barSize={24}>
                  {instrumentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#3b82f6' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profit Distribution by Session */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Profit Origin (Sessions)</h3>
          <div className="h-72">
            {sessionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={sessionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    >
                    {sessionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    </Pie>
                    <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fafafa', borderRadius: '8px' }}
                    formatter={(value: number) => [formatCurrency(value), 'Profit']}
                    />
                </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex h-full items-center justify-center text-slate-500 text-sm">No profit data to display.</div>
            )}
            
          </div>
          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 mt-2">
              {sessionData.map((entry, idx) => (
                  <div key={entry.name} className="flex items-center gap-2 text-xs text-slate-300">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length]}}></div>
                      {entry.name}
                  </div>
              ))}
          </div>
        </div>

        {/* Emotions Causing Rule Breaks */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Psychological Leaks</h3>
          <p className="text-sm text-slate-500 mb-6">Emotions preceding a broken rule.</p>
          <div className="space-y-4">
             {emotionData.length === 0 ? (
                 <div className="py-8 text-center text-slate-500 text-sm border border-dashed border-border rounded-lg">
                     Great job! No rule breaks recorded.
                 </div>
             ) : (
                 emotionData.map((d, i) => (
                    <div key={d.emotion} className="flex items-center">
                        <div className="w-24 text-sm text-slate-300 truncate">{d.emotion}</div>
                        <div className="flex-1 ml-4 h-4 bg-[#09090b] rounded-full overflow-hidden border border-border">
                             <div className="h-full bg-danger rounded-full" style={{ width: `${(d.mistakes / emotionData[0].mistakes) * 100}%`}}></div>
                        </div>
                        <div className="w-12 text-right text-sm font-medium text-white">{d.mistakes}x</div>
                    </div>
                 ))
             )}
          </div>
        </div>

        {/* Hold Time vs Profit */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Duration vs Outcome</h3>
          <div className="h-72">
             <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                    <XAxis type="number" dataKey="x" name="Duration" unit="m" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis type="number" dataKey="y" name="PnL" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                    <ZAxis type="number" dataKey="z" range={[60, 60]} />
                    <Tooltip 
                        cursor={{strokeDasharray: '3 3'}}
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fafafa', borderRadius: '8px' }}
                        formatter={(value, name) => [name === 'PnL' ? formatCurrency(value as number) : `${value} mins`, name]}
                    />
                    <Scatter data={scatterData} fill="#3b82f6" fillOpacity={0.6} shape="circle">
                       {scatterData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.y >= 0 ? '#10b981' : '#f43f5e'} />
                       ))}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
