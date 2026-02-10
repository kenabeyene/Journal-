import React, { useState } from 'react';
import { useStore } from '../store';
import { calculateStats, formatCurrency, formatPercent } from '../utils';
import { IconShield, IconCheckCircle, IconXCircle } from '../Icons';

const ProgressBar = ({ label, current, max, isCurrency = false, invertDanger = false }: { label: string, current: number, max: number, isCurrency?: boolean, invertDanger?: boolean }) => {
  // if invertDanger is true, reaching max is BAD (like drawdown). 
  // if invertDanger is false, reaching max is GOOD (like profit target).
  const percent = Math.min((current / max) * 100, 100);
  
  let barColor = 'bg-primary';
  if (invertDanger) {
    if (percent > 80) barColor = 'bg-danger';
    else if (percent > 50) barColor = 'bg-warning';
    else barColor = 'bg-success';
  } else {
    if (percent >= 100) barColor = 'bg-success';
  }

  return (
    <div className="mb-6">
      <div className="flex justify-between items-end mb-2">
        <span className="text-sm font-medium text-slate-300">{label}</span>
        <span className="text-sm text-slate-400">
          <strong className="text-white">{isCurrency ? formatCurrency(current) : `${current.toFixed(1)}%`}</strong> / {isCurrency ? formatCurrency(max) : `${max}%`}
        </span>
      </div>
      <div className="w-full bg-[#09090b] rounded-full h-3 overflow-hidden border border-border">
        <div className={`h-3 rounded-full ${barColor} transition-all duration-500 ease-out`} style={{ width: `${Math.max(percent, 0)}%` }}></div>
      </div>
    </div>
  );
};

export const PropFirm = () => {
  const { state, updateRules, updateSettings } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  
  const rules = state.propFirmRules;
  const initBal = state.settings.initialBalance;

  // Local state for editing
  const [editBal, setEditBal] = useState(initBal.toString());
  const [editTarget, setEditTarget] = useState(rules.profitTargetPercent.toString());
  const [editDailyLoss, setEditDailyLoss] = useState(rules.maxDailyLossPercent.toString());
  const [editMaxDD, setEditMaxDD] = useState(rules.maxOverallDrawdownPercent.toString());
  const [editConsistency, setEditConsistency] = useState(rules.consistencyRulePercent.toString());

  const handleSave = () => {
    updateSettings({ initialBalance: parseFloat(editBal) || 50000 });
    updateRules({
      profitTargetPercent: parseFloat(editTarget) || 10,
      maxDailyLossPercent: parseFloat(editDailyLoss) || 5,
      maxOverallDrawdownPercent: parseFloat(editMaxDD) || 10,
      consistencyRulePercent: parseFloat(editConsistency) || 40,
    });
    setIsEditing(false);
  };

  const stats = calculateStats(state.trades, initBal);

  // Calculate absolute dollar limits based on percentages
  const targetDollars = initBal * (rules.profitTargetPercent / 100);
  const maxDdDollars = initBal * (rules.maxOverallDrawdownPercent / 100);
  // Note: Daily loss is technically based on start-of-day balance in most firms, but we simplify to initial balance here for illustration.
  const maxDailyLossDollars = initBal * (rules.maxDailyLossPercent / 100);

  // Status checks
  const targetMet = stats.netProfit >= targetDollars;
  const ddFailed = stats.maxDrawdownAmount > maxDdDollars;
  const dailyFailed = Math.abs(stats.worstDayPnL) > maxDailyLossDollars;
  const consistencyFailed = stats.bestDayPercentOfTotal > rules.consistencyRulePercent;

  const isOverallFailing = ddFailed || dailyFailed || consistencyFailed;
  const isOverallPassing = targetMet && !isOverallFailing;

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <IconShield className="w-8 h-8 text-primary" />
            Prop Firm Tracker
          </h1>
          <p className="text-slate-400 mt-1">Monitor your evaluation phase progress and rule compliance.</p>
        </div>
        <button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${isEditing ? 'bg-primary text-white' : 'bg-surface border border-border text-white hover:bg-white/5'}`}
        >
          {isEditing ? 'Save Configuration' : 'Edit Rules'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Tracker Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-border rounded-xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
              <h2 className="text-xl font-semibold text-white">Evaluation Progress</h2>
              
              <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 font-bold text-sm ${isOverallFailing ? 'bg-danger/20 text-danger border border-danger/50' : isOverallPassing ? 'bg-success/20 text-success border border-success/50' : 'bg-primary/20 text-primary border border-primary/50'}`}>
                {isOverallFailing ? <><IconXCircle className="w-4 h-4" /> VIOLATED</> : isOverallPassing ? <><IconCheckCircle className="w-4 h-4" /> PASSED</> : 'IN PROGRESS'}
              </div>
            </div>

            <ProgressBar 
              label="Profit Target" 
              current={Math.max(stats.netProfit, 0)} 
              max={targetDollars} 
              isCurrency={true} 
            />

            <ProgressBar 
              label="Max Overall Drawdown" 
              current={stats.maxDrawdownAmount} 
              max={maxDdDollars} 
              isCurrency={true} 
              invertDanger={true}
            />

            <ProgressBar 
              label="Max Daily Loss (Worst Day)" 
              current={Math.abs(stats.worstDayPnL)} 
              max={maxDailyLossDollars} 
              isCurrency={true} 
              invertDanger={true}
            />

            <ProgressBar 
              label="Consistency Rule (Best Day % of Total Profit)" 
              current={stats.bestDayPercentOfTotal} 
              max={rules.consistencyRulePercent} 
              invertDanger={true}
            />
          </div>

          {/* Rule Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl border ${consistencyFailed ? 'bg-danger/5 border-danger/30' : 'bg-surface border-border'}`}>
                  <h3 className="font-medium text-white mb-1 flex items-center gap-2">
                    {consistencyFailed ? <IconXCircle className="w-4 h-4 text-danger"/> : <IconCheckCircle className="w-4 h-4 text-success"/>}
                    Consistency Rule
                  </h3>
                  <p className="text-sm text-slate-400">Your best day accounts for <strong>{stats.bestDayPercentOfTotal.toFixed(1)}%</strong> of your total net profit. It must stay under {rules.consistencyRulePercent}%.</p>
              </div>
              <div className={`p-4 rounded-xl border ${ddFailed ? 'bg-danger/5 border-danger/30' : 'bg-surface border-border'}`}>
                  <h3 className="font-medium text-white mb-1 flex items-center gap-2">
                    {ddFailed ? <IconXCircle className="w-4 h-4 text-danger"/> : <IconCheckCircle className="w-4 h-4 text-success"/>}
                    Drawdown Limit
                  </h3>
                  <p className="text-sm text-slate-400">Maximum drawdown reached is <strong>{formatCurrency(stats.maxDrawdownAmount)}</strong>. Allowed is {formatCurrency(maxDdDollars)}.</p>
              </div>
          </div>
        </div>

        {/* Configuration Panel */}
        <div>
          <div className="bg-surface border border-border rounded-xl p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-white mb-6">Account Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Initial Balance ($)</label>
                <input 
                  type="number" 
                  className={`w-full bg-[#09090b] border border-border rounded-lg px-3 py-2 text-white ${!isEditing && 'opacity-50 cursor-not-allowed'}`}
                  value={editBal}
                  onChange={e => setEditBal(e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              
              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-medium text-white mb-4">Firm Rules (%)</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Profit Target %</label>
                    <input type="number" className={`w-full bg-[#09090b] border border-border rounded-lg px-3 py-2 text-white ${!isEditing && 'opacity-50 cursor-not-allowed'}`} value={editTarget} onChange={e => setEditTarget(e.target.value)} disabled={!isEditing} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Max Daily Loss %</label>
                    <input type="number" className={`w-full bg-[#09090b] border border-border rounded-lg px-3 py-2 text-white ${!isEditing && 'opacity-50 cursor-not-allowed'}`} value={editDailyLoss} onChange={e => setEditDailyLoss(e.target.value)} disabled={!isEditing} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Max Overall Drawdown %</label>
                    <input type="number" className={`w-full bg-[#09090b] border border-border rounded-lg px-3 py-2 text-white ${!isEditing && 'opacity-50 cursor-not-allowed'}`} value={editMaxDD} onChange={e => setEditMaxDD(e.target.value)} disabled={!isEditing} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Consistency Limit %</label>
                    <input type="number" className={`w-full bg-[#09090b] border border-border rounded-lg px-3 py-2 text-white ${!isEditing && 'opacity-50 cursor-not-allowed'}`} value={editConsistency} onChange={e => setEditConsistency(e.target.value)} disabled={!isEditing} />
                  </div>
                </div>
              </div>
            </div>
            {isEditing && (
                <div className="mt-6 p-3 bg-primary/10 border border-primary/30 rounded-lg text-xs text-primary">
                    Remember to save changes. Changing initial balance will recalculate all historical drawdown stats.
                </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
