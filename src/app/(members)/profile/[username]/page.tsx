// app/(members)/profile/[username]/page.tsx
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { auth } from '@/lib/auth/utils';

type PageProps = { params: { username: string } };

type ProfileData = {
  user: {
    id: string;
    username: string;
    name?: string | null;
    avatarUrl?: string | null;
    joinedAt: string; // ISO
  };
  stats: {
    filmsWatched: number;
    reviewsCount: number;
    avgRatingGiven: number | null; // 1–10
    contrarianScore: number | null; // avg abs deviation vs group
    participationRate: number; // %
  };
  taste: {
    topGenres: { name: string; count: number }[];
    topDirectors: { name: string; count: number }[];
  };
  appreciatedReviews: {
    id: number;
    filmId: number;
    filmTitle: string;
    year: number;
    rating: number;
    excerpt: string;
    reactions: { insightful: number; controversial: number; brilliant: number; total: number };
    createdAt: string;
  }[];
  filmHistory: {
    id: number;
    title: string;
    year: number;
    posterUrl?: string | null;
    myScore: number | null;
    groupAvg: number | null;
  }[];
};

// MOCK — replace with DB queries later
const fetchProfileData = async (username: string): Promise<ProfileData | null> => {
  if (!username) return null;

  return {
    user: {
      id: 'u_' + username,
      username,
      name: username === 'member' ? 'Eiga Member' : null,
      avatarUrl: null,
      joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(), // ~4 months ago
    },
    stats: {
      filmsWatched: 32,
      reviewsCount: 29,
      avgRatingGiven: 8.3,
      contrarianScore: 1.4,
      participationRate: 87,
    },
    taste: {
      topGenres: [
        { name: 'Drama', count: 18 },
        { name: 'Crime', count: 7 },
        { name: 'Romance', count: 6 },
      ],
      topDirectors: [
        { name: 'Wong Kar-wai', count: 3 },
        { name: 'Edward Yang', count: 2 },
        { name: 'Akira Kurosawa', count: 2 },
      ],
    },
    appreciatedReviews: [
      {
        id: 1,
        filmId: 209,
        filmTitle: 'In the Mood for Love',
        year: 2000,
        rating: 8.5,
        excerpt:
          'The camera remembers what the characters cannot confess; repetition becomes the grammar of longing.',
        reactions: { insightful: 6, controversial: 1, brilliant: 3, total: 10 },
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        filmId: 203,
        filmTitle: 'Memories of Murder',
        year: 2003,
        rating: 9.0,
        excerpt:
          'A procedural that decays into uncertainty; rain and mud as moral texture, eyes searching the frame for meaning.',
        reactions: { insightful: 5, controversial: 0, brilliant: 2, total: 7 },
        createdAt: new Date().toISOString(),
      },
    ],
    filmHistory: [
      { id: 214, title: 'Seven Samurai', year: 1954, posterUrl: '/images/mock-4.jpg', myScore: 9.0, groupAvg: 9.0 },
      { id: 205, title: 'A Brighter Summer Day', year: 1991, posterUrl: '/images/mock-5.jpg', myScore: 9.0, groupAvg: 8.9 },
      { id: 203, title: 'Memories of Murder', year: 2003, posterUrl: '/images/mock-3.jpg', myScore: 9.0, groupAvg: 8.8 },
      { id: 209, title: 'In the Mood for Love', year: 2000, posterUrl: '/images/mock-poster.jpg', myScore: 8.5, groupAvg: 9.1 },
      { id: 220, title: 'Beau Travail', year: 1999, posterUrl: '/images/mock-8.jpg', myScore: null, groupAvg: 8.2 },
      { id: 216, title: 'The Tree of Life', year: 2011, posterUrl: '/images/mock-2.jpg', myScore: 7.0, groupAvg: 7.8 },
    ],
  };
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });

const DeltaPill = ({ my, avg }: { my: number | null; avg: number | null }) => {
  if (my == null || avg == null) {
    return (
      <span className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-neutral-400">
        —
      </span>
    );
  }
  const delta = my - avg;
  const abs = Math.abs(delta);
  const tone =
    abs >= 2
      ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300'
      : abs >= 1
      ? 'border-olive-500/30 bg-olive-500/10 text-olive-200'
      : 'border-white/10 bg-white/5 text-neutral-300';
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : '';
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs ${tone}`}>
      Δ {sign}
      <span className="tabular-nums">{abs.toFixed(1)}</span>
    </span>
  );
};

const StatCard = ({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) => (
  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
    <div className="text-xs uppercase tracking-wide text-neutral-400">{label}</div>
    <div className="mt-1 text-xl font-semibold text-white tabular-nums">{value}</div>
    {sub ? <div className="mt-0.5 text-xs text-neutral-500">{sub}</div> : null}
  </div>
);

const Chip = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300">
    {children}
  </span>
);

const ReviewItem = ({
  filmId,
  filmTitle,
  year,
  rating,
  excerpt,
  reactions,
}: {
  filmId: number;
  filmTitle: string;
  year: number;
  rating: number;
  excerpt: string;
  reactions: { insightful: number; controversial: number; brilliant: number; total: number };
}) => (
  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
    <div className="flex items-center justify-between gap-2">
      <Link href={`/films/${filmId}`} className="text-sm text-neutral-200 hover:underline">
        {filmTitle} <span className="text-neutral-400">({year})</span>
      </Link>
      <span className="inline-flex items-center gap-1 rounded-md border border-olive-500/20 bg-olive-500/10 px-2 py-0.5 text-xs text-olive-200">
        <span className="tabular-nums">{rating.toFixed(1)}</span>
      </span>
    </div>
    <p className="mt-2 text-sm text-neutral-300">{excerpt}</p>
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
      <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5">Insightful {reactions.insightful}</span>
      <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5">Controversial {reactions.controversial}</span>
      <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5">Brilliant {reactions.brilliant}</span>
      <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5">Total {reactions.total}</span>
    </div>
  </div>
);

const FilmRow = ({
  id,
  title,
  year,
  posterUrl,
  myScore,
  groupAvg,
}: ProfileData['filmHistory'][number]) => (
  <Link
    href={`/films/${id}`}
    className="group flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-2 transition-colors hover:bg-white/10"
  >
    <div className="relative h-14 w-10 overflow-hidden rounded border border-white/10 bg-neutral-900/60">
      {posterUrl ? (
        <Image src={posterUrl} alt={`${title} (${year})`} fill className="object-cover" />
      ) : null}
    </div>
    <div className="min-w-0 flex-1">
      <div className="truncate text-sm text-neutral-200">
        {title} <span className="text-neutral-400">({year})</span>
      </div>
      <div className="mt-0.5 flex items-center gap-2 text-xs text-neutral-400">
        <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5">
          <span>you</span>
          <span className="tabular-nums">{myScore == null ? '—' : myScore.toFixed(1)}</span>
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5">
          <span>group</span>
          <span className="tabular-nums">{groupAvg == null ? '—' : groupAvg.toFixed(1)}</span>
        </span>
        <DeltaPill my={myScore} avg={groupAvg} />
      </div>
    </div>
  </Link>
);

const Page = async ({ params }: PageProps) => {
  const usernameParam = params.username;
  const data = await fetchProfileData(usernameParam);
  if (!data) notFound();

  const session = await auth().catch(() => null);
  const isMe = session?.user?.username?.toLowerCase() === usernameParam.toLowerCase();

  const { user, stats, taste, appreciatedReviews, filmHistory } = data;

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt={user.username} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm uppercase text-neutral-300">
                {user.username.slice(0, 2)}
              </span>
            )}
          </span>
          <div>
            <h1 className="text-lg font-semibold text-white">
              {user.name ?? user.username}
            </h1>
            <div className="text-xs text-neutral-500">
              @{user.username} • Joined {formatDate(user.joinedAt)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isMe ? (
            <ButtonLink href={`/profile/${user.username}/edit`} variant="outline" size="sm">
              Edit profile
            </ButtonLink>
          ) : null}
          <ButtonLink href="/suggest" variant="primary" size="sm">
            Suggest a film
          </ButtonLink>
        </div>
      </div>

      {/* Stats */}
      <Card padding="lg">
        <div className="grid gap-3 md:grid-cols-5">
          <StatCard label="Films watched" value={stats.filmsWatched} />
          <StatCard label="Reviews" value={stats.reviewsCount} />
          <StatCard
            label="Avg rating"
            value={typeof stats.avgRatingGiven === 'number' ? stats.avgRatingGiven.toFixed(1) : '—'}
          />
          <StatCard
            label="Contrarian score"
            value={typeof stats.contrarianScore === 'number' ? stats.contrarianScore.toFixed(1) : '—'}
            sub="Avg deviation vs group"
          />
          <StatCard label="Participation" value={`${stats.participationRate}%`} />
        </div>
      </Card>

      {/* Taste profile */}
      <section className="mt-8">
        <SectionHeader title="Taste profile" subtitle="Derived from ratings with the group." />
        <div className="grid gap-4 md:grid-cols-2">
          <Card padding="lg">
            <h3 className="text-sm font-semibold text-neutral-100">Favorite genres</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {taste.topGenres.length ? (
                taste.topGenres.map((g) => (
                  <Chip key={g.name}>
                    {g.name} <span className="ml-1 tabular-nums text-neutral-400">×{g.count}</span>
                  </Chip>
                ))
              ) : (
                <div className="text-sm text-neutral-400">No data yet.</div>
              )}
            </div>
          </Card>
          <Card padding="lg">
            <h3 className="text-sm font-semibold text-neutral-100">Frequent directors</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {taste.topDirectors.length ? (
                taste.topDirectors.map((d) => (
                  <Chip key={d.name}>
                    {d.name} <span className="ml-1 tabular-nums text-neutral-400">×{d.count}</span>
                  </Chip>
                ))
              ) : (
                <div className="text-sm text-neutral-400">No data yet.</div>
              )}
            </div>
          </Card>
        </div>
        <p className="mt-3 text-xs text-neutral-500">
          “Contrarian score” is your average absolute deviation from the group’s rating for each film.
        </p>
      </section>

      {/* Most appreciated reviews */}
      <section className="mt-8">
        <SectionHeader title="Most appreciated reviews" subtitle="Based on reactions from members." />
        {appreciatedReviews.length === 0 ? (
          <Card padding="lg" className="text-sm text-neutral-400">
            No reviews yet. Your most appreciated reviews will appear here.
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {appreciatedReviews.map((r) => (
              <ReviewItem
                key={r.id}
                filmId={r.filmId}
                filmTitle={r.filmTitle}
                year={r.year}
                rating={r.rating}
                excerpt={r.excerpt}
                reactions={r.reactions}
              />
            ))}
          </div>
        )}
      </section>

      {/* Film history */}
      <section className="mt-8">
        <SectionHeader
          title="Film history"
          subtitle="Your ratings vs. the group across the archive."
          action={<Link href="/films" className="text-sm text-neutral-300 underline-offset-4 hover:text-white hover:underline">Browse all films</Link>}
        />
        {filmHistory.length === 0 ? (
          <Card padding="lg" className="text-sm text-neutral-400">
            No films yet.
          </Card>
        ) : (
          <div className="grid gap-2">
            {filmHistory.map((f) => (
              <FilmRow key={f.id} {...f} />
            ))}
          </div>
        )}
      </section>
    </>
  );
};

export default Page;