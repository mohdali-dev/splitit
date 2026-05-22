import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { Expense, Category } from '../models/types';
import { ChevronLeft, ChevronDown, Trash2 } from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '../lib/currency';

const CATEGORIES: Category[] = ['Food', 'Rent', 'Tea/Snacks', 'Travel', 'Bills', 'Other'];

const toLocalDatetimeString = (dateObj: Date): string => {
  const pad = (num: number) => String(num).padStart(2, '0');
  const year = dateObj.getFullYear();
  const month = pad(dateObj.getMonth() + 1);
  const day = pad(dateObj.getDate());
  const hours = pad(dateObj.getHours());
  const minutes = pad(dateObj.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function AddExpenseScreen({ onSaved, onCancel, expenseToEdit }: { key?: string, onSaved: () => void, onCancel: () => void, expenseToEdit?: Expense }) {
  const [roommates, setRoommates] = useState<string[]>([]);
  
  const [title, setTitle] = useState(expenseToEdit?.title || '');
  const [amount, setAmount] = useState(expenseToEdit?.amount ? Math.floor(expenseToEdit.amount / 100).toString() : '');
  const [category, setCategory] = useState<Category>(expenseToEdit?.category || 'Food');
  const [paidBy, setPaidBy] = useState(expenseToEdit?.paidBy || '');
  const [date, setDate] = useState(() => {
    if (expenseToEdit) {
      return toLocalDatetimeString(new Date(expenseToEdit.date));
    }
    return toLocalDatetimeString(new Date());
  });
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [notes, setNotes] = useState(expenseToEdit?.notes || '');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    const r = storage.getRoommates();
    setRoommates(r);
    if (!expenseToEdit && r.length > 0) setPaidBy(r[0]);
    if (expenseToEdit && expenseToEdit.participants) {
      setSelectedParticipants(expenseToEdit.participants);
    } else {
      setSelectedParticipants(r);
    }
  }, [expenseToEdit]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Math.round(Number(amount) * 100);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;
    if (selectedParticipants.length === 0) {
      alert("Please select at least one participant");
      return;
    }

    if (expenseToEdit) {
      storage.updateExpense({
        ...expenseToEdit,
        title,
        amount: parsedAmount,
        category,
        paidBy,
        date: new Date(date).toISOString(),
        participants: selectedParticipants,
        notes: notes.trim() || undefined,
      });
    } else {
      const newExpense: Expense = {
        id: crypto.randomUUID(),
        title,
        amount: parsedAmount,
        category,
        paidBy,
        date: new Date(date).toISOString(),
        participants: selectedParticipants,
        notes: notes.trim() || undefined,
      };
      storage.saveExpense(newExpense);
    }
    onSaved();
  };

  const handleDelete = () => {
    if (expenseToEdit) {
      setShowConfirmDelete(true);
    }
  };

  const confirmDelete = () => {
    if (expenseToEdit) {
      storage.deleteExpense(expenseToEdit.id);
      onSaved();
    }
  };

  return (
    <div className="absolute inset-0 bg-app-panel z-20 flex flex-col animate-in slide-in-from-bottom duration-200 transition-colors">
      <div className="px-5 py-6 flex items-center justify-between border-b border-app-border bg-app-panel shadow-sm gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="p-2 -ml-2 text-app-muted hover:text-app-text transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-2xl font-serif italic text-app-primary">{expenseToEdit ? 'Edit Expense' : 'Add Expense'}</h2>
        </div>
        
        {expenseToEdit && (
          <button type="button" onClick={handleDelete} className="p-2 bg-app-card text-red-500 hover:text-white hover:bg-red-500 rounded-full transition-colors relative border border-app-border-light shadow-sm">
            <Trash2 size={20} className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-8">
        <form id="add-form" onSubmit={handleSave} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 relative">
            <label className="text-[10px] uppercase tracking-wider font-bold text-app-muted px-2">What was this for?</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Evening Tea"
              className="w-full px-4 py-4 rounded-2xl bg-app-card border border-app-border-light focus:outline-none focus:ring-2 focus:ring-app-primary text-sm text-app-text transition-shadow shadow-sm"
            />
          </div>

          <div className="flex flex-col gap-2 relative">
            <label className="text-[10px] uppercase tracking-wider font-bold text-app-muted px-2">Amount ({getCurrencySymbol()})</label>
            <input 
              type="number" 
              required
              min="1"
              step="any"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-4 rounded-2xl bg-app-card border border-app-border-light focus:outline-none focus:ring-2 focus:ring-app-primary text-lg font-bold text-app-accent transition-shadow shadow-sm"
            />
          </div>

          <div className="flex flex-col gap-2 relative">
            <label className="text-[10px] uppercase tracking-wider font-bold text-app-muted px-2">Category</label>
            <div className="relative">
              <select 
                value={category}
                onChange={e => setCategory(e.target.value as Category)}
                className="w-full px-4 py-4 rounded-2xl bg-app-card border border-app-border-light focus:outline-none focus:ring-2 focus:ring-app-primary text-sm font-bold text-app-text appearance-none pr-10 transition-shadow shadow-sm"
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-app-primary pointer-events-none" size={20} />
            </div>
          </div>

          <div className="flex flex-col gap-2 relative">
            <label className="text-[10px] uppercase tracking-wider font-bold text-app-muted px-2">Paid By</label>
            <div className="flex gap-2 flex-wrap">
              {roommates.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setPaidBy(r)}
                  className={`flex-1 min-w-[30%] py-3 rounded-xl text-xs font-bold transition-all shadow-sm ${paidBy === r ? 'bg-app-card ring-2 ring-app-primary text-app-primary' : 'bg-app-card/50 text-app-muted hover:bg-app-card border border-transparent hover:border-app-border-light text-center'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 relative">
            <label className="text-[10px] uppercase tracking-wider font-bold text-app-muted px-2">Split Among</label>
            <div className="flex gap-2 flex-wrap">
              {roommates.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    if (selectedParticipants.includes(r)) {
                      setSelectedParticipants(selectedParticipants.filter(p => p !== r));
                    } else {
                      setSelectedParticipants([...selectedParticipants, r]);
                    }
                  }}
                  className={`flex-1 min-w-[30%] py-3 rounded-xl text-xs font-bold transition-all shadow-sm ${selectedParticipants.includes(r) ? 'bg-app-card ring-2 ring-app-primary text-app-primary' : 'bg-app-card/50 text-app-muted hover:bg-app-card border border-transparent hover:border-app-border-light text-center'}`}
                >
                  {r}
                </button>
              ))}
            </div>
            {amount && !isNaN(Number(amount)) && selectedParticipants.length > 0 && (
              <div className="mt-2 bg-app-card p-4 rounded-xl border border-app-border-light shadow-sm flex justify-between items-center text-xs mb-1">
                <span className="text-app-muted font-bold tracking-wider uppercase">Per Person</span>
                <span className="font-bold text-app-accent">{formatCurrency(Math.round(Number(amount) * 100 / selectedParticipants.length))}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 relative">
            <label className="text-[10px] uppercase tracking-wider font-bold text-app-muted px-2">Notes (Optional)</label>
            <textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g., Specific items, cash return details, etc."
              rows={2}
              className="w-full px-4 py-3 rounded-2xl bg-app-card border border-app-border-light focus:outline-none focus:ring-2 focus:ring-app-primary text-sm text-app-text transition-shadow shadow-sm resize-none"
            />
          </div>

          <div className="flex flex-col gap-2 relative">
            <label className="text-[10px] uppercase tracking-wider font-bold text-app-muted px-2">Date & Time</label>
            <input 
              type="datetime-local"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-4 rounded-2xl bg-app-card border border-app-border-light focus:outline-none focus:ring-2 focus:ring-app-primary text-sm font-bold text-app-text transition-shadow shadow-sm [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>

        </form>
      </div>

      <div className="p-6 border-t border-app-border bg-app-panel transition-colors">
        <button 
          type="submit"
          form="add-form"
          className="w-full bg-app-accent hover:bg-app-accent-hover text-white rounded-[24px] font-bold text-sm uppercase tracking-widest shadow-md flex items-center justify-center py-4 transition-transform active:scale-[0.98]"
        >
          {expenseToEdit ? 'Update Expense' : 'Record Expense'}
        </button>
      </div>

      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-app-card w-full max-w-sm rounded-[32px] p-6 shadow-xl animate-in zoom-in-95 duration-200 border border-app-border-light">
            <h3 className="font-serif text-xl italic text-app-primary mb-2">Delete Expense?</h3>
            <p className="text-sm text-app-muted mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 py-3 bg-app-panel hover:bg-app-border text-app-text font-bold rounded-2xl transition-colors">
                Cancel
              </button>
              <button 
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
