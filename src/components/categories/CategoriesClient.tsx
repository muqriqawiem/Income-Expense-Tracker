// src/components/categories/CategoriesClient.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/data/categories';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import type { Category, CategoryType } from '@/types';

interface Props {
  categories: Category[];
}

const TYPE_LABELS: Record<CategoryType, string> = {
  Income: 'Income',
  Expense: 'Expense',
  Both: 'Both',
};

const TYPE_COLORS: Record<CategoryType, string> = {
  Income: 'var(--income)',
  Expense: 'var(--expense)',
  Both: 'var(--accent)',
};

const TYPE_BG: Record<CategoryType, string> = {
  Income: 'var(--income-soft)',
  Expense: 'var(--expense-soft)',
  Both: 'var(--accent-soft)',
};

function TypeBadge({ type }: { type: CategoryType }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '999px',
        fontSize: '0.72rem',
        fontWeight: 700,
        background: TYPE_BG[type],
        color: TYPE_COLORS[type],
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}
    >
      {TYPE_LABELS[type]}
    </span>
  );
}

function CategoryPill({ color, name, inactive }: { color: string; name: string; inactive?: boolean }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 10px',
      borderRadius: '999px',
      backgroundColor: `${color}20`,
      color: color,
      fontSize: '0.8rem',
      fontWeight: 600,
      opacity: inactive ? 0.5 : 1,
    }}>
      <span style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: color,
        display: 'inline-block',
        flexShrink: 0,
      }} />
      {name}
    </span>
  );
}

export default function CategoriesClient({ categories }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [newName, setNewName] = useState('');
  const [editName, setEditName] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');
  const [editColor, setEditColor] = useState('#3b82f6');
  const [newType, setNewType] = useState<CategoryType>('Expense');
  const [editType, setEditType] = useState<CategoryType>('Expense');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!newName.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    try {
      await createCategory(newName.trim(), newColor, newType);
      setNewName('');
      setShowAdd(false);
      startTransition(() => router.refresh());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create.');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setError('');
    if (!editName.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    try {
      await updateCategory(editTarget.id, { name: editName.trim(), color: editColor, type: editType });
      setEditTarget(null);
      startTransition(() => router.refresh());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(cat: Category) {
    try {
      await updateCategory(cat.id, { is_active: !cat.is_active });
      startTransition(() => router.refresh());
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update.');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCategory(deleteTarget.id);
      setDeleteTarget(null);
      startTransition(() => router.refresh());
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed. Category may have transactions.');
    } finally {
      setDeleting(false);
    }
  }

  const active   = categories.filter((c) => c.is_active);
  const inactive = categories.filter((c) => !c.is_active);

  const TypeSelect = ({
    value,
    onChange,
  }: {
    value: CategoryType;
    onChange: (v: CategoryType) => void;
  }) => (
    <div className="form-group">
      <label className="form-label">Category Type</label>
      <select value={value} onChange={(e) => onChange(e.target.value as CategoryType)}>
        <option value="Expense">Expense</option>
        <option value="Income">Income</option>
        <option value="Both">Both (Income & Expense)</option>
      </select>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
        Controls which categories appear when creating a transaction.
      </p>
    </div>
  );

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <Button variant="primary" onClick={() => { setShowAdd(true); setError(''); setNewName(''); setNewColor('#3b82f6'); setNewType('Expense'); }}>
          + Add Category
        </Button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
            Active ({active.length})
          </h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: '600px' }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th style={{ width: '160px' }}></th>
              </tr>
            </thead>
            <tbody>
              {active.map((cat) => (
                <tr key={cat.id}>
                  <td>
                    <CategoryPill color={cat.color} name={cat.name} />
                  </td>
                  <td>
                    <TypeBadge type={cat.type ?? 'Expense'} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                        setEditTarget(cat);
                        setEditName(cat.name);
                        setEditColor(cat.color);
                        setEditType(cat.type ?? 'Expense');
                        setError('');
                      }}
                    >
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleToggleActive(cat)}
                    >
                      Deactivate
                    </Button>

                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setDeleteTarget(cat)}
                    >
                      Del
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {active.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="text-center text-muted"
                  style={{ padding: '20px' }}
                >
                  No active categories.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>

      {inactive.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Inactive ({inactive.length})
            </h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: '600px' }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th style={{ width: '120px' }}></th>
                </tr>
              </thead>

              <tbody>
                {inactive.map((cat) => (
                  <tr key={cat.id}>
                    <td>
                      <CategoryPill
                        color={cat.color}
                        name={cat.name}
                        inactive
                      />
                    </td>

                    <td>
                      <TypeBadge type={cat.type ?? 'Expense'} />
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleToggleActive(cat)}
                        >
                          Activate
                        </Button>

                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setDeleteTarget(cat)}
                        >
                          Del
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAdd && (
        <Modal title="Add Category" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Category Name</label>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Food, Salary…" autoFocus />
            </div>
            <TypeSelect value={newType} onChange={setNewType} />
            <div className="form-group">
              <label className="form-label">Category Color</label>
              <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} style={{ width: '60px', height: '40px', padding: 0, border: 'none', cursor: 'pointer' }} />
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="modal-actions">
              <Button variant="ghost" type="button" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button variant="primary" type="submit" loading={saving}>Add category</Button>
            </div>
          </form>
        </Modal>
      )}

      {editTarget && (
        <Modal title="Edit Category" onClose={() => setEditTarget(null)}>
          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label className="form-label">Category Name</label>
              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
            </div>
            <TypeSelect value={editType} onChange={setEditType} />
            <div className="form-group">
              <label className="form-label">Category Color</label>
              <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} style={{ width: '60px', height: '40px', padding: 0, border: 'none', cursor: 'pointer' }} />
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="modal-actions">
              <Button variant="ghost" type="button" onClick={() => setEditTarget(null)}>Cancel</Button>
              <Button variant="primary" type="submit" loading={saving}>Save changes</Button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete category?"
          message={`Delete "${deleteTarget.name}"? Existing transactions that use this category will lose their category link.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </>
  );
}
