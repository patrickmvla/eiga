// app/(members)/dashboard/page.tsx
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ButtonLink } from '@/components/ui/ButtonLink';

type WatchStatus = 'not_watched' | 'watching' | 'watched' | 'rewatched';

type DashboardData = {
  film: {
    id: number;
    title: string;
    year: number;
    director?: string | null;
    runtime?: number | null;
    posterUrl?: string | null;
    weekStart: string; // ISO date for Monday 00:00
    adminIntro: {
      why: string;
      themes: string[];
      notes?: string[];
      context?: string;
    };
  };
  me: {
    rating: number | null;
    hasReview: boolean;
    watchStatus: WatchStatus;
  };
  group: {
    members: number;
    watchedCount: number;
    avgScore: number | null;
  };
  memberStatuses: {
    username: string;
    avatarUrl?: string | null;
    status: WatchStatus;
  }[];
  activity: {
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
    }[];
    highlights: {
      id: number;
      quote: string;
    }[];
    upcoming?: {
      title?: string;
      note?: string;
    };
  };
};

// TODO: replace with real DB queries (Supabase/Drizzle)
const fetchDashboardData = async (): Promise<DashboardData> => {
  const monday = new Date();
  // normalize to Monday 00:00 for demo
  const day = monday.getDay(); // 0 Sun, 1 Mon
  const diffToMon = ((day + 6) % 7); // days since Monday
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - diffToMon);

  return {
    film: {
      id: 101,
      title: 'In the Mood for Love',
      year: 2000,
      director: 'Wong Kar-wai',
      runtime: 98,
      posterUrl: '/images/mock-poster.jpg',
      weekStart: monday.toISOString(),
      adminIntro: {
        why: 'To explore how restraint and repetition can create emotional crescendo without overt melodrama.',
        themes: ['Longing and restraint', 'Repetition as rhythm', 'Memory and mise-en-scène'],
        notes: ['Watch how doorways frame absence', 'Listen for recurring musical cues', 'Notice lingering shots in corridors'],
        context: 'Part of a thread on melancholy in East Asian cinema (Hou → Wong → Kore-eda).',
      },
    },
    me: {
      rating: null,
      hasReview: false,
      watchStatus: 'watching',
    },
    group: {
      members: 9,
      watchedCount: 6,
      avgScore: 8.6,
    },
    memberStatuses: [
      { username: 'akira', status: 'watched' },
      { username: 'agnes', status: 'watched' },
      { username: 'chantal', status: 'watching' },
      { username: 'bong', status: 'watched' },
      { username: 'claire', status: 'rewatched' },
      { username: 'barry', status: 'not_watched' },
      { username: 'pauline', status: 'watching' },
      { username: 'manny', status: 'watched' },
      { username: 'yasujiro', status: 'watching' },
    ],
    activity: {
      reviews: [
        {
          id: 1,
          user: 'agnes',
          rating: 9.0,
          excerpt:
            'The camera is the memory: it remembers what the characters cannot say. Every repetition shifts the meaning.',
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          user: 'bong',
          rating: 8.5,
          excerpt:
            'Cheung’s gestures carry entire paragraphs of subtext. Also: the hallway soundscape deserves an essay.',
          createdAt: new Date().toISOString(),
        },
      ],
      threads: [
        { id: 11, title: 'Cheongsam patterns and time loops (00:12:40, 00:31:05)', createdAt: new Date().toISOString() },
        { id: 12, title: 'Is the film romantic or post-romantic?', createdAt: new Date().toISOString() },
      ],
      highlights: [
        { id: 21, quote: 'The film’s negative space is its real protagonist.' },
        { id: 22, quote: 'Wong composes memory like jazz—returning to the motif, never quite the same.' },
      ],
      upcoming: {
        note: 'Next film is selected Sunday night after The Verdict.',
      },
    },
  };
};

const formatDuration = (ms: number) => {
  if (ms <= 0) return '0m';
  const totalMins = Math.floor(ms / 60000);
  const d = Math.floor(totalMins / (60 * 24));
  const h = Math.floor((totalMins % (60 * 24)) / 60);
  const m = totalMins % 60;
  return [d ? `${d}d` : null, h ? `${h}h` : null, `${m}m`].filter(Boolean).join(' ');
};

const computePhase = (weekStartISO: string) => {
  const now = new Date();
  const start = new Date(weekStartISO); // Mon 00:00
  const fri = new Date(start);
  fri.setDate(start.getDate() + 4); // Fri 00:00
  const nextMon = new Date(start);
  nextMon.setDate(start.getDate() + 7); // next Mon 00:00

  if (now < fri) {
    return {
      phase: 'watch' as const,
      label: 'Discussion opens in',
      nextAt: fri,
      remaining: formatDuration(fri.getTime() - now.getTime()),
      badge: 'Watching period',
    };
  }
  if (now < nextMon) {
    return {
      phase: 'discussion' as const,
      label: 'Week ends in',
      nextAt: nextMon,
      remaining: formatDuration(nextMon.getTime() - now.getTime()),
      badge: 'Discussion open',
    };
  }
  const followingMon = new Date(nextMon);
  followingMon.setDate(nextMon.getDate() + 7);
  return {
    phase: 'ended' as const,
    label: 'Next film drops in',
    nextAt: followingMon,
    remaining: formatDuration(followingMon.getTime() - now.getTime()),
    badge: 'Week ended',
  };
};

const PhaseBadge = ({ phase }: { phase: 'watch' | 'discussion' | 'ended' }) => {
  const cls =
    phase === 'discussion'
      ? 'border-olive-500/30 bg-olive-500/10 text-olive-200'
      : phase === 'watch'
      ? 'border-white/15 bg-white/5 text-neutral-300'
      : 'border-white/10 bg-white/5 text-neutral-400';
  const text =
    phase === 'discussion' ? 'Discussion open' : phase === 'watch' ? 'Watching period' : 'Week ended';
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs ${cls}`}>{text}</span>;
};

const StatusPill = ({ status }: { status: WatchStatus }) => {
  const map: Record<WatchStatus, { label: string; cls: string }> = {
    not_watched: { label: 'Not watched', cls: 'border-white/10 bg-white/5 text-neutral-300' },
    watching: { label: 'Watching', cls: 'border-olive-500/30 bg-olive-500/10 text-olive-200' },
    watched: { label: 'Watched', cls: 'border-olive-500/30 bg-olive-500/15 text-olive-100' },
    rewatched: { label: 'Rewatched', cls: 'border-olive-500/30 bg-olive-500/10 text-olive-200' },
  };
  const m = map[status];
  return <span className={`inline-flex rounded-md px-2 py-0.5 text-xs ${m.cls}`}>{m.label}</span>;
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
        <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className="text-[10px] uppercase text-neutral-300">{name.slice(0, 2)}</span>
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
  const data = await fetchDashboardData();
  const { film, me, group, memberStatuses, activity } = data;
  const phase = computePhase(film.weekStart);

  return (
    <>
      {/* Header */}
      <SectionHeader
        title="Dashboard"
        subtitle="Your week at a glance."
        action={
          <ButtonLink href="/suggest" variant="outline" size="md">
            Suggest a film
          </ButtonLink>
        }
      />

      {/* This week’s film */}
      <Card padding="lg" className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-30">
          {film.posterUrl ? (
            <Image
              src={film.posterUrl}
              alt={`${film.title} poster`}
              fill
              className="object-cover blur-md scale-110"
              priority
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-transparent" />
        </div>

        <div className="flex flex-col gap-6 md:flex-row md:gap-8">
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

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-balance text-2xl font-semibold tracking-tight text-white md:text-3xl">
                {film.title}{' '}
                <span className="text-neutral-400">({film.year})</span>
              </h1>
              <PhaseBadge phase={phase.phase} />
            </div>
            <div className="mt-1 text-sm text-neutral-400">
              {film.director ? <span>Dir. {film.director}</span> : null}
              {film.runtime ? <span> • {film.runtime} min</span> : null}
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="text-xs uppercase tracking-wide text-neutral-400">{phase.label}</div>
                <div className="mt-1 font-mono text-lg">{phase.remaining}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="text-xs uppercase tracking-wide text-neutral-400">Group progress</div>
                <div className="mt-1 text-sm">
                  <span className="tabular-nums font-semibold text-neutral-100">
                    {group.watchedCount}/{group.members}
                  </span>{' '}
                  watched
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="text-xs uppercase tracking-wide text-neutral-400">Your status</div>
                <div className="mt-1">
                  <StatusPill status={me.watchStatus} />
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <ButtonLink href={`/films/${film.id}`} variant="primary" size="md">
                {me.hasReview ? 'Edit your review' : 'Rate & review'}
              </ButtonLink>
              <ButtonLink href={`/films/${film.id}`} variant="outline" size="md">
                Open discussion
              </ButtonLink>
              {group.avgScore ? (
                <span className="ml-2 inline-flex items-center gap-1 rounded-md border border-olive-500/20 bg-olive-500/10 px-2 py-1 text-xs text-olive-200">
                  <span className="tabular-nums">{group.avgScore.toFixed(1)}</span>
                  <span className="text-neutral-400">avg</span>
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Admin notes */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-wide text-neutral-400">Why this film</div>
            <p className="mt-1 text-sm text-neutral-300">{film.adminIntro.why}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-wide text-neutral-400">Themes to consider</div>
            <ul className="mt-1 list-disc pl-5 text-sm text-neutral-300">
              {film.adminIntro.themes.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-wide text-neutral-400">Viewing notes</div>
            {film.adminIntro.notes && film.adminIntro.notes.length ? (
              <ul className="mt-1 list-disc pl-5 text-sm text-neutral-300">
                {film.adminIntro.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-neutral-300">None.</p>
            )}
          </div>
        </div>
        {film.adminIntro.context ? (
          <p className="mt-3 text-xs text-neutral-500">Context: {film.adminIntro.context}</p>
        ) : null}
      </Card>

      {/* Member watch statuses */}
      <section className="mt-10">
        <SectionHeader
          title="Watch status"
          subtitle="Where everyone is at before the main discussion."
          action={<span className="text-xs text-neutral-500">{group.watchedCount}/{group.members} watched</span>}
        />
        <div className="grid gap-3 md:grid-cols-3">
          {memberStatuses.map((m) => (
            <MemberChip key={m.username} name={m.username} avatarUrl={m.avatarUrl} status={m.status} />
          ))}
        </div>
      </section>

      {/* Activity feed */}
      <section className="mt-10">
        <SectionHeader title="Activity" subtitle="Latest reviews, threads, and highlights." />
        <div className="grid gap-4 md:grid-cols-3">
          <Card padding="lg">
            <h3 className="text-sm font-semibold text-neutral-100">Recent reviews</h3>
            <ul className="mt-3 space-y-3">
              {activity.reviews.map((r) => (
                <li key={r.id} className="rounded-md border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-200">{r.user}</span>
                    <span className="inline-flex items-center gap-1 rounded-md border border-olive-500/20 bg-olive-500/10 px-2 py-0.5 text-xs text-olive-200">
                      <span className="tabular-nums">{r.rating.toFixed(1)}</span>
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm text-neutral-300">{r.excerpt}</p>
                </li>
              ))}
              {activity.reviews.length === 0 && (
                <li className="text-sm text-neutral-400">No reviews yet. Be the first to post one.</li>
              )}
            </ul>
          </Card>

          <Card padding="lg">
            <h3 className="text-sm font-semibold text-neutral-100">New threads</h3>
            <ul className="mt-3 space-y-3">
              {activity.threads.map((t) => (
                <li key={t.id} className="rounded-md border border-white/10 bg-white/5 p-3">
                  <Link href={`/films/${film.id}`} className="text-sm text-neutral-200 hover:underline">
                    {t.title}
                  </Link>
                </li>
              ))}
              {activity.threads.length === 0 && (
                <li className="text-sm text-neutral-400">No new threads yet.</li>
              )}
            </ul>
          </Card>

          <Card padding="lg">
            <h3 className="text-sm font-semibold text-neutral-100">Highlights</h3>
            <ul className="mt-3 space-y-3">
              {activity.highlights.map((h) => (
                <li key={h.id} className="rounded-md border border-white/10 bg-white/5 p-3 text-sm text-neutral-300">
                  “{h.quote}”
                </li>
              ))}
              {activity.highlights.length === 0 && (
                <li className="text-sm text-neutral-400">Highlights will appear here as the week unfolds.</li>
              )}
            </ul>
            {activity.upcoming ? (
              <p className="mt-4 text-xs text-neutral-500">{activity.upcoming.note}</p>
            ) : null}
          </Card>
        </div>
      </section>
    </>
  );
};

export default Page;