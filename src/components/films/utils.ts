// components/films/utils.ts
import type { FilmItem } from './types';

export const perPage = 24;

export const getParam = (
  sp: Record<string, string | string[] | undefined> | undefined,
  key: string,
  fallback?: string
) => {
  const v = sp?.[key];
  const out = Array.isArray(v) ? v[0] : v;
  return out ?? fallback;
};

export const getParamArray = (
  sp: Record<string, string | string[] | undefined> | undefined,
  key: string
) => {
  const v = sp?.[key];
  return Array.isArray(v) ? v : v ? [v] : [];
};

export const toNum = (v: string | undefined, def: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

export const buildQuery = (params: Record<string, string | undefined>) => {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v && v.length) usp.set(k, v);
  });
  const q = usp.toString();
  return q ? `?${q}` : '';
};

export const applyFilters = (
  items: FilmItem[],
  opts: {
    q: string;
    searchIn: string[]; // ['titles','reviews','discussions']
    filter: 'all' | 'consensus' | 'controversial';
    decade: string; // 'all' or '1990'
    genre: string; // 'all' or name
    country: string; // 'all' or code
    min: number;
    max: number;
  }
) => {
  const needle = opts.q.toLowerCase().trim();
  let out = items.filter((f) => f.avgScore >= opts.min && f.avgScore <= opts.max);

  if (opts.filter === 'consensus') out = out.filter((f) => f.dissent < 1.2);
  if (opts.filter === 'controversial') out = out.filter((f) => f.dissent > 2.0);

  if (opts.decade !== 'all') {
    const base = parseInt(opts.decade, 10);
    if (!Number.isNaN(base)) out = out.filter((f) => f.year >= base && f.year < base + 10);
  }
  if (opts.genre !== 'all') out = out.filter((f) => f.genres.includes(opts.genre));
  if (opts.country !== 'all') out = out.filter((f) => f.country === opts.country);

  if (needle) {
    const searchTitles = !opts.searchIn.length || opts.searchIn.includes('titles');
    const searchReviews = opts.searchIn.includes('reviews');
    const searchDiscussions = opts.searchIn.includes('discussions');

    out = out.filter((f) => {
      const inTitle =
        searchTitles &&
        (f.title.toLowerCase().includes(needle) ||
          (f.director ?? '').toLowerCase().includes(needle) ||
          String(f.year).includes(needle));
      const inReviews =
        searchReviews && (f.reviewsSample ?? []).some((t) => t.toLowerCase().includes(needle));
      const inDiscuss =
        searchDiscussions && (f.discussionsSample ?? []).some((t) => t.toLowerCase().includes(needle));
      return inTitle || inReviews || inDiscuss;
    });
  }

  return out;
};

export const applySort = (
  items: FilmItem[],
  sort: 'recent' | 'rating' | 'dissent' | 'alpha' | 'oldest'
) => {
  const arr = [...items];
  switch (sort) {
    case 'rating':
      return arr.sort((a, b) => b.avgScore - a.avgScore || b.year - a.year);
    case 'dissent':
      return arr.sort((a, b) => b.dissent - a.dissent || b.year - a.year);
    case 'alpha':
      return arr.sort((a, b) => a.title.localeCompare(b.title));
    case 'oldest':
      return arr.sort((a, b) => a.year - b.year || a.title.localeCompare(b.title));
    case 'recent':
    default:
      return arr.sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
  }
};