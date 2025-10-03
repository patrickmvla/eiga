'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Picked = {
  tmdbId: number;
  title: string;
  year?: number | null;
  posterUrl?: string | null;
};

type TMDBMovie = {
  id: number;
  title: string;
  release_date?: string;
  poster_path?: string | null;
};

const posterUrlFor = (path?: string | null) =>
  path ? `https://image.tmdb.org/t/p/w342${path}` : null;

export const TmdbSearch = ({
  onPick,
  disabled = false,
  initial,
}: {
  onPick: (film: Picked | null) => void;
  disabled?: boolean;
  initial?: Picked | null;
}) => {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [picked, setPicked] = useState<Picked | null>(initial ?? null);

  const controllerRef = useRef<AbortController | null>(null);

  const canSearch = useMemo(() => q.trim().length >= 2, [q]);

  useEffect(() => {
    if (!canSearch || disabled || picked) {
      setResults([]);
      setLoading(false);
      setErr(null);
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    const run = async () => {
      try {
        setLoading(true);
        setErr(null);
        // Adjust param name to your /api/tmdb route if needed (query vs. q).
        const url = `/api/tmdb?query=${encodeURIComponent(q.trim())}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`TMDB fetch failed: ${res.status}`);
        const data = await res.json();
        const items: TMDBMovie[] = data.results ?? [];
        setResults(items.slice(0, 8));
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          setErr('Could not fetch results.');
        }
      } finally {
        setLoading(false);
      }
    };

    const id = setTimeout(run, 300); // debounce
    return () => clearTimeout(id);
  }, [q, canSearch, disabled, picked]);

  const handlePick = (m: TMDBMovie) => {
    const year = m.release_date ? Number(m.release_date.slice(0, 4)) : null;
    const selection: Picked = {
      tmdbId: m.id,
      title: m.title,
      year: Number.isFinite(year) ? year : null,
      posterUrl: posterUrlFor(m.poster_path),
    };
    setPicked(selection);
    onPick(selection);
  };

  const clearPick = () => {
    setPicked(null);
    onPick(null);
  };

  return (
    <div className="grid gap-2">
      <label htmlFor="tmdb-search" className="text-xs text-neutral-400">
        Search TMDB
      </label>
      <input
        id="tmdb-search"
        type="search"
        placeholder="Type a film title…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        disabled={disabled || !!picked}
        className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
      />

      {/* Picked preview */}
      {picked ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-olive-500/30 bg-olive-500/10 p-3">
          <div className="min-w-0">
            <div className="truncate text-sm text-neutral-100">
              {picked.title} {picked.year ? <span className="text-neutral-400">({picked.year})</span> : null}
            </div>
            <div className="text-xs text-neutral-400">TMDB ID: {picked.tmdbId}</div>
          </div>
          <button
            type="button"
            onClick={clearPick}
            className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-neutral-200 hover:bg-white/10"
          >
            Clear
          </button>
        </div>
      ) : null}

      {/* Results */}
      {!picked && canSearch ? (
        <div className="rounded-lg border border-white/10 bg-white/5">
          {loading ? (
            <div className="p-3 text-sm text-neutral-400">Searching…</div>
          ) : err ? (
            <div className="p-3 text-sm text-red-300">{err}</div>
          ) : results.length === 0 ? (
            <div className="p-3 text-sm text-neutral-400">No results yet.</div>
          ) : (
            <ul className="max-h-72 divide-y divide-white/10 overflow-auto">
              {results.map((m) => {
                const year = m.release_date ? Number(m.release_date.slice(0, 4)) : null;
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => handlePick(m)}
                      className="flex w-full items-center justify-between gap-3 p-3 text-left hover:bg-white/5"
                    >
                      <span className="truncate text-sm text-neutral-100">
                        {m.title} {Number.isFinite(year) ? <span className="text-neutral-400">({year})</span> : null}
                      </span>
                      <span className="text-xs text-neutral-400">Pick</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
};