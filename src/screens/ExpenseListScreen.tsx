import { useEffect, useState } from 'react';
import { storage } from '../services/storage';
import { Expense } from '../models/types';
import { ExpenseCard } from '../components/ExpenseCard';
import { Receipt, Calendar, Users, Tags, Search } from 'lucide-react';
import { formatCurrency } from '../lib/currency';

export default function ExpenseListScreen({ refreshTrigger, onEditExpense }: { refreshTrigger: number, onEditExpense: (e: Expense) => void }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [groupBy, setGroupBy] = useState<'date' | 'category' | 'person'>('date');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setExpenses(storage.getExpenses());
  }, [refreshTrigger]);

  const filteredExpenses = expenses.filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const sortedExpenses = [...filteredExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let groupedExpenses: { title: string, items: Expense[] }[] = [];

  if (groupBy === 'date') {
     groupedExpenses = [{ title: 'All Expenses', items: sortedExpenses }];
  } else if (groupBy === 'category') {
     const groups: Record<string, Expense[]> = {};
     sortedExpenses.forEach(e => {
        if (!groups[e.category]) groups[e.category] = [];
        groups[e.category].push(e);
     });
     groupedExpenses = Object.keys(groups).map(k => ({ title: k, items: groups[k] }));
  } else if (groupBy === 'person') {
     const groups: Record<string, Expense[]> = {};
     sortedExpenses.forEach(e => {
        if (!groups[e.paidBy]) groups[e.paidBy] = [];
        groups[e.paidBy].push(e);
     });
     groupedExpenses = Object.keys(groups).map(k => ({ title: k, items: groups[k] }));
  }

  return (
    <div className="p-4 flex flex-col gap-4 pb-20">
      <div className="flex flex-col gap-4 mb-2">
         <h2 className="text-2xl font-serif italic text-app-primary px-1">Expense Log</h2>
         
         {expenses.length > 0 && (
           <div className="flex flex-col gap-4">
             <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                 <Search size={16} className="text-app-muted" />
               </div>
               <input
                 type="text"
                 placeholder="Search expenses..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full bg-app-card border border-app-border-light rounded-xl py-3 pl-11 pr-4 text-sm text-app-text outline-none focus:border-app-primary transition-all shadow-sm"
               />
             </div>
             <div className="flex gap-2 bg-app-card p-1.5 rounded-2xl border border-app-border-light shadow-sm">
               <button
                onClick={() => setGroupBy('date')}
                className={`flex-1 py-2.5 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all ${groupBy === 'date' ? 'bg-app-bg text-app-primary shadow-sm ring-1 ring-app-border-light' : 'text-app-muted hover:text-app-text'}`}
             >
               <Calendar size={14} /> Latest
             </button>
             <button
                onClick={() => setGroupBy('category')}
                className={`flex-1 py-2.5 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all ${groupBy === 'category' ? 'bg-app-bg text-app-primary shadow-sm ring-1 ring-app-border-light' : 'text-app-muted hover:text-app-text'}`}
             >
               <Tags size={14} /> Category
             </button>
             <button
                onClick={() => setGroupBy('person')}
                className={`flex-1 py-2.5 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all ${groupBy === 'person' ? 'bg-app-bg text-app-primary shadow-sm ring-1 ring-app-border-light' : 'text-app-muted hover:text-app-text'}`}
             >
               <Users size={14} /> Person
             </button>
           </div>
         </div>
         )}
      </div>
      
      {filteredExpenses.length === 0 ? (
        <div className="bg-app-card rounded-[32px] border border-app-border-light shadow-sm overflow-hidden flex flex-col transition-colors">
          <div className="text-center py-16 bg-app-card transition-colors">
            <Receipt className="mx-auto h-12 w-12 text-app-border mb-3" />
            <p className="text-app-muted font-bold text-sm tracking-wider uppercase">No expenses to show.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groupedExpenses.map(group => (
            <div key={group.title} className="bg-app-card rounded-[32px] border border-app-border-light shadow-sm overflow-hidden flex flex-col transition-colors">
              {groupBy !== 'date' && (
                <div className="p-5 border-b border-app-border-light bg-app-panel text-app-primary text-sm uppercase tracking-widest font-bold flex justify-between items-center">
                   <span>{group.title}</span>
                   <span className="text-app-muted text-xs">
                     {formatCurrency(group.items.reduce((sum, e) => sum + e.amount, 0))}
                   </span>
                </div>
              )}
              <div className="flex flex-col gap-2 p-4 bg-app-card transition-colors">
                {group.items.map(expense => (
                   <ExpenseCard key={expense.id} expense={expense} onClick={() => onEditExpense(expense)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
