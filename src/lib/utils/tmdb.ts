// lib/utils/tmdb.ts

type PosterSize = 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original';
type BackdropSize = 'w300' | 'w780' | 'w1280' | 'original';
type ProfileSize = 'w45' | 'w185' | 'h632' | 'original';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p/';

const READ_TOKEN = process.env.TMDB_READ_ACCESS_TOKEN;
const API_KEY = process.env.TMDB_API_KEY;

export const TMDB_ENABLED = Boolean(READ_TOKEN || API_KEY);

// Simple in-memory cache (dev-friendly)
type CacheEntry<T> = { data: T; exp: number };
const cache = new Map<string, CacheEntry<unknown>>();

const cacheGet = <T>(key: string): T | undefined => {
  const e = cache.get(key);
  if (!e) return undefined;
  if (Date.now() > e.exp) {
    cache.delete(key);
    return undefined;
  }
  return e.data as T;
};
const cacheSet = <T>(key: string, data: T, ttlMs: number) => {
  cache.set(key, { data, exp: Date.now() + ttlMs });
};
const withCache = async <T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> => {
  const hit = cacheGet<T>(key);
  if (hit !== undefined) return hit;
  const data = await fetcher();
  cacheSet(key, data, ttlMs);
  return data;
};

const toSearchParams = (params?: Record<string, string | number | boolean | undefined>) => {
  const sp = new URLSearchParams();
  if (!params) return sp;
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    sp.set(k, String(v));
  }
  if (!READ_TOKEN && API_KEY) sp.set('api_key', API_KEY);
  return sp;
};

const tmdbFetch = async <T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> => {
  if (!TMDB_ENABLED) throw new Error('TMDB is not configured. Set TMDB_READ_ACCESS_TOKEN or TMDB_API_KEY.');

  const sp = toSearchParams(params);
  const url = `${TMDB_BASE}${path}${sp.toString() ? `?${sp.toString()}` : ''}`;

  const res = await fetch(url, {
    headers: READ_TOKEN
      ? { Accept: 'application/json', Authorization: `Bearer ${READ_TOKEN}` }
      : { Accept: 'application/json' },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`TMDB ${res.status} ${res.statusText}: ${text || url}`);
  }
  return (await res.json()) as T;
};

// ——— Image helpers (hardened) ———
const joinImg = (size: string, path?: string | null): string | null => {
  if (!path) return null;
  // TMDB paths should start with "/", ensure it for safety
  const safePath = path.startsWith('/') ? path : `/${path}`;
  // TMDB_IMG_BASE already ends with "/"
  return `${TMDB_IMG_BASE}${size}${safePath}`;
};

export const buildPosterUrl = (path?: string | null, size: PosterSize = 'w342'): string | null =>
  joinImg(size, path);

export const buildBackdropUrl = (path?: string | null, size: BackdropSize = 'w780'): string | null =>
  joinImg(size, path);

export const buildProfileUrl = (path?: string | null, size: ProfileSize = 'w185'): string | null =>
  joinImg(size, path);

// Convenience best sizes
export const bestPoster = (posterPath?: string | null): string | null =>
  buildPosterUrl(posterPath, 'w342');

// ——— Parsing helpers ———
const parseYear = (dateStr?: string | null): number | null => {
  if (!dateStr) return null;
  const y = Number(String(dateStr).slice(0, 4));
  return Number.isFinite(y) ? y : null;
};

// Types (subset)
type TmdbMovieSearchItem = {
  id: number;
  title: string;
  release_date?: string | null;
  poster_path?: string | null;
  original_title?: string | null;
};

type TmdbMovieSearchResponse = {
  page: number;
  results: TmdbMovieSearchItem[];
  total_pages: number;
  total_results: number;
};

type TmdbPersonSearchItem = {
  id: number;
  name: string;
  profile_path?: string | null;
  known_for_department?: string | null;
  popularity?: number;
};

type TmdbPersonSearchResponse = {
  page: number;
  results: TmdbPersonSearchItem[];
  total_pages: number;
  total_results: number;
};

type TmdbGenre = { id: number; name: string };
type TmdbCountry = { iso_3166_1: string; name: string };

type TmdbCredits = {
  cast: { name: string; order: number }[];
  crew: { name: string; job: string; department?: string }[];
};

type TmdbVideo = {
  key: string;
  site: string;     // 'YouTube', etc.
  type: string;     // 'Trailer', 'Teaser', etc.
  official?: boolean;
  published_at?: string;
  name: string;
};
type TmdbVideos = { results: TmdbVideo[] };

type TmdbMovieDetailsResponse = {
  id: number;
  title: string;
  original_title?: string | null;
  release_date?: string | null;
  runtime?: number | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  genres?: TmdbGenre[];
  production_countries?: TmdbCountry[];
  credits?: TmdbCredits;
  videos?: TmdbVideos; // when appended
};

// Public return types
export type SearchMovie = {
  tmdbId: number;
  title: string;
  year: number | null;
  releaseDate: string | null;
  posterPath: string | null;
  posterUrl: string | null;
};

export type SearchPerson = {
  tmdbId: number;
  name: string;
  profilePath: string | null;
  profileUrl: string | null;
  knownFor: string | null;
};

export type MovieDetails = {
  tmdbId: number;
  title: string;
  originalTitle: string | null;
  year: number | null;
  releaseDate: string | null;
  runtime: number | null;
  posterPath: string | null;
  posterUrl: string | null;
  backdropPath: string | null;
  backdropUrl: string | null;
  genres: string[];
  countries: string[]; // ISO-3166-1
  directors: string[];
  cast: string[];
  // Optional when append includes 'videos'
  videos?: {
    key: string;
    site: string;
    type: string;
    official: boolean;
    publishedAt: string | null;
    name: string;
  }[];
  trailerUrl?: string | null;
};

// API: search movies
export const searchMovies = async (q: string, opts?: {
  year?: number;
  page?: number;
  includeAdult?: boolean;
  language?: string;
}): Promise<SearchMovie[]> => {
  const query = q.trim();
  if (!query) return [];

  const params = {
    query,
    include_adult: Boolean(opts?.includeAdult ?? false),
    page: Math.max(1, Math.min(100, opts?.page ?? 1)),
    language: opts?.language ?? 'en-US',
    year: opts?.year ? Number(opts.year) : undefined,
  };

  const key = `search:${params.language}:${params.year || 'any'}:${params.page}:${query.toLowerCase()}`;
  return withCache<SearchMovie[]>(key, 1000 * 30, async () => {
    const data = await tmdbFetch<TmdbMovieSearchResponse>('/search/movie', params);
    return (data.results ?? []).slice(0, 10).map((m) => {
      const year = parseYear(m.release_date);
      const posterUrl = buildPosterUrl(m.poster_path, 'w342'); // now hardened
      return {
        tmdbId: m.id,
        title: m.title,
        year,
        releaseDate: m.release_date ?? null,
        posterPath: m.poster_path ?? null,
        posterUrl,
      };
    });
  });
};

// API: search people
export const searchPerson = async (q: string, opts?: {
  page?: number;
  includeAdult?: boolean;
  language?: string;
}): Promise<SearchPerson[]> => {
  const query = q.trim();
  if (!query) return [];

  const params = {
    query,
    include_adult: Boolean(opts?.includeAdult ?? false),
    page: Math.max(1, Math.min(100, opts?.page ?? 1)),
    language: opts?.language ?? 'en-US',
  };

  const key = `person:${params.language}:${params.page}:${query.toLowerCase()}`;
  return withCache<SearchPerson[]>(key, 1000 * 30, async () => {
    const data = await tmdbFetch<TmdbPersonSearchResponse>('/search/person', params);
    return (data.results ?? []).slice(0, 5).map((p) => {
      const profileUrl = buildProfileUrl(p.profile_path, 'w185'); // now hardened
      return {
        tmdbId: p.id,
        name: p.name,
        profilePath: p.profile_path ?? null,
        profileUrl,
        knownFor: p.known_for_department ?? null,
      };
    });
  });
};

// API: movie details (+ optional append_to_response)
export const getMovieDetails = async (
  tmdbId: number,
  opts?: { language?: string; append?: string[] }
): Promise<MovieDetails> => {
  const id = Number(tmdbId);
  if (!Number.isFinite(id) || id <= 0) throw new Error('Invalid TMDB id');

  // Always include credits; merge with caller's append list
  const appendSet = new Set([...(opts?.append ?? []), 'credits']);
  const append = Array.from(appendSet).join(',');

  const params = {
    language: opts?.language ?? 'en-US',
    append_to_response: append,
  };

  const key = `movie:${id}:${params.language}:${append}`;
  const data = await withCache<TmdbMovieDetailsResponse>(key, 1000 * 60 * 5, () =>
    tmdbFetch<TmdbMovieDetailsResponse>(`/movie/${id}`, params)
  );

  const directors =
    data.credits?.crew?.filter((c) => c.job === 'Director').map((c) => c.name).slice(0, 3) ?? [];

  const cast =
    data.credits?.cast?.sort((a, b) => a.order - b.order).slice(0, 5).map((c) => c.name) ?? [];

  const posterUrl = buildPosterUrl(data.poster_path, 'w500');
  const backdropUrl = buildBackdropUrl(data.backdrop_path, 'w780');

  let videos: MovieDetails['videos'] | undefined;
  let trailerUrl: string | null | undefined;

  if (appendSet.has('videos') && data.videos?.results) {
    videos = data.videos.results.map((v) => ({
      key: v.key,
      site: v.site,
      type: v.type,
      official: Boolean(v.official),
      publishedAt: v.published_at ?? null,
      name: v.name,
    }));

    const yt = data.videos.results.filter((v) => v.site === 'YouTube');
    const pick =
      yt.find((v) => v.type === 'Trailer' && v.official) ||
      yt.find((v) => v.type === 'Trailer') ||
      yt[0];
    trailerUrl = pick ? `https://www.youtube.com/watch?v=${pick.key}` : null;
  }

  return {
    tmdbId: data.id,
    title: data.title,
    originalTitle: data.original_title ?? null,
    year: parseYear(data.release_date),
    releaseDate: data.release_date ?? null,
    runtime: typeof data.runtime === 'number' ? data.runtime : null,
    posterPath: data.poster_path ?? null,
    posterUrl,
    backdropPath: data.backdrop_path ?? null,
    backdropUrl,
    genres: (data.genres ?? []).map((g) => g.name),
    countries: (data.production_countries ?? []).map((c) => c.iso_3166_1),
    directors,
    cast,
    videos,
    trailerUrl,
  };
};