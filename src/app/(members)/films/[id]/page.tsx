/* eslint-disable @typescript-eslint/no-explicit-any */

import Image from "next/image"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Clock, Film as FilmIcon, MessageSquare } from "lucide-react"
import type { ReactNode } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { SectionHeader } from "@/components/ui/section-header"
import { Button } from "@/components/ui/button"

import { auth } from "@/lib/auth/utils"
import { getFilmDiscussionData } from "@/lib/db/queries"
import { computeWeeklyPhase, secondsToTimecode } from "@/lib/utils/helpers"
import { RealtimeBinder } from "./RealtimeBinder"

/* Badges */
const PhaseBadge = ({ phase }: { phase: "watch" | "discussion" | "ended" }) => {
  const map: Record<
    "watch" | "discussion" | "ended",
    { label: string; className: string; icon: ReactNode }
  > = {
    discussion: {
      label: "Discussion open",
      className: "border-primary/30 bg-primary/10 text-foreground",
      icon: <MessageSquare className="h-3.5 w-3.5 text-primary" aria-hidden="true" />,
    },
    watch: {
      label: "Watching period",
      className: "border-border bg-card/60 text-muted-foreground",
      icon: <FilmIcon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />,
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

const RatingPill = ({ score }: { score: number | null }) => {
  if (typeof score !== "number") {
    return (
      <span className="inline-flex items-center rounded-md border border-border bg-card/60 px-2 py-0.5 text-xs text-muted-foreground">
        —
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-md border border-border bg-primary/10 px-2 py-0.5 text-xs text-foreground">
      <span className="tabular-nums">{score.toFixed(1)}</span>
    </span>
  )
}

/* Forms and blocks */
const ReviewForm = ({ filmId }: { filmId: number }) => (
  <form method="POST" action="/api/reviews" className="grid gap-3" noValidate>
    <input type="hidden" name="film_id" value={filmId} />
    <div className="grid gap-2 md:grid-cols-[6rem_1fr] md:items-center">
      <label htmlFor="score" className="text-xs text-muted-foreground">
        Your score
      </label>
      <input
        id="score"
        name="score"
        type="number"
        min={1}
        max={10}
        step="0.1"
        required
        placeholder="e.g., 8.5"
        className="w-28 rounded-md border border-border bg-card/60 px-2 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 md:w-32"
      />
    </div>
    <div>
      <label htmlFor="review" className="mb-1 block text-xs text-muted-foreground">
        Your review (100–1000 words recommended)
      </label>
      <textarea
        id="review"
        name="review"
        required
        minLength={100}
        maxLength={8000}
        rows={8}
        placeholder="Write your take. Consider themes, craft, context. Be specific—cite scenes and choices."
        className="w-full rounded-md border border-border bg-card/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <p className="mt-1 text-xs text-muted-foreground">
        You must submit a review before joining the discussion threads.
      </p>
    </div>
    <div className="flex items-center gap-2">
      <Button type="submit" size="sm">Submit review</Button>
      <Button asChild variant="outline" size="sm">
        <Link href={`/films/${filmId}`}>Cancel</Link>
      </Button>
    </div>
  </form>
)

const ReviewCard = ({
  user,
  rating,
  excerpt,
}: {
  user: string
  rating: number
  excerpt: string
}) => (
  <div className="rounded-md border border-border bg-card/60 p-3">
    <div className="flex items-center justify-between">
      <div className="text-sm text-foreground">{user}</div>
      <RatingPill score={rating} />
    </div>
    <p className="mt-2 text-sm text-muted-foreground">{excerpt}</p>
  </div>
)

const CommentBlock = ({
  user,
  content,
  hasSpoilers,
  timestampRef,
  reactions,
}: {
  user: string
  content: string
  hasSpoilers: boolean
  timestampRef?: number | null
  reactions?: { insightful: number; controversial: number; brilliant: number }
}) => (
  <div className="rounded-md border border-border bg-card/60 p-3">
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm text-foreground">{user}</div>
      <div className="flex items-center gap-2">
        {typeof timestampRef === "number" ? (
          <span className="rounded-md border border-border bg-card/60 px-2 py-0.5 text-xs text-muted-foreground">
            {secondsToTimecode(timestampRef)}
          </span>
        ) : null}
        {hasSpoilers ? (
          <span className="rounded-md border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
            Spoilers
          </span>
        ) : null}
      </div>
    </div>
    <p className={["mt-2 text-sm", hasSpoilers ? "text-muted-foreground" : "text-foreground"].join(" ")}>
      {hasSpoilers ? "Spoiler content hidden (toggle coming soon)." : content}
    </p>
    {reactions ? (
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded-md border border-border bg-card/60 px-2 py-0.5">
          Insightful {reactions.insightful}
        </span>
        <span className="rounded-md border border-border bg-card/60 px-2 py-0.5">
          Controversial {reactions.controversial}
        </span>
        <span className="rounded-md border border-border bg-card/60 px-2 py-0.5">
          Brilliant {reactions.brilliant}
        </span>
      </div>
    ) : null}
  </div>
)

/* Page */
const Page = async (props: any) => {
  const params = await props.params

  // Auth (for personalization + realtime presence)
  const session = await auth()
  if (!session?.user) {
    redirect(`/login?callbackUrl=/films/${params.id}`)
  }

  const filmId = Number(params.id)
  if (!Number.isFinite(filmId) || filmId <= 0) notFound()

  const data = await getFilmDiscussionData(filmId, session.user.id)
  if (!data) notFound()

  const { film, stats, me, reviews, threads } = data
  const phaseInfo = computeWeeklyPhase(film.weekStart)
  const phase = phaseInfo.phase

  return (
    <main id="main" className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
      {/* Realtime presence/invalidation (headless) */}
      <RealtimeBinder filmId={film.id} username={session.user.username} />

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link
            href="/films"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            ← Back to Films
          </Link>
          <h1 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {film.title} <span className="text-muted-foreground">({film.year})</span>
          </h1>
          <div className="mt-1 text-sm text-muted-foreground">
            {film.director ? <span>Dir. {film.director}</span> : null}
            {film.runtime ? <span> • {film.runtime} min</span> : null}
          </div>
          <div className="mt-2">
            <PhaseBadge phase={phase} />
          </div>
        </div>
        <div className="relative hidden h-28 w-20 overflow-hidden rounded-md border border-border bg-card/60 sm:block">
          {film.posterUrl ? (
            <Image
              src={film.posterUrl}
              alt={`${film.title} (${film.year})`}
              fill
              className="object-cover"
            />
          ) : null}
        </div>
      </div>

      {/* The Setup (admin notes) */}
      <section className="mt-4">
        <SectionHeader title="The Setup" subtitle="Admin context for the week" />
        <Card className="border-border bg-card/40">
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Admin notes</div>
            {typeof film.adminNotes === "string" && film.adminNotes.trim().length > 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">{film.adminNotes}</p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">No notes yet.</p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* The Ratings */}
      <section className="mt-8">
        <SectionHeader title="The Ratings" subtitle="Group scores at a glance" />
        <Card className="border-border bg-card/40">
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-md border border-border bg-card/60 p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Average</div>
                <div className="mt-1 tabular-nums text-2xl font-semibold text-foreground">
                  {typeof stats.avgScore === "number" ? stats.avgScore.toFixed(1) : "—"}
                </div>
              </div>
              <div className="rounded-md border border-border bg-card/60 p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Dissent (std dev)
                </div>
                <div className="mt-1 tabular-nums text-2xl font-semibold text-foreground">
                  {typeof stats.stdDev === "number" ? stats.stdDev.toFixed(1) : "—"}
                </div>
              </div>
              <div className="rounded-md border border-border bg-card/60 p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Your score</div>
                <div className="mt-1">
                  <RatingPill score={me.myScore} />
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {stats.ratings.map((r) => (
                <div
                  key={r.username}
                  className="flex items-center justify-between rounded-md border border-border bg-card/60 px-3 py-2"
                >
                  <span className="text-sm text-foreground">{r.username}</span>
                  <RatingPill score={r.score} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* The Takes */}
      <section className="mt-8">
        <SectionHeader
          title="The Takes"
          subtitle="Post your review (100–1000 words) to unlock the discussion."
          action={
            me.hasReview ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/films/${film.id}?edit=1`}>Edit your review</Link>
              </Button>
            ) : null
          }
        />

        {!me.hasReview ? (
          <Card className="mb-6 border-primary/30 bg-primary/10">
            <CardContent className="p-6">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Your review</h3>
              <ReviewForm filmId={film.id} />
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {reviews.map((r) => (
            <ReviewCard key={r.id} user={r.user} rating={r.rating} excerpt={r.excerpt} />
          ))}
          {reviews.length === 0 && (
            <Card className="border-border bg-card/40">
              <CardContent className="p-6 text-sm text-muted-foreground">
                No reviews yet. Be the first to post one.
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* The Discourse */}
      <section className="mt-8">
        <SectionHeader
          title="The Discourse"
          subtitle={
            me.hasReview
              ? "Join the threads. Cite timestamps. Tag spoilers."
              : "Locked until you post your review."
          }
          action={
            me.hasReview ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/films/${film.id}#new-thread`}>Start a thread</Link>
              </Button>
            ) : null
          }
        />

        {!me.hasReview ? (
          <Card className="border-border bg-card/40">
            <CardContent className="p-6 text-sm text-muted-foreground">
              You need to submit a review to participate in discussion threads.
            </CardContent>
          </Card>
        ) : null}

        {/* Top-level new thread form */}
        {me.hasReview ? (
          <Card id="new-thread" className="border-border bg-card/40">
            <CardContent className="p-6">
              <form method="POST" action="/api/discussions" className="grid gap-2" noValidate>
                <input type="hidden" name="film_id" value={film.id} />
                <label htmlFor="new-thread-content" className="text-xs text-muted-foreground">
                  Start a new thread
                </label>
                <textarea
                  id="new-thread-content"
                  name="content"
                  rows={4}
                  placeholder="Open a thoughtful thread…"
                  className="w-full rounded-md border border-border bg-card/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  required
                  minLength={5}
                  maxLength={5000}
                />
                <div className="flex items-center justify-between gap-2">
                  <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      name="has_spoilers"
                      className="h-3.5 w-3.5 rounded border-border bg-card/60 text-primary focus:outline-none focus:ring-primary/30"
                    />
                    Spoilers
                  </label>
                  <div className="flex items-center gap-2">
                    <label htmlFor="new-thread-ts" className="text-xs text-muted-foreground">
                      Timestamp (s)
                    </label>
                    <input
                      id="new-thread-ts"
                      name="timestamp_reference"
                      type="number"
                      min={0}
                      step={1}
                      placeholder="e.g., 760"
                      className="w-24 rounded-md border border-border bg-card/60 px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <Button type="submit" size="sm">Post thread</Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : null}

        <div
          className={["grid gap-4 md:grid-cols-2", !me.hasReview ? "pointer-events-none opacity-60" : ""].join(" ")}
        >
          {threads.map((t) => {
            const rootId = t.comments?.[0]?.id ?? t.id
            return (
              <Card key={t.id} className="border-border bg-card/40">
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold text-foreground">{t.title || "Thread"}</h3>
                  <div className="mt-3 grid gap-3">
                    {t.comments.map((c) => (
                      <div key={c.id}>
                        <CommentBlock
                          user={c.user}
                          content={c.content}
                          hasSpoilers={c.hasSpoilers}
                          timestampRef={c.timestampRef}
                          reactions={c.reactions}
                        />
                        {c.replies?.length ? (
                          <div className="mt-2 space-y-2 pl-4">
                            {c.replies.map((r) => (
                              <CommentBlock
                                key={r.id}
                                user={r.user}
                                content={r.content}
                                hasSpoilers={r.hasSpoilers}
                                timestampRef={r.timestampRef}
                                reactions={r.reactions}
                              />
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  {me.hasReview ? (
                    <form
                      id={`reply-thread-${t.id}`}
                      method="POST"
                      action="/api/discussions"
                      className="mt-4 grid gap-2"
                      noValidate
                    >
                      <input type="hidden" name="film_id" value={film.id} />
                      <input type="hidden" name="parent_id" value={rootId} />
                      <label htmlFor={`comment-${t.id}`} className="text-xs text-muted-foreground">
                        Reply to thread
                      </label>
                      <textarea
                        id={`comment-${t.id}`}
                        name="content"
                        rows={3}
                        placeholder="Add a thoughtful reply…"
                        className="w-full rounded-md border border-border bg-card/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <div className="flex items-center justify-between gap-2">
                        <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                          <input
                            type="checkbox"
                            name="has_spoilers"
                            className="h-3.5 w-3.5 rounded border-border bg-card/60 text-primary focus:outline-none focus:ring-primary/30"
                          />
                          Spoilers
                        </label>
                        <div className="flex items-center gap-2">
                          <label htmlFor={`timestamp-${t.id}`} className="text-xs text-muted-foreground">
                            Timestamp (s)
                          </label>
                          <input
                            id={`timestamp-${t.id}`}
                            name="timestamp_reference"
                            type="number"
                            min={0}
                            step={1}
                            placeholder="e.g., 760"
                            className="w-24 rounded-md border border-border bg-card/60 px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                          <Button type="submit" size="sm">Reply</Button>
                        </div>
                      </div>
                    </form>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
          {/* FIX: Properly close the map call (no extra parenthesis) */}
        </div>
      </section>

      {/* The Verdict */}
      <section className="mt-8">
        <SectionHeader title="The Verdict" subtitle="Admin’s closing summary posts at week’s end." />
        <Card className="border-border bg-card/40">
          <CardContent className="p-6 text-sm text-muted-foreground">
            The Verdict will appear here Sunday night with highlights and related-film links.
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

export default Page