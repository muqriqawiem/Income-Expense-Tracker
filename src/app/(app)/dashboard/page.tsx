// src/app/(app)/dashboard/page.tsx
import { getFinancialOverview, getBudgetSummaryRows } from '@/data/summary';
import { generateMonthOptions, currentYearMonth } from '@/lib/utils/date';
import { formatRM } from '@/lib/utils/currency';
import MonthSelector from '@/components/dashboard/MonthSelector';
import BudgetSummaryTable from '@/components/dashboard/BudgetSummaryTable';

interface Props {
  searchParams: Promise<{ month?: string }>;
}

function OverviewCard({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean | null;
}) {
  const color =
    positive === true
      ? 'var(--income)'
      : positive === false
      ? 'var(--expense)'
      : 'var(--text)';

  return (
    <div className="card">
      <p style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '8px' }}>
        {label}
      </p>
      <p style={{ fontSize: '1.35rem', fontWeight: 700, color, fontFamily: 'monospace' }}>
        {value}
      </p>
    </div>
  );
}

export default async function DashboardPage({ searchParams }: Props) {
  const params = await searchParams;
  const selectedMonth = params.month ?? currentYearMonth();
  const monthOptions = generateMonthOptions();

  const [overview, budgetRows] = await Promise.all([
    getFinancialOverview(selectedMonth),
    getBudgetSummaryRows(selectedMonth),
  ]);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <MonthSelector options={monthOptions} selected={selectedMonth} />
      </div>

      <div className="overview-grid">
        <OverviewCard label="Total Income"           value={formatRM(overview.total_income)}           positive={true} />
        <OverviewCard label="Total Expense"          value={formatRM(overview.total_expense)}          positive={false} />
        <OverviewCard label="Total Remaining"        value={formatRM(overview.total_remaining)}        positive={overview.total_remaining >= 0} />
        <OverviewCard label="Total Allocated Budget" value={formatRM(overview.total_allocated_budget)} />
        <OverviewCard label="Buffer"                 value={formatRM(overview.buffer)}                 positive={overview.buffer >= 0} />
      </div>

      <BudgetSummaryTable rows={budgetRows} />
    </>
  );
}
