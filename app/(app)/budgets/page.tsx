// src/app/(app)/budgets/page.tsx
import { getBudgets } from '@/data/budgets';
import { getCategories } from '@/data/categories';
import { generateMonthOptions, currentYearMonth } from '@/lib/utils/date';
import BudgetsClient from '@/components/budgets/BudgetsClient';

interface Props {
  searchParams: Promise<{ month?: string }>;
}

export default async function BudgetsPage({ searchParams }: Props) {
  const params = await searchParams;
  const selectedMonth = params.month ?? currentYearMonth();
  const monthOptions = generateMonthOptions();

  const [budgets, categories] = await Promise.all([
    getBudgets(selectedMonth),
    getCategories(true),
  ]);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Budgets</h1>
      </div>
      <BudgetsClient
        budgets={budgets}
        categories={categories}
        selectedMonth={selectedMonth}
        monthOptions={monthOptions}
      />
    </>
  );
}
