// app/(members)/dashboard/page.tsx
import Image from "next/image";
import { redirect } from "next/navigation";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";

import { auth } from "@/lib/auth/utils";
import { getDashboardData } from "@/lib/db/queries";
import { computeWeeklyPhase } from "@/lib/utils/helpers";
import { DashboardRealtimeBinder } from "./RealtimeBinder";

type WatchStatus = "not_watched" | "watching" | "watched" | "rewatched";

const PhaseBadge = ({ phase }: { phase: "watch" | "discussion" | "ended" }) => {
  const cls =
    phase === "discussion"
      ? "border-olive-500/30 bg-olive-500/10 text-olive-200"
      : phase === "watch"
      ? "border-white/15 bg-white/5 text-neutral-300"
      : "border-white/10 bg-white/5 text-neutral-400";
  const text =
    phase === "discussion"
      ? "Discussion open"
      : phase === "watch"
      ? "Watching period"
      : "Week ended";
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs ${cls}`}>
      {text}
    </span>
  );
};

const StatusPill = ({ status }: { status: WatchStatus }) => {
  const map: Record<WatchStatus, { label: string; cls: string }> = {
    not_watched: {
      label: "Not watched",
      cls: "border-white/10 bg-white/5 text-neutral-300",
    },
    watching: {
      label: "Watching",
      cls: "border-olive-500/30 bg-olive-500/10 text-olive-200",
    },
    watched: {
      label: "Watched",
      cls: "border-olive-500/30 bg-olive-500/15 text-olive-100",
    },
    rewatched: {
      label: "Rewatched",
      cls: "border-olive-500/30 bg-olive-500/10 text-olive-200",
    },
  };
  const m = map[status];
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs ${m.cls}`}>
      {m.label}
    </span>
  );
};

const MemberChip = ({
  name,
  avatarUrl,
  status,
}: {
  name: string;
  avatarUrl?: string | null;
  status: WatchStatus;
}) => (
  <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2">
    <span className="inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-neutral-900/60">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-[10px] uppercase text-neutral-300">
          {name.slice(0, 2)}
        </span>
      )}
    </span>
    <div className="min-w-0">
      <div className="truncate text-sm text-neutral-200">{name}</div>
      <div className="text-xs text-neutral-400">
        <StatusPill status={status} />
      </div>
    </div>
  </div>
);

const Page = async () => {
  // Session from cookie (layout already guards, but we re-check to get user id)
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const data = await getDashboardData(session.user.id);
  const { film, me, group, memberStatuses } = data;

  return (
    <>
      <SectionHeader
        title="Dashboard"
        subtitle="Your week at a glance."
        action={
          <ButtonLink href="/suggest" variant="outline" size="md">
            Suggest a film
          </ButtonLink>
        }
      />

      <Card padding="lg" className="relative overflow-hidden">
        {/* Poster backdrop */}
        <div className="absolute inset-0 -z-10 opacity-30">
          {film?.posterUrl ? (
            <Image
              src={film.posterUrl}
              alt={film.title ? `${film.title} poster` : "Poster"}
              fill
              className="object-cover blur-md scale-110"
              priority
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-transparent" />
        </div>

        {!film ? (
          <div className="flex flex-col items-start gap-4">
            <h2 className="text-lg font-semibold text-white">
              No current film scheduled.
            </h2>
            <p className="text-sm text-neutral-400">
              The next selection drops Monday at 00:00. In the meantime, browse
              the archive.
            </p>
            <div className="flex items-center gap-2">
              <ButtonLink href="/films" variant="outline" size="md">
                Browse films
              </ButtonLink>
              {session.user.role === "admin" ? (
                <ButtonLink href="/select-film" variant="primary" size="md">
                  Select next film
                </ButtonLink>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            {/* Realtime presence/invalidation (headless) */}
            <DashboardRealtimeBinder
              filmId={film.id}
              username={session.user.username}
            />

            <div className="flex flex-col gap-6 md:flex-row md:gap-8">
              {/* Poster */}
              <div className="relative h-40 w-28 shrink-0 overflow-hidden rounded-md border border-white/10 bg-neutral-900/60 md:h-56 md:w-40">
                {film.posterUrl ? (
                  <Image
                    src={film.posterUrl}
                    alt={`${film.title} (${film.year})`}
                    fill
                    className="object-cover"
                  />
                ) : null}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-balance text-2xl font-semibold tracking-tight text-white md:text-3xl">
                    {film.title}{" "}
                    <span className="text-neutral-400">({film.year})</span>
                  </h1>
                  {/* Phase */}
                  {film.weekStart ? (
                    <PhaseBadge
                      phase={computeWeeklyPhase(film.weekStart).phase}
                    />
                  ) : null}
                </div>
                <div className="mt-1 text-sm text-neutral-400">
                  {film.director ? <span>Dir. {film.director}</span> : null}
                  {film.runtime ? <span> • {film.runtime} min</span> : null}
                </div>

                {/* Counters */}
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {film.weekStart ? (
                    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                      <div className="text-xs uppercase tracking-wide text-neutral-400">
                        {computeWeeklyPhase(film.weekStart).label}
                      </div>
                      <div className="mt-1 font-mono text-lg">
                        {computeWeeklyPhase(film.weekStart).humanRemaining}
                      </div>
                    </div>
                  ) : null}
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="text-xs uppercase tracking-wide text-neutral-400">
                      Group progress
                    </div>
                    <div className="mt-1 text-sm">
                      <span className="tabular-nums font-semibold text-neutral-100">
                        {group.watchedCount}/{group.members}
                      </span>{" "}
                      watched
                    </div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="text-xs uppercase tracking-wide text-neutral-400">
                      Your status
                    </div>
                    <div className="mt-1">
                      <StatusPill status={me.watchStatus} />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <ButtonLink
                    href={`/films/${film.id}`}
                    variant="primary"
                    size="md"
                  >
                    {me.hasReview ? "Edit your review" : "Rate & review"}
                  </ButtonLink>
                  <ButtonLink
                    href={`/films/${film.id}`}
                    variant="outline"
                    size="md"
                  >
                    Open discussion
                  </ButtonLink>
                  {typeof group.avgScore === "number" ? (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-md border border-olive-500/20 bg-olive-500/10 px-2 py-1 text-xs text-olive-200">
                      <span className="tabular-nums">
                        {group.avgScore.toFixed(1)}
                      </span>
                      <span className="text-neutral-400">avg</span>
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Admin notes */}
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="md:col-span-3 rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-wide text-neutral-400">
                  Admin notes
                </div>
                {typeof film.adminNotes === "string" &&
                film.adminNotes.trim().length > 0 ? (
                  <p className="mt-1 text-sm text-neutral-300">
                    {film.adminNotes}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-neutral-400">No notes yet.</p>
                )}
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Member watch statuses */}
      <section className="mt-10">
        <SectionHeader
          title="Watch status"
          subtitle="Where everyone is at before the main discussion."
          action={
            <span className="text-xs text-neutral-500">
              {group.watchedCount}/{group.members} watched
            </span>
          }
        />
        {memberStatuses.length === 0 ? (
          <Card padding="lg" className="text-sm text-neutral-400">
            No statuses yet.
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {memberStatuses.map((m) => (
              <MemberChip
                key={m.username}
                name={m.username}
                avatarUrl={m.avatarUrl}
                status={m.status as WatchStatus}
              />
            ))}
          </div>
        )}
      </section>

      {/* Activity feed (placeholder until wired) */}
      <section className="mt-10">
        <SectionHeader
          title="Activity"
          subtitle="Latest reviews, threads, and highlights."
        />
        <Card padding="lg" className="text-sm text-neutral-400">
          Activity feed coming soon.
        </Card>
      </section>
    </>
  );
};

export default Page;
