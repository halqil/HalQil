'use client';

interface StatusBadgeProps {
  status: string;
  type?: 'user' | 'provider' | 'order' | 'application';
}

interface BadgeConfig {
  label: string;
  bg: string;
  text: string;
}

const statusMaps: Record<string, Record<string, BadgeConfig>> = {
  user: {
    ACTIVE: { label: 'Faol', bg: 'rgba(16,185,129,0.1)', text: '#10b981' },
    FROZEN: { label: 'Muzlatilgan', bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' },
    BLOCKED: { label: 'Bloklangan', bg: 'rgba(239,68,68,0.1)', text: '#ef4444' },
    DELETED: { label: "O'chirilgan", bg: 'rgba(107,114,128,0.1)', text: '#6b7280' },
  },
  provider: {
    PENDING: { label: 'Kutilmoqda', bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' },
    APPROVED: { label: 'Tasdiqlangan', bg: 'rgba(16,185,129,0.1)', text: '#10b981' },
    REJECTED: { label: 'Rad etilgan', bg: 'rgba(239,68,68,0.1)', text: '#ef4444' },
  },
  order: {
    PENDING: { label: 'Kutilmoqda', bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' },
    ACCEPTED: { label: 'Qabul qilingan', bg: 'rgba(59,130,246,0.1)', text: '#3b82f6' },
    IN_PROGRESS: { label: 'Jarayonda', bg: 'rgba(139,92,246,0.1)', text: '#8b5cf6' },
    COMPLETED: { label: 'Yakunlangan', bg: 'rgba(16,185,129,0.1)', text: '#10b981' },
    CANCELLED: { label: 'Bekor qilingan', bg: 'rgba(107,114,128,0.1)', text: '#6b7280' },
    DISPUTED: { label: 'Shikoyat', bg: 'rgba(249,115,22,0.1)', text: '#f97316' },
    FAILED: { label: 'Muvaffaqiyatsiz', bg: 'rgba(239,68,68,0.1)', text: '#ef4444' },
  },
  application: {
    PENDING: { label: 'Kutilmoqda', bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' },
    APPROVED: { label: 'Tasdiqlangan', bg: 'rgba(16,185,129,0.1)', text: '#10b981' },
    REJECTED: { label: 'Rad etilgan', bg: 'rgba(239,68,68,0.1)', text: '#ef4444' },
  },
};

export function StatusBadge({ status, type = 'user' }: StatusBadgeProps) {
  const map = statusMaps[type] || statusMaps.user;
  const config = map[status] || {
    label: status,
    bg: 'rgba(107,114,128,0.1)',
    text: '#6b7280',
  };

  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
      style={{
        backgroundColor: config.bg,
        color: config.text,
      }}
    >
      {config.label}
    </span>
  );
}
