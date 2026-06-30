// src/app/(app)/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getFinancialOverview, getBudgetSummaryRows } from '@/data/summary';
import { generateMonthOptions, currentYearMonth } from '@/lib/utils/date';
import { formatRM } from '@/lib/utils/currency';

import MonthSelector from '@/components/dashboard/MonthSelector';
import BudgetSummaryTable from '@/components/dashboard/BudgetSummaryTable';
import SpendingChart from '@/components/dashboard/SpendingChart';
import DrilldownPanel, { type DrilldownTarget } from '@/components/dashboard/DrilldownPanel';
import type { FinancialOverview, BudgetSummaryRow } from '@/types';

// ── helpers ────────────────────────────────────────────────────

function getPreviousYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const prev = new Date(year, month - 2, 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
}

function pctChange(current: number, prev: number): number | null {
  if (prev === 0) return null;
  return ((current - prev) / Math.abs(prev)) * 100;
}

// ── DeltaPill ──────────────────────────────────────────────────

interface DeltaPillProps {
  current: number;
  prev: number;
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
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '3px',
        fontSize: '0.72rem', fontWeight: 600,
        background: 'rgba(148, 163, 184, 0.15)', color: 'var(--text-muted)',
        padding: '2px 8px', borderRadius: '999px',
      }}>
        → same as {prevMonthLabel}
      </span>
    );
  }

  const color = isGood ? 'var(--income)' : 'var(--expense)';
  const bgColor = isGood ? 'rgba(34, 197, 94, 0.12)' : 'rgba(244, 63, 94, 0.12)';
  const arrow = isUp ? '▲' : '▼';

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      fontSize: '0.72rem', fontWeight: 600,
      background: bgColor, color,
      padding: '2px 8px', borderRadius: '999px', whiteSpace: 'nowrap',
    }}>
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
  onClick?: () => void;
}

function OverviewCard({ label, value, positive, deltaNode, onClick }: OverviewCardProps) {
  const color =
    positive === true ? 'var(--income)' :
    positive === false ? 'var(--expense)' :
    'var(--text)';

  const glowColor =
    positive === true ? 'rgba(34, 197, 94, 0.12)' :
    positive === false ? 'rgba(244, 63, 94, 0.12)' :
    'rgba(56, 189, 248, 0.08)';

  const clickable = !!onClick;

  return (
    <div
      className="card"
      onClick={onClick}
      style={{
        padding: '20px',
        position: 'relative',
        cursor: clickable ? 'pointer' : 'default',
        transition: 'border-color 0.18s ease, box-shadow 0.18s ease, transform 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (!clickable) return;
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = 'rgba(56,189,248,0.35)';
        el.style.transform = 'translateY(-2px)';
        el.style.boxShadow = '0 12px 36px rgba(0,0,0,0.30), 0 0 0 1px rgba(56,189,248,0.15)';
      }}
      onMouseLeave={(e) => {
        if (!clickable) return;
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = '';
        el.style.transform = '';
        el.style.boxShadow = '';
      }}
    >
      <div style={{
        position: 'absolute', top: '-30px', right: '-30px',
        width: '80px', height: '80px', borderRadius: '50%',
        background: glowColor, filter: 'blur(20px)', pointerEvents: 'none',
      }} />

      <p style={{
        fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '8px',
        display: 'flex', alignItems: 'center', gap: '6px',
      }}>
        {label}
        {clickable && (
          <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', opacity: 0.7 }}>tap to explore ↗</span>
        )}
      </p>

      <p style={{
        fontSize: '1.35rem', fontWeight: 700, color,
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        marginBottom: deltaNode ? '8px' : '0',
      }}>
        {value}
      </p>

      {deltaNode && <div>{deltaNode}</div>}
    </div>
  );
}

// ── Page (client-side data loading) ───────────────────────────

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const selectedMonth = searchParams.get('month') ?? currentYearMonth();
  const monthOptions = generateMonthOptions();

  const [overview, setOverview] = useState<FinancialOverview | null>(null);
  const [prevOverview, setPrevOverview] = useState<FinancialOverview | null>(null);
  const [budgetRows, setBudgetRows] = useState<BudgetSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [drilldown, setDrilldown] = useState<DrilldownTarget | null>(null);

  const prevMonth = getPreviousYearMonth(selectedMonth);
  const [prevYear, prevMonthNum] = prevMonth.split('-').map(Number);
  const [selYear] = selectedMonth.split('-').map(Number);
  const prevLabel =
    prevYear === selYear
      ? new Date(prevYear, prevMonthNum - 1, 1).toLocaleDateString('en-MY', { month: 'short' })
      : new Date(prevYear, prevMonthNum - 1, 1).toLocaleDateString('en-MY', { month: 'short', year: 'numeric' });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getFinancialOverview(selectedMonth),
      getFinancialOverview(prevMonth),
      getBudgetSummaryRows(selectedMonth),
    ]).then(([ov, pOv, rows]) => {
      setOverview(ov);
      setPrevOverview(pOv);
      setBudgetRows(rows);
      setLoading(false);
    });
  }, [selectedMonth, prevMonth]);

  const ov = overview;
  const pOv = prevOverview;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <MonthSelector options={monthOptions} selected={selectedMonth} />
      </div>

      {loading || !ov || !pOv ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '20px 0' }}>Loading…</div>
      ) : (
        <>
          <div className="overview-grid">
            <OverviewCard
              label="Total Income"
              value={formatRM(ov.total_income)}
              positive={true}
              onClick={() => setDrilldown({ kind: 'income', year_month: selectedMonth })}
              deltaNode={
                <DeltaPill current={ov.total_income} prev={pOv.total_income} prevMonthLabel={prevLabel} />
              }
            />
            <OverviewCard
              label="Total Expense"
              value={formatRM(ov.total_expense)}
              positive={false}
              onClick={() => setDrilldown({ kind: 'expense', year_month: selectedMonth })}
              deltaNode={
                <DeltaPill current={ov.total_expense} prev={pOv.total_expense} invertPolarity={true} prevMonthLabel={prevLabel} />
              }
            />
            <OverviewCard
              label="Total Remaining"
              value={formatRM(ov.total_remaining)}
              positive={ov.total_remaining >= 0}
              onClick={() => setDrilldown({ kind: 'remaining', year_month: selectedMonth })}
              deltaNode={
                <DeltaPill current={ov.total_remaining} prev={pOv.total_remaining} prevMonthLabel={prevLabel} />
              }
            />
            <OverviewCard
              label="Total Allocated Budget"
              value={formatRM(ov.total_allocated_budget)}
            />
            <OverviewCard
              label="Buffer"
              value={formatRM(ov.buffer)}
              positive={ov.buffer >= 0}
              onClick={() => setDrilldown({ kind: 'buffer', year_month: selectedMonth, allocated: ov.total_allocated_budget })}
              deltaNode={
                <DeltaPill current={ov.buffer} prev={pOv.buffer} prevMonthLabel={prevLabel} />
              }
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <SpendingChart rows={budgetRows} totalExpense={ov.total_expense} />
          </div>

          <BudgetSummaryTable
            rows={budgetRows}
            year_month={selectedMonth}
            onDrilldown={(row) => setDrilldown({
              kind: 'budget-category',
              year_month: selectedMonth,
              category_id: row.category_id,
              category_name: row.category_name,
              category_color: row.category_color,
              allocated: row.allocated_budget,
              spent: row.spent,
            })}
          />

          <DrilldownPanel
            target={drilldown}
            overview={ov}
            onClose={() => setDrilldown(null)}
          />
        </>
      )}
    </>
  );
}
