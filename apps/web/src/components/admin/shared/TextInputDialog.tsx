'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, X } from 'lucide-react';

interface TextInputDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  confirmText?: string;
  loading?: boolean;
}

export function TextInputDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  placeholder = 'Matn kiriting...',
  required = true,
  rows = 3,
  confirmText = 'Tasdiqlash',
  loading = false,
}: TextInputDialogProps) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (open) setValue('');
  }, [open]);

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

  const canSubmit = !required || value.trim().length > 0;

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

        {description && (
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            {description}
          </p>
        )}

        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="glass-textarea w-full px-4 py-3 text-sm mb-4"
          style={{ color: 'var(--text)' }}
        />

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="btn-ghost px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40"
          >
            Bekor qilish
          </button>
          <button
            onClick={() => onConfirm(value.trim())}
            disabled={loading || !canSubmit}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm font-medium disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
