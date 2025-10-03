// components/landing/SeatBadge.tsx
import { ProgressBar } from '@/components/ui/ProgressBar';

type Props = {
  seatsAvailable: number;
  capacity: number;
  className?: string;
};

export const SeatBadge = ({ seatsAvailable, capacity, className = '' }: Props) => {
  const filled = Math.max(capacity - seatsAvailable, 0);
  const pct = Math.round((filled / capacity) * 100);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-neutral-200 ${className}`}
      aria-label={
        seatsAvailable > 0
          ? `${seatsAvailable} seats available out of ${capacity}`
          : `Waitlist only. ${capacity} seats filled`
      }
    >
      <ProgressBar value={pct} />
      {seatsAvailable > 0 ? (
        <span className="tabular-nums">{seatsAvailable} seats available</span>
      ) : (
        <span>Waitlist only</span>
      )}
    </span>
  );
};