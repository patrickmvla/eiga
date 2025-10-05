
// app/(admin)/select-film/page.tsx
import { SelectFilmWizard } from '@/components/admin/SelectFilmWizard';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import Image from 'next/image';
import Link from 'next/link';

import { films, suggestions, users as usersTable } from '@/drizzle/schema';
import { db } from '@/lib/db/client';
import { getCurrentMondayYmd, getNextMondayYmd } from '@/lib/utils/helpers';
import { desc, eq } from 'drizzle-orm';

type Suggestion = {
  id: number;
  tmdbId: number;
  title: string;
  year?: number | null;
  user: string;
  pitch: string;
  weekSuggested: string; // ISO/ymd
  expiresAt: string; // ISO
};

type AdminSelectData = {
  weekStart: string; // current Monday ISO/ymd
  nextMonday: string; // YYYY-MM-DD for input[type="date"]
  upcoming: {
    id: number;
    title: string;
    year: number;
    posterUrl?: string | null;
    weekStart: string; // ISO/ymd
  } | null;
  suggestions: Suggestion[];
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const getParam = (sp: Record<string, string | string[] | undefined>, key: string) => {
  const v = sp?.[key];
  return Array.isArray(v) ? v[0] : v;
};

// Real DB-backed fetch
async function fetchAdminSelectData(): Promise<AdminSelectData> {
  // Current and next week
  const weekStartYmd = getCurrentMondayYmd();
  const nextMondayYmd = getNextMondayYmd();

  // Upcoming film scheduled for next Monday (if any)
  const upcomingRow = await db
    .select({
      id: films.id,
      title: films.title,
      year: films.year,
      posterUrl: films.posterUrl,
      weekStart: films.weekStart,
    })
    .from(films)
    .where(eq(films.weekStart, nextMondayYmd))
    .limit(1)
    .then((r) => r[0] ?? null);

  const upcoming = upcomingRow
    ? {
        id: upcomingRow.id,
        title: upcomingRow.title,
        year: upcomingRow.year,
        posterUrl: upcomingRow.posterUrl ?? null,
        weekStart: String(upcomingRow.weekStart),
      }
    : null;

  // Pending suggestions with usernames, newest first
  const pending = await db
    .select({
      id: suggestions.id,
      tmdbId: suggestions.tmdbId,
      title: suggestions.title,
      pitch: suggestions.pitch,
      weekSuggested: suggestions.weekSuggested,
      createdAt: suggestions.createdAt,
      user: usersTable.username,
    })
    .from(suggestions)
    .innerJoin(usersTable, eq(usersTable.id, suggestions.userId))
    .where(eq(suggestions.status, 'pending'))
    .orderBy(desc(suggestions.createdAt))
    .limit(50);

  const suggestionsMapped: Suggestion[] = pending.map((s) => {
    const ws = String(s.weekSuggested ?? weekStartYmd);
    // Expire 28 days after weekSuggested
    const exp = new Date(ws);
    exp.setDate(exp.getDate() + 28);
    return {
      id: s.id,
      tmdbId: s.tmdbId,
      title: s.title,
      year: undefined,
      user: s.user,
      pitch: s.pitch,
      weekSuggested: ws,
      expiresAt: exp.toISOString(),
    };
  });

  return {
    weekStart: weekStartYmd,
    nextMonday: nextMondayYmd, // matches YYYY-MM-DD for date input
    upcoming,
    suggestions: suggestionsMapped,
  };
}

const Page = async ({ searchParams }: PageProps) => {
  const data = await fetchAdminSelectData();
  const { suggestions, upcoming, nextMonday } = data;

  // Await search params (Next 15)
  const sp = await searchParams;

  // Optional prefill from query (Load into form)
  const prefillTmdbId = getParam(sp, 'tmdbId');
  const prefillTitle = getParam(sp, 'title');
  const prefillYear = getParam(sp, 'year');
  const prefillPoster = getParam(sp, 'posterUrl');

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
                      {/* Direct select */}
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