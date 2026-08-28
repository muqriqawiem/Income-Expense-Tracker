// src/app/(app)/dashboard/page.tsx
import { getFinancialOverview, getBudgetSummaryRows } from '@/data/summary';
import { getMaskMoneyPreference } from '@/data/preferences';
import { getCategoriesByUsage } from '@/data/categories';
import { previousYearMonth, resolveYearMonth } from '@/lib/utils/date';

import DashboardClient from '@/components/dashboard/DashboardClient';

interface Props {
  searchParams: Promise<{ month?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const params = await searchParams;
  const selectedMonth = resolveYearMonth(params.month);
  const prevMonth = previousYearMonth(selectedMonth);

  // Server-side fetch — HTML arrives pre-rendered, no client useEffect wait
  const [overview, prevOverview, budgetRows, initialMaskMoney, categories] = await Promise.all([
    getFinancialOverview(selectedMonth),
    getFinancialOverview(prevMonth),
    getBudgetSummaryRows(selectedMonth),
    getMaskMoneyPreference(),
    getCategoriesByUsage(true), // active only — same call TransactionsPage already makes
  ]);

  return (
    <DashboardClient
      overview={overview}
      prevOverview={prevOverview}
      budgetRows={budgetRows}
      selectedMonth={selectedMonth}
      prevMonth={prevMonth}
      initialMaskMoney={initialMaskMoney}
      categories={categories}
    />
  );
}
