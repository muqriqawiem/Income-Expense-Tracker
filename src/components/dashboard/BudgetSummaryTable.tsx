// src/components/dashboard/BudgetSummaryTable.tsx
'use client';

import { useState } from 'react';
import { formatRM } from '@/lib/utils/currency';
import type { BudgetSummaryRow } from '@/types';

interface Props {
  rows: BudgetSummaryRow[];
}

function usedColor(pct: number): string {
  if (pct >= 100) return 'var(--expense)';
  if (pct >= 80) return 'var(--warning)';
  return 'var(--income)';
}

export default function BudgetSummaryTable({ rows }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Collapsible header */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: open ? '1px solid rgba(255,255,255,0.08)' : 'none',
          background: 'rgba(255,255,255,0.02)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          cursor: 'pointer',
          border: 'none',
          fontFamily: 'inherit',
        }}
      >
        <h2
          style={{
            fontSize: '0.9rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-muted)',
          }}
        >
          Category Budget Summary
        </h2>
        <span
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
            transition: 'transform 0.2s ease',
            display: 'inline-block',
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
          }}
        >
          ▾
        </span>
      </button>

      {/* Collapsible body */}
      {open && (
        <>
          {rows.length === 0 ? (
            <div className="empty-state">
              <p style={{ fontSize: '1.5rem' }}>◎</p>
              <p>No budgets set for this month.</p>
              <p>
                <a href="/budgets" style={{ color: 'var(--accent)' }}>
                  Set up budgets →
                </a>
              </p>
            </div>
          ) : (
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
                    const categoryColor = row.category_color || '#6b7280';

                    return (
                      <tr key={row.category_id}>
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 10px',
                              borderRadius: '999px',
                              backgroundColor: `${categoryColor}18`,
                              border: `1px solid ${categoryColor}25`,
                              backdropFilter: 'blur(8px)',
                              WebkitBackdropFilter: 'blur(8px)',
                              color: categoryColor,
                              fontSize: '0.8rem',
                              fontWeight: 600,
                            }}
                          >
                            <span
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: categoryColor,
                                display: 'inline-block',
                              }}
                            />
                            {row.category_name}
                          </span>
                        </td>
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
                                style={{
                                  width: `${pct}%`,
                                  background: color,
                                  boxShadow: `0 0 8px ${color}55`,
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                color,
                                minWidth: '40px',
                              }}
                            >
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
          )}
        </>
      )}
    </div>
  );
}
