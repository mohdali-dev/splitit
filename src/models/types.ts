export type Category = 'Rent' | 'Food' | 'Tea/Snacks' | 'Travel' | 'Bills' | 'Other';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: Category;
  paidBy: string;
  date: string; // ISO string
  participants: string[];
  notes?: string;
}

export interface Settlement {
  id: string;
  from: string;
  to: string;
  amount: number;
  date: string;
}

export type GroupCategory = 'Home' | 'Travel' | 'Office' | 'Other';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  currency: 'PKR' | 'USD' | 'INR' | 'EUR';
  notificationsEnabled: boolean;
  textSize?: 'compact' | 'small' | 'default' | 'large' | 'xl';
}

export interface Group {
  id: string;
  name: string;
  category?: GroupCategory | string;
  themeColor?: string;
  roommates: string[];
  expenses: Expense[];
  settlements: Settlement[];
  createdAt: string;
}
