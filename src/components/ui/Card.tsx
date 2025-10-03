// components/ui/Card.tsx
import type { HTMLAttributes, ReactNode } from 'react';

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
};

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
} as const;

export const Card = ({
  children,
  className = '',
  padding = 'md',
  hover = false,
  ...props
}: Props) => (
  <div
    {...props}
    className={`rounded-xl border border-white/10 bg-neutral-900/40 ${paddingMap[padding]} ${
      hover ? 'transition-colors hover:bg-neutral-900/60' : ''
    } ${className}`}
  >
    {children}
  </div>
);