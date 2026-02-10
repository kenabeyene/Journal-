import React from 'react';
import { useStore } from '../store';
import { calculateStats, formatCurrency, formatPercent } from '../utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { IconTrendingUp, IconTrendingDown, IconActivity, IconAlertTriangle } from '../Icons';

const StatCard = ({ title, value, subtitle, icon, trend }: { title: string, value: string, subtitle?: string, icon?: React.ReactNode, trend?: 'up' | 'down' | 'neutral' }) => {
  return (
    <div className="bg-surface border border-border rounded-xl p-6 flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
        {icon && <div className="text-slate-500">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-bold ${trend === 'up' ? 'text-success' : trend === 'down' ? 'text-danger' : 'text-white'}`}>
          {value}
        </span>
      </div>
      {subtitle && <p className="text-xs text-slate-500 mt-2">{subtitle}</p>}
      
      {/* Decorative accent */}
      {trend === 'up' && <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-success/10 rounded-full blur-xl pointer-events-none" />}
      {trend === 'down' && <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-danger/10 rounded-full blur-xl pointer-events-none" />}
    </div>
  );
};

export const Dashboard = () => {
  const { state } = useStore();
  const stats = calculateStats(state.trades, state.settings.initialBalance);
  const rules = state.propFirmRules;

  const isConsistencyFailing = stats.bestDayPercentOfTotal > rules.consistencyRulePercent;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-slate-400 mt-1">Overview of your trading performance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Current Balance" 
          value={formatCurrency(stats.currentBalance)} 
          subtitle={`Initial: ${formatCurrency(state.settings.initialBalance)}`}
          trend={stats.netProfit >= 0 ? 'up' : 'down'}
        />
        <StatCard 
          title="Total Net Profit" 
          value={formatCurrency(stats.netProfit)} 
          icon={stats.netProfit >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
          trend={stats.netProfit >= 0 ? 'up' : 'down'}
        />
        <StatCard 
          title="Win Rate" 
          value={`${stats.winRate.toFixed(1)}%`} 
          subtitle={`${stats.totalTrades} total trades`}
          icon={<IconActivity />}
        />
        <StatCard 
          title="Average R:R" 
          value={`1 : ${stats.avgRR.toFixed(2)}`} 
          subtitle="On winning trades"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatCard 
          title="Max Drawdown" 
          value={formatPercent(stats.maxDrawdownPercent)} 
          subtitle={formatCurrency(stats.maxDrawdownAmount)}
          trend={stats.maxDrawdownPercent > rules.maxOverallDrawdownPercent ? 'down' : 'neutral'}
          icon={stats.maxDrawdownPercent > rules.maxOverallDrawdownPercent ? <IconAlertTriangle className="text-danger" /> : undefined}
        />
        <StatCard 
          title="Best Day" 
          value={formatCurrency(stats.bestDayPnL)} 
          trend="up"
        />
        <StatCard 
          title="Consistency Score" 
          value={`${stats.bestDayPercentOfTotal.toFixed(1)}%`} 
          subtitle={`Rule limit: ${rules.consistencyRulePercent}%`}
          trend={isConsistencyFailing ? 'down' : (stats.netProfit > 0 ? 'up' : 'neutral')}
          icon={isConsistencyFailing ? <IconAlertTriangle className="text-danger" /> : undefined}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
        {/* Equity Curve */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Equity Curve</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.equityCurve} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={['auto', 'auto']} stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} width={60} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fafafa', borderRadius: '8px' }}
                  itemStyle={{ color: '#3b82f6' }}
                  formatter={(value: number) => [formatCurrency(value), 'Balance']}
                />
                <Area type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorBalance)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily PnL */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Daily PnL</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.dailyPnLChart} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="date" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} width={60} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fafafa', borderRadius: '8px' }}
                  formatter={(value: number) => [formatCurrency(value), 'PnL']}
                  cursor={{fill: '#27272a', opacity: 0.4}}
                />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {stats.dailyPnLChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
