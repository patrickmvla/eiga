// app/(members)/dashboard/page.tsx
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Clock, MessageSquare, Film } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { SectionHeader } from "@/components/ui/section-header"

import { auth } from "@/lib/auth/utils"
import { getDashboardData } from "@/lib/db/queries"
import { computeWeeklyPhase } from "@/lib/utils/helpers"
import { DashboardRealtimeBinder } from "./RealtimeBinder"

type WatchStatus = "not_watched" | "watching" | "watched" | "rewatched"

const PhaseBadge = ({ phase }: { phase: "watch" | "discussion" | "ended" }) => {
  const map: Record<
    "watch" | "discussion" | "ended",
    { label: string; className: string; icon: React.ReactNode }
  > = {
    discussion: {
      label: "Discussion open",
      className: "border-primary/30 bg-primary/10 text-foreground",
      icon: <MessageSquare className="h-3.5 w-3.5 text-primary" aria-hidden="true" />,
    },
    watch: {
      label: "Watching period",
      className: "border-border bg-card/60 text-muted-foreground",
      icon: <Film className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />,
    },
    ended: {
      label: "Week ended",
      className: "border-border bg-card/60 text-muted-foreground",
      icon: <Clock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />,
    },
  }
  const m = map[phase]
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs",
        m.className,
      ].join(" ")}
    >
      {m.icon}
      {m.label}
    </span>
  )
}

const StatusPill = ({ status }: { status: WatchStatus }) => {
  const map: Record<WatchStatus, { label: string; className: string }> = {
    not_watched: {
      label: "Not watched",
      className: "border-border bg-card/60 text-muted-foreground",
    },
    watching: {
      label: "Watching",
      className: "border-primary/30 bg-primary/10 text-foreground",
    },
    watched: {
      label: "Watched",
      className: "border-primary/30 bg-primary/15 text-foreground",
    },
    rewatched: {
      label: "Rewatched",
      className: "border-primary/30 bg-primary/10 text-foreground",
    },
  }
  const m = map[status]
  return (
    <span className={["inline-flex rounded-md px-2 py-0.5 text-xs", m.className].join(" ")}>
      {m.label}
    </span>
  )
}

const MemberChip = ({
  name,
  avatarUrl,
  status,
}: {
  name: string
  avatarUrl?: string | null
  status: WatchStatus
}) => (
  <div className="flex items-center gap-2 rounded-md border border-border bg-card/60 p-2">
    <Avatar className="h-7 w-7 border border-border bg-card/60">
      {avatarUrl ? (
        <AvatarImage src={avatarUrl} alt={name} />
      ) : (
        <AvatarFallback className="text-[10px] uppercase text-muted-foreground">
          {name.slice(0, 2)}
        </AvatarFallback>
      )}
    </Avatar>
    <div className="min-w-0">
      <div className="truncate text-sm text-foreground">{name}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">
        <StatusPill status={status} />
      </div>
    </div>
  </div>
)

const Page = async () => {
  const session = await auth()
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard")
  }

  const data = await getDashboardData(session.user.id)
  const { film, me, group, memberStatuses } = data

  return (
    <>
      <SectionHeader
        title="Dashboard"
        subtitle="Your week at a glance."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/suggest">Suggest a film</Link>
          </Button>
        }
      />

      <Card className="relative overflow-hidden border-border bg-card/40">
        {/* Poster backdrop */}
        <div className="absolute inset-0 -z-10 opacity-30">
          {film?.posterUrl ? (
            <Image
              src={film.posterUrl}
              alt={film.title ? `${film.title} poster` : "Poster"}
              fill
              className="scale-110 object-cover blur-md"
              priority
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        </div>

        <CardContent className="p-6">
          {!film ? (
            <div className="flex flex-col items-start gap-4">
              <h2 className="text-lg font-semibold text-foreground">No current film scheduled.</h2>
              <p className="text-sm text-muted-foreground">
                The next selection drops Monday at 00:00. In the meantime, browse the archive.
              </p>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/films">Browse films</Link>
                </Button>
                {session.user.role === "admin" ? (
                  <Button asChild size="sm">
                    <Link href="/select-film">Select next film</Link>
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <>
              {/* Realtime presence/invalidation (headless) */}
              <DashboardRealtimeBinder filmId={film.id} username={session.user.username} />

              <div className="flex flex-col gap-6 md:flex-row md:gap-8">
                {/* Poster */}
                <div className="relative h-40 w-28 shrink-0 overflow-hidden rounded-md border border-border bg-card/60 md:h-56 md:w-40">
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
                    <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                      {film.title} <span className="text-muted-foreground">({film.year})</span>
                    </h1>
                    {film.weekStart ? (
                      <PhaseBadge phase={computeWeeklyPhase(film.weekStart).phase} />
                    ) : null}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {film.director ? <span>Dir. {film.director}</span> : null}
                    {film.runtime ? <span> • {film.runtime} min</span> : null}
                  </div>

                  {/* Counters */}
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {film.weekStart ? (
                      <div className="rounded-md border border-border bg-card/60 p-3">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">
                          {computeWeeklyPhase(film.weekStart).label}
                        </div>
                        {/* Avoid hydration mismatch as clock ticks */}
                        <div suppressHydrationWarning className="mt-1 font-mono text-lg">
                          {computeWeeklyPhase(film.weekStart).humanRemaining}
                        </div>
                      </div>
                    ) : null}
                    <div className="rounded-md border border-border bg-card/60 p-3">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        Group progress
                      </div>
                      <div className="mt-1 text-sm">
                        <span className="tabular-nums font-semibold text-foreground">
                          {group.watchedCount}/{group.members}
                        </span>{" "}
                        watched
                      </div>
                      {/* tiny meter */}
                      <div className="mt-2 h-1.5 rounded-full bg-white/10">
                        <div
                          className="h-1.5 rounded-full bg-primary/70"
                          style={{
                            width: `${Math.max(
                              0,
                              Math.min(100, (group.watchedCount / Math.max(group.members || 1, 1)) * 100)
                            ).toFixed(0)}%`,
                          }}
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                    <div className="rounded-md border border-border bg-card/60 p-3">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        Your status
                      </div>
                      <div className="mt-1">
                        <StatusPill status={me.watchStatus} />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button asChild size="sm">
                      <Link href={`/films/${film.id}`}>
                        {me.hasReview ? "Edit your review" : "Rate & review"}
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/films/${film.id}`}>Open discussion</Link>
                    </Button>
                    {typeof group.avgScore === "number" ? (
                      <Badge
                        variant="secondary"
                        className="ml-2 border-border bg-primary/10 text-foreground"
                      >
                        <span className="tabular-nums">{group.avgScore.toFixed(1)}</span>
                        <span className="ml-1 text-muted-foreground">avg</span>
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Admin notes */}
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="md:col-span-3 rounded-md border border-border bg-card/60 p-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Admin notes</div>
                  {typeof film.adminNotes === "string" && film.adminNotes.trim().length > 0 ? (
                    <p className="mt-1 text-sm text-muted-foreground">{film.adminNotes}</p>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">No notes yet.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Member watch statuses */}
      <section className="mt-10">
        <SectionHeader
          title="Watch status"
          subtitle="Where everyone is at before the main discussion."
          action={
            <span className="text-xs text-muted-foreground">
              {group.watchedCount}/{group.members} watched
            </span>
          }
        />
        {memberStatuses.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">No statuses yet.</CardContent>
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
        <SectionHeader title="Activity" subtitle="Latest reviews, threads, and highlights." />
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Activity feed coming soon.</CardContent>
        </Card>
      </section>
    </>
  )
}

export default Page