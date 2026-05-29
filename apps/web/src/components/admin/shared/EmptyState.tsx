'use client';

import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ backgroundColor: 'var(--sidebar-hover)' }}
      >
        <Icon size={28} style={{ color: 'var(--muted)' }} />
      </div>

      <h3
        className="text-lg font-semibold mb-1"
        style={{ color: 'var(--text)' }}
      >
        {title}
      </h3>

      {description && (
        <p
          className="text-sm max-w-sm mb-4"
          style={{ color: 'var(--muted)' }}
        >
          {description}
        </p>
      )}

      {action && (
        <button onClick={action.onClick} className="btn-primary px-5 py-2.5 text-sm font-medium">
          {action.label}
        </button>
      )}
    </div>
  );
}
