/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(admin)/manage/page.tsx
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import Image from "next/image";
import Link from "next/link";

import {
  films,
  ratings,
  suggestions,
  users as usersTable,
} from "@/drizzle/schema";
import { db } from "@/lib/db/client";
import { CLUB_CAPACITY } from "@/lib/db/queries"; // 10 seats policy
import { getCurrentMondayYmd } from "@/lib/utils/helpers";
import { desc, sql as dsql, eq } from "drizzle-orm";

// Types used by the UI
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

type FlaggedItem =
  | {
      id: number;
      type: "review";
      filmId: number;
      filmTitle: string;
      user: string;
      excerpt: string;
      reason: string;
      createdAt: string;
    }
  | {
      id: number;
      type: "comment";
      filmId: number;
      filmTitle: string;
      user: string;
      content: string;
      hasSpoilers: boolean;
      reason: string;
      createdAt: string;
    };

type Member = {
  id: string;
  username: string;
  name?: string | null;
  avatarUrl?: string | null;
  participationRate: number; // %
  missedWeeks: number;
  isActive: boolean;
};

type AdminManageData = {
  weekStart: string; // Monday 00:00 (YYYY-MM-DD or ISO acceptable for Date())
  currentFilm: {
    id: number;
    title: string;
    year: number;
    director?: string | null;
    runtime?: number | null;
    posterUrl?: string | null;
    adminIntro?: string | null;
    groupAvg?: number | null;
    dissent?: number | null;
  } | null;
  stats: {
    members: number;
    capacity: number;
    watchedCount: number;
    participation: number; // %
  };
  suggestions: Suggestion[];
  flagged: FlaggedItem[];
  members: Member[];
  settings: {
    publicTeasersEnabled: boolean;
    seatsAvailable: number;
  };
};

// Helpers
const formatWindow = (weekStartISO: string) => {
  const start = new Date(weekStartISO);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
  return `${fmt(start)} – ${fmt(end)}`;
};

const computePhase = (weekStartISO: string) => {
  const now = new Date();
  const start = new Date(weekStartISO);
  const fri = new Date(start);
  fri.setDate(start.getDate() + 4); // Fri 00:00
  const nextMon = new Date(start);
  nextMon.setDate(start.getDate() + 7); // Mon 00:00
  if (now < fri) return { phase: "watch" as const, label: "Watching period" };
  if (now < nextMon)
    return { phase: "discussion" as const, label: "Discussion open" };
  return { phase: "ended" as const, label: "Week ended" };
};

const PhaseBadge = ({ phase }: { phase: "watch" | "discussion" | "ended" }) => {
  const map = {
    discussion: "border-olive-500/30 bg-olive-500/10 text-olive-200",
    watch: "border-white/15 bg-white/5 text-neutral-300",
    ended: "border-white/10 bg-white/5 text-neutral-400",
  } as const;
  const text =
    phase === "discussion"
      ? "Discussion open"
      : phase === "watch"
      ? "Watching period"
      : "Week ended";
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs ${map[phase]}`}
    >
      {text}
    </span>
  );
};

const SmallStat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
    <div className="text-xs uppercase tracking-wide text-neutral-400">
      {label}
    </div>
    <div className="mt-1 text-lg font-semibold text-white tabular-nums">
      {value}
    </div>
  </div>
);

const SuggestionRow = ({ s }: { s: Suggestion }) => (
  <div className="grid gap-2 rounded-lg border border-white/10 bg-white/5 p-3 md:grid-cols-[1fr_auto] md:items-center">
    <div>
      <div className="truncate text-sm font-semibold text-white">
        {s.title}{" "}
        {s.year ? <span className="text-neutral-400">({s.year})</span> : null}
      </div>
      <div className="mt-0.5 text-xs text-neutral-500">
        by {s.user} • expires {new Date(s.expiresAt).toLocaleDateString()}
      </div>
      <p className="mt-2 text-sm text-neutral-300">{s.pitch}</p>
    </div>
    <div className="flex shrink-0 items-center justify-end gap-2">
      <form method="POST" action="/api/admin/suggestions/select">
        <input type="hidden" name="suggestion_id" value={s.id} />
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-md bg-olive-500 px-3 py-1.5 text-sm font-semibold text-neutral-950 transition-colors hover:bg-olive-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-olive-400/40"
          title="Select for next week"
        >
          Select
        </button>
      </form>
      <form method="POST" action="/api/admin/suggestions/reject">
        <input type="hidden" name="suggestion_id" value={s.id} />
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
          title="Reject"
        >
          Reject
        </button>
      </form>
    </div>
  </div>
);

const FlaggedCard = ({ item }: { item: FlaggedItem }) => (
  <div className="grid gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
    <div className="flex items-center justify-between">
      <div className="text-xs uppercase tracking-wide text-neutral-400">
        {item.type === "review" ? "Review" : "Comment"} • {item.user} •{" "}
        <Link
          href={`/films/${item.filmId}`}
          className="text-neutral-300 underline-offset-4 hover:text-white hover:underline"
        >
          {item.filmTitle}
        </Link>
      </div>
      <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-[11px] text-yellow-300">
        {item.reason}
      </span>
    </div>
    <div className="text-sm text-neutral-300">
      {item.type === "review" ? (item as any).excerpt : (item as any).content}
    </div>
    <div className="flex items-center justify-end gap-2">
      <form method="POST" action="/api/admin/flags/highlight">
        <input type="hidden" name="item_id" value={item.id} />
        <input type="hidden" name="type" value={item.type} />
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-md border border-olive-500/30 bg-olive-500/10 px-3 py-1.5 text-xs text-olive-200 transition-colors hover:bg-olive-500/15"
        >
          Mark as highlight
        </button>
      </form>
      <form method="POST" action="/api/admin/flags/resolve">
        <input type="hidden" name="item_id" value={item.id} />
        <input type="hidden" name="type" value={item.type} />
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-neutral-200 transition-colors hover:bg-white/10"
        >
          Resolve
        </button>
      </form>
      <form method="POST" action="/api/admin/flags/delete">
        <input type="hidden" name="item_id" value={item.id} />
        <input type="hidden" name="type" value={item.type} />
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-200 transition-colors hover:bg-red-500/20"
        >
          Delete
        </button>
      </form>
    </div>
  </div>
);

const MemberRow = ({ m }: { m: Member }) => (
  <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
    <div className="flex items-center gap-3">
      <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-neutral-900/60">
        {m.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={m.avatarUrl}
            alt={m.username}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-[10px] uppercase text-neutral-300">
            {m.username.slice(0, 2)}
          </span>
        )}
      </span>
      <div>
        <div className="text-sm text-neutral-200">{m.name ?? m.username}</div>
        <div className="text-xs text-neutral-500">
          Participation {m.participationRate}% • Missed {m.missedWeeks}{" "}
          {m.missedWeeks === 1 ? "week" : "weeks"}
        </div>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <form method="POST" action="/api/admin/members/toggle-active">
        <input type="hidden" name="user_id" value={m.id} />
        <input type="hidden" name="set_active" value={m.isActive ? "0" : "1"} />
        <button
          type="submit"
          className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 ${
            m.isActive
              ? "border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20 focus-visible:ring-yellow-400/40"
              : "border border-olive-500/30 bg-olive-500/10 text-olive-200 hover:bg-olive-500/20 focus-visible:ring-olive-400/40"
          }`}
          title={m.isActive ? "Deactivate member" : "Activate member"}
        >
          {m.isActive ? "Deactivate" : "Activate"}
        </button>
      </form>
      <form method="POST" action="/api/admin/members/remove">
        <input type="hidden" name="user_id" value={m.id} />
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-200 transition-colors hover:bg-red-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
          title="Remove from club"
        >
          Remove
        </button>
      </form>
    </div>
  </div>
);

async function fetchAdminManageData(): Promise<AdminManageData> {
  // Current film
  const current = await db
    .select({
      id: films.id,
      title: films.title,
      year: films.year,
      director: films.director,
      runtime: films.runtime,
      posterUrl: films.posterUrl,
      adminNotes: films.adminNotes,
      weekStart: films.weekStart,
    })
    .from(films)
    .orderBy(
      // Explicit enum casts to avoid type ambiguity
      dsql`CASE ${films.status}
          WHEN 'current'::film_status THEN 1
          WHEN 'upcoming'::film_status THEN 2
          ELSE 3
        END`,
      desc(films.weekStart)
    )
    .limit(1)
    .then((r) => r[0] ?? null);

  // Active members
  const membersRow = await db
    .select({ cnt: dsql<number>`CAST(COUNT(*) AS int)` })
    .from(usersTable)
    .where(eq(usersTable.isActive, true))
    .then((r) => r[0]?.cnt ?? 0);

  // Aggregates for current film
  let groupAvg: number | null = null;
  let dissent: number | null = null;
  let watchedCount = 0;

  if (current) {
    const agg = await db
      .select({
        avg: dsql<number | null>`ROUND(AVG(${ratings.score})::numeric, 1)`,
        std: dsql<
          number | null
        >`ROUND(COALESCE(stddev_pop(${ratings.score}), 0)::numeric, 1)`,
        cnt: dsql<number>`CAST(COUNT(*) AS int)`,
      })
      .from(ratings)
      .where(eq(ratings.filmId, current.id))
      .then((r) => r[0]);

    groupAvg = agg?.avg ?? null;
    dissent = agg?.std ?? null;
    watchedCount = agg?.cnt ?? 0;
  }

  const participation =
    membersRow > 0
      ? Math.round((watchedCount / Math.min(membersRow, CLUB_CAPACITY)) * 100)
      : 0;

  // Suggestions (pending)
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
    .limit(25);

  const suggestionsMapped: Suggestion[] = pending.map((s) => {
    const ws =
      typeof s.weekSuggested === "string"
        ? s.weekSuggested
        : getCurrentMondayYmd();
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

  // Members list (basic, with defaulted participation/missed)
  const membersListRows = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      avatarUrl: usersTable.avatarUrl,
      isActive: usersTable.isActive,
    })
    .from(usersTable)
    .orderBy(usersTable.username);

  const membersList: Member[] = membersListRows.map((m) => ({
    id: m.id,
    username: m.username,
    name: null,
    avatarUrl: m.avatarUrl ?? null,
    isActive: m.isActive ?? true,
    participationRate: 0, // not computed historically
    missedWeeks: 0, // requires historical weekly data
  }));

  // Settings: best-effort read from a generic "settings" table (if present)
  let publicTeasersEnabled = true;
  let seatsAvailable = 0;
  try {
    const rows: any = await db.execute(
      dsql`select key, value from "settings" where key in ('publicTeasersEnabled','seatsAvailable')`
    );
    const arr: Array<{ key: string; value: string }> = Array.isArray(rows)
      ? (rows as any)
      : (rows as any).rows ?? [];
    for (const r of arr) {
      if (r.key === "publicTeasersEnabled") {
        const v = String(r.value).toLowerCase();
        publicTeasersEnabled = ["1", "true", "on", "yes"].includes(v);
      }
      if (r.key === "seatsAvailable") {
        const n = Number(r.value);
        seatsAvailable = Number.isFinite(n)
          ? Math.max(0, Math.min(10, Math.floor(n)))
          : 0;
      }
    }
  } catch {
    // settings table may not exist; use defaults
  }

  // Week start: prefer current film's week_start; else current Monday
  const weekStart =
    (current?.weekStart && String(current.weekStart)) || getCurrentMondayYmd();

  return {
    weekStart,
    currentFilm: current
      ? {
          id: current.id,
          title: current.title,
          year: current.year,
          director: current.director ?? null,
          runtime: current.runtime ?? null,
          posterUrl: current.posterUrl ?? null,
          adminIntro: current.adminNotes ?? null,
          groupAvg,
          dissent,
        }
      : null,
    stats: {
      members: membersRow,
      capacity: CLUB_CAPACITY,
      watchedCount,
      participation,
    },
    suggestions: suggestionsMapped,
    flagged: [], // no flags table yet
    members: membersList,
    settings: {
      publicTeasersEnabled,
      seatsAvailable,
    },
  };
}

const Page = async () => {
  const data = await fetchAdminManageData();
  const {
    weekStart,
    currentFilm,
    stats,
    suggestions,
    flagged,
    members,
    settings,
  } = data;
  const phase = computePhase(weekStart);

  return (
    <>
      <SectionHeader
        title="Admin · Manage"
        subtitle={`Week of ${formatWindow(weekStart)}`}
        action={<PhaseBadge phase={phase.phase} />}
      />

      {/* Summary */}
      <div className="grid gap-3 md:grid-cols-4">
        <SmallStat
          label="Members"
          value={`${stats.members}/${stats.capacity}`}
        />
        <SmallStat
          label="Watched"
          value={`${stats.watchedCount}/${stats.members}`}
        />
        <SmallStat label="Participation" value={`${stats.participation}%`} />
        <SmallStat
          label="Seats available"
          value={`${settings.seatsAvailable}`}
        />
      </div>

      {/* Current film */}
      <section className="mt-8">
        <SectionHeader
          title="This week’s film"
          subtitle="Intro, stats, and quick actions"
          action={
            <ButtonLink href="/select-film" variant="outline" size="md">
              Select next
            </ButtonLink>
          }
        />
        <Card padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 opacity-25">
            {currentFilm?.posterUrl ? (
              <Image
                src={currentFilm.posterUrl}
                alt={`${currentFilm.title} poster`}
                fill
                className="object-cover blur-md scale-110"
                priority
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-transparent" />
          </div>

          {currentFilm ? (
            <div className="flex flex-col gap-6 md:flex-row md:gap-8">
              <div className="relative h-40 w-28 shrink-0 overflow-hidden rounded-md border border-white/10 bg-neutral-900/60 md:h-56 md:w-40">
                {currentFilm.posterUrl ? (
                  <Image
                    src={currentFilm.posterUrl}
                    alt={`${currentFilm.title} (${currentFilm.year})`}
                    fill
                    className="object-cover"
                  />
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-balance text-2xl font-semibold tracking-tight text-white md:text-3xl">
                    {currentFilm.title}{" "}
                    <span className="text-neutral-400">
                      ({currentFilm.year})
                    </span>
                  </h2>
                </div>
                <div className="mt-1 text-sm text-neutral-400">
                  {currentFilm.director ? (
                    <span>Dir. {currentFilm.director}</span>
                  ) : null}
                  {currentFilm.runtime ? (
                    <span> • {currentFilm.runtime} min</span>
                  ) : null}
                </div>
                <p className="mt-3 text-sm text-neutral-300">
                  {currentFilm.adminIntro ?? "No introduction yet."}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <ButtonLink
                    href={`/films/${currentFilm.id}`}
                    variant="primary"
                    size="md"
                  >
                    Open discussion
                  </ButtonLink>
                  <ButtonLink href="/select-film" variant="outline" size="md">
                    Edit introduction
                  </ButtonLink>
                  {typeof currentFilm.groupAvg === "number" ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-olive-500/20 bg-olive-500/10 px-2 py-1 text-xs text-olive-200">
                      <span className="tabular-nums">
                        {currentFilm.groupAvg.toFixed(1)}
                      </span>
                      <span className="text-neutral-400">avg</span>
                    </span>
                  ) : null}
                  {typeof currentFilm.dissent === "number" ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-neutral-200">
                      <span className="tabular-nums">
                        {currentFilm.dissent.toFixed(1)}
                      </span>
                      <span className="text-neutral-400">dissent</span>
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-neutral-400">
              No film selected. Use “Select next” to schedule Monday’s drop.
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <form method="POST" action="/api/admin/films/publish-verdict">
              <input type="hidden" name="week_start" value={weekStart} />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md border border-olive-500/30 bg-olive-500/10 px-3 py-1.5 text-sm text-olive-200 transition-colors hover:bg-olive-500/15"
              >
                Publish The Verdict
              </button>
            </form>
            <form method="POST" action="/api/admin/films/close-week">
              <input type="hidden" name="week_start" value={weekStart} />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-neutral-200 transition-colors hover:bg-white/10"
              >
                Close week
              </button>
            </form>
          </div>
        </Card>
      </section>

      {/* Suggestions */}
      <section className="mt-10">
        <SectionHeader
          title="Suggestions"
          subtitle="Select one for next week; remaining expire after 4 weeks."
          action={
            <Link
              href="/select-film"
              className="text-sm text-neutral-300 underline-offset-4 hover:text-white hover:underline"
            >
              Open selector
            </Link>
          }
        />
        {suggestions.length === 0 ? (
          <Card padding="lg" className="text-sm text-neutral-400">
            No suggestions this week.
          </Card>
        ) : (
          <div className="grid gap-3">
            {suggestions.map((s) => (
              <SuggestionRow key={s.id} s={s} />
            ))}
          </div>
        )}
      </section>

      {/* Moderation queue */}
      <section className="mt-10">
        <SectionHeader
          title="Moderation queue"
          subtitle="Flagged reviews and comments"
        />
        {flagged.length === 0 ? (
          <Card padding="lg" className="text-sm text-neutral-400">
            Nothing flagged at the moment.
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {flagged.map((f) => (
              <FlaggedCard key={`${f.type}-${f.id}`} item={f} />
            ))}
          </div>
        )}
      </section>

      {/* Members */}
      <section className="mt-10">
        <SectionHeader
          title="Members"
          subtitle="Participation and status"
          action={
            <Link
              href="/invites"
              className="text-sm text-neutral-300 underline-offset-4 hover:text-white hover:underline"
            >
              Manage invites
            </Link>
          }
        />
        <div className="grid gap-3 md:grid-cols-2">
          {members.map((m) => (
            <MemberRow key={m.id} m={m} />
          ))}
        </div>
      </section>

      {/* Settings */}
      <section className="mt-10">
        <SectionHeader
          title="Settings"
          subtitle="Public teasers and availability"
        />
        <Card padding="lg" className="grid gap-4 md:grid-cols-2">
          <form
            method="POST"
            action="/api/admin/settings/update"
            className="grid gap-3"
          >
            <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
              <div>
                <div className="text-sm text-neutral-200">Public teasers</div>
                <div className="text-xs text-neutral-500">
                  Show anonymized excerpts and Dissent Index on landing.
                </div>
              </div>
              <input type="hidden" name="key" value="publicTeasersEnabled" />
              <input
                type="hidden"
                name="value"
                value={settings.publicTeasersEnabled ? "0" : "1"}
              />
              <button
                type="submit"
                className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  settings.publicTeasersEnabled
                    ? "border border-olive-500/30 bg-olive-500/10 text-olive-200 hover:bg-olive-500/20"
                    : "border border-white/10 bg-white/5 text-neutral-200 hover:bg-white/10"
                }`}
              >
                {settings.publicTeasersEnabled ? "Enabled" : "Disabled"}
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
              <div>
                <div className="text-sm text-neutral-200">Seats available</div>
                <div className="text-xs text-neutral-500">
                  Controls the “X seats available” badge on the landing page.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="hidden" name="key" value="seatsAvailable" />
                <input
                  name="value"
                  type="number"
                  min={0}
                  max={10}
                  defaultValue={settings.seatsAvailable}
                  className="w-20 rounded-md border border-white/10 bg-neutral-900/50 px-2 py-1.5 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-md bg-olive-500 px-3 py-1.5 text-xs font-semibold text-neutral-950 transition-colors hover:bg-olive-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-olive-400/40"
                >
                  Save
                </button>
              </div>
            </div>
          </form>

          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="text-sm font-semibold text-neutral-100">
              Quick links
            </div>
            <div className="mt-2 grid gap-2 text-sm">
              <Link
                href="/select-film"
                className="text-neutral-300 underline-offset-4 hover:text-white hover:underline"
              >
                Select next week’s film
              </Link>
              <Link
                href="/invites"
                className="text-neutral-300 underline-offset-4 hover:text-white hover:underline"
              >
                Manage invites and waitlist
              </Link>
              <Link
                href="/films"
                className="text-neutral-300 underline-offset-4 hover:text-white hover:underline"
              >
                Browse all films (members view)
              </Link>
            </div>
          </div>
        </Card>
      </section>
    </>
  );
};

export default Page;
