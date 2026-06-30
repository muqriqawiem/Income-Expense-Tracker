// src/components/dashboard/DashboardClient.tsx
'use client';

import { useState } from 'react';
import { formatRM } from '@/lib/utils/currency';
import { setMaskMoneyPreference } from '@/data/preferences';
import MonthSelector from '@/components/dashboard/MonthSelector';
import BudgetSummaryTable from '@/components/dashboard/BudgetSummaryTable';
import SpendingChart from '@/components/dashboard/SpendingChart';
import DrilldownPanel, { type DrilldownTarget } from '@/components/dashboard/DrilldownPanel';
import type { FinancialOverview, BudgetSummaryRow } from '@/types';

interface Props {
  overview: FinancialOverview;
  prevOverview: FinancialOverview;
  budgetRows: BudgetSummaryRow[];
  selectedMonth: string;
  prevMonth: string;
  monthOptions: string[];
  initialMaskMoney: boolean;
}

// ── helpers ────────────────────────────────────────────────────

function pctChange(current: number, prev: number): number | null {
  if (prev === 0) return null;
  return ((current - prev) / Math.abs(prev)) * 100;
}

const MASK_PLACEHOLDER = 'RM ••••';

function displayRM(value: number, masked: boolean): string {
  return masked ? MASK_PLACEHOLDER : formatRM(value);
}

// ── Eye / EyeOff icons (professional outline style, stroke-based) ──

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 11 7 11 7a13.16 13.16 0 0 1-3.17 4.34M6.61 6.61C3.35 8.36 1 12 1 12s4 7 11 7a10.4 10.4 0 0 0 5.05-1.25" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// ── MaskToggleButton ───────────────────────────────────────────

function MaskToggleButton({ masked, onClick }: { masked: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={masked ? 'Show amounts' : 'Hide amounts'}
      aria-label={masked ? 'Show amounts' : 'Hide amounts'}
      aria-pressed={masked}
      style={{
        width: '38px',
        height: '38px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: masked ? 'var(--accent)' : 'var(--text-muted)',
        background: masked ? 'var(--accent-soft)' : 'rgba(255,255,255,0.04)',
        border: masked ? '1px solid rgba(56,189,248,0.30)' : '1px solid var(--border)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        cursor: 'pointer',
        transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        if (!masked) {
          el.style.background = 'rgba(255,255,255,0.08)';
          el.style.color = 'var(--text)';
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        if (!masked) {
          el.style.background = 'rgba(255,255,255,0.04)';
          el.style.color = 'var(--text-muted)';
        }
      }}
    >
      {masked ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  );
}

// ── DeltaPill ──────────────────────────────────────────────────

function DeltaPill({
  current, prev, invertPolarity = false, prevMonthLabel, masked,
}: {
  current: number; prev: number; invertPolarity?: boolean; prevMonthLabel: string; masked: boolean;
}) {
  if (masked) {
    return <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•• vs {prevMonthLabel}</span>;
  }

  const pct = pctChange(current, prev);

  if (pct === null) {
    return <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>— no {prevMonthLabel} data</span>;
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

function OverviewCard({
  label, value, positive, deltaNode, onClick,
}: {
  label: string; value: string; positive?: boolean | null;
  deltaNode?: React.ReactNode; onClick?: () => void;
}) {
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
        padding: '20px', position: 'relative',
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

// ── DashboardClient ────────────────────────────────────────────

export default function DashboardClient({
  overview, prevOverview, budgetRows, selectedMonth, prevMonth, monthOptions, initialMaskMoney,
}: Props) {
  const [drilldown, setDrilldown] = useState<DrilldownTarget | null>(null);
  const [masked, setMasked] = useState(initialMaskMoney);

  async function toggleMask() {
    const next = !masked;
    setMasked(next); // optimistic update — instant UI feedback
    try {
      await setMaskMoneyPreference(next);
    } catch {
      // Revert on failure so UI state matches what's actually persisted
      setMasked(!next);
    }
  }

  const [prevYear, prevMonthNum] = prevMonth.split('-').map(Number);
  const [selYear] = selectedMonth.split('-').map(Number);
  const prevLabel =
    prevYear === selYear
      ? new Date(prevYear, prevMonthNum - 1, 1).toLocaleDateString('en-MY', { month: 'short' })
      : new Date(prevYear, prevMonthNum - 1, 1).toLocaleDateString('en-MY', { month: 'short', year: 'numeric' });

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MaskToggleButton masked={masked} onClick={toggleMask} />
          <MonthSelector options={monthOptions} selected={selectedMonth} />
        </div>
      </div>

      <div className="overview-grid">
        <OverviewCard
          label="Total Income"
          value={displayRM(overview.total_income, masked)}
          positive={true}
          onClick={() => setDrilldown({ kind: 'income', year_month: selectedMonth })}
          deltaNode={<DeltaPill current={overview.total_income} prev={prevOverview.total_income} prevMonthLabel={prevLabel} masked={masked} />}
        />
        <OverviewCard
          label="Total Expense"
          value={displayRM(overview.total_expense, masked)}
          positive={false}
          onClick={() => setDrilldown({ kind: 'expense', year_month: selectedMonth })}
          deltaNode={<DeltaPill current={overview.total_expense} prev={prevOverview.total_expense} invertPolarity prevMonthLabel={prevLabel} masked={masked} />}
        />
        <OverviewCard
          label="Total Remaining"
          value={displayRM(overview.total_remaining, masked)}
          positive={overview.total_remaining >= 0}
          onClick={() => setDrilldown({ kind: 'remaining', year_month: selectedMonth })}
          deltaNode={<DeltaPill current={overview.total_remaining} prev={prevOverview.total_remaining} prevMonthLabel={prevLabel} masked={masked} />}
        />
        <OverviewCard
          label="Total Allocated Budget"
          value={displayRM(overview.total_allocated_budget, masked)}
        />
        <OverviewCard
          label="Buffer"
          value={displayRM(overview.buffer, masked)}
          positive={overview.buffer >= 0}
          onClick={() => setDrilldown({ kind: 'buffer', year_month: selectedMonth, allocated: overview.total_allocated_budget })}
          deltaNode={<DeltaPill current={overview.buffer} prev={prevOverview.buffer} prevMonthLabel={prevLabel} masked={masked} />}
        />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <SpendingChart rows={budgetRows} totalExpense={overview.total_expense} masked={masked} />
      </div>

      <BudgetSummaryTable
        rows={budgetRows}
        year_month={selectedMonth}
        masked={masked}
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

      {/* Drilldown panel intentionally NOT given `masked` — masking is dashboard-only */}
      <DrilldownPanel
        target={drilldown}
        overview={overview}
        onClose={() => setDrilldown(null)}
      />
    </>
  );
}
