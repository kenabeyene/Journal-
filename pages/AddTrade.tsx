import React, { useState } from 'react';
import { useStore } from '../store';
import { Emotion, Instrument, Session, Direction, Trade } from '../types';

export const AddTrade = () => {
  const { addTrade } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [instrument, setInstrument] = useState<Instrument>('Nasdaq');
  const [session, setSession] = useState<Session>('New York');
  const [direction, setDirection] = useState<Direction>('Buy');
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [riskAmount, setRiskAmount] = useState('');
  const [resultAmount, setResultAmount] = useState('');
  const [duration, setDuration] = useState('');
  const [emotionBefore, setEmotionBefore] = useState<Emotion>('Calm');
  const [emotionAfter, setEmotionAfter] = useState<Emotion>('Calm');
  const [ruleFollowed, setRuleFollowed] = useState(true);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = parseFloat(resultAmount);
    const risk = parseFloat(riskAmount);
    
    // Auto calculate RR if win, else set negative
    let rr = 0;
    if (result > 0 && risk > 0) {
        rr = result / risk;
    } else if (result < 0) {
        rr = result / risk; // Negative RR
    }

    const newTrade: Trade = {
      id: crypto.randomUUID(),
      date: new Date(date).toISOString(),
      instrument,
      session,
      direction,
      entryPrice: parseFloat(entryPrice) || 0,
      stopLoss: parseFloat(stopLoss) || 0,
      takeProfit: parseFloat(takeProfit) || 0,
      riskAmount: risk || 0,
      resultAmount: result || 0,
      rrAchieved: rr,
      durationMinutes: parseInt(duration, 10) || 0,
      emotionBefore,
      emotionAfter,
      ruleFollowed,
      notes,
    };

    // Simulate network delay
    setTimeout(() => {
      addTrade(newTrade);
      setIsSubmitting(false);
      setSuccess(true);
      
      // Reset some fields
      setResultAmount('');
      setNotes('');
      setEmotionBefore('Calm');
      setEmotionAfter('Calm');
      setRuleFollowed(true);

      setTimeout(() => setSuccess(false), 3000);
    }, 500);
  };

  const inputClass = "w-full bg-[#09090b] border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";
  const labelClass = "block text-sm font-medium text-slate-400 mb-1.5";

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Log Trade</h1>
        <p className="text-slate-400 mt-1">Record your execution, psychology, and results.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-6 md:p-8 space-y-8">
        
        {/* Section: Basic Details */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 border-b border-border pb-2">Execution Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Date & Time</label>
              <input type="datetime-local" required className={inputClass} value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Instrument</label>
              <select className={inputClass} value={instrument} onChange={e => setInstrument(e.target.value as Instrument)}>
                {['Nasdaq', 'S&P500', 'EURUSD', 'GBPUSD', 'Gold', 'Oil', 'Crypto', 'Other'].map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Session</label>
              <select className={inputClass} value={session} onChange={e => setSession(e.target.value as Session)}>
                {['London', 'New York', 'Asian', 'Overnight'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Direction</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="direction" value="Buy" checked={direction === 'Buy'} onChange={() => setDirection('Buy')} className="text-primary focus:ring-primary bg-background border-border" />
                  <span className="text-white">Buy (Long)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="direction" value="Sell" checked={direction === 'Sell'} onChange={() => setDirection('Sell')} className="text-danger focus:ring-danger bg-background border-border" />
                  <span className="text-white">Sell (Short)</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Price & Risk */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 border-b border-border pb-2">Price & Risk</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className={labelClass}>Entry Price</label>
              <input type="number" step="any" required className={inputClass} placeholder="0.00" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Stop Loss</label>
              <input type="number" step="any" required className={inputClass} placeholder="0.00" value={stopLoss} onChange={e => setStopLoss(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Take Profit</label>
              <input type="number" step="any" required className={inputClass} placeholder="0.00" value={takeProfit} onChange={e => setTakeProfit(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Risk Amount ($)</label>
              <input type="number" step="any" required className={inputClass} placeholder="100.00" value={riskAmount} onChange={e => setRiskAmount(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Result PnL ($)</label>
              <input type="number" step="any" required className={inputClass} placeholder="-50 or 150" value={resultAmount} onChange={e => setResultAmount(e.target.value)} />
              <p className="text-xs text-slate-500 mt-1">Use negative value for losses.</p>
            </div>
            <div>
              <label className={labelClass}>Duration (Minutes)</label>
              <input type="number" className={inputClass} placeholder="45" value={duration} onChange={e => setDuration(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Section: Psychology */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 border-b border-border pb-2">Psychology & Review</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className={labelClass}>Emotion Before Entry</label>
              <select className={inputClass} value={emotionBefore} onChange={e => setEmotionBefore(e.target.value as Emotion)}>
                {['Calm', 'FOMO', 'Revenge', 'Bored', 'Anxious', 'Confident', 'Greedy', 'Fearful'].map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Emotion After Exit</label>
              <select className={inputClass} value={emotionAfter} onChange={e => setEmotionAfter(e.target.value as Emotion)}>
                {['Calm', 'FOMO', 'Revenge', 'Bored', 'Anxious', 'Confident', 'Greedy', 'Fearful'].map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
               <label className="flex items-center gap-3 cursor-pointer bg-[#09090b] p-4 rounded-lg border border-border">
                  <input type="checkbox" checked={ruleFollowed} onChange={e => setRuleFollowed(e.target.checked)} className="w-5 h-5 rounded text-primary focus:ring-primary border-border bg-background" />
                  <span className="text-white font-medium">I followed my trading plan exactly.</span>
                </label>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Trade Notes / Reflections</label>
              <textarea rows={4} className={inputClass} placeholder="What went well? What could be improved?" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-between">
            {success ? (
                <div className="text-success font-medium flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Trade saved successfully!
                </div>
            ) : (
                <div />
            )}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-primary hover:bg-blue-600 text-white font-medium py-2.5 px-6 rounded-lg transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-[#18181b] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save Trade'}
          </button>
        </div>

      </form>
    </div>
  );
};
