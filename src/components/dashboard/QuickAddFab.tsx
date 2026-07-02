// src/components/dashboard/QuickAddFab.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { createTransaction } from '@/data/transactions';
import { todayISO } from '@/lib/utils/date';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import type { Category, TransactionFormData } from '@/types';

interface Props {
  categories: Category[];
}

const EMPTY_FORM: TransactionFormData = {
  transaction_date: todayISO(),
  type: 'Expense',
  category_id: '',
  amount: '',
  description: '',
};

export default function QuickAddFab({ categories }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<TransactionFormData>(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Same filtering rule as TransactionTableClient — 'Both' categories always show
  const filteredCategories = categories.filter((c) => {
    if (!c.type || c.type === 'Both') return true;
    return c.type === form.type;
  });

  function openModal() {
    setForm({ ...EMPTY_FORM, transaction_date: todayISO() });
    setError('');
    setOpen(true);
  }

  function handleTypeChange(newType: 'Income' | 'Expense') {
    setForm((prev) => ({ ...prev, type: newType, category_id: '' }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const amount = parseFloat(form.amount);
    if (!form.transaction_date) { setError('Date is required.'); return; }
    if (!form.category_id) { setError('Category is required.'); return; }
    if (isNaN(amount) || amount <= 0) { setError('Enter a valid amount.'); return; }

    setSaving(true);
    try {
      await createTransaction({
        transaction_date: form.transaction_date,
        type: form.type,
        category_id: form.category_id,
        amount,
        description: form.description || undefined,
      });
      setOpen(false);
      router.refresh(); // re-runs the dashboard server fetch → overview/budget rows update
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        className="quick-add-fab"
        onClick={openModal}
        aria-label="Quick add transaction"
        title="Quick add transaction"
        style={{
          position: 'fixed',
          right: '24px',
          bottom: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--accent)',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 8px 28px rgba(56,189,248,0.4)',
          cursor: 'pointer',
          zIndex: 60,
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px) scale(1.05)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0) scale(1)';
        }}
      >
        <Plus size={26} strokeWidth={2.4} />
      </button>

      {open && (
        <Modal title="Quick Add Transaction" onClose={() => setOpen(false)}>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                value={form.transaction_date}
                onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Type</label>
              <select
                value={form.type}
                onChange={(e) => handleTypeChange(e.target.value as 'Income' | 'Expense')}
              >
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Category
                {filteredCategories.length === 0 && (
                  <span style={{ color: 'var(--expense)', marginLeft: '6px', fontSize: '0.75rem', fontWeight: 400 }}>
                    — No {form.type} categories found. Add one in Categories.
                  </span>
                )}
              </label>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              >
                <option value="">Select category…</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.type === 'Both' ? ' (Both)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Amount (RM)</label>
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <div className="modal-actions">
              <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={saving}>
                Add transaction
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Clear the mobile bottom tab bar (58px + safe area) on small screens */}
      <style>{`
        @media (max-width: 768px) {
          .quick-add-fab {
            bottom: calc(74px + env(safe-area-inset-bottom)) !important;
          }
        }
      `}</style>
    </>
  );
}