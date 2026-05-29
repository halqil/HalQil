'use client';

import { useEffect, useCallback } from 'react';
import { Loader2, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'default';
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Tasdiqlash',
  cancelText = 'Bekor qilish',
  variant = 'default',
  loading = false,
}: ConfirmDialogProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    },
    [onClose, loading]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  const confirmBtnClass =
    variant === 'danger'
      ? 'btn-danger'
      : variant === 'warning'
        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl px-5 py-2.5 font-medium shadow-lg hover:opacity-90 transition-opacity'
        : 'btn-primary';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!loading ? onClose : undefined}
      />
      <div className="glass-modal fade-in relative w-full max-w-md p-6 rounded-2xl">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 btn-ghost p-1.5 rounded-lg disabled:opacity-40"
        >
          <X size={18} />
        </button>

        <h3
          className="text-lg font-semibold pr-8 mb-2"
          style={{ color: 'var(--text)' }}
        >
          {title}
        </h3>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          {description}
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="btn-ghost px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`${confirmBtnClass} flex items-center gap-2 px-5 py-2.5 text-sm font-medium disabled:opacity-60`}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
