// components/ui/ProgressBar.tsx
import type { HTMLAttributes } from 'react';

type Props = HTMLAttributes<HTMLDivElement> & {
  value: number; // 0–100
};

export const ProgressBar = ({ value, className = '', ...props }: Props) => {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      className={`relative h-1.5 w-16 overflow-hidden rounded-full bg-white/10 ${className}`}
      {...props}
    >
      <div
        className="absolute left-0 top-0 h-full bg-white/70"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};