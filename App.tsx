import React, { useState, useRef } from 'react';
import { StoreProvider, useStore } from './store';
import { calculateConsistency, formatCurrency } from './utils';
import { IconTarget, IconCheckCircle, IconXCircle, IconTrash, IconSparkles, IconTrendingUp } from './Icons';

const FiffysDashboard = () => {
  const { state, addEntry, deleteEntry, updateSettings, importState } = useStore();
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPnL, setNewPnL] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local settings state
  const [editAccSize, setEditAccSize] = useState(state.accountSize.toString());
  const [editTarget, setEditTarget] = useState(state.profitTarget.toString());
  const [editRule, setEditRule] = useState(state.consistencyRulePercent.toString());

  const stats = calculateConsistency(state.entries, state.consistencyRulePercent, state.profitTarget);

  // Modified handler for separate Win/Loss buttons
  const handleAddEntry = (type: 'win' | 'loss') => {
    if (!newDate || !newPnL) return;

    const numericValue = parseFloat(newPnL);
    if (isNaN(numericValue)) return;

    // Force absolute value, then apply the sign based on the button clicked
    let finalPnL = Math.abs(numericValue);
    if (type === 'loss') {
        finalPnL = -finalPnL;
    }

    addEntry({
      id: crypto.randomUUID(),
      date: newDate,
      pnl: finalPnL
    });

    setNewPnL('');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(
      parseFloat(editAccSize) || 50000,
      parseFloat(editTarget) || 2500,
      parseFloat(editRule) || 40
    );
    setShowSettings(false);
  };

  // --- Backup Functions ---
  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "fiffys-trading-journal-backup.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedState = JSON.parse(event.target?.result as string);
        if (importedState && Array.isArray(importedState.entries)) {
          importState(importedState);
          // Sync local form state to new imported state
          setEditAccSize(importedState.accountSize.toString());
          setEditTarget(importedState.profitTarget.toString());
          setEditRule(importedState.consistencyRulePercent.toString());
          alert('Welcome back Fiffy! Backup restored perfectly. ✨');
          setShowSettings(false);
        } else {
          alert('Oops! This file doesn\'t look like a valid journal backup.');
        }
      } catch (err) {
        alert('Oops! There was an error reading your backup file.');
      }
    };
    reader.readAsText(file);
    // Reset input so she can import the same file again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isFailingConsistency = stats.totalNetProfit > 0 && !stats.isPassingConsistency;
  const targetProgressPercent = Math.min(Math.max((stats.totalNetProfit / state.profitTarget) * 100, 0), 100);
  const consistencyProgressPercent = Math.min(stats.consistencyPercent, 100);

  // Determine Fiffy's Status Message
  let statusBadge = null;
  let statusMessage = null;
  let actionRequired = null;

  if (state.entries.length === 0) {
     statusBadge = (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white font-medium text-sm mb-4 shadow-lg shadow-black/20">
           <IconSparkles className="w-4 h-4 text-secondary" /> Ready to conquer the markets
        </div>
     );
     statusMessage = "Let's track your journey, Fiffy! 🚀 Log your first day below.";
  } else if (stats.isEvaluationPassed) {
      statusBadge = (
         <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/20 border border-success/30 text-success font-medium text-sm mb-4 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <IconCheckCircle className="w-4 h-4" /> Challenge Passed!
         </div>
      );
      statusMessage = "Amazing job, Fiffy! 🎉 You hit the target and perfectly managed your consistency.";
  } else if (isFailingConsistency) {
      statusBadge = (
         <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-danger/20 border border-danger/30 text-danger font-medium text-sm mb-4 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
            <IconXCircle className="w-4 h-4" /> Consistency Rule Alert
         </div>
      );
      statusMessage = `Careful Fiffy! Your best day is too high (${stats.consistencyPercent.toFixed(1)}%).`;
      actionRequired = `To pass, you need to make ${formatCurrency(stats.consistencyShortfall)} MORE in total profit without increasing your best day of ${formatCurrency(stats.bestDayPnL)}.`;
  } else if (stats.totalNetProfit < 0) {
      statusBadge = (
         <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning/20 border border-warning/30 text-warning font-medium text-sm mb-4 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <IconTarget className="w-4 h-4" /> Drawdown Phase
         </div>
      );
      statusMessage = "You're currently in a slight drawdown. Stick to your plan, Fiffy. You've got this! 💪";
  } else {
      statusBadge = (
         <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary font-medium text-sm mb-4 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            <IconTrendingUp className="w-4 h-4" /> On Track
         </div>
      );
      statusMessage = `Looking good, Fiffy! You're ${targetProgressPercent.toFixed(1)}% of the way to your target with perfect consistency.`;
      if (!stats.isTargetReached) {
          actionRequired = `Just ${formatCurrency(state.profitTarget - stats.totalNetProfit)} left to hit the target. Keep those wins balanced!`;
      }
  }

  // Calculate Streaks
  let winStreak = 0;
  let lossStreak = 0;
  for (let day of stats.aggregatedDays) {
     if (day.pnl > 0) {
        if (lossStreak > 0) break;
        winStreak++;
     } else if (day.pnl < 0) {
        if (winStreak > 0) break;
        lossStreak++;
     } else {
        break; // 0 PnL breaks the streak
     }
  }

  // Fiffy's Smart Strategy Logic
  let strategySuggestion = "";
  const safeTarget = Math.max(state.profitTarget / 15, stats.bestDayPnL * 0.5);
  const safeMax = stats.bestDayPnL > 0 ? stats.bestDayPnL : state.profitTarget / 5;

  if (state.entries.length === 0) {
      strategySuggestion = `Hey Fiffy! Ready to crush it? A great starting goal is around ${formatCurrency(state.profitTarget / 10)} for your first day. This gives you steady progress without risking a consistency violation later. Remember to breathe and trust your edge! ✨`;
  } else if (stats.isEvaluationPassed) {
      strategySuggestion = `Challenge completely smashed, Fiffy! 🎉 You've hit the target and managed your rules perfectly. Close the charts, go treat yourself to something nice, and get ready for the funded account! You earned this.`;
  } else if (isFailingConsistency) {
      const safeMin = stats.bestDayPnL * 0.3;
      strategySuggestion = `Careful Fiffy! Your biggest day (${formatCurrency(stats.bestDayPnL)}) is taking up too much of your total profit. Action Plan: We need to dilute it. Aim for smaller, consistent daily wins between ${formatCurrency(safeMin)} and ${formatCurrency(safeMax)}. DO NOT make more than ${formatCurrency(stats.bestDayPnL)} today!`;
  } else if (stats.totalNetProfit < 0) {
      if (lossStreak >= 3) {
          strategySuggestion = `Take a deep breath, Fiffy. You've had ${lossStreak} red days in a row. The market will always be there. Scale down your risk to the absolute minimum, wait for your absolute best A+ setup, and aim for a base hit of ${formatCurrency(state.profitTarget / 20)}. Protect your capital first!`;
      } else {
          strategySuggestion = `You're currently in a slight drawdown, Fiffy, but that's just part of the game! Don't swing for the fences to make it back all at once. Aim for reliable setups to pull in ${formatCurrency(state.profitTarget / 20)} to ${formatCurrency(state.profitTarget / 10)} per day until you're back in the green. You got this! 💪`;
      }
  } else {
      if (winStreak >= 3) {
          strategySuggestion = `You are ON FIRE, Fiffy! 🔥 A ${winStreak}-day winning streak! The market is perfectly in sync with you right now. But remember: keep your sizing the same. Don't get overconfident. Your sweet spot for today is around ${formatCurrency(safeTarget)}.`;
      } else if (targetProgressPercent > 80) {
          strategySuggestion = `You are SO close to passing, Fiffy! (${targetProgressPercent.toFixed(1)}%). Stay disciplined and do exactly what got you here. Don't rush the final stretch. Just aim for ${formatCurrency(safeTarget)} today. Keep it simple! 💅`;
      } else {
          strategySuggestion = `You're doing amazing, Fiffy! To maintain your perfect consistency score, a great target for your next daily profit is around ${formatCurrency(safeTarget)}, up to a maximum of ${formatCurrency(safeMax)}. Slow, steady, and disciplined wins the funding! 💅`;
      }
  }

  // Highlight bold currency formatting for the strategy string
  const formattedStrategy = strategySuggestion.split(/(?=\$[0-9,.]+)/).map((part, index) => {
    const match = part.match(/^(\$[0-9,.]+)(.*)/);
    if (match) {
      return <span key={index}><strong className="text-primary">{match[1]}</strong>{match[2]}</span>;
    }
    return <span key={index}>{part}</span>;
  });

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-secondary pb-2">
              Fiffy's Journal
            </h1>
            <p className="text-slate-400 text-lg font-medium">
              Tracking <span className="text-white">{formatCurrency(state.accountSize)}</span> Account
            </p>
          </div>
          
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="text-sm font-semibold bg-white/5 border border-white/10 px-5 py-2.5 rounded-full hover:bg-white/10 transition-all shadow-lg hover:shadow-primary/20 text-white"
          >
            {showSettings ? 'Close Settings' : 'Edit Rules & Backup'}
          </button>
        </div>

        {/* Settings Panel with Backup Options */}
        {showSettings && (
          <div className="glass-card p-6 md:p-8 rounded-3xl animate-in fade-in slide-in-from-top-4 duration-300 space-y-8">
             
             {/* Rules Configuration */}
             <div>
               <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                 <IconTarget className="w-5 h-5 text-primary" /> Setup Your Challenge
               </h3>
               <form onSubmit={handleSaveSettings} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                 <div>
                   <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Account Size ($)</label>
                   <input type="number" value={editAccSize} onChange={e => setEditAccSize(e.target.value)} className="w-full bg-[#030305] border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors font-medium" />
                 </div>
                 <div>
                   <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Profit Target ($)</label>
                   <input type="number" value={editTarget} onChange={e => setEditTarget(e.target.value)} className="w-full bg-[#030305] border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors font-medium" />
                 </div>
                 <div>
                   <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Consistency (%)</label>
                   <input type="number" value={editRule} onChange={e => setEditRule(e.target.value)} className="w-full bg-[#030305] border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors font-medium" />
                 </div>
                 <button type="submit" className="bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/30">
                   Save Rules
                 </button>
               </form>
             </div>

             {/* Data Backup Tools */}
             <div className="pt-8 border-t border-white/5">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                  Data Backup (Save inside your PC)
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  The app auto-saves to your browser! However, if you clear your browser history or change computers, download a backup below to keep your history safe.
                </p>
                <div className="flex flex-wrap gap-4">
                   <button 
                      onClick={handleExportBackup} 
                      className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold py-2.5 px-6 rounded-xl transition-all flex items-center gap-2"
                   >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                      Export Backup
                   </button>
                   
                   <input 
                     type="file" 
                     accept=".json" 
                     className="hidden" 
                     ref={fileInputRef} 
                     onChange={handleImportBackup} 
                   />
                   <button 
                      onClick={() => fileInputRef.current?.click()} 
                      className="bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-semibold py-2.5 px-6 rounded-xl transition-all flex items-center gap-2"
                   >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                      Import Backup
                   </button>
                </div>
             </div>

          </div>
        )}

        {/* Personalized Status Banner */}
        <div className="glass-card rounded-[2rem] p-8 md:p-10 relative overflow-hidden">
           {/* Decorative background glow */}
           <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none"></div>
           <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary/10 rounded-full blur-[80px] pointer-events-none"></div>
           
           <div className="relative z-10">
              {statusBadge}
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
                 {statusMessage}
              </h2>
              {actionRequired && (
                 <div className="mt-6 inline-block bg-[#030305]/80 backdrop-blur border border-white/5 rounded-2xl p-4 text-slate-200 font-medium">
                    <span className="text-primary font-bold mr-2">🎯 Action Plan:</span> 
                    {actionRequired}
                 </div>
              )}
           </div>
        </div>

        {/* Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Target Progress */}
          <div className="glass-card p-8 rounded-3xl relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-white">Profit Target</h3>
              {stats.isTargetReached ? 
                <div className="bg-success/20 p-2 rounded-full"><IconCheckCircle className="w-5 h-5 text-success" /></div> : 
                <div className="bg-white/5 p-2 rounded-full"><IconTarget className="w-5 h-5 text-slate-400" /></div>
              }
            </div>
            
            <div className="flex items-baseline gap-2 mb-6">
              <span className={`text-4xl font-extrabold tracking-tight ${stats.isTargetReached ? 'text-success' : stats.totalNetProfit >= 0 ? 'text-white' : 'text-danger'}`}>
                {formatCurrency(stats.totalNetProfit)}
              </span>
              <span className="text-slate-400 font-medium text-lg">/ {formatCurrency(state.profitTarget)}</span>
            </div>
            
            <div className="relative w-full h-4 bg-[#030305] rounded-full overflow-hidden border border-white/5 shadow-inner">
              <div 
                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${stats.isTargetReached ? 'bg-success shadow-[0_0_10px_#10b981]' : 'bg-gradient-to-r from-primary to-blue-500'}`} 
                style={{ width: `${targetProgressPercent}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-3 text-sm font-medium">
               <span className="text-slate-500">0%</span>
               <span className="text-slate-400">{targetProgressPercent.toFixed(1)}%</span>
            </div>
          </div>

          {/* Consistency Progress */}
          <div className="glass-card p-8 rounded-3xl relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-white">Consistency Rule</h3>
              {stats.isPassingConsistency ? 
                <div className="bg-success/20 p-2 rounded-full"><IconCheckCircle className="w-5 h-5 text-success" /></div> : 
                stats.totalNetProfit > 0 ? <div className="bg-danger/20 p-2 rounded-full"><IconXCircle className="w-5 h-5 text-danger" /></div> :
                <div className="bg-white/5 p-2 rounded-full"><IconTarget className="w-5 h-5 text-slate-400" /></div>
              }
            </div>
            
            <div className="flex items-baseline gap-2 mb-6">
              <span className={`text-4xl font-extrabold tracking-tight ${isFailingConsistency ? 'text-danger' : 'text-white'}`}>
                {stats.totalNetProfit > 0 ? `${stats.consistencyPercent.toFixed(1)}%` : '0.0%'}
              </span>
              <span className="text-slate-400 font-medium text-lg">/ {state.consistencyRulePercent}% limit</span>
            </div>
            
            <div className="relative w-full h-4 bg-[#030305] rounded-full overflow-hidden border border-white/5 shadow-inner">
              {/* Marker for rule limit */}
              <div className="absolute top-0 bottom-0 w-1 bg-white z-20 shadow-[0_0_8px_white]" style={{ left: `${state.consistencyRulePercent}%` }} />
              
              {/* Fill */}
              <div 
                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${isFailingConsistency ? 'bg-danger shadow-[0_0_10px_#f43f5e]' : 'bg-gradient-to-r from-secondary to-pink-400'}`} 
                style={{ width: `${consistencyProgressPercent}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-3 text-sm font-medium relative">
               <span className="text-slate-500">Best Day: {formatCurrency(stats.bestDayPnL)}</span>
               <span className="text-white/60 text-xs absolute left-[40%] -translate-x-1/2 mt-1">MAX {state.consistencyRulePercent}%</span>
            </div>
          </div>
        </div>

        {/* Fiffy's Smart Strategy / AI Suggestion */}
        <div className="glass-card rounded-[2rem] p-6 md:p-8 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center gap-6 border-primary/30 bg-primary/10 shadow-[0_0_20px_rgba(139,92,246,0.05)]">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
                <IconSparkles className="w-7 h-7 md:w-8 md:h-8 text-primary" />
            </div>
            <div>
                <h3 className="text-xl font-bold text-white mb-2">Fiffy's Smart Strategy</h3>
                <p className="text-slate-300 text-[15px] md:text-base leading-relaxed font-medium">
                    {formattedStrategy}
                </p>
            </div>
        </div>

        {/* Input & History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Add Entry Card */}
          <div className="lg:col-span-1 glass-card rounded-3xl p-8 h-fit z-10">
            <h3 className="text-xl font-bold text-white mb-6">Log New Day</h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Select Date</label>
                <input 
                  type="date" 
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-[#030305] border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">End of Day PnL ($)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 font-bold">$</span>
                  <input 
                    type="number" 
                    step="any"
                    required
                    placeholder="150.50 or 500"
                    value={newPnL}
                    onChange={(e) => setNewPnL(e.target.value)}
                    className="w-full bg-[#030305] border border-white/10 rounded-xl pl-8 pr-4 py-3.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button 
                  type="button" 
                  onClick={() => handleAddEntry('win')}
                  className="w-full bg-success/10 text-success border border-success/30 hover:bg-success/20 font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                  Log Win
                </button>
                <button 
                  type="button" 
                  onClick={() => handleAddEntry('loss')}
                  className="w-full bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path></svg>
                  Log Loss
                </button>
              </div>
            </div>
          </div>

          {/* History Table */}
          <div className="lg:col-span-2 glass-card rounded-3xl overflow-hidden flex flex-col h-[600px] z-10">
             <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-[#030305]/60 shrink-0">
               <h3 className="text-xl font-bold text-white">Daily History</h3>
               <span className="text-sm font-medium text-slate-500 bg-[#030305] px-3 py-1 rounded-full border border-white/5">
                  {stats.aggregatedDays.length} Days Tracked
               </span>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#030305]/20">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-[#0a0a0d] z-20 shadow-sm border-b border-white/5">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-slate-500 text-sm uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 font-semibold text-slate-500 text-sm uppercase tracking-wider text-right">Net PnL</th>
                      <th className="px-4 py-3 font-semibold text-slate-500 text-sm uppercase tracking-wider text-right">% of Total</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="space-y-2 relative z-0">
                    {stats.aggregatedDays.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-16 text-center text-slate-500">
                          <div className="flex flex-col items-center mt-8">
                             <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                <IconSparkles className="w-8 h-8 text-slate-600" />
                             </div>
                             <p className="font-medium text-lg">No trading days logged yet.</p>
                             <p className="text-sm mt-1">Your history will appear here.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      stats.aggregatedDays.map(day => {
                        const dayEntries = state.entries.filter(e => e.date.startsWith(day.date));
                        const isBest = day.date === stats.bestDayDate && stats.bestDayPnL > 0;
                        const percentOfTotal = stats.totalNetProfit > 0 && day.pnl > 0 
                            ? ((day.pnl / stats.totalNetProfit) * 100).toFixed(1) + '%' 
                            : '-';

                        return (
                          <React.Fragment key={day.date}>
                            <tr className={`group transition-colors rounded-xl overflow-hidden ${isBest ? 'bg-primary/10 hover:bg-primary/20' : 'hover:bg-white/5'}`}>
                              <td className="px-4 py-4 text-white font-medium rounded-l-xl">
                                <div className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full ${day.pnl >= 0 ? 'bg-success' : 'bg-danger'}`}></div>
                                  {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                  {isBest && <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full uppercase font-bold tracking-wider shadow-[0_0_10px_rgba(139,92,246,0.4)]">Best Day</span>}
                                </div>
                              </td>
                              <td className={`px-4 py-4 font-bold text-right text-lg ${day.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                                {day.pnl > 0 ? '+' : ''}{formatCurrency(day.pnl)}
                              </td>
                              <td className="px-4 py-4 text-slate-300 text-right font-semibold">
                                {percentOfTotal}
                              </td>
                              <td className="px-4 py-4 text-center rounded-r-xl w-16">
                                {/* Only allow delete if there's exactly 1 entry for this date to keep UI simple. If multiple, user deletes individually. */}
                                {dayEntries.length === 1 && (
                                   <button 
                                     onClick={() => deleteEntry(dayEntries[0].id)} 
                                     className="text-slate-500 hover:text-danger hover:bg-danger/10 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100" 
                                     title="Delete Entry"
                                   >
                                     <IconTrash className="w-4 h-4" />
                                   </button>
                                )}
                              </td>
                            </tr>
                            
                            {/* If multiple entries on same day, show nested view */}
                            {dayEntries.length > 1 && dayEntries.map((entry, idx) => (
                              <tr key={entry.id} className="bg-white/[0.02]">
                                <td className="px-4 py-2 pl-10 text-xs text-slate-500 font-medium">
                                  <span className="text-white/20 mr-2">└</span> Entry {idx + 1}
                                </td>
                                <td className={`px-4 py-2 text-right text-sm font-medium ${entry.pnl >= 0 ? 'text-success/70' : 'text-danger/70'}`}>
                                  {formatCurrency(entry.pnl)}
                                </td>
                                <td></td>
                                <td className="px-4 py-2 text-center">
                                  <button onClick={() => deleteEntry(entry.id)} className="text-slate-600 hover:text-danger p-1.5 hover:bg-danger/10 rounded-md transition-colors" title="Delete Entry">
                                    <IconTrash className="w-3 h-3" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {/* Spacer row */}
                            <tr className="h-2"></tr>
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <FiffysDashboard />
    </StoreProvider>
  );
}
