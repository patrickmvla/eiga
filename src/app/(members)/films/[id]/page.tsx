/* eslint-disable @typescript-eslint/no-explicit-any */

import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ButtonLink } from "@/components/ui/ButtonLink";

import { auth } from "@/lib/auth/utils";
import { getFilmDiscussionData } from "@/lib/db/queries";
import { computeWeeklyPhase, secondsToTimecode } from "@/lib/utils/helpers";
import { RealtimeBinder } from "./RealtimeBinder";

// ... (All helper components like PhaseBadge, RatingPill, etc. can remain unchanged)

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

const RatingPill = ({ score }: { score: number | null }) => {
  if (typeof score !== "number") {
    return (
      <span className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-neutral-400">
        —
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-md border border-olive-500/20 bg-olive-500/10 px-2 py-0.5 text-xs text-olive-200">
      <span className="tabular-nums">{score.toFixed(1)}</span>
    </span>
  );
};

const ReviewForm = ({ filmId }: { filmId: number }) => (
  <form method="POST" action="/api/reviews" className="grid gap-3">
    <input type="hidden" name="film_id" value={filmId} />
    <div className="grid gap-2 md:grid-cols-[6rem_1fr] md:items-center">
      <label htmlFor="score" className="text-xs text-neutral-400">
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
        className="w-28 rounded-lg border border-white/10 bg-neutral-900/50 px-2 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-olive-400/40 md:w-32"
      />
    </div>
    <div>
      <label htmlFor="review" className="mb-1 block text-xs text-neutral-400">
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
        className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
      />
      <p className="mt-1 text-xs text-neutral-500">
        You must submit a review before joining the discussion threads.
      </p>
    </div>
    <div className="flex items-center gap-2">
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-lg bg-olive-500 px-4 py-2 text-sm font-semibold text-neutral-950 transition-colors hover:bg-olive-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-olive-400/40"
      >
        Submit review
      </button>
      <ButtonLink href={`/films/${filmId}`} variant="ghost" size="md">
        Cancel
      </ButtonLink>
    </div>
  </form>
);

const ReviewCard = ({
  user,
  rating,
  excerpt,
}: {
  user: string;
  rating: number;
  excerpt: string;
}) => (
  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
    <div className="flex items-center justify-between">
      <div className="text-sm text-neutral-200">{user}</div>
      <span className="inline-flex items-center gap-1 rounded-md border border-olive-500/20 bg-olive-500/10 px-2 py-0.5 text-xs text-olive-200">
        <span className="tabular-nums">{rating.toFixed(1)}</span>
      </span>
    </div>
    <p className="mt-2 text-sm text-neutral-300">{excerpt}</p>
  </div>
);

const CommentBlock = ({
  user,
  content,
  hasSpoilers,
  timestampRef,
  reactions,
}: {
  user: string;
  content: string;
  hasSpoilers: boolean;
  timestampRef?: number | null;
  reactions?: { insightful: number; controversial: number; brilliant: number };
}) => (
  <div className="rounded-md border border-white/10 bg-white/5 p-3">
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm text-neutral-200">{user}</div>
      <div className="flex items-center gap-2">
        {typeof timestampRef === "number" ? (
          <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-neutral-300">
            {secondsToTimecode(timestampRef)}
          </span>
        ) : null}
        {hasSpoilers ? (
          <span className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-xs text-red-300">
            Spoilers
          </span>
        ) : null}
      </div>
    </div>
    <p
      className={`mt-2 text-sm ${
        hasSpoilers ? "text-neutral-400" : "text-neutral-300"
      }`}
    >
      {hasSpoilers ? "Spoiler content hidden (toggle coming soon)." : content}
    </p>
    {reactions ? (
      <div className="mt-2 flex items-center gap-2 text-xs text-neutral-400">
        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5">
          Insightful {reactions.insightful}
        </span>
        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5">
          Controversial {reactions.controversial}
        </span>
        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5">
          Brilliant {reactions.brilliant}
        </span>
      </div>
    ) : null}
  </div>
);

// MODIFICATION: Changed props to 'any' and will await them inside.
const Page = async (props: any) => {
  const params = await props.params;

  // Auth (for personalization + realtime presence)
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=/films/${params.id}`);
  }

  const filmId = Number(params.id);
  if (!Number.isFinite(filmId) || filmId <= 0) notFound();

  const data = await getFilmDiscussionData(filmId, session.user.id);
  if (!data) notFound();

  const { film, stats, me, reviews, threads } = data;

  const phaseInfo = computeWeeklyPhase(film.weekStart);
  const phase = phaseInfo.phase;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
      {/* Realtime presence/invalidation (headless) */}
      <RealtimeBinder filmId={film.id} username={session.user.username} />

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link
            href="/films"
            className="text-sm text-neutral-400 underline-offset-4 hover:text-white hover:underline"
          >
            ← Back to Films
          </Link>
          <h1 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-white md:text-3xl">
            {film.title} <span className="text-neutral-400">({film.year})</span>
          </h1>
          <div className="mt-1 text-sm text-neutral-400">
            {film.director ? <span>Dir. {film.director}</span> : null}
            {film.runtime ? <span> • {film.runtime} min</span> : null}
          </div>
          <div className="mt-2">
            <PhaseBadge phase={phase} />
          </div>
        </div>
        <div className="relative hidden h-28 w-20 overflow-hidden rounded-md border border-white/10 bg-neutral-900/60 sm:block">
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
        <SectionHeader
          title="The Setup"
          subtitle="Admin context for the week"
        />
        <Card padding="lg">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-wide text-neutral-400">
              Admin notes
            </div>
            {typeof film.adminNotes === "string" &&
            film.adminNotes.trim().length > 0 ? (
              <p className="mt-1 text-sm text-neutral-300">{film.adminNotes}</p>
            ) : (
              <p className="mt-1 text-sm text-neutral-400">No notes yet.</p>
            )}
          </div>
        </Card>
      </section>

      {/* The Ratings */}
      <section className="mt-8">
        <SectionHeader
          title="The Ratings"
          subtitle="Group scores at a glance"
        />
        <Card padding="lg">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="text-xs uppercase tracking-wide text-neutral-400">
                Average
              </div>
              <div className="mt-1 text-2xl font-semibold text-white tabular-nums">
                {typeof stats.avgScore === "number"
                  ? stats.avgScore.toFixed(1)
                  : "—"}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="text-xs uppercase tracking-wide text-neutral-400">
                Dissent (std dev)
              </div>
              <div className="mt-1 text-2xl font-semibold text-white tabular-nums">
                {typeof stats.stdDev === "number"
                  ? stats.stdDev.toFixed(1)
                  : "—"}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="text-xs uppercase tracking-wide text-neutral-400">
                Your score
              </div>
              <div className="mt-1">
                <RatingPill score={me.myScore} />
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {stats.ratings.map((r) => (
              <div
                key={r.username}
                className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2"
              >
                <span className="text-sm text-neutral-200">{r.username}</span>
                <RatingPill score={r.score} />
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* The Takes */}
      <section className="mt-8">
        <SectionHeader
          title="The Takes"
          subtitle="Post your review (100–1000 words) to unlock the discussion."
          action={
            me.hasReview ? (
              <ButtonLink
                href={`/films/${film.id}?edit=1`}
                variant="outline"
                size="md"
              >
                Edit your review
              </ButtonLink>
            ) : (
              <></>
            )
          }
        />

        {!me.hasReview ? (
          <Card
            padding="lg"
            className="mb-6 border-olive-500/30 bg-olive-500/10"
          >
            <h3 className="mb-3 text-sm font-semibold text-white">
              Your review
            </h3>
            <ReviewForm filmId={film.id} />
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {reviews.map((r) => (
            <ReviewCard
              key={r.id}
              user={r.user}
              rating={r.rating}
              excerpt={r.excerpt}
            />
          ))}
          {reviews.length === 0 && (
            <Card padding="lg" className="text-sm text-neutral-400">
              No reviews yet. Be the first to post one.
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
              <ButtonLink
                href={`/films/${film.id}#new-thread`}
                variant="outline"
                size="md"
              >
                Start a thread
              </ButtonLink>
            ) : null
          }
        />

        {!me.hasReview ? (
          <Card
            padding="lg"
            className="border-white/10 bg-white/5 text-sm text-neutral-400"
          >
            You need to submit a review to participate in discussion threads.
          </Card>
        ) : null}

        {/* Top-level new thread form */}
        {me.hasReview ? (
          <Card padding="lg" id="new-thread" className="mb-4">
            <form
              method="POST"
              action="/api/discussions"
              className="grid gap-2"
            >
              <input type="hidden" name="film_id" value={film.id} />
              {/* Omit parent_id entirely to create a root thread */}
              <label
                htmlFor="new-thread-content"
                className="text-xs text-neutral-400"
              >
                Start a new thread
              </label>
              <textarea
                id="new-thread-content"
                name="content"
                rows={4}
                placeholder="Open a thoughtful thread…"
                className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
                required
                minLength={5}
                maxLength={5000}
              />
              <div className="flex items-center justify-between gap-2">
                <label className="inline-flex items-center gap-2 text-xs text-neutral-400">
                  <input
                    type="checkbox"
                    name="has_spoilers"
                    className="h-3.5 w-3.5 rounded border-white/20 bg-neutral-900/60 text-olive-500 focus:outline-none focus:ring-olive-400/40"
                  />
                  Spoilers
                </label>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="new-thread-ts"
                    className="text-xs text-neutral-400"
                  >
                    Timestamp (s)
                  </label>
                  <input
                    id="new-thread-ts"
                    name="timestamp_reference"
                    type="number"
                    min={0}
                    step={1}
                    placeholder="e.g., 760"
                    className="w-24 rounded-lg border border-white/10 bg-neutral-900/50 px-2 py-1.5 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-lg bg-olive-500 px-3 py-1.5 text-sm font-semibold text-neutral-950 transition-colors hover:bg-olive-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-olive-400/40"
                  >
                    Post thread
                  </button>
                </div>
              </div>
            </form>
          </Card>
        ) : null}

        <div
          className={`grid gap-4 md:grid-cols-2 ${
            !me.hasReview ? "pointer-events-none opacity-60" : ""
          }`}
        >
          {threads.map((t) => {
            const rootId = t.comments?.[0]?.id ?? t.id; // reply to the root comment
            return (
              <Card key={t.id} padding="lg">
                <h3 className="text-sm font-semibold text-neutral-100">
                  {t.title || "Thread"}
                </h3>
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
                  >
                    <input type="hidden" name="film_id" value={film.id} />
                    <input type="hidden" name="parent_id" value={rootId} />
                    <label
                      htmlFor={`comment-${t.id}`}
                      className="text-xs text-neutral-400"
                    >
                      Reply to thread
                    </label>
                    <textarea
                      id={`comment-${t.id}`}
                      name="content"
                      rows={3}
                      placeholder="Add a thoughtful reply…"
                      className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <label className="inline-flex items-center gap-2 text-xs text-neutral-400">
                        <input
                          type="checkbox"
                          name="has_spoilers"
                          className="h-3.5 w-3.5 rounded border-white/20 bg-neutral-900/60 text-olive-500 focus:outline-none focus:ring-olive-400/40"
                        />
                        Spoilers
                      </label>
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor={`timestamp-${t.id}`}
                          className="text-xs text-neutral-400"
                        >
                          Timestamp (s)
                        </label>
                        <input
                          id={`timestamp-${t.id}`}
                          name="timestamp_reference"
                          type="number"
                          min={0}
                          step={1}
                          placeholder="e.g., 760"
                          className="w-24 rounded-lg border border-white/10 bg-neutral-900/50 px-2 py-1.5 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center rounded-lg bg-olive-500 px-3 py-1.5 text-sm font-semibold text-neutral-950 transition-colors hover:bg-olive-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-olive-400/40"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  </form>
                ) : null}
              </Card>
            );
          })}
          {threads.length === 0 && (
            <Card padding="lg" className="text-sm text-neutral-400">
              No threads yet. Be the first to start one—after you post your
              review.
            </Card>
          )}
        </div>
      </section>

      {/* The Verdict */}
      <section className="mt-8">
        <SectionHeader
          title="The Verdict"
          subtitle="Admin’s closing summary posts at week’s end."
        />
        <Card padding="lg" className="text-sm text-neutral-400">
          The Verdict will appear here Sunday night with highlights and
          related-film links.
        </Card>
      </section>
    </main>
  );
};

export default Page;
