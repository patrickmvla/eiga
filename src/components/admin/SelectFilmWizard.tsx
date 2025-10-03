'use client';

import { useMemo, useState } from 'react';
import { TmdbSearch } from '@/components/suggest/TmdbSearch';

type Picked = {
  tmdbId: number;
  title: string;
  year?: number | null;
  posterUrl?: string | null;
};

export const SelectFilmWizard = ({
  defaultWeekStart,
  initialPick,
  action = '/api/admin/films/schedule', // TODO: implement server route later
}: {
  defaultWeekStart: string; // YYYY-MM-DD
  initialPick?: Picked | null;
  action?: string;
}) => {
  const [picked, setPicked] = useState<Picked | null>(initialPick ?? null);
  const [why, setWhy] = useState('');
  const [themes, setThemes] = useState('');
  const [technical, setTechnical] = useState('');
  const [context, setContext] = useState('');
  const [weekStart, setWeekStart] = useState(defaultWeekStart);
  const [status, setStatus] = useState<'upcoming' | 'current'>('upcoming');

  const canSubmit = useMemo(() => !!picked && weekStart.length > 0, [picked, weekStart]);

  return (
    <form method="POST" action={action} className="grid gap-4">
      {/* Honeypot */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="absolute left-[-9999px] top-[-9999px] h-0 w-0 opacity-0"
        aria-hidden="true"
      />

      <fieldset className="grid gap-4">
        {/* TMDB search and pick */}
        <TmdbSearch onPick={setPicked} initial={initialPick ?? null} />

        {/* Hidden fields from pick */}
        <input type="hidden" name="tmdb_id" value={picked?.tmdbId ?? ''} />
        <input type="hidden" name="title" value={picked?.title ?? ''} />
        {picked?.year ? <input type="hidden" name="year" value={String(picked.year)} /> : null}
        {picked?.posterUrl ? <input type="hidden" name="poster_url" value={picked.posterUrl} /> : null}

        {/* The Setup */}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="why" className="mb-1 block text-xs text-neutral-400">
              Why this film
            </label>
            <textarea
              id="why"
              name="why"
              rows={3}
              placeholder="Why now, and why for this group?"
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
            />
          </div>

          <div>
            <label htmlFor="themes" className="mb-1 block text-xs text-neutral-400">
              Themes to consider (one per line)
            </label>
            <textarea
              id="themes"
              name="themes"
              rows={4}
              placeholder="e.g., Restraint as romance&#10;Memory as mise-en-scène"
              value={themes}
              onChange={(e) => setThemes(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
            />
          </div>

          <div>
            <label htmlFor="technical" className="mb-1 block text-xs text-neutral-400">
              Technical notes (optional, one per line)
            </label>
            <textarea
              id="technical"
              name="technical"
              rows={4}
              placeholder="e.g., Framing through thresholds&#10;Motifs in score"
              value={technical}
              onChange={(e) => setTechnical(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="context" className="mb-1 block text-xs text-neutral-400">
              Context (optional)
            </label>
            <input
              id="context"
              name="context"
              placeholder="Thread or programming context (e.g., melancholy in East Asian cinema)"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
            />
          </div>
        </div>

        {/* Schedule */}
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label htmlFor="week_start" className="mb-1 block text-xs text-neutral-400">
              Week start (Monday)
            </label>
            <input
              id="week_start"
              name="week_start"
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
            />
            <p className="mt-1 text-xs text-neutral-500">The film will drop at 00:00 on this date.</p>
          </div>

          <div>
            <label htmlFor="status" className="mb-1 block text-xs text-neutral-400">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'upcoming' | 'current')}
              className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
            >
              <option value="upcoming">Upcoming</option>
              <option value="current">Set as current now</option>
            </select>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center justify-center rounded-lg bg-olive-500 px-4 py-2 text-sm font-semibold text-neutral-950 transition-colors hover:bg-olive-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-olive-400/40 disabled:opacity-50"
          >
            Schedule film
          </button>
          {!picked ? (
            <span className="text-xs text-neutral-500">Pick a film to enable submission.</span>
          ) : null}
        </div>
      </fieldset>
    </form>
  );
};