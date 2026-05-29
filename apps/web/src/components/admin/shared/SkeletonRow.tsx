'use client';

interface SkeletonRowProps {
  cols?: number;
  rows?: number;
}

export function SkeletonRow({ cols = 5, rows = 5 }: SkeletonRowProps) {
  return (
    <div className="w-full space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-center gap-4 p-4 rounded-xl animate-pulse"
          style={{ backgroundColor: 'var(--skeleton)' }}
        >
          {Array.from({ length: cols }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-4 rounded-lg flex-1"
              style={{
                backgroundColor: 'var(--border)',
                maxWidth: colIndex === 0 ? '40%' : '20%',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
