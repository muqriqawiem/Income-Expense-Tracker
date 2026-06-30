// src/app/(app)/dashboard/page.tsx
import { getFinancialOverview, getBudgetSummaryRows } from '@/data/summary';
import { getMaskMoneyPreference } from '@/data/preferences';
import { generateMonthOptions, currentYearMonth } from '@/lib/utils/date';

import MonthSelector from '@/components/dashboard/MonthSelector';
import DashboardClient from '@/components/dashboard/DashboardClient';

interface Props {
  searchParams: Promise<{ month?: string }>;
}

function getPreviousYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const prev = new Date(year, month - 2, 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
}

export default async function DashboardPage({ searchParams }: Props) {
  const params = await searchParams;
  const selectedMonth = params.month ?? currentYearMonth();
  const prevMonth = getPreviousYearMonth(selectedMonth);
  const monthOptions = generateMonthOptions();

  // Server-side fetch — HTML arrives pre-rendered, no client useEffect wait
  const [overview, prevOverview, budgetRows, initialMaskMoney] = await Promise.all([
    getFinancialOverview(selectedMonth),
    getFinancialOverview(prevMonth),
    getBudgetSummaryRows(selectedMonth),
    getMaskMoneyPreference(),
  ]);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <MonthSelector options={monthOptions} selected={selectedMonth} />
      </div>

      <DashboardClient
        overview={overview}
        prevOverview={prevOverview}
        budgetRows={budgetRows}
        selectedMonth={selectedMonth}
        prevMonth={prevMonth}
        initialMaskMoney={initialMaskMoney}
      />
    </>
  );
}
