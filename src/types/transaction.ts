import { BudgetCategory } from '../constants/categories';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category?: BudgetCategory;
  type: 'income' | 'expense';
  institution_name?: string;
  account_name?: string;
  is_plaid: boolean;
} 