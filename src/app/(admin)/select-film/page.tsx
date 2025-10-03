// app/(admin)/select-film/page.tsx
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { SelectFilmWizard } from '@/components/admin/SelectFilmWizard';

type Suggestion = {
  id: number;
  tmdbId: number;
  title: string;
  year?: number | null;
  user: string;
  pitch: string;
  weekSuggested: string; // ISO
  expiresAt: string; // ISO
};

type AdminSelectData = {
  weekStart: string; // current Monday ISO
  nextMonday: string; // YYYY-MM-DD for convenience
  upcoming: {
    id: number;
    title: string;
    year: number;
    posterUrl?: string | null;
    weekStart: string; // ISO
  } | null;
  suggestions: Suggestion[];
};

// Mock fetch — replace with DB queries
const fetchAdminSelectData = async (): Promise<AdminSelectData> => {
  const now = new Date();
  const day = now.getDay(); // 0 Sun, 1 Mon
  const monday = new Date(now);
  const diffToMon = ((day + 6) % 7);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - diffToMon);

  const nextMonDate = new Date(monday);
  nextMonDate.setDate(monday.getDate() + 7);

  // ISO date string for input[type="date"]
  const yyyy = nextMonDate.getFullYear();
  const mm = String(nextMonDate.getMonth() + 1).padStart(2, '0');
  const dd = String(nextMonDate.getDate()).padStart(2, '0');
  const nextMonday = `${yyyy}-${mm}-${dd}`;

  const in21 = new Date(monday);
  in21.setDate(monday.getDate() + 21);

  return {
    weekStart: monday.toISOString(),
    nextMonday,
    upcoming: {
      id: 999,
      title: 'Placeholder Upcoming',
      year: 1974,
      posterUrl: '/images/mock-1.jpg',
      weekStart: nextMonDate.toISOString(),
    },
    suggestions: [
      {
        id: 1,
        tmdbId: 37797,
        title: 'La Cérémonie',
        year: 1995,
        user: 'agnes',
        pitch:
          'Class, literacy, and power refracted through performance—ties into our surveillance/secrets thread.',
        weekSuggested: monday.toISOString(),
        expiresAt: in21.toISOString(),
      },
      {
        id: 2,
        tmdbId: 14161,
        title: 'Beau Travail',
        year: 1999,
        user: 'claire',
        pitch:
          'Bodies as choreography; masculinity under discipline; final dance as thesis. A formal pivot.',
        weekSuggested: monday.toISOString(),
        expiresAt: in21.toISOString(),
      },
      {
        id: 3,
        tmdbId: 807,
        title: 'Seven Samurai',
        year: 1954,
        user: 'akira',
        pitch:
          'On structure and ensemble dynamics—connects to communal ethics and action form.',
        weekSuggested: monday.toISOString(),
        expiresAt: in21.toISOString(),
      },
    ],
  };
};

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const getParam = (sp: PageProps['searchParams'], key: string) => {
  const v = sp?.[key];
  return Array.isArray(v) ? v[0] : v;
};

const Page = async ({ searchParams }: PageProps) => {
  const data = await fetchAdminSelectData();
  const { suggestions, upcoming, nextMonday } = data;

  // Optional prefill from query (Load into form)
  const prefillTmdbId = getParam(searchParams, 'tmdbId');
  const prefillTitle = getParam(searchParams, 'title');
  const prefillYear = getParam(searchParams, 'year');
  const prefillPoster = getParam(searchParams, 'posterUrl');

  const initialPick =
    prefillTmdbId && prefillTitle
      ? {
          tmdbId: Number(prefillTmdbId),
          title: prefillTitle,
          year: prefillYear ? Number(prefillYear) : undefined,
          posterUrl: prefillPoster,
        }
      : null;

  return (
    <>
      <SectionHeader
        title="Select next week’s film"
        subtitle="Pick from suggestions or search TMDB, add your setup, and schedule the drop."
        action={<ButtonLink href="/manage" variant="outline" size="md">Back to Manage</ButtonLink>}
      />

      {/* Upcoming preview */}
      <Card padding="lg" className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-neutral-400">Upcoming (draft)</div>
            {upcoming ? (
              <div className="mt-1 text-sm text-neutral-200">
                {upcoming.title} <span className="text-neutral-400">({upcoming.year})</span> • week of{' '}
                {new Date(upcoming.weekStart).toLocaleDateString()}
              </div>
            ) : (
              <div className="mt-1 text-sm text-neutral-400">No upcoming film scheduled.</div>
            )}
          </div>
          <div className="relative h-14 w-10 overflow-hidden rounded border border-white/10 bg-neutral-900/60">
            {upcoming?.posterUrl ? (
              <Image src={upcoming.posterUrl} alt={`${upcoming.title} poster`} fill className="object-cover" />
            ) : null}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Suggestions queue */}
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-neutral-100">Suggestions</h3>
          {suggestions.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-400">No suggestions this week.</p>
          ) : (
            <div className="mt-3 grid gap-3">
              {suggestions.map((s) => (
                <div key={s.id} className="grid gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">
                        {s.title} {s.year ? <span className="text-neutral-400">({s.year})</span> : null}
                      </div>
                      <div className="mt-0.5 text-xs text-neutral-500">
                        by {s.user} • expires {new Date(s.expiresAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {/* Load into form (client prefill via query) */}
                      <Link
                        href={`/select-film?tmdbId=${s.tmdbId}&title=${encodeURIComponent(s.title)}${
                          s.year ? `&year=${s.year}` : ''
                        }`}
                        className="rounded-md border border-olive-500/30 bg-olive-500/10 px-3 py-1.5 text-xs text-olive-200 hover:bg-olive-500/20"
                        title="Load into form"
                      >
                        Load
                      </Link>
                      {/* Direct select (server action placeholder) */}
                      <form method="POST" action="/api/admin/suggestions/select">
                        <input type="hidden" name="suggestion_id" value={s.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center rounded-md bg-olive-500 px-3 py-1.5 text-xs font-semibold text-neutral-950 transition-colors hover:bg-olive-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-olive-400/40"
                          title="Select for next week"
                        >
                          Select
                        </button>
                      </form>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-300">{s.pitch}</p>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-neutral-500">
            Selecting immediately schedules the film for the next cycle. “Load” lets you tweak the setup first.
          </p>
        </Card>

        {/* Manual search + setup wizard */}
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-neutral-100">Manual pick and setup</h3>
          <p className="mt-1 text-xs text-neutral-500">
            Search TMDB, then add “The Setup” and schedule the week.
          </p>
          <div className="mt-3">
            <SelectFilmWizard defaultWeekStart={nextMonday} initialPick={initialPick ?? undefined} />
          </div>
        </Card>
      </div>

      {/* Tips */}
      <section className="mt-8">
        <Card padding="lg">
          <h4 className="text-sm font-semibold text-neutral-100">Programming notes</h4>
          <ul className="mt-2 list-disc pl-5 text-sm text-neutral-300">
            <li>Balance across decades, countries, and forms over time.</li>
            <li>One film a week: drops Monday, watch Mon–Thu, discuss Fri–Sun.</li>
            <li>Members must post a review (100–1000 words) before joining threads.</li>
          </ul>
        </Card>
      </section>
    </>
  );
};

export default Page;