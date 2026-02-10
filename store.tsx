import React, { createContext, useContext, useState, useEffect } from 'react';
import { DayEntry, AppState, Trade } from './types';

interface StoreContextType {
  state: AppState;
  addEntry: (entry: DayEntry) => void;
  deleteEntry: (id: string) => void;
  updateSettings: (accountSizeOrObj: any, profitTarget?: number, rulePercent?: number) => void;
  addTrade: (trade: Trade) => void;
  deleteTrade: (id: string) => void;
  updateRules: (rules: any) => void;
  importState: (newState: AppState) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('propFirmTrackerState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          entries: parsed.entries || [],
          consistencyRulePercent: parsed.consistencyRulePercent || 40,
          accountSize: parsed.accountSize || 50000,
          profitTarget: parsed.profitTarget || 2500,
          trades: parsed.trades || [],
          settings: parsed.settings || { initialBalance: 50000 },
          propFirmRules: parsed.propFirmRules || {
            profitTargetPercent: 10,
            maxDailyLossPercent: 5,
            maxOverallDrawdownPercent: 10,
            consistencyRulePercent: 40,
          }
        };
      } catch (e) {
        console.error("Failed to parse state", e);
      }
    }
    // Default clean state
    return {
      entries: [],
      consistencyRulePercent: 40,
      accountSize: 50000,
      profitTarget: 2500,
      trades: [],
      settings: { initialBalance: 50000 },
      propFirmRules: {
        profitTargetPercent: 10,
        maxDailyLossPercent: 5,
        maxOverallDrawdownPercent: 10,
        consistencyRulePercent: 40,
      }
    };
  });

  useEffect(() => {
    // This is where the magic happens! Automatically saves to her browser anytime state changes.
    localStorage.setItem('propFirmTrackerState', JSON.stringify(state));
  }, [state]);

  const addEntry = (entry: DayEntry) => {
    setState(prev => ({ ...prev, entries: [...prev.entries, entry] }));
  };

  const deleteEntry = (id: string) => {
    setState(prev => ({ ...prev, entries: prev.entries.filter(e => e.id !== id) }));
  };

  const updateSettings = (accountSizeOrObj: any, profitTarget?: number, rulePercent?: number) => {
    if (typeof accountSizeOrObj === 'object') {
      setState(prev => ({ ...prev, settings: { ...prev.settings, ...accountSizeOrObj } }));
    } else {
      setState(prev => ({ 
        ...prev, 
        accountSize: accountSizeOrObj, 
        profitTarget: profitTarget || prev.profitTarget, 
        consistencyRulePercent: rulePercent || prev.consistencyRulePercent 
      }));
    }
  };

  const addTrade = (trade: Trade) => {
    setState(prev => ({ ...prev, trades: [...prev.trades, trade] }));
  };

  const deleteTrade = (id: string) => {
    setState(prev => ({ ...prev, trades: prev.trades.filter(t => t.id !== id) }));
  };

  const updateRules = (rules: any) => {
    setState(prev => ({ ...prev, propFirmRules: { ...prev.propFirmRules, ...rules } }));
  };

  const importState = (newState: AppState) => {
    setState(newState);
  };

  return (
    <StoreContext.Provider value={{ state, addEntry, deleteEntry, updateSettings, addTrade, deleteTrade, updateRules, importState }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
