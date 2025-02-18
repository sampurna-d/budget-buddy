import { BudgetCategory } from '../constants/categories';

export interface Budget {
  category: BudgetCategory;
  amount: number;
  spent: number;
} 