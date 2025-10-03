// components/ui/ButtonLink.tsx
import Link, { LinkProps } from 'next/link';
import type { ReactNode, AnchorHTMLAttributes } from 'react';

type AnchorProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>;

type Props = LinkProps &
  AnchorProps & {
    children: ReactNode;
    className?: string;
    variant?: 'primary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    ariaLabel?: string;
  };

const base =
  'inline-flex items-center justify-center rounded-lg font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-olive-400/40';
const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
} as const;

const variants = {
  primary: 'bg-olive-500 text-neutral-950 hover:bg-olive-400',
  outline:
    'border border-olive-500/30 bg-olive-500/10 text-olive-200 hover:bg-olive-500/15',
  ghost: 'text-olive-300 hover:bg-olive-500/10',
} as const;

export const ButtonLink = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  ariaLabel,
  ...props
}: Props) => (
  <Link
    {...props}
    aria-label={ariaLabel ?? props['aria-label']}
    className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
  >
    {children}
  </Link>
);