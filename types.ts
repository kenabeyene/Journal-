export interface DayEntry {
  id: string;
  date: string; // YYYY-MM-DD
  pnl: number;
}

export type Emotion = 'Calm' | 'FOMO' | 'Revenge' | 'Bored' | 'Anxious' | 'Confident' | 'Greedy' | 'Fearful';
export type Instrument = 'Nasdaq' | 'S&P500' | 'EURUSD' | 'GBPUSD' | 'Gold' | 'Oil' | 'Crypto' | 'Other';
export type Session = 'London' | 'New York' | 'Asian' | 'Overnight';
export type Direction = 'Buy' | 'Sell';

export interface Trade {
  id: string;
  date: string;
  instrument: Instrument;
  session: Session;
  direction: Direction;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskAmount: number;
  resultAmount: number;
  rrAchieved: number;
  durationMinutes: number;
  emotionBefore: Emotion;
  emotionAfter: Emotion;
  ruleFollowed: boolean;
  notes: string;
}

export interface AppState {
  entries: DayEntry[];
  consistencyRulePercent: number;
  accountSize: number;
  profitTarget: number;
  trades: Trade[];
  settings: {
    initialBalance: number;
  };
  propFirmRules: {
    profitTargetPercent: number;
    maxDailyLossPercent: number;
    maxOverallDrawdownPercent: number;
    consistencyRulePercent: number;
  };
}