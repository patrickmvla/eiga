// components/landing/PosterBackdrop.tsx
import Image from 'next/image';

type Props = {
  posterUrl?: string | null;
  alt: string;
  className?: string;
};

export const PosterBackdrop = ({ posterUrl, alt, className = '' }: Props) => (
  <div className={`absolute inset-0 -z-10 overflow-hidden rounded-2xl ${className}`}>
    {posterUrl ? (
      <Image
        src={posterUrl}
        alt={alt}
        fill
        priority
        sizes="100vw"
        className="scale-110 object-cover opacity-30 blur-md"
      />
    ) : (
      <div className="h-full w-full bg-gradient-to-br from-neutral-800 to-neutral-900" />
    )}
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-transparent" />
  </div>
);