'use client';

import { useMemo, useState } from 'react';
import { TmdbSearch } from './TmdbSearch';

type Picked = {
  tmdbId: number;
  title: string;
  year?: number | null;
  posterUrl?: string | null;
};

export const SuggestForm = ({
  disabled = false,
  action = '/api/suggestions',
}: {
  disabled?: boolean;
  action?: string;
}) => {
  const [picked, setPicked] = useState<Picked | null>(null);
  const [pitch, setPitch] = useState('');

  const pitchLen = pitch.trim().length;
  const validPitch = pitchLen >= 10 && pitchLen <= 500;
  const canSubmit = !!picked && validPitch && !disabled;

  const helper = useMemo(() => {
    if (pitchLen === 0) return 'Write 2–3 sentences (10–500 characters).';
    if (pitchLen < 10) return `Keep going… ${10 - pitchLen} more to meet the minimum.`;
    if (pitchLen > 500) return `Please trim ${pitchLen - 500} characters.`;
    return `${pitchLen} / 500 characters`;
  }, [pitchLen]);

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

      <fieldset disabled={disabled} className="grid gap-4 disabled:opacity-60">
        <TmdbSearch onPick={setPicked} disabled={disabled} />

        {/* Hidden fields populated when picked */}
        <input type="hidden" name="tmdb_id" value={picked?.tmdbId ?? ''} />
        <input type="hidden" name="title" value={picked?.title ?? ''} />
        {picked?.year ? <input type="hidden" name="year" value={String(picked.year)} /> : null}
        {picked?.posterUrl ? <input type="hidden" name="poster_url" value={picked.posterUrl} /> : null}

        <div>
          <label htmlFor="pitch" className="mb-1 block text-xs text-neutral-400">
            Your pitch
          </label>
          <textarea
            id="pitch"
            name="pitch"
            required
            minLength={10}
            maxLength={500}
            rows={5}
            placeholder="Why this film? What should we pay attention to? Where does it fit in our ongoing threads?"
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
          />
          <div className={`mt-1 text-xs ${validPitch ? 'text-neutral-500' : 'text-yellow-300'}`}>
            {helper}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center justify-center rounded-lg bg-olive-500 px-4 py-2 text-sm font-semibold text-neutral-950 transition-colors hover:bg-olive-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-olive-400/40 disabled:opacity-50"
          >
            Submit suggestion
          </button>
          {!picked ? (
            <span className="text-xs text-neutral-500">Pick a film to enable submission.</span>
          ) : null}
        </div>
      </fieldset>
    </form>
  );
};