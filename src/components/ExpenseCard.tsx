import React, { FC } from 'react';
import { Expense } from '../models/types';
import { Receipt, Coffee, Bus, Zap, Home as HomeIcon, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../lib/currency';

export function getCategoryIcon(category: string) {
  switch(category) {
    case 'Rent': return <HomeIcon size={20} className="text-app-primary" />;
    case 'Food': return <Receipt size={20} className="text-app-accent" />;
    case 'Tea/Snacks': return <Coffee size={20} className="text-app-primary" />;
    case 'Travel': return <Bus size={20} className="text-app-accent" />;
    case 'Bills': return <Zap size={20} className="text-app-primary" />;
    default: return <Receipt size={20} className="text-app-primary" />;
  }
}

export const ExpenseCard: FC<{ expense: Expense, onClick?: () => void }> = ({ expense, onClick }) => {
  const dateObj = new Date(expense.date);
  const dateStr = dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
  
  return (
    <div onClick={onClick} className={`flex items-center gap-4 py-3 px-4 rounded-2xl transition-colors ${onClick ? 'cursor-pointer hover:bg-app-hover' : ''}`}>
      <div className="w-10 h-10 rounded-full bg-app-bg flex items-center justify-center flex-shrink-0 border border-app-border-light">
        {getCategoryIcon(expense.category)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-app-text leading-tight truncate">{expense.title}</p>
        <p className="text-sm text-gray-500 leading-tight mt-0.5 truncate">
          {expense.paidBy} &bull; {expense.category} &bull; {dateStr} at {timeStr}
        </p>
        {expense.notes && (
          <p className="text-[11px] text-app-muted/90 italic leading-snug mt-1 truncate pl-2 border-l border-app-primary/30">
            {expense.notes}
          </p>
        )}
      </div>
      <div className="text-right flex-shrink-0 flex items-center gap-2">
        <p className="text-base font-bold text-app-text">
          {formatCurrency(expense.amount)}
        </p>
        {onClick && <ChevronRight size={16} className="text-app-muted opacity-50" />}
      </div>
    </div>
  );
}
