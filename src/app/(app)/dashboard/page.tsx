// src/app/(app)/dashboard/page.tsx

import { getFinancialOverview, getBudgetSummaryRows } from '@/data/summary';
import { generateMonthOptions, currentYearMonth } from '@/lib/utils/date';
import { formatRM } from '@/lib/utils/currency';

import MonthSelector from '@/components/dashboard/MonthSelector';
import BudgetSummaryTable from '@/components/dashboard/BudgetSummaryTable';
import SpendingChart from '@/components/dashboard/SpendingChart';
import type { FinancialOverview } from '@/types';

interface Props {
  searchParams: Promise<{ month?: string }>;
}

// ── helpers ────────────────────────────────────────────────────

function getPreviousYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const prev = new Date(year, month - 2, 1); // month-2 because month is 1-indexed
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Returns the % change from prev → current.
 * Returns null when prev is 0 (avoid divide-by-zero / infinity).
 */
function pctChange(current: number, prev: number): number | null {
  if (prev === 0) return null;
  return ((current - prev) / Math.abs(prev)) * 100;
}

// ── DeltaPill ──────────────────────────────────────────────────

interface DeltaPillProps {
  current: number;
  prev: number;
  /**
   * Polarity flips meaning for expense: a decrease is good (green).
   * Set invertPolarity=true for expense-type metrics.
   */
  invertPolarity?: boolean;
  prevMonthLabel: string;
}

function DeltaPill({ current, prev, invertPolarity = false, prevMonthLabel }: DeltaPillProps) {
  const pct = pctChange(current, prev);

  if (pct === null) {
    return (
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        — no {prevMonthLabel} data
      </span>
    );
  }

  const isUp = pct > 0;
  const isGood = invertPolarity ? !isUp : isUp;
  const isFlat = Math.abs(pct) < 0.05;

  if (isFlat) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          fontSize: '0.72rem',
          fontWeight: 600,
          background: 'rgba(148, 163, 184, 0.15)',
          color: 'var(--text-muted)',
          padding: '2px 8px',
          borderRadius: '999px',
        }}
      >
        → same as {prevMonthLabel}
      </span>
    );
  }

  const color = isGood ? 'var(--income)' : 'var(--expense)';
  const bgColor = isGood ? 'rgba(34, 197, 94, 0.12)' : 'rgba(244, 63, 94, 0.12)';
  const arrow = isUp ? '▲' : '▼';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        fontSize: '0.72rem',
        fontWeight: 600,
        background: bgColor,
        color,
        padding: '2px 8px',
        borderRadius: '999px',
        whiteSpace: 'nowrap',
      }}
    >
      {arrow} {Math.abs(pct).toFixed(1)}% vs {prevMonthLabel}
    </span>
  );
}

// ── OverviewCard ───────────────────────────────────────────────

interface OverviewCardProps {
  label: string;
  value: string;
  positive?: boolean | null;
  deltaNode?: React.ReactNode;
}

function OverviewCard({ label, value, positive, deltaNode }: OverviewCardProps) {
  const color =
    positive === true
      ? 'var(--income)'
      : positive === false
      ? 'var(--expense)'
      : 'var(--text)';

  const glowColor =
    positive === true
      ? 'rgba(34, 197, 94, 0.12)'
      : positive === false
      ? 'rgba(244, 63, 94, 0.12)'
      : 'rgba(56, 189, 248, 0.08)';

  return (
    <div
      className="card"
      style={{
        padding: '20px',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-30px',
          right: '-30px',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: glowColor,
          filter: 'blur(20px)',
          pointerEvents: 'none',
        }}
      />

      <p
        style={{
          fontSize: '0.72rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--text-muted)',
          marginBottom: '8px',
        }}
      >
        {label}
      </p>

      <p
        style={{
          fontSize: '1.35rem',
          fontWeight: 700,
          color,
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          marginBottom: deltaNode ? '8px' : '0',
        }}
      >
        {value}
      </p>

      {deltaNode && <div>{deltaNode}</div>}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────

export default async function DashboardPage({ searchParams }: Props) {
  const params = await searchParams;

  const selectedMonth = params.month ?? currentYearMonth();
  const prevMonth = getPreviousYearMonth(selectedMonth);
  const monthOptions = generateMonthOptions();

  // Derive a short label for the previous month (e.g. "May" or "Dec 2024")
  const [prevYear, prevMonthNum] = prevMonth.split('-').map(Number);
  const [selYear] = selectedMonth.split('-').map(Number);
  const prevLabel =
    prevYear === selYear
      ? new Date(prevYear, prevMonthNum - 1, 1).toLocaleDateString('en-MY', { month: 'short' })
      : new Date(prevYear, prevMonthNum - 1, 1).toLocaleDateString('en-MY', { month: 'short', year: 'numeric' });

  const [overview, prevOverview, budgetRows] = await Promise.all([
    getFinancialOverview(selectedMonth),
    getFinancialOverview(prevMonth),
    getBudgetSummaryRows(selectedMonth),
  ]);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>

        <MonthSelector options={monthOptions} selected={selectedMonth} />
      </div>

      <div className="overview-grid">
        <OverviewCard
          label="Total Income"
          value={formatRM(overview.total_income)}
          positive={true}
          deltaNode={
            <DeltaPill
              current={overview.total_income}
              prev={prevOverview.total_income}
              prevMonthLabel={prevLabel}
            />
          }
        />

        <OverviewCard
          label="Total Expense"
          value={formatRM(overview.total_expense)}
          positive={false}
          deltaNode={
            <DeltaPill
              current={overview.total_expense}
              prev={prevOverview.total_expense}
              invertPolarity={true}
              prevMonthLabel={prevLabel}
            />
          }
        />

        <OverviewCard
          label="Total Remaining"
          value={formatRM(overview.total_remaining)}
          positive={overview.total_remaining >= 0}
          deltaNode={
            <DeltaPill
              current={overview.total_remaining}
              prev={prevOverview.total_remaining}
              prevMonthLabel={prevLabel}
            />
          }
        />

        <OverviewCard
          label="Total Allocated Budget"
          value={formatRM(overview.total_allocated_budget)}
        />

        <OverviewCard
          label="Buffer"
          value={formatRM(overview.buffer)}
          positive={overview.buffer >= 0}
          deltaNode={
            <DeltaPill
              current={overview.buffer}
              prev={prevOverview.buffer}
              prevMonthLabel={prevLabel}
            />
          }
        />
      </div>

      {/* Spending chart — expense breakdown by category */}
      <div style={{ marginBottom: '24px' }}>
        <SpendingChart
          rows={budgetRows}
          totalExpense={overview.total_expense}
        />
      </div>

      <BudgetSummaryTable rows={budgetRows} />
    </>
  );
}
