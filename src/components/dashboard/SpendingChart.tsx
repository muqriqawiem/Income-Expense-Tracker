// src/components/dashboard/SpendingChart.tsx
'use client';

import { useState } from 'react';
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
const GAP = 3;

function polarToXY(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const start = polarToXY(cx, cy, r, startDeg);
  const end = polarToXY(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export default function SpendingChart({ rows, totalExpense }: Props) {
  const [open, setOpen] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const spentRows = rows.filter((r) => r.spent > 0).sort((a, b) => b.spent - a.spent);
  const hasData = spentRows.length > 0 && totalExpense > 0;

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

  const hovered = hoveredId ? spentRows.find((r) => r.category_id === hoveredId) : null;

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
          Spending by Category
        </h2>
        <span
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
            transition: 'transform 0.2s ease',
            display: 'inline-block',
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          ›
        </span>
      </button>

      {/* Collapsible body */}
      {open && (
        <>
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
              <div style={{ flexShrink: 0, position: 'relative' }}>
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
                  {segments.map(({ row, start, end }) => {
                    const isHovered = hoveredId === row.category_id;
                    const isOtherHovered = hoveredId !== null && !isHovered;
                    return (
                      <path
                        key={row.category_id}
                        d={describeArc(DONUT_CX, DONUT_CY, DONUT_R, start, end)}
                        fill="none"
                        stroke={row.category_color}
                        strokeWidth={isHovered ? STROKE_W + 8 : STROKE_W}
                        strokeLinecap="butt"
                        style={{
                          filter: isHovered
                            ? `drop-shadow(0 0 12px ${row.category_color}cc)`
                            : `drop-shadow(0 0 6px ${row.category_color}88)`,
                          opacity: isOtherHovered ? 0.3 : 1,
                          transition: 'opacity 0.18s ease, stroke-width 0.18s ease, filter 0.18s ease',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={() => setHoveredId(row.category_id)}
                        onMouseLeave={() => setHoveredId(null)}
                      />
                    );
                  })}

                  {/* Centre label — changes on hover */}
                  {hovered ? (
                    <>
                      <text
                        x={DONUT_CX}
                        y={DONUT_CY - 20}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={hovered.category_color}
                        fontSize="10"
                        fontWeight="700"
                        fontFamily="Inter, system-ui, sans-serif"
                      >
                        {hovered.category_name.toUpperCase()}
                      </text>
                      <text
                        x={DONUT_CX}
                        y={DONUT_CY + 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#f8fafc"
                        fontSize="13"
                        fontWeight="700"
                        fontFamily='"JetBrains Mono", "Fira Code", monospace'
                      >
                        {formatRM(hovered.spent)}
                      </text>
                      <text
                        x={DONUT_CX}
                        y={DONUT_CY + 20}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="var(--text-muted)"
                        fontSize="10"
                        fontFamily="Inter, system-ui, sans-serif"
                      >
                        {((hovered.spent / totalExpense) * 100).toFixed(1)}% of total
                      </text>
                    </>
                  ) : (
                    <>
                      <text
                        x={DONUT_CX}
                        y={DONUT_CY - 10}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="var(--text-muted)"
                        fontSize="11"
                        fontWeight="600"
                        fontFamily="Inter, system-ui, sans-serif"
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
                    </>
                  )}
                </svg>
              </div>

              {/* Legend + bars */}
              <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {spentRows.map((row) => {
                  const pct = (row.spent / totalExpense) * 100;
                  const isHovered = hoveredId === row.category_id;
                  const isOtherHovered = hoveredId !== null && !isHovered;
                  return (
                    <div
                      key={row.category_id}
                      onMouseEnter={() => setHoveredId(row.category_id)}
                      onMouseLeave={() => setHoveredId(null)}
                      style={{
                        opacity: isOtherHovered ? 0.4 : 1,
                        transition: 'opacity 0.18s ease',
                        cursor: 'default',
                      }}
                    >
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
                            fontWeight: isHovered ? 700 : 600,
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
                              boxShadow: isHovered
                                ? `0 0 10px ${row.category_color}cc`
                                : `0 0 6px ${row.category_color}88`,
                            }}
                          />
                          {row.category_name}
                        </span>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                            color: isHovered ? 'var(--text)' : 'var(--text-muted)',
                          }}
                        >
                          {formatRM(row.spent)}{' '}
                          <span style={{ opacity: 0.5, fontSize: '0.72rem' }}>
                            {pct.toFixed(1)}%
                          </span>
                        </span>
                      </div>
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
        </>
      )}
    </div>
  );
}
