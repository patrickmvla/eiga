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
import type { LandingFilm } from '@/components/landing/RecentFilmCard';

export const revalidate = 3600;

type PublicLandingData = {
  currentFilm: {
    id: number;
    title: string;
    year: number;
    posterUrl?: string | null;
  } | null;
  seatsAvailable: number;
  stats: {
    members: number;
    capacity: number;
    participation: number;
    avgReviewLength: number;
  };
  excerpts: { id: number; text: string }[];
  recentFilms: LandingFilm[];
};

// TODO: replace with real DB queries next
const fetchPublicLandingData = async (): Promise<PublicLandingData> => {
  return {
    currentFilm: {
      id: 101,
      title: 'In the Mood for Love',
      year: 2000,
      posterUrl: '/images/mock-poster.jpg',
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
  };
};

const Page = async () => {
  const data = await fetchPublicLandingData();
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
        </div>
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