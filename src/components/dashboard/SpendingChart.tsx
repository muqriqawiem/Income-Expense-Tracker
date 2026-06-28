// src/components/dashboard/SpendingChart.tsx
'use client';

import { formatRM } from '@/lib/utils/currency';
import type { BudgetSummaryRow } from '@/types';

interface Props {
  rows: BudgetSummaryRow[];
  totalExpense: number;
}

const DONUT_R = 80;
const DONUT_CX = 110;
const DONUT_CY = 110;
const STROKE_W = 28;
const GAP = 3; // degrees gap between segments

function polarToXY(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number
): string {
  const start = polarToXY(cx, cy, r, startDeg);
  const end = polarToXY(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export default function SpendingChart({ rows, totalExpense }: Props) {
  // Only show rows with actual spending
  const spentRows = rows
    .filter((r) => r.spent > 0)
    .sort((a, b) => b.spent - a.spent);

  const hasData = spentRows.length > 0 && totalExpense > 0;

  // Build donut segments
  let cursor = 0;
  const segments = spentRows.map((row) => {
    const pct = row.spent / totalExpense;
    const sweep = pct * 360;
    const gapAngle = spentRows.length > 1 ? GAP : 0;
    const start = cursor + gapAngle / 2;
    const end = cursor + sweep - gapAngle / 2;
    cursor += sweep;
    return { row, start, end, pct };
  });

  return (
    <div
      className="card"
      style={{
        padding: 0,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.02)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
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
          Spending by Category
        </h2>
      </div>

      {!hasData ? (
        <div className="empty-state">
          <p style={{ fontSize: '1.5rem' }}>◎</p>
          <p>No expense transactions for this month.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '24px',
            padding: '24px',
            alignItems: 'center',
          }}
        >
          {/* Donut */}
          <div style={{ flexShrink: 0 }}>
            <svg
              width={220}
              height={220}
              viewBox="0 0 220 220"
              style={{ display: 'block' }}
            >
              {/* Background ring */}
              <circle
                cx={DONUT_CX}
                cy={DONUT_CY}
                r={DONUT_R}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={STROKE_W}
              />

              {/* Segments */}
              {segments.map(({ row, start, end }) => (
                <path
                  key={row.category_id}
                  d={describeArc(DONUT_CX, DONUT_CY, DONUT_R, start, end)}
                  fill="none"
                  stroke={row.category_color}
                  strokeWidth={STROKE_W}
                  strokeLinecap="butt"
                  style={{
                    filter: `drop-shadow(0 0 6px ${row.category_color}88)`,
                    transition: 'opacity 0.2s',
                  }}
                />
              ))}

              {/* Centre label */}
              <text
                x={DONUT_CX}
                y={DONUT_CY - 10}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="var(--text-muted)"
                fontSize="11"
                fontWeight="600"
                fontFamily="Inter, system-ui, sans-serif"
                textDecoration="none"
              >
                SPENT
              </text>
              <text
                x={DONUT_CX}
                y={DONUT_CY + 14}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#f8fafc"
                fontSize="14"
                fontWeight="700"
                fontFamily='"JetBrains Mono", "Fira Code", monospace'
              >
                {formatRM(totalExpense)}
              </text>
            </svg>
          </div>

          {/* Legend + bars */}
          <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {spentRows.map((row) => {
              const pct = (row.spent / totalExpense) * 100;
              return (
                <div key={row.category_id}>
                  {/* Label row */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: row.category_color,
                      }}
                    >
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: row.category_color,
                          flexShrink: 0,
                          boxShadow: `0 0 6px ${row.category_color}88`,
                        }}
                      />
                      {row.category_name}
                    </span>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {formatRM(row.spent)}{' '}
                      <span style={{ opacity: 0.5, fontSize: '0.72rem' }}>
                        {pct.toFixed(1)}%
                      </span>
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${pct}%`,
                        background: row.category_color,
                        boxShadow: `0 0 8px ${row.category_color}55`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
