import { useEffect, useState } from 'react';
import { storage } from '../services/storage';
import { Expense } from '../models/types';
import { ExpenseCard } from '../components/ExpenseCard';
import { Receipt, Eye, EyeOff } from 'lucide-react';
import { formatCurrency } from '../lib/currency';
import { useAppStore } from '../store';

export default function HomeScreen({ refreshTrigger, onEditExpense }: { refreshTrigger: number, onEditExpense: (e: Expense) => void }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const { isDiscreteMode, toggleDiscreteMode } = useAppStore();

  useEffect(() => {
    const data = storage.getExpenses();
    setExpenses(data);
    setTotal(data.reduce((sum, item) => sum + item.amount, 0));
  }, [refreshTrigger]);

  const recentExpenses = expenses.slice(0, 5);

  return (
    <div className="p-4 flex flex-col gap-6">
      <div className="bg-app-primary rounded-[32px] p-8 text-app-text-inv shadow-md relative overflow-hidden transition-colors">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10 flex flex-col items-center text-center">
          <span className="text-app-border uppercase text-[10px] tracking-widest font-bold mb-2">Total Expenses</span>
          <div className="text-5xl font-serif text-app-text-inv mb-2 flex items-center justify-center gap-3">
            <span>{formatCurrency(total)}</span>
            <button onClick={toggleDiscreteMode} className="text-app-text-inv hover:opacity-80 transition-opacity" title="Toggle Discrete Mode">
              {isDiscreteMode ? <EyeOff size={28} /> : <Eye size={28} />}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-app-card rounded-[32px] border border-app-border-light shadow-sm overflow-hidden flex flex-col transition-colors">
        <div className="p-6 border-b border-app-border-light flex justify-between items-center bg-app-card transition-colors">
          <h3 className="font-serif text-xl italic text-app-text">Recent Expenses</h3>
          <span className="text-[10px] uppercase font-bold tracking-tighter text-app-muted">Latest</span>
        </div>
        
        {recentExpenses.length === 0 ? (
          <div className="text-center py-12 bg-app-card border-none transition-colors">
            <Receipt className="mx-auto h-12 w-12 text-app-border mb-3" />
            <p className="text-app-muted font-bold text-sm tracking-wider uppercase">No expenses yet.</p>
            <p className="text-app-muted text-xs mt-1">Tap + to add one</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 p-4 bg-app-card transition-colors">
            {recentExpenses.map(expense => (
               <ExpenseCard key={expense.id} expense={expense} onClick={() => onEditExpense(expense)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
