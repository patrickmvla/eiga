// app/(members)/films/page.tsx
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { MemberFilmCard } from '@/components/films/MemberFilmCard';
import { FilterBar } from '@/components/films/FilterBar';
import { Paginator } from '@/components/films/Paginator';
import {
  perPage,
  applyFilters,
  applySort,
  getParam,
  getParamArray,
  toNum,
} from '@/components/films/utils';
import type { FilmItem } from '@/components/films/types';

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/utils';
import { getMemberFilms, type MemberFilmsSort, type MemberFilmsFilter } from '@/lib/db/queries';

export const revalidate = 600;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const Page = async ({ searchParams }: PageProps) => {
  const session = await auth();
  if (!session?.user) {
    redirect('/login?callbackUrl=/films');
  }

  // Await params (Next 15)
  const sp = await searchParams;

  // Params
  const q = getParam(sp, 'q', '')!;
  const sort = (getParam(sp, 'sort', 'recent') ?? 'recent') as MemberFilmsSort;
  const filter = (getParam(sp, 'filter', 'all') ?? 'all') as MemberFilmsFilter;
  const decade = getParam(sp, 'decade', 'all')!;
  const genre = getParam(sp, 'genre', 'all')!;
  const country = getParam(sp, 'country', 'all')!;
  const min = toNum(getParam(sp, 'min'), 1);
  const max = toNum(getParam(sp, 'max'), 10);
  const page = Math.max(1, Math.floor(toNum(getParam(sp, 'page'), 1)));

  // searchIn: accept multiple ?in= OR a compact comma string
  const inMulti = getParamArray(sp, 'in');
  const searchIn =
    inMulti.length > 0 ? inMulti : (getParam(sp, 'in', '') ?? '').split(',').filter(Boolean);

  // Try DB query first (DB supports q/filter/decade/sort/page/perPage)
  const decadeOpt = decade !== 'all' && /^\d{4}$/.test(decade) ? Number(decade) : ('all' as const);

  const dbResult = await getMemberFilms(session.user.id, {
    q,
    filter,
    decade: decadeOpt,
    sort,
    page,
    perPage,
  }).catch(() => null);

  let total = 0;
  let items: FilmItem[] = [];

  if (dbResult) {
    total = dbResult.total;
    // Map DB items to FilmItem shape expected by MemberFilmCard
    items = dbResult.items.map((it) => ({
      id: it.id,
      title: it.title,
      year: it.year,
      director: it.director,
      posterUrl: it.posterUrl,
      avgScore: it.avgScore ?? null,
      dissent: it.dissent ?? null,
      myScore: it.myScore ?? null,
      genres: [] as string[],
      country: '—',
    }));
  } else {
    // Fallback: no DB — show empty result set (no MOCK reference)
    const base: FilmItem[] = [];
    const filtered = applyFilters(base, {
      q,
      searchIn,
      filter,
      decade,
      genre,
      country,
      min,
      max,
    });
    const sorted = applySort(filtered, sort);
    total = sorted.length;
    const start = (page - 1) * perPage;
    items = sorted.slice(start, start + perPage);
  }

  return (
    <>
      <SectionHeader
        title="Films"
        subtitle="Archive of all films and member discussions."
        action={
          <ButtonLink href="/suggest" variant="outline" size="md">
            Suggest a film
          </ButtonLink>
        }
      />

      <Card padding="lg" className="mb-6">
        <FilterBar
          q={q}
          sort={sort}
          filter={filter}
          decade={decade}
          genre={genre}
          country={country}
          min={min}
          max={max}
          searchIn={searchIn}
          basePath="/films"
        />
        <p className="mt-3 text-xs text-neutral-500">
          Search scopes include titles/years/directors by default; you can also search member reviews and discussion content.
        </p>
      </Card>

      {items.length === 0 ? (
        <Card padding="lg" className="text-center text-sm text-neutral-400">
          No films match your filters. Try adjusting your search.
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {items.map((film) => (
            <MemberFilmCard key={film.id} film={film} />
          ))}
        </div>
      )}

      <Paginator
        page={page}
        total={total}
        perPage={perPage}
        basePath="/films"
        params={{
          q,
          sort,
          filter,
          decade,
          genre,
          country,
          min: String(min),
          max: String(max),
          in: searchIn.join(','), // compact preserve
        }}
      />
    </>
  );
};

export default Page;