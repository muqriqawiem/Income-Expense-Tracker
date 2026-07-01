// src/components/budgets/BudgetsClient.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { upsertBudget, deleteBudget, copyBudgetsFromMonth } from '@/data/budgets';
import { setMaskMoneyPreference } from '@/data/preferences';
import { formatRM } from '@/lib/utils/currency';
import { formatMonthLabel } from '@/lib/utils/date';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import type { Budget, Category } from '@/types';

interface Props {
  budgets: Budget[];
  categories: Category[];
  selectedMonth: string;
  monthOptions: string[];
  initialMaskMoney: boolean;
}

function getPreviousMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const prev = new Date(year, month - 2, 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
}

const MASK_PLACEHOLDER = 'RM ••••';

function displayRM(value: number, masked: boolean): string {
  return masked ? MASK_PLACEHOLDER : formatRM(value);
}

// ── Eye / EyeOff icons (matches DashboardClient) ────────────────

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

interface SummaryCardProps {
  label: string;
  value: string;
  glowColor: string;
}

function SummaryCard({ label, value, glowColor }: SummaryCardProps) {
  return (
    <div
      className="card"
      style={{
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        flex: 1,
        minWidth: '160px',
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
          color: 'var(--text)',
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        }}
      >
        {value}
      </p>
    </div>
  );
}

const ICON_BTN_STYLE: React.CSSProperties = {
  padding: '6px',
  width: '30px',
  height: '30px',
};

export default function BudgetsClient({
  budgets,
  categories,
  selectedMonth,
  monthOptions,
  initialMaskMoney,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<Budget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null);
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copying, setCopying] = useState(false);
  const [masked, setMasked] = useState(initialMaskMoney);

  async function toggleMask() {
    const next = !masked;
    setMasked(next); // optimistic update — instant UI feedback
    try {
      await setMaskMoneyPreference(next);
    } catch {
      setMasked(!next);
    }
  }

  function switchMonth(month: string) {
    router.push(`${pathname}?month=${month}`);
  }

  function openAdd() {
    setFormCategoryId('');
    setFormAmount('');
    setError('');
    setShowAdd(true);
  }

  function openEdit(b: Budget) {
    setFormCategoryId(b.category_id);
    setFormAmount(String(b.allocated_budget));
    setError('');
    setEditTarget(b);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const amount = parseFloat(formAmount);

    if (!formCategoryId) {
      setError('Select a category.');
      return;
    }

    if (isNaN(amount) || amount < 0) {
      setError('Enter a valid amount.');
      return;
    }

    setSaving(true);

    try {
      await upsertBudget({
        category_id: formCategoryId,
        year_month: selectedMonth,
        allocated_budget: amount,
      });

      setShowAdd(false);
      setEditTarget(null);

      startTransition(() => router.refresh());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await deleteBudget(deleteTarget.id);
      setDeleteTarget(null);
      startTransition(() => router.refresh());
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  }

  async function handleCopyFromPrevious() {
    setCopying(true);

    try {
      const prevMonth = getPreviousMonth(selectedMonth);
      const copied = await copyBudgetsFromMonth(prevMonth, selectedMonth);

      if (copied.length === 0) {
        alert(`No budgets found for ${formatMonthLabel(prevMonth)} to copy from.`);
      } else {
        startTransition(() => router.refresh());
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Copy failed. Please try again.');
    } finally {
      setCopying(false);
    }
  }

  const budgetedCategoryIds = new Set(budgets.map((b) => b.category_id));
  const availableCategories = categories.filter((c) => !budgetedCategoryIds.has(c.id));

  const totalBudget = budgets.reduce(
    (s, b) => s + (Number(b.allocated_budget) || 0),
    0
  );

  return (
    <>
      {/* Month selector + mask toggle + actions */}
      <div className="filters-bar" style={{ marginBottom: '20px' }}>
        <div className="form-group">
          <label className="form-label">Month</label>
          <select value={selectedMonth} onChange={(e) => switchMonth(e.target.value)}>
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {formatMonthLabel(m)}
              </option>
            ))}
          </select>
        </div>

        <MaskToggleButton masked={masked} onClick={toggleMask} />

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          {budgets.length === 0 && (
            <Button
              variant="secondary"
              onClick={handleCopyFromPrevious}
              disabled={copying}
            >
              {copying ? '⟳ Copying…' : '⎘ Copy from previous month'}
            </Button>
          )}

          <Button
            variant="primary"
            onClick={openAdd}
            disabled={availableCategories.length === 0}
          >
            + Set Budget
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="overview-grid" style={{ marginBottom: '24px' }}>
        <SummaryCard
          label="Total Allocated"
          value={displayRM(totalBudget, masked)}
          glowColor="rgba(56, 189, 248, 0.15)"
        />
        <SummaryCard
          label="Categories Budgeted"
          value={String(budgets.length)}
          glowColor="rgba(139, 92, 246, 0.15)"
        />
      </div>

      {/* Table / Empty state */}
      {budgets.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p style={{ fontSize: '1.5rem' }}>◎</p>
            <p>No budgets set for {formatMonthLabel(selectedMonth)}.</p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th className="text-right">Allocated Budget</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {budgets.map((b) => {
                const categoryColor = b.category?.color ?? '#6b7280';
                return (
                  <tr key={b.id}>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '999px',
                          backgroundColor: `${categoryColor}20`,
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
                          }}
                        />
                        {b.category?.name ?? '—'}
                      </span>
                    </td>

                    <td className="text-right font-mono" style={{ fontWeight: 600 }}>
                      {displayRM(Number(b.allocated_budget), masked)}
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Edit"
                          aria-label="Edit"
                          style={ICON_BTN_STYLE}
                          onClick={() => openEdit(b)}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          title="Delete"
                          aria-label="Delete"
                          style={ICON_BTN_STYLE}
                          onClick={() => setDeleteTarget(b)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <Modal title={`Set Budget — ${formatMonthLabel(selectedMonth)}`} onClose={() => setShowAdd(false)}>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select value={formCategoryId} onChange={(e) => setFormCategoryId(e.target.value)}>
                <option value="">Select category…</option>
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Amount (RM)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <div className="modal-actions">
              <Button variant="ghost" type="button" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={saving}>
                Save budget
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <Modal title={`Edit Budget — ${editTarget.category?.name ?? ''}`} onClose={() => setEditTarget(null)}>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Amount (RM)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                autoFocus
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <div className="modal-actions">
              <Button variant="ghost" type="button" onClick={() => setEditTarget(null)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={saving}>
                Save changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete */}
      {deleteTarget && (
        <ConfirmDialog
          title="Remove budget?"
          message={`Remove budget for ${deleteTarget.category?.name}?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </>
  );
}