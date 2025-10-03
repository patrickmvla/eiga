// app/(public)/page.tsx
import Link from 'next/link';
import Image from 'next/image';

import { ButtonLink } from '@/components/ui/ButtonLink';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { PosterBackdrop } from '@/components/landing/PosterBackdrop';
import { SeatBadge } from '@/components/landing/SeatBadge';
import { ExcerptCard } from '@/components/landing/ExcerptCard';
import { RecentFilmCard } from '@/components/landing/RecentFilmCard';

import { getPublicLandingData, type PublicLandingData } from '@/lib/db/queries';

export const revalidate = 3600;

// Fallback strictly typed to PublicLandingData (posterUrl must be string | null)
const fallbackData = (): PublicLandingData => ({
  currentFilm: {
    id: 101,
    title: 'In the Mood for Love',
    year: 2000,
    posterUrl: '/images/mock-poster.jpg',
    weekStart: '2000-01-03',
  },
  seatsAvailable: 3,
  stats: {
    members: 7,
    capacity: 10,
    participation: 82,
    avgReviewLength: 284,
  },
  excerpts: [
    { id: 1, text: 'A masterclass in restraint—the spaces between gestures say more than dialogue ever could.' },
    { id: 2, text: 'The framing traps characters within memories; it’s the camera that remembers what they try to forget.' },
    { id: 3, text: 'Sound design as narration: the hallway footsteps become the film’s heartbeat.' },
  ],
  recentFilms: [
    { id: 201, title: 'The Conversation', year: 1974, posterUrl: '/images/mock-1.jpg', avgScore: 8.6, dissent: 1.2 },
    { id: 202, title: 'Celine and Julie Go Boating', year: 1974, posterUrl: '/images/mock-2.jpg', avgScore: 7.9, dissent: 2.1 },
    { id: 203, title: 'Memories of Murder', year: 2003, posterUrl: '/images/mock-3.jpg', avgScore: 8.8, dissent: 0.9 },
    { id: 204, title: 'The Red Shoes', year: 1948, posterUrl: '/images/mock-4.jpg', avgScore: 8.2, dissent: 1.7 },
    { id: 205, title: 'A Brighter Summer Day', year: 1991, posterUrl: '/images/mock-5.jpg', avgScore: 8.9, dissent: 1.0 },
    { id: 206, title: 'The Ascent', year: 1977, posterUrl: '/images/mock-6.jpg', avgScore: 8.1, dissent: 2.3 },
    { id: 207, title: 'La Ceremonie', year: 1995, posterUrl: '/images/mock-7.jpg', avgScore: 7.7, dissent: 2.6 },
    { id: 208, title: 'Killer of Sheep', year: 1978, posterUrl: '/images/mock-8.jpg', avgScore: 8.0, dissent: 1.5 },
  ],
});

const DissentIndex = ({ films }: { films: PublicLandingData['recentFilms'] }) => {
  const ranked = films
    .filter((f) => typeof f.dissent === 'number')
    .sort((a, b) => (b.dissent ?? 0) - (a.dissent ?? 0))
    .slice(0, 3);

  if (ranked.length === 0) return null;

  return (
    <Card padding="lg" className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-100">Dissent Index</h3>
        <span className="text-xs text-neutral-500">Most controversial lately</span>
      </div>
      <div className="grid gap-2">
        {ranked.map((f) => (
          <div key={f.id} className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2">
            <div className="min-w-0 truncate text-sm text-neutral-200">
              {f.title} <span className="text-neutral-400">({f.year})</span>
            </div>
            <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-xs text-neutral-200">
              <span className="tabular-nums">{(f.dissent ?? 0).toFixed(1)}</span>
              <span className="text-neutral-400">dissent</span>
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-neutral-500">
        “Dissent” reflects how divided the group was (standard deviation of scores).
      </p>
    </Card>
  );
};

const Page = async () => {
  const data = (await getPublicLandingData().catch(() => null)) ?? fallbackData();
  const { currentFilm, seatsAvailable, stats, excerpts, recentFilms } = data;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 md:py-14">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/30 p-6 shadow-lg md:p-10">
        <PosterBackdrop
          posterUrl={currentFilm?.posterUrl}
          alt={currentFilm ? `${currentFilm.title} poster` : 'Eiga'}
        />

        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-5xl">
              Eiga — a private cinema club for serious film discourse
            </h1>
            <p className="mt-3 text-pretty text-neutral-300 md:text-lg">
              Ten members. One film a week. Thoughtful reviews before discussion.
              Curated, intimate, and spoiler-savvy.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <ButtonLink href="/request-invite" variant="primary" size="md">
                Request an invite
              </ButtonLink>
              <ButtonLink href="/archive" variant="outline" size="md">
                Browse archive
              </ButtonLink>
              <SeatBadge seatsAvailable={seatsAvailable} capacity={stats.capacity} />
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="text-xs uppercase tracking-wide text-neutral-400">This week’s film</div>
            {currentFilm ? (
              <div className="flex items-center gap-3">
                <div className="relative h-16 w-11 overflow-hidden rounded-md border border-white/10 bg-neutral-800">
                  {currentFilm.posterUrl ? (
                    <Image
                      src={currentFilm.posterUrl}
                      alt={`${currentFilm.title} (${currentFilm.year})`}
                      fill
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div>
                  <div className="font-semibold">{currentFilm.title}</div>
                  <div className="text-sm text-neutral-400">{currentFilm.year}</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-neutral-400">New selection drops Monday.</div>
            )}

            <div className="mt-2 grid grid-cols-3 gap-3 text-xs text-neutral-300">
              <Card padding="sm" className="text-center">
                <div className="tabular-nums text-sm">{stats.members}/{stats.capacity}</div>
                <div className="text-neutral-400">Members</div>
              </Card>
              <Card padding="sm" className="text-center">
                <div className="tabular-nums text-sm">{stats.participation}%</div>
                <div className="text-neutral-400">Participation</div>
              </Card>
              <Card padding="sm" className="text-center">
                <div className="tabular-nums text-sm">{stats.avgReviewLength}</div>
                <div className="text-neutral-400">Avg words</div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Teaser excerpts */}
      <section className="mt-12">
        <SectionHeader title="From the discussion (anonymized)" />
        <div className="grid gap-4 md:grid-cols-3">
          {excerpts.map((ex) => (
            <ExcerptCard key={ex.id} text={ex.text} />
          ))}
          {excerpts.length === 0 && (
            <Card padding="lg" className="text-sm text-neutral-400">
              No excerpts yet. Check back after this week’s discussion.
            </Card>
          )}
        </div>
      </section>

      {/* Recent films grid */}
      <section className="mt-12">
        <SectionHeader
          title="Recently discussed"
          action={
            <Link
              href="/archive"
              className="text-sm text-neutral-300 underline-offset-4 hover:text-white hover:underline"
            >
              View full archive
            </Link>
          }
        />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {recentFilms.slice(0, 8).map((film) => (
            <RecentFilmCard key={film.id} film={film} />
          ))}
          {recentFilms.length === 0 && (
            <Card padding="lg" className="text-sm text-neutral-400">
              Nothing in the archive yet. First week coming soon.
            </Card>
          )}
        </div>

        {/* Dissent Index */}
        <DissentIndex films={recentFilms} />
      </section>

      {/* Invite CTA */}
      <section className="mt-12 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.03] p-6 text-center md:p-10">
        <h3 className="text-xl font-semibold">Interested in joining Eiga?</h3>
        <p className="mx-auto mt-2 max-w-2xl text-neutral-300">
          We keep it small for thoughtful discourse. Request an invite, share a bit about your tastes,
          and we’ll reach out when a seat opens.
        </p>
        <div className="mt-4">
          <ButtonLink href="/request-invite" variant="primary" size="md">
            Join the waitlist
          </ButtonLink>
        </div>
      </section>
    </main>
  );
};

export default Page;