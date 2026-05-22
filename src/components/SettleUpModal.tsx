import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { storage } from '../services/storage';
import { Settlement } from '../models/types';
import { formatCurrency, getCurrencySymbol } from '../lib/currency';

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  debtorId: string; // The person who pays (owes money)
  creditorId: string; // The person who gets paid (is owed money)
  amount: number; // The amount being settled
  onSettleCompleted: () => void;
}

export default function SettleUpModal({
  isOpen,
  onClose,
  debtorId,
  creditorId,
  amount,
  onSettleCompleted
}: SettleUpModalProps) {
  const [settleAmount, setSettleAmount] = useState<string>('');

  useEffect(() => {
    if (amount > 0) {
      setSettleAmount(Math.floor(amount / 100).toString());
    } else {
      setSettleAmount('');
    }
  }, [amount, isOpen]);

  if (!isOpen) return null;

  const handleSettleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Math.round(Number(settleAmount) * 100);
    if (isNaN(amt) || amt <= 0 || !debtorId || !creditorId) return;

    const settleModal = { maxAmount: amount };
    if (amt > settleModal.maxAmount) {
      alert(`Error: Settlement amount cannot exceed the total amount owed (${formatCurrency(settleModal.maxAmount)}).`);
      return;
    }

    const newSettlement: Settlement = {
      id: crypto.randomUUID(),
      from: debtorId,
      to: creditorId,
      amount: amt,
      date: new Date().toISOString()
    };

    storage.saveSettlement(newSettlement);
    onSettleCompleted();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-300">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <form
        onSubmit={handleSettleSubmit}
        className="relative bg-app-card w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl border-t sm:border border-app-border-light flex flex-col gap-6 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-250 z-10"
      >
        {/* Top Handle for mobile dragging aesthetic */}
        <div className="flex sm:hidden justify-center -mt-2 -mb-2">
          <div className="w-12 h-1 bg-app-border rounded-full opacity-60" />
        </div>

        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider font-bold text-app-muted">Settlement</span>
            <h3 className="font-serif italic text-2xl font-bold text-app-primary">Settle Up</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-app-panel rounded-full text-app-muted hover:text-app-text transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-5">
          {/* Who is paying who card */}
          <div className="p-4 bg-app-panel rounded-2xl border border-app-border-light flex items-center justify-between gap-4">
            <div className="flex-1 text-center">
              <span className="text-[10px] uppercase tracking-widest font-bold text-red-500 block mb-1">Payer</span>
              <span className="font-bold text-app-text text-sm block truncate">{debtorId}</span>
            </div>
            
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-app-muted font-bold tracking-widest uppercase mb-1">Pays</span>
              <div className="p-1.5 bg-app-primary/10 text-app-primary rounded-full">
                <Check size={16} strokeWidth={2.5} />
              </div>
            </div>

            <div className="flex-1 text-center">
              <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 block mb-1">Recipient</span>
              <span className="font-bold text-app-text text-sm block truncate">{creditorId}</span>
            </div>
          </div>

          {/* Amount input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-wider font-bold text-app-muted px-1 block">
              Settlement Amount ({getCurrencySymbol()})
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                value={settleAmount}
                onChange={(e) => setSettleAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 pb-3 bg-app-bg border border-app-border-light text-app-text hover:border-app-primary/30 focus:border-app-primary focus:outline-hidden rounded-2xl font-bold text-base transition-all focus:ring-1 focus:ring-app-primary"
                required
              />
            </div>
          </div>
        </div>

        {/* Prominent Pill Settled Button */}
        <div className="flex flex-col gap-2 mt-2">
          <button
            type="submit"
            className="w-full py-3.5 px-6 rounded-full bg-app-primary hover:bg-app-accent hover:brightness-115 text-app-text-inv font-bold text-sm tracking-wide shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Check size={18} strokeWidth={2.5} />
            <span>Mark as Settled</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-full text-app-muted hover:text-app-text font-bold text-xs tracking-wide transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
