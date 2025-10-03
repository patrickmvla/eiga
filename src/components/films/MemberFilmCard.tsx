// components/films/MemberFilmCard.tsx
import Image from 'next/image';
import Link from 'next/link';
import type { FilmItem } from './types';

export const MemberFilmCard = ({ film }: { film: FilmItem }) => (
  <Link
    href={`/films/${film.id}`}
    className="group relative overflow-hidden rounded-xl border border-white/10 bg-neutral-900/40 transition-colors hover:bg-neutral-900/60"
  >
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
        <div className="text-xs text-neutral-400">
          {film.year} {film.director ? `• ${film.director}` : ''}
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-neutral-200">
          <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5">
            <span className="tabular-nums">{film.avgScore.toFixed(1)}</span>
            <span className="text-neutral-400">avg</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5">
            <span className="tabular-nums">{film.dissent.toFixed(1)}</span>
            <span className="text-neutral-400">dissent</span>
          </span>
          {typeof film.myScore === 'number' ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-olive-500/20 bg-olive-500/10 px-2 py-0.5 text-olive-200">
              <span className="tabular-nums">{film.myScore.toFixed(1)}</span>
              <span className="text-neutral-400">your score</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-neutral-300">
              Unrated
            </span>
          )}
        </div>
      </div>
    </div>
  </Link>
);