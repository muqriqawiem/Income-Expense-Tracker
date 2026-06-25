// src/components/transactions/TransactionTableClient.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createTransaction, updateTransaction, deleteTransaction } from '@/data/transactions';
import { formatRM } from '@/lib/utils/currency';
import { todayISO } from '@/lib/utils/date';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import type { Transaction, Category, TransactionFormData } from '@/types';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  selectedMonth: string;
}

const EMPTY_FORM: TransactionFormData = {
  transaction_date: todayISO(),
  type: 'Expense',
  category_id: '',
  amount: '',
  description: '',
};

export default function TransactionTableClient({
  transactions,
  categories,
  selectedMonth,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [form, setForm] = useState<TransactionFormData>(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function openAdd() {
    setForm({ ...EMPTY_FORM, transaction_date: todayISO() });
    setEditTarget(null);
    setError('');
    setShowForm(true);
  }

  function openEdit(t: Transaction) {
    setForm({
      transaction_date: t.transaction_date,
      type: t.type,
      category_id: t.category_id ?? '',
      amount: String(t.amount),
      description: t.description ?? '',
    });
    setEditTarget(t);
    setError('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditTarget(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const amount = parseFloat(form.amount);
    if (!form.transaction_date) { setError('Date is required.'); return; }
    if (!form.category_id)      { setError('Category is required.'); return; }
    if (isNaN(amount) || amount <= 0) { setError('Enter a valid amount.'); return; }

    setSaving(true);
    try {
      const payload = {
        transaction_date: form.transaction_date,
        type: form.type,
        category_id: form.category_id,
        amount,
        description: form.description || undefined,
      };

      if (editTarget) {
        await updateTransaction(editTarget.id, payload);
      } else {
        await createTransaction(payload);
      }
      closeForm();
      startTransition(() => router.refresh());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTransaction(deleteTarget.id);
      setDeleteTarget(null);
      startTransition(() => router.refresh());
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
        </p>
        <Button variant="primary" onClick={openAdd}>
          + Add Transaction
        </Button>
      </div>

      {transactions.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p style={{ fontSize: '1.5rem' }}>⇄</p>
            <p>No transactions for this period.</p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th className="text-right">Amount</th>
                <th>Description</th>
                <th style={{ width: '80px' }}></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{t.transaction_date}</td>
                  <td>
                    <span className={`badge badge-${t.type.toLowerCase()}`}>{t.type}</span>
                  </td>
                  <td>{t.category?.name ?? <span className="text-muted">—</span>}</td>
                  <td
                    className="text-right font-mono"
                    style={{
                      color: t.type === 'Income' ? 'var(--income)' : 'var(--expense)',
                      fontWeight: 600,
                    }}
                  >
                    {formatRM(Number(t.amount))}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {t.description ?? '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(t)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => setDeleteTarget(t)}>
                        Del
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showForm && (
        <Modal
          title={editTarget ? 'Edit Transaction' : 'Add Transaction'}
          onClose={closeForm}
        >
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                value={form.transaction_date}
                onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as 'Income' | 'Expense' })}
              >
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                required
              >
                <option value="">Select category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Amount (RM)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Notes…"
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <div className="modal-actions">
              <Button variant="ghost" type="button" onClick={closeForm}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={saving}>
                {editTarget ? 'Save changes' : 'Add transaction'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete transaction?"
          message={`This will permanently delete the ${deleteTarget.type.toLowerCase()} of ${formatRM(Number(deleteTarget.amount))} on ${deleteTarget.transaction_date}.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </>
  );
}
