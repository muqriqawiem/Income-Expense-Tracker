// src/types/index.ts

export type TransactionType = 'Income' | 'Expense';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  color: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  transaction_date: string;
  type: TransactionType;
  category_id: string | null;
  amount: number;
  description: string | null;
  year_month: string;
  created_at: string;
  category?: Pick<Category, 'id' | 'name' | 'is_active' | 'color'>;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  year_month: string;
  allocated_budget: number;
  created_at: string;
  category?: Pick<Category, 'id' | 'name' | 'is_active' | 'color'>;
}

export interface FinancialOverview {
  total_income: number;
  total_expense: number;
  total_remaining: number;
  total_allocated_budget: number;
  buffer: number;
}

export interface BudgetSummaryRow {
  category_id: string;
  category_name: string;
  allocated_budget: number;
  spent: number;
  remaining: number;
  used_percent: number;
  category_color: string;
}

export interface TransactionFormData {
  transaction_date: string;
  type: TransactionType;
  category_id: string;
  amount: string;
  description: string;
}

export interface BudgetFormData {
  category_id: string;
  allocated_budget: string;
}
