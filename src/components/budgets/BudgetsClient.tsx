// src/components/budgets/BudgetsClient.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { upsertBudget, deleteBudget, copyBudgetsFromMonth } from '@/data/budgets';
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
}

function getPreviousMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const prev = new Date(year, month - 2, 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
}

export default function BudgetsClient({
  budgets,
  categories,
  selectedMonth,
  monthOptions,
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
    if (!formCategoryId)             { setError('Select a category.'); return; }
    if (isNaN(amount) || amount < 0) { setError('Enter a valid amount.'); return; }

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

  // Categories that don't have a budget yet in this month
  const budgetedCategoryIds = new Set(budgets.map((b) => b.category_id));
  const availableCategories = categories.filter((c) => !budgetedCategoryIds.has(c.id));

  const totalBudget = budgets.reduce((s, b) => s + Number(b.allocated_budget), 0);

  return (
    <>
      {/* Month selector + action buttons */}
      <div className="filters-bar" style={{ marginBottom: '20px' }}>
        <div className="form-group">
          <label className="form-label">Month</label>
          <select value={selectedMonth} onChange={(e) => switchMonth(e.target.value)}>
            {monthOptions.map((m) => (
              <option key={m} value={m}>{formatMonthLabel(m)}</option>
            ))}
          </select>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
          {budgets.length === 0 && (
            <Button variant="ghost" onClick={handleCopyFromPrevious} disabled={copying}>
              {copying ? 'Copying…' : 'Copy from previous month'}
            </Button>
          )}
          <Button variant="primary" onClick={openAdd} disabled={availableCategories.length === 0}>
            + Set Budget
          </Button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="card" style={{ marginBottom: '20px', display: 'flex', gap: '32px', flexWrap: 'wrap', padding: '20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(56,189,248,0.08)', filter: 'blur(24px)', pointerEvents: 'none' }}/>
        <div>
          <p style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Total Allocated
          </p>
          <p style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: '"JetBrains Mono", "Fira Code", monospace', color: 'var(--accent)' }}>
            {formatRM(totalBudget)}
          </p>
        </div>
        <div>
          <p style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Categories budgeted
          </p>
          <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>{budgets.length}</p>
        </div>
      </div>

      {/* Budget table */}
      {budgets.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p style={{ fontSize: '1.5rem' }}>◎</p>
            <p>No budgets set for {formatMonthLabel(selectedMonth)}.</p>
            <p style={{ marginTop: '12px' }}>
              <Button variant="primary" onClick={openAdd}>
                Set first budget
              </Button>
            </p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Budget Allocation
            </h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th className="text-right">Allocated Budget</th>
                <th style={{ width: '100px' }}></th>
              </tr>
            </thead>
            <tbody>
              {budgets.map((b) => (
                <tr key={b.id}>
                  <td>
                    <span style={{  display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontWeight: 600 }}>
                      {b.category?.name ?? '—'}
                    </span>
                  </td>
                  </td>
                  <td className="text-right font-mono" style={{ fontWeight: 600, color: 'var(--accent)' }}>
                    {formatRM(Number(b.allocated_budget))}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(b)}>Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => setDeleteTarget(b)}>Del</Button>
                    </div>
                  </td>
                </tr>
              ))}
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
              <select
                value={formCategoryId}
                onChange={(e) => setFormCategoryId(e.target.value)}
                required
              >
                <option value="">Select category…</option>
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Allocated Budget (RM)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="modal-actions">
              <Button variant="ghost" type="button" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button variant="primary" type="submit" loading={saving}>Save budget</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <Modal title={`Edit Budget — ${editTarget.category?.name}`} onClose={() => setEditTarget(null)}>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Allocated Budget (RM)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="0.00"
                required
                autoFocus
              />
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="modal-actions">
              <Button variant="ghost" type="button" onClick={() => setEditTarget(null)}>Cancel</Button>
              <Button variant="primary" type="submit" loading={saving}>Save changes</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <ConfirmDialog
          title="Remove budget?"
          message={`Remove the budget for "${deleteTarget.category?.name}" in ${formatMonthLabel(selectedMonth)}?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </>
  );
}
