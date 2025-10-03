// components/landing/RecentFilmCard.tsx
import Image from 'next/image';
import Link from 'next/link';

export type LandingFilm = {
  id: number;
  title: string;
  year: number;
  posterUrl?: string | null;
  avgScore?: number | null;  // ← accept null
  dissent?: number | null;   // ← accept null
};

type Props = {
  film: LandingFilm;
  href?: string; // optional link target
  className?: string;
};

export const RecentFilmCard = ({ film, href, className = '' }: Props) => {
  const content = (
    <div className={`group relative overflow-hidden rounded-xl border border-white/10 bg-neutral-900/40 ${className}`}>
      <div className="relative aspect-[2/3]">
        {film.posterUrl ? (
          <Image
            src={film.posterUrl}
            alt={`${film.title} (${film.year})`}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-neutral-800 to-neutral-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="text-sm font-semibold">{film.title}</div>
          <div className="text-xs text-neutral-400">{film.year}</div>
          <div className="mt-2 flex items-center gap-2 text-xs text-neutral-200">
            {typeof film.avgScore === 'number' && (
              <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5">
                <span className="tabular-nums">{film.avgScore.toFixed(1)}</span>
                <span className="text-neutral-400">avg</span>
              </span>
            )}
            {typeof film.dissent === 'number' && (
              <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5">
                <span className="tabular-nums">{film.dissent.toFixed(1)}</span>
                <span className="text-neutral-400">dissent</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
};