// src/components/dashboard/BudgetSummaryTable.tsx
import { formatRM } from '@/lib/utils/currency';
import type { BudgetSummaryRow } from '@/types';

interface Props {
  rows: BudgetSummaryRow[];
}

function usedColor(pct: number): string {
  if (pct >= 100) return 'var(--expense)';
  if (pct >= 80)  return 'var(--warning)';
  return 'var(--income)';
}

export default function BudgetSummaryTable({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <p style={{ fontSize: '1.5rem' }}>◎</p>
          <p>No budgets set for this month.</p>
          <p>
            <a href="/budgets" style={{ color: 'var(--accent)' }}>
              Set up budgets →
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
          Category Budget Summary
        </h2>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th className="text-right">Allocated</th>
              <th className="text-right">Spent</th>
              <th className="text-right">Remaining</th>
              <th>Used %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const pct = Math.min(row.used_percent, 100);
              const color = usedColor(row.used_percent);
              return (
                <tr key={row.category_id}>
                  <td style={{ fontWeight: 500 }}>{row.category_name}</td>
                  <td className="text-right font-mono">{formatRM(row.allocated_budget)}</td>
                  <td className="text-right font-mono" style={{ color: 'var(--expense)' }}>
                    {formatRM(row.spent)}
                  </td>
                  <td
                    className="text-right font-mono"
                    style={{ color: row.remaining < 0 ? 'var(--expense)' : 'var(--income)' }}
                  >
                    {formatRM(row.remaining)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="progress-bar" style={{ flex: 1 }}>
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${pct}%`, background: color }}
                        />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color, minWidth: '40px' }}>
                        {row.used_percent.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
