// app/(admin)/select-film/page.tsx
import Image from "next/image";
import Link from "next/link";

import { SelectFilmWizard } from "@/components/admin/select-film-wizard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";

import { films, suggestions, users as usersTable } from "@/drizzle/schema";
import { db } from "@/lib/db/client";
import { getCurrentMondayYmd, getNextMondayYmd } from "@/lib/utils/helpers";
import { desc, eq } from "drizzle-orm";

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

const getParam = (
  sp: Record<string, string | string[] | undefined>,
  key: string
) => {
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
    .where(eq(suggestions.status, "pending"))
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
  const prefillTmdbId = getParam(sp, "tmdbId");
  const prefillTitle = getParam(sp, "title");
  const prefillYear = getParam(sp, "year");
  const prefillPoster = getParam(sp, "posterUrl");

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
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/manage">Back to Manage</Link>
          </Button>
        }
      />

      {/* Upcoming preview */}
      <Card className="mb-6 border-border bg-card/40">
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Upcoming (draft)
            </div>
            {upcoming ? (
              <div className="mt-1 text-sm text-foreground">
                {upcoming.title}{" "}
                <span className="text-muted-foreground">({upcoming.year})</span>{" "}
                • week of{" "}
                {new Date(upcoming.weekStart).toLocaleDateString("en-US")}
              </div>
            ) : (
              <div className="mt-1 text-sm text-muted-foreground">
                No upcoming film scheduled.
              </div>
            )}
          </div>
          <div className="relative h-14 w-10 overflow-hidden rounded border border-border bg-card/60">
            {upcoming?.posterUrl ? (
              <Image
                src={upcoming.posterUrl}
                alt={`${upcoming.title} poster`}
                fill
                className="object-cover"
              />
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Suggestions queue */}
        <Card className="border-border bg-card/40">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-foreground">
              Suggestions
            </h3>
            {suggestions.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                No suggestions this week.
              </p>
            ) : (
              <div className="mt-3 grid gap-3">
                {suggestions.map((s) => (
                  <div
                    key={s.id}
                    className="grid gap-2 rounded-md border border-border bg-card/60 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-foreground">
                          {s.title}{" "}
                          {s.year ? (
                            <span className="text-muted-foreground">
                              ({s.year})
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          by {s.user} • expires{" "}
                          {new Date(s.expiresAt).toLocaleDateString("en-US")}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {/* Load into form (client prefill via query) */}
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          title="Load into form"
                        >
                          <Link
                            href={`/select-film?tmdbId=${
                              s.tmdbId
                            }&title=${encodeURIComponent(s.title)}${
                              s.year ? `&year=${s.year}` : ""
                            }`}
                          >
                            Load
                          </Link>
                        </Button>
                        {/* Direct select */}
                        <form
                          method="POST"
                          action="/api/admin/suggestions/select"
                        >
                          <input
                            type="hidden"
                            name="suggestion_id"
                            value={s.id}
                          />
                          <Button
                            type="submit"
                            size="sm"
                            title="Select for next week"
                          >
                            Select
                          </Button>
                        </form>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{s.pitch}</p>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Selecting immediately schedules the film for the next cycle.
              “Load” lets you tweak the setup first.
            </p>
          </CardContent>
        </Card>

        {/* Manual search + setup wizard */}
        <Card className="border-border bg-card/40">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-foreground">
              Manual pick and setup
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Search TMDB, then add “The Setup” and schedule the week.
            </p>
            <div className="mt-3">
              <SelectFilmWizard
                defaultWeekStart={nextMonday}
                initialPick={initialPick ?? undefined}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <section className="mt-8">
        <Card className="border-border bg-card/40">
          <CardContent className="p-6">
            <h4 className="text-sm font-semibold text-foreground">
              Programming notes
            </h4>
            <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
              <li>Balance across decades, countries, and forms over time.</li>
              <li>
                One film a week: drops Monday, watch Mon–Thu, discuss Fri–Sun.
              </li>
              <li>
                Members must post a review (100–1000 words) before joining
                threads.
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </>
  );
};

export default Page;
