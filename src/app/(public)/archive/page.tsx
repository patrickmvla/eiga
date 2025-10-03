// app/(public)/archive/page.tsx
import Link from 'next/link';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui/ButtonLink';

import {
  getPublicArchive,
  type PublicArchiveItem,
  type ArchiveSort,
  type ArchiveFilter,
} from '@/lib/db/queries';

export const revalidate = 3600;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const perPage = 24;

const getParam = (
  sp: Record<string, string | string[] | undefined> | undefined,
  key: string,
  fallback = ''
) => {
  const v = sp?.[key];
  return Array.isArray(v) ? (v[0] ?? fallback) : (v ?? fallback);
};

const toInt = (val: string | undefined, def: number) => {
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
};

const buildQuery = (params: Record<string, string | undefined>) => {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v && v.length) usp.set(k, v);
  });
  const q = usp.toString();
  return q ? `?${q}` : '';
};

// Fallback mock data used only if DB query fails
const MOCK_ARCHIVE: PublicArchiveItem[] = [
  { id: 201, title: 'The Conversation', year: 1974, avgScore: 8.6, dissent: 1.2, reviewsCount: 9 },
  { id: 202, title: 'Celine and Julie Go Boating', year: 1974, avgScore: 7.9, dissent: 2.1, reviewsCount: 8 },
  { id: 203, title: 'Memories of Murder', year: 2003, avgScore: 8.8, dissent: 0.9, reviewsCount: 9 },
  { id: 204, title: 'The Red Shoes', year: 1948, avgScore: 8.2, dissent: 1.7, reviewsCount: 10 },
  { id: 205, title: 'A Brighter Summer Day', year: 1991, avgScore: 8.9, dissent: 1.0, reviewsCount: 9 },
  { id: 206, title: 'The Ascent', year: 1977, avgScore: 8.1, dissent: 2.3, reviewsCount: 7 },
  { id: 207, title: 'La Cérémonie', year: 1995, avgScore: 7.7, dissent: 2.6, reviewsCount: 8 },
  { id: 208, title: 'Killer of Sheep', year: 1978, avgScore: 8.0, dissent: 1.5, reviewsCount: 9 },
  { id: 209, title: 'In the Mood for Love', year: 2000, avgScore: 9.1, dissent: 1.3, reviewsCount: 10 },
  { id: 210, title: 'The Mirror', year: 1975, avgScore: 8.3, dissent: 2.0, reviewsCount: 8 },
  { id: 211, title: 'Mulholland Dr.', year: 2001, avgScore: 8.7, dissent: 2.2, reviewsCount: 9 },
  { id: 212, title: 'Stalker', year: 1979, avgScore: 8.4, dissent: 1.8, reviewsCount: 9 },
  { id: 213, title: 'Persona', year: 1966, avgScore: 8.5, dissent: 2.4, reviewsCount: 9 },
  { id: 214, title: 'Seven Samurai', year: 1954, avgScore: 9.0, dissent: 1.1, reviewsCount: 10 },
  { id: 215, title: 'The Godfather', year: 1972, avgScore: 9.2, dissent: 0.8, reviewsCount: 10 },
  { id: 216, title: 'The Tree of Life', year: 2011, avgScore: 7.8, dissent: 2.8, reviewsCount: 7 },
  { id: 217, title: 'Moonlight', year: 2016, avgScore: 8.5, dissent: 1.2, reviewsCount: 9 },
  { id: 218, title: 'Parasite', year: 2019, avgScore: 8.9, dissent: 1.4, reviewsCount: 10 },
  { id: 219, title: 'Jeanne Dielman, 23, quai du Commerce, 1080 Bruxelles', year: 1975, avgScore: 8.1, dissent: 2.5, reviewsCount: 8 },
  { id: 220, title: 'Beau Travail', year: 1999, avgScore: 8.2, dissent: 2.0, reviewsCount: 8 },
];

// Fallback helpers
const applyFiltersLocal = (
  items: PublicArchiveItem[],
  {
    q,
    filter,
    decade,
  }: { q: string; filter: ArchiveFilter; decade: string }
) => {
  let out = items;
  if (q) {
    const needle = q.toLowerCase();
    out = out.filter((f) => f.title.toLowerCase().includes(needle));
  }
  if (filter === 'consensus') out = out.filter((f) => (f.dissent ?? 0) < 1.2);
  if (filter === 'controversial') out = out.filter((f) => (f.dissent ?? 0) > 2.0);
  if (decade && decade !== 'all') {
    const base = parseInt(decade, 10);
    if (!Number.isNaN(base)) out = out.filter((f) => f.year >= base && f.year < base + 10);
  }
  return out;
};

const applySortLocal = (items: PublicArchiveItem[], sort: ArchiveSort) => {
  const arr = [...items];
  switch (sort) {
    case 'rating':
      return arr.sort((a, b) => (b.avgScore ?? -Infinity) - (a.avgScore ?? -Infinity) || b.year - a.year);
    case 'dissent':
      return arr.sort((a, b) => (b.dissent ?? -Infinity) - (a.dissent ?? -Infinity) || b.year - a.year);
    case 'alpha':
      return arr.sort((a, b) => a.title.localeCompare(b.title));
    case 'oldest':
      return arr.sort((a, b) => a.year - b.year || a.title.localeCompare(b.title));
    case 'recent':
    default:
      return arr.sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
  }
};

const FilmRow = ({ film }: { film: PublicArchiveItem }) => (
  <Card padding="md" className="flex items-center justify-between gap-4">
    <div className="min-w-0">
      <div className="truncate text-sm font-semibold text-white">{film.title}</div>
      <div className="mt-0.5 text-xs text-neutral-400">
        {film.year} • {film.reviewsCount}/10 reviews
      </div>
    </div>
    <div className="flex shrink-0 items-center gap-2">
      <span className="inline-flex items-center gap-1 rounded-md border border-olive-500/20 bg-olive-500/10 px-2 py-1 text-xs text-olive-300">
        <span className="tabular-nums">
          {typeof film.avgScore === 'number' ? film.avgScore.toFixed(1) : '—'}
        </span>
        <span className="text-neutral-400">avg</span>
      </span>
      <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-neutral-200">
        <span className="tabular-nums">
          {typeof film.dissent === 'number' ? film.dissent.toFixed(1) : '—'}
        </span>
        <span className="text-neutral-400">dissent</span>
      </span>
    </div>
  </Card>
);

const FilterBar = ({
  q,
  sort,
  filter,
  decade,
}: {
  q: string;
  sort: ArchiveSort;
  filter: ArchiveFilter;
  decade: string;
}) => {
  const decades = ['all', '1950', '1960', '1970', '1980', '1990', '2000', '2010', '2020'];
  return (
    <form method="GET" className="flex flex-col gap-3 md:flex-row md:items-end">
      <div className="flex-1">
        <label htmlFor="q" className="mb-1 block text-xs text-neutral-400">
          Search
        </label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          placeholder="Search title…"
          className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
        />
      </div>

      <div className="grid grid-cols-3 gap-3 md:w-auto">
        <div>
          <label htmlFor="sort" className="mb-1 block text-xs text-neutral-400">
            Sort
          </label>
          <select
            id="sort"
            name="sort"
            defaultValue={sort}
            className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
          >
            <option value="recent">Most recent</option>
            <option value="rating">Highest rated</option>
            <option value="dissent">Most controversial</option>
            <option value="alpha">A–Z</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>

        <div>
          <label htmlFor="filter" className="mb-1 block text-xs text-neutral-400">
            Filter
          </label>
          <select
            id="filter"
            name="filter"
            defaultValue={filter}
            className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
          >
            <option value="all">All</option>
            <option value="consensus">Consensus</option>
            <option value="controversial">Controversial</option>
          </select>
        </div>

        <div>
          <label htmlFor="decade" className="mb-1 block text-xs text-neutral-400">
            Decade
          </label>
          <select
            id="decade"
            name="decade"
            defaultValue={decade}
            className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
          >
            {decades.map((d) => (
              <option key={d} value={d}>
                {d === 'all' ? 'All decades' : `${d}s`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 md:ml-2">
        <ButtonLink href="/archive" variant="ghost" size="md" ariaLabel="Reset filters">
          Reset
        </ButtonLink>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-lg bg-olive-500 px-4 py-2 text-sm font-semibold text-neutral-950 transition-colors hover:bg-olive-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-olive-400/40"
        >
          Apply
        </button>
      </div>
    </form>
  );
};

const Paginator = ({
  page,
  total,
  q,
  sort,
  filter,
  decade,
}: {
  page: number;
  total: number;
  q: string;
  sort: ArchiveSort;
  filter: ArchiveFilter;
  decade: string;
}) => {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  if (totalPages <= 1) return null;

  const prev = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;

  return (
    <div className="mt-6 flex items-center justify-between">
      <div className="text-xs text-neutral-400">
        Page {page} of {totalPages}
      </div>
      <div className="flex items-center gap-2">
        <ButtonLink
          href={`/archive${buildQuery({
            q,
            sort,
            filter,
            decade,
            page: prev ? String(prev) : undefined,
          })}`}
          variant="outline"
          size="sm"
          ariaLabel="Previous page"
          className={prev ? '' : 'pointer-events-none opacity-40'}
        >
          Prev
        </ButtonLink>
        <ButtonLink
          href={`/archive${buildQuery({
            q,
            sort,
            filter,
            decade,
            page: next ? String(next) : undefined,
          })}`}
          variant="outline"
          size="sm"
          ariaLabel="Next page"
          className={next ? '' : 'pointer-events-none opacity-40'}
        >
          Next
        </ButtonLink>
      </div>
    </div>
  );
};

const Page = async ({ searchParams }: PageProps) => {
  // Await the params per Next 15 API
  const sp = await searchParams;

  const q = getParam(sp, 'q');
  const sort = (getParam(sp, 'sort', 'recent') as ArchiveSort) ?? 'recent';
  const filter = (getParam(sp, 'filter', 'all') as ArchiveFilter) ?? 'all';
  const decade = getParam(sp, 'decade', 'all');
  const page = toInt(getParam(sp, 'page'), 1);

  // Try DB first
  const decadeOpt = decade !== 'all' && /^\d{4}$/.test(decade) ? Number(decade) : ('all' as const);
  const result = await getPublicArchive({
    q,
    filter,
    decade: decadeOpt,
    sort,
    page,
    perPage,
  }).catch(() => null);

  let total = 0;
  let items: PublicArchiveItem[] = [];

  if (result) {
    total = result.total;
    items = result.items;
  } else {
    // Fallback (DB not ready)
    const filtered = applyFiltersLocal(MOCK_ARCHIVE, { q, filter, decade });
    const sorted = applySortLocal(filtered, sort);
    total = sorted.length;
    const start = (page - 1) * perPage;
    items = sorted.slice(start, start + perPage);
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 md:py-14">
      <SectionHeader title="Archive" subtitle={`Browse ${total} films discussed by the club`} />

      <Card padding="lg" className="mb-6">
        <FilterBar q={q} sort={sort} filter={filter} decade={decade} />
        <p className="mt-3 text-xs text-neutral-500">
          “Dissent” reflects how divided the group was (standard deviation of scores).
        </p>
      </Card>

      {items.length === 0 ? (
        <Card padding="lg" className="text-center text-sm text-neutral-400">
          No films match your filters. Try adjusting your search or{' '}
          <Link href="/archive" className="text-olive-300 underline underline-offset-4 hover:text-olive-200">
            reset filters
          </Link>
          .
        </Card>
      ) : (
        <div className="grid gap-3">
          {items.map((film) => (
            <FilmRow key={film.id} film={film} />
          ))}
        </div>
      )}

      <Paginator page={page} total={total} q={q} sort={sort} filter={filter} decade={decade} />
    </main>
  );
};

export default Page;