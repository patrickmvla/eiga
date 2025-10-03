// app/(members)/films/[id]/page.tsx
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ButtonLink } from "@/components/ui/ButtonLink";

type WatchStatus = "not_watched" | "watching" | "watched" | "rewatched";

type FilmDiscussionData = {
  film: {
    id: number;
    title: string;
    year: number;
    director?: string | null;
    runtime?: number | null;
    posterUrl?: string | null;
    weekStart: string; // ISO
    adminSetup: {
      why: string;
      themes: string[];
      technical?: string[];
      context?: string;
    };
  };
  stats: {
    avgScore: number | null;
    stdDev: number | null;
    ratings: { username: string; score: number | null }[]; // up to 10
  };
  me: {
    watchStatus: WatchStatus;
    myScore: number | null;
    hasReview: boolean;
    reviewText?: string;
  };
  reviews: {
    id: number;
    user: string;
    rating: number;
    excerpt: string;
    createdAt: string;
  }[];
  threads: {
    id: number;
    title: string;
    createdAt: string;
    comments: {
      id: number;
      user: string;
      content: string;
      hasSpoilers: boolean;
      timestampRef?: number; // seconds
      reactions?: {
        insightful: number;
        controversial: number;
        brilliant: number;
      };
      replies?: {
        id: number;
        user: string;
        content: string;
        hasSpoilers: boolean;
        timestampRef?: number;
        reactions?: {
          insightful: number;
          controversial: number;
          brilliant: number;
        };
      }[];
    }[];
  }[];
};

type PageProps = { params: { id: string } };

// Mock fetch — replace with DB queries (Supabase/Drizzle)
const fetchFilmDiscussionData = async (
  id: number
): Promise<FilmDiscussionData | null> => {
  if (!Number.isFinite(id)) return null;

  const monday = new Date();
  const day = monday.getDay();
  const diffToMon = (day + 6) % 7;
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - diffToMon);

  return {
    film: {
      id,
      title: "In the Mood for Love",
      year: 2000,
      director: "Wong Kar-wai",
      runtime: 98,
      posterUrl: "/images/mock-poster.jpg",
      weekStart: monday.toISOString(),
      adminSetup: {
        why: "To study how rhythm and repetition sculpt longing without melodrama.",
        themes: [
          "Restraint as romance",
          "Memory as mise-en-scène",
          "Time loops in costume and music",
        ],
        technical: [
          "Framing through thresholds",
          "Recurring motifs in score",
          "Slow shutter and stepping cadence",
        ],
        context: "A stop on our melancholy thread: Hou → Wong → Kore-eda.",
      },
    },
    stats: {
      avgScore: 8.6,
      stdDev: 1.3,
      ratings: [
        { username: "akira", score: 9.0 },
        { username: "agnes", score: 9.0 },
        { username: "chantal", score: 7.5 },
        { username: "bong", score: 8.5 },
        { username: "claire", score: 8.0 },
        { username: "barry", score: null }, // not rated yet
        { username: "pauline", score: 8.0 },
        { username: "manny", score: 9.0 },
        { username: "yasujiro", score: 9.0 },
      ],
    },
    me: {
      watchStatus: "watching",
      myScore: null,
      hasReview: false,
    },
    reviews: [
      {
        id: 1,
        user: "agnes",
        rating: 9.0,
        excerpt:
          "The camera is memory—each repetition tilts meaning, never repeating emotion the same way.",
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        user: "bong",
        rating: 8.5,
        excerpt:
          "Cheung’s gestures carry paragraphs of subtext; the hallway soundscape becomes narration.",
        createdAt: new Date().toISOString(),
      },
    ],
    threads: [
      {
        id: 11,
        title: "Cheongsam patterns and time loops (00:12:40, 00:31:05)",
        createdAt: new Date().toISOString(),
        comments: [
          {
            id: 111,
            user: "manny",
            content:
              "It’s the pattern recurrence that tricks you into feeling scenes rhyme—they aren’t flashbacks so much as echoes.",
            hasSpoilers: false,
            timestampRef: 760,
            reactions: { insightful: 3, controversial: 0, brilliant: 2 },
            replies: [
              {
                id: 112,
                user: "agnes",
                content:
                  "Agree—and the corridor lighting modulates “memory” into that amber haze.",
                hasSpoilers: false,
                timestampRef: 1870,
                reactions: { insightful: 1, controversial: 0, brilliant: 0 },
              },
            ],
          },
        ],
      },
      {
        id: 12,
        title: "Is the film romantic or post-romantic?",
        createdAt: new Date().toISOString(),
        comments: [
          {
            id: 121,
            user: "claire",
            content:
              "Spoiler: The hotel room scene suggests confession is refused; the romance is asymptotic, never consummated.",
            hasSpoilers: true,
            reactions: { insightful: 2, controversial: 1, brilliant: 0 },
          },
        ],
      },
    ],
  };
};

const secondsToTimestamp = (s?: number) => {
  if (!s || s < 0) return null;
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = Math.floor(s % 60);
  return hrs > 0
    ? `${hrs}:${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`
    : `${mins}:${secs.toString().padStart(2, "0")}`;
};

const PhaseBadge = ({ weekStartISO }: { weekStartISO: string }) => {
  const now = new Date();
  const start = new Date(weekStartISO); // Mon 00:00
  const fri = new Date(start);
  fri.setDate(start.getDate() + 4); // Fri 00:00
  const nextMon = new Date(start);
  nextMon.setDate(start.getDate() + 7); // next Mon 00:00

  const phase =
    now < fri
      ? ("watch" as const)
      : now < nextMon
      ? ("discussion" as const)
      : ("ended" as const);

  const text =
    phase === "discussion"
      ? "Discussion open"
      : phase === "watch"
      ? "Watching period"
      : "Week ended";
  const cls =
    phase === "discussion"
      ? "border-olive-500/30 bg-olive-500/10 text-olive-200"
      : phase === "watch"
      ? "border-white/15 bg-white/5 text-neutral-300"
      : "border-white/10 bg-white/5 text-neutral-400";

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
  <form
    method="POST"
    action="/api/reviews" /* TODO: implement */
    className="grid gap-3"
  >
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
        maxLength={
          8000
        } /* word-count enforcement can be server-side; chars here */
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
  timestampRef?: number;
  reactions?: { insightful: number; controversial: number; brilliant: number };
}) => (
  <div className="rounded-md border border-white/10 bg-white/5 p-3">
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm text-neutral-200">{user}</div>
      <div className="flex items-center gap-2">
        {typeof timestampRef === "number" ? (
          <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-neutral-300">
            {secondsToTimestamp(timestampRef)}
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

const Page = async ({ params }: PageProps) => {
  const id = Number(params.id);
  const data = await fetchFilmDiscussionData(id);
  if (!data) notFound();

  const { film, stats, me, reviews, threads } = data;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link
            href="/films"
            className="text-sm text-neutral-400 hover:text-white hover:underline underline-offset-4"
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
            <PhaseBadge weekStartISO={film.weekStart} />
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

      {/* The Setup */}
      <section className="mt-4">
        <SectionHeader
          title="The Setup"
          subtitle="Admin context for the week"
        />
        <Card padding="lg">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold text-neutral-100">
                Why this film
              </h3>
              <p className="mt-2 text-sm text-neutral-300">
                {film.adminSetup.why}
              </p>
              {film.adminSetup.context ? (
                <p className="mt-3 text-xs text-neutral-500">
                  Context: {film.adminSetup.context}
                </p>
              ) : null}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">
                Themes to consider
              </h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-neutral-300">
                {film.adminSetup.themes.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
              {film.adminSetup.technical?.length ? (
                <>
                  <h4 className="mt-4 text-sm font-semibold text-neutral-100">
                    Technical notes
                  </h4>
                  <ul className="mt-2 list-disc pl-5 text-sm text-neutral-300">
                    {film.adminSetup.technical.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
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

        <div
          className={`grid gap-4 md:grid-cols-2 ${
            !me.hasReview ? "pointer-events-none opacity-60" : ""
          }`}
        >
          {threads.map((t) => (
            <Card key={t.id} padding="lg">
              <h3 className="text-sm font-semibold text-neutral-100">
                {t.title}
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
                  id="new-thread"
                  method="POST"
                  action="/api/discussions" /* TODO: implement */
                  className="mt-4 grid gap-2"
                >
                  <input type="hidden" name="film_id" value={film.id} />
                  <input type="hidden" name="parent_id" value="" />
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
                        step="1"
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
          ))}
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
