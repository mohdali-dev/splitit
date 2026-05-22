import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { Settlement } from '../models/types';
import { formatCurrency } from '../lib/currency';
import { Check, Calendar, Trash2 } from 'lucide-react';

interface SettlementHistoryProps {
  refreshTrigger?: number;
  className?: string;
  onHistoryCleared?: () => void;
}

export default function SettlementHistory({
  refreshTrigger = 0,
  className = '',
  onHistoryCleared
}: SettlementHistoryProps) {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const loadSettlements = () => {
    setSettlements(storage.getSettlements());
  };

  useEffect(() => {
    loadSettlements();
  }, [refreshTrigger]);

  const handleClearHistory = () => {
    setShowConfirmClear(true);
  };

  const confirmClearHistory = () => {
    storage.clearSettlements();
    loadSettlements();
    setShowConfirmClear(false);
    if (onHistoryCleared) {
      onHistoryCleared();
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Recent';
    }
  };

  if (settlements.length === 0) {
    return (
      <div className={`text-center py-6 px-4 bg-app-card rounded-[24px] border border-app-border-light text-app-muted/60 text-xs font-semibold select-none ${className}`}>
        No completed settlements yet.
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between px-2">
        <span className="font-bold uppercase tracking-wider text-[10px] text-app-muted">History</span>
        <button
          onClick={handleClearHistory}
          className="text-red-500/70 hover:text-red-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
          title="Clear settlement history"
        >
          <Trash2 size={12} />
          <span>Clear History</span>
        </button>
      </div>

      <div className="bg-app-card rounded-[24px] border border-app-border-light overflow-hidden shadow-xs flex flex-col">
        {settlements.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between p-5 border-b border-app-border-light last:border-0 hover:bg-app-hover transition-all duration-250"
          >
            <div className="flex items-center gap-3.5 min-w-0 pr-4">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <Check size={15} strokeWidth={2.8} />
              </div>
              
              <div className="min-w-0 flex flex-col gap-1">
                <p className="text-sm text-app-text font-semibold truncate leading-none">
                  <span className="font-bold text-app-primary">{s.from}</span> paid{' '}
                  <span className="font-bold text-app-accent">{s.to}</span>
                </p>
                <div className="flex items-center gap-1 text-[11px] text-app-muted font-semibold">
                  <Calendar size={11} className="text-app-muted/80" />
                  <span>{formatDate(s.date)}</span>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="font-mono text-base font-bold text-emerald-600 bg-emerald-500/5 px-3 py-1 rounded-xl border border-emerald-500/15 block shadow-xs">
                {formatCurrency(s.amount)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {showConfirmClear && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-app-card w-full max-w-xs rounded-[32px] p-6 shadow-xl border border-app-border-light flex flex-col gap-4 animate-in zoom-in-95 duration-250">
            <div>
              <h3 className="font-serif italic text-lg font-bold text-red-500">Clear History</h3>
              <p className="text-xs text-app-muted mt-2 leading-relaxed">
                Are you sure you want to delete all completed settlements? This action is permanent.
              </p>
            </div>
            <div className="flex gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => setShowConfirmClear(false)}
                className="flex-1 py-2.5 bg-app-panel hover:bg-app-border text-app-text text-sm font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmClearHistory}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
