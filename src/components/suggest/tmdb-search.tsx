/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Film as FilmIcon, ImageOff } from "lucide-react";

type Picked = {
  tmdbId: number;
  title: string;
  year?: number | null;
  posterUrl?: string | null;
};

// API result (SearchMovie) and raw TMDB result, handled together
type ApiMovie = {
  tmdbId: number;
  title: string;
  year: number | null;
  releaseDate: string | null;
  posterPath: string | null;
  posterUrl: string | null;
};
type RawTmdb = {
  id: number;
  title: string;
  release_date?: string | null;
  poster_path?: string | null;
};

type Normalized = {
  id: number;
  title: string;
  year: number | null;
  thumbUrl: string | null; // small grid preview
  posterUrl: string | null; // larger picked preview
};

const posterUrlFor = (
  path?: string | null,
  size: "w92" | "w154" | "w185" | "w342" | "w500" | "w780" | "original" = "w342"
) => {
  if (!path) return null;
  const safePath = path.startsWith("/") ? path : `/${path}`;
  return `https://image.tmdb.org/t/p/${size}${safePath}`;
};

export const TmdbSearch = ({
  onPick,
  disabled = false,
  initial,
}: {
  onPick: (film: Picked | null) => void;
  disabled?: boolean;
  initial?: Picked | null;
}) => {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Normalized[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [picked, setPicked] = useState<Picked | null>(initial ?? null);
  const [brokenIds, setBrokenIds] = useState<Set<number>>(new Set());

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

        const url = `/api/tmdb?query=${encodeURIComponent(q.trim())}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`TMDB fetch failed: ${res.status}`);

        // Our /api/tmdb returns { results: ApiMovie[] }, but support raw too just in case
        const data = await res.json();
        const items: Array<ApiMovie | RawTmdb> = data.results ?? data?.results ?? [];

        const normalized: Normalized[] = [];
        const seen = new Set<number>();

        for (const it of items) {
          // Detect API vs raw shapes
          const isApi = (it as ApiMovie).tmdbId !== undefined;
          const id = isApi ? (it as ApiMovie).tmdbId : (it as RawTmdb).id;
          if (seen.has(id)) continue;
          seen.add(id);

          const title = it.title;
          const year = isApi
            ? (it as ApiMovie).year
            : ((): number | null => {
                const d = (it as RawTmdb).release_date ?? null;
                if (!d) return null;
                const y = Number(String(d).slice(0, 4));
                return Number.isFinite(y) ? y : null;
              })();

          const posterPathApi = (it as ApiMovie).posterPath ?? null;
          const posterPathRaw = (it as RawTmdb).poster_path ?? null;
          const posterUrlApi = (it as ApiMovie).posterUrl ?? null;

          const thumbUrl =
            posterUrlFor(posterPathApi ?? posterPathRaw, "w185") ??
            (isApi ? posterUrlApi : null);
          const posterUrl =
            (isApi ? posterUrlApi : null) ??
            posterUrlFor(posterPathApi ?? posterPathRaw, "w342");

          normalized.push({ id, title, year: year ?? null, thumbUrl, posterUrl });
        }

        setResults(normalized.slice(0, 12));
      } catch (e: any) {
        if (e.name !== "AbortError") {
          setErr("Could not fetch results.");
        }
      } finally {
        setLoading(false);
      }
    };

    const id = setTimeout(run, 300);
    return () => clearTimeout(id);
  }, [q, canSearch, disabled, picked]);

  const handlePick = (n: Normalized) => {
    const selection: Picked = {
      tmdbId: n.id,
      title: n.title,
      year: n.year,
      posterUrl: n.posterUrl,
    };
    setPicked(selection);
    onPick(selection);
  };

  const clearPick = () => {
    setPicked(null);
    onPick(null);
  };

  const onInputKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" && canSearch && results.length > 0) {
      e.preventDefault();
      handlePick(results[0]);
    }
  };

  const markBroken = (id: number) => setBrokenIds((prev) => new Set(prev).add(id));

  return (
    <div className="grid gap-2">
      <Label htmlFor="tmdb-search" className="text-xs text-muted-foreground">
        Search TMDB
      </Label>
      <Input
        id="tmdb-search"
        type="search"
        placeholder="Type a film title…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={onInputKeyDown}
        disabled={disabled || !!picked}
        className="disabled:opacity-60"
      />

      {/* Picked preview */}
      {picked ? (
        <div className="flex items-center justify-between gap-3 rounded-md border border-primary/30 bg-primary/10 p-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded border border-border bg-card/60">
              {picked.posterUrl ? (
                <Image
                  src={picked.posterUrl}
                  alt={`${picked.title} poster`}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <FilmIcon className="h-5 w-5" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm text-foreground">
                {picked.title}{" "}
                {picked.year ? (
                  <span className="text-muted-foreground">({picked.year})</span>
                ) : null}
              </div>
              <div className="text-xs text-muted-foreground">TMDB ID: {picked.tmdbId}</div>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={clearPick} className="h-7 px-2">
            Change
          </Button>
        </div>
      ) : null}

      {/* Results */}
      {!picked && canSearch ? (
        <div className="rounded-md border border-border bg-card/40 p-2">
          {loading ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] w-full animate-pulse rounded-md bg-card/60" />
              ))}
            </div>
          ) : err ? (
            <div className="p-3 text-sm text-destructive">{err}</div>
          ) : results.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground">No results yet.</div>
          ) : (
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4" role="listbox" aria-label="TMDB results">
              {results.map((n) => {
                const broken = brokenIds.has(n.id);
                return (
                  <li key={n.id} role="option" aria-selected="false">
                    <button
                      type="button"
                      onClick={() => handlePick(n)}
                      className="group relative block w-full overflow-hidden rounded-md border border-border bg-card/60"
                      title={n.title}
                    >
                      <div className="relative aspect-[2/3] w-full">
                        {n.thumbUrl && !broken ? (
                          <Image
                            src={n.thumbUrl}
                            alt={`${n.title} poster`}
                            fill
                            sizes="(max-width: 768px) 33vw, 25vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                            onError={() => markBroken(n.id)}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-card/60 text-muted-foreground">
                            <ImageOff className="h-6 w-6" />
                          </div>
                        )}
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2">
                          <div className="truncate text-xs font-medium text-foreground">{n.title}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {Number.isFinite(n.year) ? `(${n.year})` : ""}
                          </div>
                        </div>
                        <div className="pointer-events-none absolute right-1 top-1 rounded-full border border-border bg-black/40 px-2 py-0.5 text-[10px] text-foreground opacity-0 backdrop-blur transition-opacity duration-200 group-hover:opacity-100">
                          Pick
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-2 text-right text-[10px] text-muted-foreground">Covers from TMDB</div>
        </div>
      ) : null}
    </div>
  );
};