// src/components/dashboard/DrilldownPanel.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getMonthlyTrend,
  getCategoryBreakdown,
  getCategoryTransactions,
  getCategoryWeeklyBreakdown,
  type MonthlyTrend,
  type CategoryBreakdown,
  type WeeklyBreakdown,
} from '@/data/drilldown';
import { formatRM } from '@/lib/utils/currency';
import type { FinancialOverview, Transaction } from '@/types';

// ── Types ──────────────────────────────────────────────────────

export type DrilldownTarget =
  | { kind: 'income'; year_month: string }
  | { kind: 'expense'; year_month: string }
  | { kind: 'remaining'; year_month: string }
  | { kind: 'buffer'; year_month: string; allocated: number }
  | { kind: 'budget-category'; year_month: string; category_id: string; category_name: string; category_color: string; allocated: number; spent: number }
  | { kind: 'expense-category'; year_month: string; category_id: string; category_name: string; category_color: string; amount: number };

interface Props {
  target: DrilldownTarget | null;
  overview: FinancialOverview;
  onClose: () => void;
}

// ── Helpers ────────────────────────────────────────────────────

function shortMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  const now = new Date();
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString('en-MY', { month: 'short' });
  }
  return d.toLocaleDateString('en-MY', { month: 'short', year: '2-digit' });
}

// ── Mini bar chart ─────────────────────────────────────────────

function MiniBar({ label, value, max, color, sublabel }: {
  label: string; value: number; max: number; color: string; sublabel?: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '0.82rem', fontFamily: '"JetBrains Mono","Fira Code",monospace', color: 'var(--text)', fontWeight: 600 }}>
          {formatRM(value)}
          {sublabel && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '4px' }}>{sublabel}</span>}
        </span>
      </div>
      <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '99px', boxShadow: `0 0 6px ${color}88`, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

// ── Trend spark line (SVG) ─────────────────────────────────────

function TrendChart({ data, field, color }: {
  data: MonthlyTrend[];
  field: 'income' | 'expense' | 'net';
  color: string;
}) {
  if (data.length === 0) return null;
  const values = data.map((d) => d[field]);
  const max = Math.max(...values.map(Math.abs), 1);
  const W = 260;
  const H = 56;
  const pad = 4;
  const step = (W - pad * 2) / Math.max(data.length - 1, 1);

  const points = values.map((v, i) => {
    const x = pad + i * step;
    const y = H - pad - ((v / max) * (H - pad * 2));
    return { x, y, v };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div style={{ margin: '16px 0' }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
        {/* Zero line (for net which can be negative) */}
        {field === 'net' && (
          <line
            x1={pad} y1={H - pad} x2={W - pad} y2={H - pad}
            stroke="rgba(255,255,255,0.08)" strokeWidth="1"
          />
        )}
        {/* Area fill */}
        <polyline
          points={`${points[0].x},${H - pad} ${polyline} ${points[points.length - 1].x},${H - pad}`}
          fill={`${color}18`}
          stroke="none"
        />
        {/* Line */}
        <polyline points={polyline} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        {/* Dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} stroke="rgba(15,23,42,0.9)" strokeWidth="1.5" />
        ))}
      </svg>
      {/* Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
        {data.map((d, i) => (
          <span key={i} style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', flex: 1 }}>
            {shortMonth(d.year_month)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Transaction list ───────────────────────────────────────────

function TxnList({ txns }: { txns: Transaction[] }) {
  if (txns.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        No transactions found.
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {txns.map((t) => (
        <div key={t.id} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 14px', borderRadius: '10px',
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 500 }}>
              {t.description || '—'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {t.transaction_date}
            </div>
          </div>
          <div style={{
            fontSize: '0.85rem', fontFamily: '"JetBrains Mono","Fira Code",monospace',
            fontWeight: 700, color: t.type === 'Income' ? 'var(--income)' : 'var(--expense)',
          }}>
            {formatRM(Number(t.amount))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Section heading ────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '10px', marginTop: '20px',
    }}>
      {children}
    </div>
  );
}

// ── Divider ────────────────────────────────────────────────────

function Divider() {
  return <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '16px 0' }} />;
}

// ── Panel content views ────────────────────────────────────────

function IncomeView({ target, onDrillCategory }: {
  target: Extract<DrilldownTarget, { kind: 'income' }>;
  onDrillCategory: (cat: CategoryBreakdown) => void;
}) {
  const [cats, setCats] = useState<CategoryBreakdown[]>([]);
  const [trend, setTrend] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getCategoryBreakdown(target.year_month, 'Income'),
      getMonthlyTrend(target.year_month, 6),
    ]).then(([c, t]) => { setCats(c); setTrend(t); setLoading(false); });
  }, [target.year_month]);

  if (loading) return <Spinner />;

  const total = cats.reduce((s, c) => s + c.amount, 0);

  return (
    <>
      <SectionHeading>Income by Category</SectionHeading>
      {cats.length === 0
        ? <EmptyNote>No income recorded this month.</EmptyNote>
        : cats.map((c) => (
            <MiniBar
              key={c.category_id ?? 'none'}
              label={c.category_name}
              value={c.amount}
              max={total}
              color={c.category_color}
              sublabel={`${((c.amount / total) * 100).toFixed(1)}%`}
            />
          ))
      }
      <Divider />
      <SectionHeading>6-Month Income Trend</SectionHeading>
      <TrendChart data={trend} field="income" color="var(--income)" />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
        {trend.map((t, i) => (
          <div key={i} style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{shortMonth(t.year_month)}</div>
            <div style={{ fontSize: '0.7rem', fontFamily: '"JetBrains Mono","Fira Code",monospace', color: 'var(--income)', fontWeight: 600 }}>
              {t.income > 0 ? formatRM(t.income).replace('RM', '') : '—'}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function ExpenseView({ target, onDrillCategory }: {
  target: Extract<DrilldownTarget, { kind: 'expense' }>;
  onDrillCategory: (cat: CategoryBreakdown) => void;
}) {
  const [cats, setCats] = useState<CategoryBreakdown[]>([]);
  const [trend, setTrend] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getCategoryBreakdown(target.year_month, 'Expense'),
      getMonthlyTrend(target.year_month, 6),
    ]).then(([c, t]) => { setCats(c); setTrend(t); setLoading(false); });
  }, [target.year_month]);

  if (loading) return <Spinner />;

  const total = cats.reduce((s, c) => s + c.amount, 0);

  return (
    <>
      <SectionHeading>Expense by Category — click to inspect</SectionHeading>
      {cats.length === 0
        ? <EmptyNote>No expenses recorded this month.</EmptyNote>
        : cats.map((c) => (
            <div
              key={c.category_id ?? 'none'}
              onClick={() => c.category_id && onDrillCategory(c)}
              style={{ cursor: c.category_id ? 'pointer' : 'default' }}
            >
              <MiniBar
                label={c.category_name}
                value={c.amount}
                max={total}
                color={c.category_color}
                sublabel={`${((c.amount / total) * 100).toFixed(1)}%`}
              />
            </div>
          ))
      }
      <Divider />
      <SectionHeading>6-Month Expense Trend</SectionHeading>
      <TrendChart data={trend} field="expense" color="var(--expense)" />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
        {trend.map((t, i) => (
          <div key={i} style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{shortMonth(t.year_month)}</div>
            <div style={{ fontSize: '0.7rem', fontFamily: '"JetBrains Mono","Fira Code",monospace', color: 'var(--expense)', fontWeight: 600 }}>
              {t.expense > 0 ? formatRM(t.expense).replace('RM', '') : '—'}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function RemainingView({ target, overview }: {
  target: Extract<DrilldownTarget, { kind: 'remaining' }>;
  overview: FinancialOverview;
}) {
  const [trend, setTrend] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMonthlyTrend(target.year_month, 6).then((t) => { setTrend(t); setLoading(false); });
  }, [target.year_month]);

  const { total_income, total_expense, total_remaining } = overview;

  return (
    <>
      <SectionHeading>This Month's Breakdown</SectionHeading>
      <ReconcileRow label="Total Income" value={total_income} color="var(--income)" />
      <ReconcileRow label="Total Expense" value={total_expense} color="var(--expense)" negative />
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '10px 0' }} />
      <ReconcileRow
        label="Net Remaining"
        value={total_remaining}
        color={total_remaining >= 0 ? 'var(--income)' : 'var(--expense)'}
        bold
      />

      {!loading && (
        <>
          <Divider />
          <SectionHeading>6-Month Net Savings Trend</SectionHeading>
          <TrendChart data={trend} field="net" color="var(--accent)" />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
            {trend.map((t, i) => (
              <div key={i} style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{shortMonth(t.year_month)}</div>
                <div style={{ fontSize: '0.7rem', fontFamily: '"JetBrains Mono","Fira Code",monospace', color: t.net >= 0 ? 'var(--income)' : 'var(--expense)', fontWeight: 600 }}>
                  {formatRM(Math.abs(t.net)).replace('RM', '')}{t.net < 0 ? ' ▼' : ''}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function BufferView({ target, overview }: {
  target: Extract<DrilldownTarget, { kind: 'buffer' }>;
  overview: FinancialOverview;
}) {
  const { total_income, total_allocated_budget, buffer } = overview;
  const pctAllocated = total_income > 0 ? (total_allocated_budget / total_income) * 100 : 0;
  const pctBuffer = total_income > 0 ? (buffer / total_income) * 100 : 0;

  return (
    <>
      <SectionHeading>Buffer Calculation</SectionHeading>
      <ReconcileRow label="Total Income" value={total_income} color="var(--income)" />
      <ReconcileRow label="Total Allocated Budget" value={total_allocated_budget} color="var(--warning)" negative />
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '10px 0' }} />
      <ReconcileRow
        label="Buffer"
        value={buffer}
        color={buffer >= 0 ? 'var(--income)' : 'var(--expense)'}
        bold
      />

      <Divider />
      <SectionHeading>Income Allocation</SectionHeading>
      <MiniBar label="Budgeted" value={total_allocated_budget} max={total_income} color="var(--warning)" sublabel={`${pctAllocated.toFixed(1)}%`} />
      <MiniBar label="Unallocated (Buffer)" value={Math.max(buffer, 0)} max={total_income} color="var(--accent)" sublabel={`${Math.max(pctBuffer, 0).toFixed(1)}%`} />

      {buffer < 0 && (
        <div style={{
          marginTop: '12px', padding: '10px 14px', borderRadius: '10px',
          background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.20)',
          fontSize: '0.8rem', color: 'var(--expense)',
        }}>
          ⚠ You've allocated {formatRM(Math.abs(buffer))} more than your income. Reduce budgets to regain a positive buffer.
        </div>
      )}
    </>
  );
}

function ExpenseCategoryView({ target }: {
  target: Extract<DrilldownTarget, { kind: 'expense-category' }>;
}) {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [weekly, setWeekly] = useState<WeeklyBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!target.category_id) return;
    setLoading(true);
    Promise.all([
      getCategoryTransactions(target.year_month, target.category_id),
      getCategoryWeeklyBreakdown(target.year_month, target.category_id),
    ]).then(([t, w]) => { setTxns(t); setWeekly(w); setLoading(false); });
  }, [target.year_month, target.category_id]);

  if (loading) return <Spinner />;

  const maxWeek = Math.max(...weekly.map((w) => w.amount), 1);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <span style={{
          width: '10px', height: '10px', borderRadius: '50%',
          backgroundColor: target.category_color, display: 'inline-block',
          boxShadow: `0 0 10px ${target.category_color}`,
        }} />
        <span style={{ fontSize: '1rem', fontWeight: 700, color: target.category_color }}>
          {formatRM(target.amount)}
        </span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>total spent</span>
      </div>

      <SectionHeading>Weekly Breakdown</SectionHeading>
      {weekly.filter((w) => w.amount > 0).length === 0
        ? <EmptyNote>No weekly data.</EmptyNote>
        : weekly.map((w) => (
            <MiniBar
              key={w.week}
              label={w.week}
              value={w.amount}
              max={maxWeek}
              color={target.category_color}
            />
          ))
      }

      <Divider />
      <SectionHeading>Transactions ({txns.length})</SectionHeading>
      <TxnList txns={txns} />
    </>
  );
}

function BudgetCategoryView({ target }: {
  target: Extract<DrilldownTarget, { kind: 'budget-category' }>;
}) {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [weekly, setWeekly] = useState<WeeklyBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getCategoryTransactions(target.year_month, target.category_id),
      getCategoryWeeklyBreakdown(target.year_month, target.category_id),
    ]).then(([t, w]) => { setTxns(t); setWeekly(w); setLoading(false); });
  }, [target.year_month, target.category_id]);

  if (loading) return <Spinner />;

  const { allocated, spent, category_color } = target;
  const remaining = allocated - spent;
  const pct = allocated > 0 ? (spent / allocated) * 100 : 0;
  const maxWeek = Math.max(...weekly.map((w) => w.amount), 1);

  const barColor = pct >= 100 ? 'var(--expense)' : pct >= 80 ? 'var(--warning)' : 'var(--income)';

  return (
    <>
      {/* Budget progress summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
        {[
          { label: 'Budget', value: allocated, color: 'var(--accent)' },
          { label: 'Spent', value: spent, color: 'var(--expense)' },
          { label: 'Remaining', value: remaining, color: remaining >= 0 ? 'var(--income)' : 'var(--expense)' },
        ].map((item) => (
          <div key={item.label} style={{
            padding: '12px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{item.label}</div>
            <div style={{ fontSize: '0.88rem', fontFamily: '"JetBrains Mono","Fira Code",monospace', fontWeight: 700, color: item.color }}>
              {formatRM(item.value)}
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Budget used</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: barColor }}>{pct.toFixed(1)}%</span>
      </div>
      <div style={{ height: '7px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden', marginBottom: '16px' }}>
        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: barColor, borderRadius: '99px', boxShadow: `0 0 8px ${barColor}66`, transition: 'width 0.5s ease' }} />
      </div>

      <SectionHeading>Weekly Spending</SectionHeading>
      {weekly.filter((w) => w.amount > 0).length === 0
        ? <EmptyNote>No spending this month.</EmptyNote>
        : weekly.map((w) => (
            <MiniBar key={w.week} label={w.week} value={w.amount} max={maxWeek} color={category_color} />
          ))
      }

      <Divider />
      <SectionHeading>Transactions ({txns.length})</SectionHeading>
      <TxnList txns={txns} />
    </>
  );
}

// ── Small reusable bits ────────────────────────────────────────

function Spinner() {
  return (
    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
      Loading…
    </div>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '12px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>{children}</div>
  );
}

function ReconcileRow({ label, value, color, negative, bold }: {
  label: string; value: number; color: string; negative?: boolean; bold?: boolean;
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 0',
      fontWeight: bold ? 700 : 400,
    }}>
      <span style={{ fontSize: '0.85rem', color: bold ? 'var(--text)' : 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: '0.88rem', fontFamily: '"JetBrains Mono","Fira Code",monospace', color, fontWeight: bold ? 700 : 600 }}>
        {negative ? '−' : ''}{formatRM(value)}
      </span>
    </div>
  );
}

// ── Title map ──────────────────────────────────────────────────

function panelTitle(target: DrilldownTarget): string {
  switch (target.kind) {
    case 'income': return 'Income Breakdown';
    case 'expense': return 'Expense Breakdown';
    case 'remaining': return 'Net Remaining';
    case 'buffer': return 'Budget Buffer';
    case 'expense-category': return target.category_name;
    case 'budget-category': return target.category_name;
  }
}

// ── Main DrilldownPanel ────────────────────────────────────────

export default function DrilldownPanel({ target, overview, onClose }: Props) {
  // Stack for back navigation
  const [stack, setStack] = useState<DrilldownTarget[]>([]);
  const current: DrilldownTarget | null = stack.length > 0 ? stack[stack.length - 1] : target;

  // Reset stack when target changes
  useEffect(() => {
    setStack([]);
  }, [target]);

  const push = useCallback((next: DrilldownTarget) => {
    setStack((s) => [...s, next]);
  }, []);

  const pop = useCallback(() => {
    setStack((s) => s.slice(0, -1));
  }, []);

  const handleDrillExpenseCategory = useCallback((cat: CategoryBreakdown) => {
    if (!target || target.kind !== 'expense') return;
    push({
      kind: 'expense-category',
      year_month: target.year_month,
      category_id: cat.category_id!,
      category_name: cat.category_name,
      category_color: cat.category_color,
      amount: cat.amount,
    });
  }, [target, push]);

  // Keyboard close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (stack.length > 0) pop();
        else onClose();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, pop, stack.length]);

  const isOpen = !!target;
  const canGoBack = stack.length > 0;

  const breadcrumbs: string[] = [];
  if (target) breadcrumbs.push(panelTitle(target));
  stack.forEach((s) => breadcrumbs.push(panelTitle(s)));

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(2,6,23,0.55)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 200,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.22s ease',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0,
          width: 'min(420px, 100vw)',
          height: '100vh',
          background: 'rgba(15,23,42,0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderLeft: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.35)',
          zIndex: 201,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '18px 20px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
          position: 'sticky', top: 0,
          background: 'rgba(15,23,42,0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          zIndex: 1,
        }}>
          {/* Breadcrumbs */}
          {breadcrumbs.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
              {breadcrumbs.map((b, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '0.72rem', color: i === breadcrumbs.length - 1 ? 'var(--text)' : 'var(--text-muted)', fontWeight: i === breadcrumbs.length - 1 ? 600 : 400 }}>
                    {b}
                  </span>
                  {i < breadcrumbs.length - 1 && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>›</span>
                  )}
                </span>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {canGoBack && (
                <button
                  onClick={pop}
                  style={{
                    width: '28px', height: '28px', borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
                    color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem', flexShrink: 0,
                  }}
                >
                  ‹
                </button>
              )}
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                {current ? panelTitle(current) : ''}
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{
                width: '28px', height: '28px', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', flex: 1 }}>
          {current && (() => {
            switch (current.kind) {
              case 'income':
                return <IncomeView target={current} onDrillCategory={() => {}} />;
              case 'expense':
                return <ExpenseView target={current} onDrillCategory={handleDrillExpenseCategory} />;
              case 'remaining':
                return <RemainingView target={current} overview={overview} />;
              case 'buffer':
                return <BufferView target={current} overview={overview} />;
              case 'expense-category':
                return <ExpenseCategoryView target={current} />;
              case 'budget-category':
                return <BudgetCategoryView target={current} />;
            }
          })()}
        </div>
      </div>
    </>
  );
}
