'use client';

interface AvatarProps {
  name?: string | null;
  avatar?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_MAP = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

const BG_COLORS = [
  'from-blue-500 to-blue-600',
  'from-purple-500 to-purple-600',
  'from-green-500 to-green-600',
  'from-orange-500 to-orange-600',
  'from-pink-500 to-pink-600',
  'from-teal-500 to-teal-600',
  'from-indigo-500 to-indigo-600',
  'from-rose-500 to-rose-600',
];

function getInitials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getBgGradient(name?: string | null): string {
  if (!name) return BG_COLORS[0];
  const code = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return BG_COLORS[code % BG_COLORS.length];
}

const API_BASE =
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
    : 'http://localhost:5000';

export default function Avatar({ name, avatar, size = 'md', className = '' }: AvatarProps) {
  const sizeClass = SIZE_MAP[size];

  if (avatar) {
    const src = avatar.startsWith('http') ? avatar : `${API_BASE}${avatar}`;
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-[var(--border)] ${className}`}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} bg-gradient-to-br ${getBgGradient(name)} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-sm ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
