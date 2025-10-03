// components/ui/SectionHeader.tsx
import type { ReactNode } from 'react';

type Props = {
  title: string | ReactNode;
  subtitle?: string | ReactNode;
  action?: ReactNode;
  className?: string;
};

export const SectionHeader = ({
  title,
  subtitle,
  action,
  className = '',
}: Props) => (
  <div className={`mb-4 flex items-end justify-between gap-4 ${className}`}>
    <div>
      <h2 className="text-xl font-semibold tracking-tight text-neutral-100">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-1 text-sm text-neutral-400">{subtitle}</p>
      ) : null}
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);