import { DayEntry, Trade } from './types';

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatPercent = (value: number) => {
  return `${value.toFixed(2)}%`;
};

export const calculateConsistency = (entries: DayEntry[], rulePercent: number, profitTarget: number) => {
  // Aggregate PnL by Date
  const dailyPnL: Record<string, number> = {};
  let totalNetProfit = 0;

  entries.forEach(entry => {
    totalNetProfit += entry.pnl;
    const day = entry.date.split('T')[0];
    dailyPnL[day] = (dailyPnL[day] || 0) + entry.pnl;
  });

  // Find Best Day
  let bestDayPnL = 0;
  let bestDayDate = '';
  Object.entries(dailyPnL).forEach(([date, pnl]) => {
    if (pnl > bestDayPnL) {
      bestDayPnL = pnl;
      bestDayDate = date;
    }
  });

  // Calculate Consistency
  const consistencyPercent = (totalNetProfit > 0 && bestDayPnL > 0) 
    ? (bestDayPnL / totalNetProfit) * 100 
    : 0;

  const isPassingConsistency = totalNetProfit > 0 && consistencyPercent <= rulePercent;
  const isTargetReached = totalNetProfit >= profitTarget;
  const isEvaluationPassed = isTargetReached && isPassingConsistency;

  // Calculate Shortfall (how much more profit needed to fix consistency)
  // Required Total Profit = Best Day / (Rule / 100)
  const requiredTotalProfitForConsistency = bestDayPnL > 0 ? bestDayPnL / (rulePercent / 100) : 0;
  const consistencyShortfall = requiredTotalProfitForConsistency > totalNetProfit 
      ? requiredTotalProfitForConsistency - totalNetProfit 
      : 0;

  // Convert dailyPnL object into array for rendering
  const aggregatedDays = Object.entries(dailyPnL)
    .map(([date, pnl]) => ({ date, pnl }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    totalNetProfit,
    bestDayPnL,
    bestDayDate,
    consistencyPercent,
    isPassingConsistency,
    isTargetReached,
    isEvaluationPassed,
    consistencyShortfall,
    requiredTotalProfitForConsistency,
    aggregatedDays
  };
};

export const calculateStats = (trades: Trade[], initialBalance: number) => {
  let netProfit = 0;
  let winningTrades = 0;
  let totalRR = 0;
  let maxBalance = initialBalance;
  let maxDrawdownAmount = 0;
  let currentBalance = initialBalance;
  
  const dailyPnL: Record<string, number> = {};
  const equityCurve: { date: string, balance: number }[] = [];

  trades.forEach(trade => {
    netProfit += trade.resultAmount;
    if (trade.resultAmount > 0) {
      winningTrades++;
      totalRR += trade.rrAchieved;
    }

    currentBalance += trade.resultAmount;
    
    if (currentBalance > maxBalance) {
      maxBalance = currentBalance;
    }
    const currentDrawdown = maxBalance - currentBalance;
    if (currentDrawdown > maxDrawdownAmount) {
      maxDrawdownAmount = currentDrawdown;
    }

    const day = trade.date.split('T')[0];
    dailyPnL[day] = (dailyPnL[day] || 0) + trade.resultAmount;
    
    equityCurve.push({
      date: day,
      balance: currentBalance
    });
  });

  const totalTrades = trades.length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const avgRR = winningTrades > 0 ? (totalRR / winningTrades) : 0;
  const maxDrawdownPercent = initialBalance > 0 ? (maxDrawdownAmount / initialBalance) * 100 : 0;

  let bestDayPnL = 0;
  let worstDayPnL = 0;
  let bestDayDate = '';
  Object.entries(dailyPnL).forEach(([date, pnl]) => {
    if (pnl > bestDayPnL) {
      bestDayPnL = pnl;
      bestDayDate = date;
    }
    if (pnl < worstDayPnL) {
      worstDayPnL = pnl;
    }
  });

  const bestDayPercentOfTotal = netProfit > 0 && bestDayPnL > 0 ? (bestDayPnL / netProfit) * 100 : 0;

  const dailyPnLChart = Object.entries(dailyPnL)
    .map(([date, pnl]) => ({ date, pnl }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    currentBalance,
    netProfit,
    winRate,
    totalTrades,
    avgRR,
    maxDrawdownAmount,
    maxDrawdownPercent,
    bestDayPnL,
    worstDayPnL,
    bestDayDate,
    bestDayPercentOfTotal,
    equityCurve,
    dailyPnLChart
  };
};