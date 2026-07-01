// src/components/ui/ConfirmDialog.tsx
'use client';

import Modal from './Modal';
import Button from './Button';

interface Props {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary';
}

export default function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
  loading,
  confirmLabel = 'Delete',
  confirmVariant = 'danger',
}: Props) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{message}</p>
      <div className="modal-actions">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}