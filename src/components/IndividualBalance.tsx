import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { Expense, Settlement } from '../models/types';
import { formatCurrency, getCurrencySymbol } from '../lib/currency';
import { CheckCircle2, AlertCircle, ArrowRight, Wallet, Check, X } from 'lucide-react';

interface IndividualBalanceProps {
  refreshTrigger?: number;
  onSettleCompleted?: () => void;
  className?: string;
}

export default function IndividualBalance({
  refreshTrigger = 0,
  onSettleCompleted,
  className = ''
}: IndividualBalanceProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [roommates, setRoommates] = useState<string[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  
  // Settle modal state
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleFrom, setSettleFrom] = useState('');
  const [settleTo, setSettleTo] = useState('');
  const [settleAmount, setSettleAmount] = useState('');

  const loadData = () => {
    setExpenses(storage.getExpenses());
    setRoommates(storage.getRoommates());
    setSettlements(storage.getSettlements());
  };

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  // Calculations
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const balances = roommates.map(person => {
    let paid = 0;
    let owed = 0;

    expenses.forEach(e => {
      if (e.paidBy === person) paid += e.amount;
      const participants = e.participants && e.participants.length > 0 ? e.participants : roommates;
      if (participants.includes(person)) {
        owed += e.amount / participants.length;
      }
    });
    
    let settlementAdjustments = 0;
    if (total > 0) {
      settlements.forEach(s => {
        if (s.from === person) settlementAdjustments += s.amount;
        if (s.to === person) settlementAdjustments -= s.amount;
      });
    }

    const balance = total > 0 ? Math.round(paid - owed + settlementAdjustments) : 0;
    return { person, paid: Math.round(paid), balance };
  });

  // Calculate transactions (who owes whom)
  const transactions: { from: string; to: string; amount: number }[] = [];
  const creditors = balances.filter(b => b.balance > 0).map(b => ({ ...b }));
  const debtors = balances.filter(b => b.balance < 0).map(b => ({ person: b.person, owe: -b.balance }));

  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    
    const amount = Math.min(creditor.balance, debtor.owe);
    
    if (amount > 0) {
      transactions.push({
        from: debtor.person,
        to: creditor.person,
        amount: amount
      });
    }
    
    creditor.balance -= amount;
    debtor.owe -= amount;
    
    if (creditor.balance <= 0) i++;
    if (debtor.owe <= 0) j++;
  }

  const handleSettleClick = (person: string, isDebtor: boolean) => {
    if (isDebtor) {
      // If person owes money, find who they owe to
      const matchedTx = transactions.find(t => t.from === person);
      setSettleFrom(person);
      setSettleTo(matchedTx ? matchedTx.to : roommates.find(r => r !== person) || '');
      setSettleAmount(matchedTx ? Math.floor(matchedTx.amount / 100).toString() : '');
    } else {
      // If person is owed money, find who owes them
      const matchedTx = transactions.find(t => t.to === person);
      setSettleFrom(matchedTx ? matchedTx.from : roommates.find(r => r !== person) || '');
      setSettleTo(person);
      setSettleAmount(matchedTx ? Math.floor(matchedTx.amount / 100).toString() : '');
    }
    setShowSettleModal(true);
  };

  const handleSettleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Math.round(Number(settleAmount) * 100);
    if (isNaN(amountNum) || amountNum <= 0 || !settleFrom || !settleTo ) return;

    const newSettlement: Settlement = {
      id: crypto.randomUUID(),
      from: settleFrom,
      to: settleTo,
      amount: amountNum,
      date: new Date().toISOString()
    };

    storage.saveSettlement(newSettlement);
    setShowSettleModal(false);
    setSettleAmount('');
    loadData();
    if (onSettleCompleted) {
      onSettleCompleted();
    }
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Individual list */}
      <div className="bg-app-card rounded-[24px] border border-app-border-light overflow-hidden shadow-xs">
        {balances.map((b) => {
          const isOwed = b.balance > 0;
          const owes = b.balance < 0;
          const isSettled = !isOwed && !owes;

          return (
            <div
              key={b.person}
              id={`bal-row-${b.person}`}
              className="flex items-center justify-between p-5 border-b border-app-border-light last:border-0 hover:bg-app-hover transition-all duration-250"
            >
              <div className="flex-1 min-w-0 pr-4">
                <span className="font-bold text-base text-app-text truncate block">{b.person}</span>
                <span className="text-xs text-app-muted font-semibold block mt-1">
                  Total Paid: {formatCurrency(b.paid)}
                </span>
              </div>

              {/* Amount and Settle */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right flex flex-col items-end justify-center">
                  <span
                    className={`font-mono text-base font-bold tracking-tight leading-none ${
                      isOwed ? 'text-emerald-600' : owes ? 'text-red-500' : 'text-app-muted'
                    }`}
                  >
                    {isOwed ? '+' : ''}
                    {formatCurrency(b.balance)}
                  </span>
                  <span className="text-[10px] text-app-muted font-bold mt-1 uppercase tracking-wider leading-none">
                    {isOwed ? 'Gets back' : owes ? 'Owes' : 'Settled'}
                  </span>
                </div>

                {!isSettled && (
                  <button
                    onClick={() => handleSettleClick(b.person, owes)}
                    className="py-2.5 px-4 bg-app-panel hover:bg-app-primary border border-app-primary/10 hover:border-transparent text-app-primary hover:text-app-text-inv font-bold rounded-xl transition-all text-xs uppercase tracking-wider shrink-0 cursor-pointer shadow-xs active:scale-95"
                    title={`Record settlement for ${b.person}`}
                  >
                    Settle
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Settle Modal Overlay */}
      {showSettleModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSettleSubmit}
            className="bg-app-card w-full max-w-sm rounded-[32px] p-5 shadow-xl border border-app-border-light flex flex-col gap-4 animate-in zoom-in-95 duration-250"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-serif italic text-lg font-bold text-app-primary">Settle Balance</h3>
              <button
                type="button"
                onClick={() => setShowSettleModal(false)}
                className="p-1 hover:bg-app-panel rounded-full text-app-muted hover:text-app-text transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider font-bold text-app-muted block mb-1">Payer (Who Pays)</label>
                <select
                  value={settleFrom}
                  onChange={(e) => setSettleFrom(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-app-bg border border-app-border-light text-sm font-semibold text-app-text focus:outline-hidden"
                >
                  <option value="">Select Payer</option>
                  {roommates.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider font-bold text-app-muted block mb-1">Recipient (Who gets paid)</label>
                <select
                  value={settleTo}
                  onChange={(e) => setSettleTo(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-app-bg border border-app-border-light text-sm font-semibold text-app-text focus:outline-hidden"
                >
                  <option value="">Select Recipient</option>
                  {roommates.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider font-bold text-app-muted block mb-1">
                  Amount ({getCurrencySymbol()})
                </label>
                <input
                  type="number"
                  step="any"
                  value={settleAmount}
                  placeholder="0.00"
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-app-bg border border-app-border-light text-sm font-bold text-app-accent focus:outline-hidden focus:ring-1 focus:ring-app-primary"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => setShowSettleModal(false)}
                className="flex-1 py-2.5 bg-app-panel hover:bg-app-border text-app-text text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-app-primary hover:brightness-110 text-app-text-inv text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Confirm Settle
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
