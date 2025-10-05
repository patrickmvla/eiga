// app/(public)/cinema/page.tsx
import Image from 'next/image';
import Link from 'next/link';

import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { searchMovies, TMDB_ENABLED } from '@/lib/utils/tmdb';

export const revalidate = 86400; // Refresh daily

type CuratedItem = { title: string; year?: number };
type CuratedTheme = {
  key: string;
  title: string;
  blurb: string;
  films: CuratedItem[];
};

const themes: CuratedTheme[] = [
  {
    key: 'melancholy-memory',
    title: 'Melancholy & Memory',
    blurb:
      'Cinema as a chamber for echoes: gestures repeated, time refracted, memory breathed into color and rhythm.',
    films: [
      { title: 'In the Mood for Love', year: 2000 },
      { title: 'The Mirror', year: 1975 },
      { title: 'A Brighter Summer Day', year: 1991 },
      { title: 'Tokyo Story', year: 1953 },
    ],
  },
  {
    key: 'rhythms-bodies',
    title: 'Rhythms & Bodies',
    blurb:
      'Movement scored into image: choreography, discipline, and the human figure as instrument.',
    films: [
      { title: 'Beau Travail', year: 1999 },
      { title: 'The Red Shoes', year: 1948 },
      { title: 'All That Jazz', year: 1979 },
      { title: 'Climax', year: 2018 },
    ],
  },
  {
    key: 'sound-surveillance',
    title: 'Sound & Surveillance',
    blurb:
      'Ethics of listening and looking: tape hiss and paranoia, rooms that keep secrets, sound that confesses.',
    films: [
      { title: 'The Conversation', year: 1974 },
      { title: 'Blow Out', year: 1981 },
      { title: 'Berberian Sound Studio', year: 2012 },
      { title: 'Memories of Murder', year: 2003 },
    ],
  },
  {
    key: 'play-form',
    title: 'Play & Form',
    blurb:
      'Cinema that toys with time, identity, and image—formal games that open real emotion.',
    films: [
      { title: 'Celine and Julie Go Boating', year: 1974 },
      { title: 'Persona', year: 1966 },
      { title: 'La Jetée', year: 1962 },
      { title: 'PlayTime', year: 1967 },
    ],
  },
  {
    key: 'work-dignity',
    title: 'Work & Dignity',
    blurb:
      'Lives held in frames of labor, solidarity, and the grace of everyday effort.',
    films: [
      { title: 'Killer of Sheep', year: 1978 },
      { title: 'The Ascent', year: 1977 },
      { title: 'Parasite', year: 2019 },
      { title: 'Seven Samurai', year: 1954 },
    ],
  },
];

type Poster = { title: string; year: number | null; posterUrl: string | null };

// Resolve a poster via TMDB search (best match by year; graceful fallback)
async function resolvePoster({ title, year }: CuratedItem): Promise<Poster> {
  try {
    const results = await searchMovies(title, {
      year: typeof year === 'number' ? year : undefined,
      includeAdult: false,
      language: 'en-US',
    });
    if (!results.length) return { title, year: year ?? null, posterUrl: null };
    // Prefer exact-year match if possible
    const exact = typeof year === 'number' ? results.find((r) => r.year === year) : undefined;
    const pick = exact ?? results[0];
    return { title: pick.title, year: pick.year, posterUrl: pick.posterUrl };
  } catch {
    return { title, year: year ?? null, posterUrl: null };
  }
}

async function fetchTheme(theme: CuratedTheme) {
  const posters = await Promise.all(theme.films.map(resolvePoster));
  return { ...theme, posters };
}

const PosterTile = ({ title, year, posterUrl }: Poster) => (
  <div className="group relative overflow-hidden rounded-lg border border-white/10 bg-white/5">
    <div className="relative aspect-[2/3]">
      {posterUrl ? (
        <Image
          src={posterUrl}
          alt={`${title}${year ? ` (${year})` : ''}`}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-neutral-800 to-neutral-900" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <div className="truncate text-sm font-semibold text-white">{title}</div>
        <div className="text-xs text-neutral-400">{year ?? ''}</div>
      </div>
    </div>
  </div>
);

const Page = async () => {
  // If TMDB isn’t configured, show a friendly note + CTAs
  if (!TMDB_ENABLED) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 md:py-14">
        <SectionHeader
          title="A love letter to cinema"
          subtitle="We treat films as art—across decades, countries, and forms."
        />
        <Card padding="lg" className="mb-6">
          <p className="text-neutral-300">
            This page highlights curated themes we return to again and again—melancholy and memory, rhythm and
            bodies, sound and surveillance, play and form, work and dignity. We use real posters from TMDB to showcase
            films as we program them. TMDB isn’t configured right now, but you can still explore what we care about.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <ButtonLink href="/philosophy" variant="primary" size="md">Read our philosophy</ButtonLink>
            <ButtonLink href="/archive" variant="outline" size="md">Browse the archive</ButtonLink>
            <ButtonLink href="/request-invite" variant="ghost" size="md">Request an invite</ButtonLink>
          </div>
        </Card>
      </main>
    );
  }

  const loaded = await Promise.all(themes.map(fetchTheme));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 md:py-14">
      <SectionHeader
        title="A love letter to cinema"
        subtitle="We program across decades, countries, and forms — small on purpose, serious about discourse."
        action={
          <div className="flex gap-2">
            <ButtonLink href="/philosophy" variant="outline" size="sm">Philosophy</ButtonLink>
            <ButtonLink href="/request-invite" variant="primary" size="sm">Request invite</ButtonLink>
          </div>
        }
      />

      <Card padding="lg" className="mb-8">
        <p className="text-pretty text-neutral-300">
          We see films as art—built from rhythm, sound, performance, light, and history. Each week we curate one film,
          write “The Setup,” and ask members to review before discussing. Over time, threads of inquiry emerge:
          melancholy and memory, bodies and choreography, ethics of listening, games of form, labor and dignity.
        </p>
        <blockquote className="mt-4 border-l-2 border-olive-500/40 pl-4 text-sm text-neutral-400">
          “Watch deliberately. Write generously. Argue in good faith.”
        </blockquote>
      </Card>

      {loaded.map((theme) => {
        const posters = theme.posters.filter((p) => p.posterUrl != null);
        return (
          <section key={theme.key} className="mt-10">
            <SectionHeader
              title={theme.title}
              subtitle={theme.blurb}
              action={
                <Link
                  href="/archive"
                  className="text-sm text-neutral-300 underline-offset-4 hover:text-white hover:underline"
                >
                  Explore more
                </Link>
              }
            />
            {posters.length === 0 ? (
              <Card padding="lg" className="text-sm text-neutral-400">
                Posters unavailable at the moment. Check back soon.
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {posters.map((p) => (
                  <PosterTile key={`${p.title}-${p.year ?? 'n/a'}`} title={p.title} year={p.year} posterUrl={p.posterUrl} />
                ))}
              </div>
            )}
          </section>
        );
      })}

      <section className="mt-12 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.03] p-6 text-center md:p-10">
        <h3 className="text-xl font-semibold">Want to join Eiga?</h3>
        <p className="mx-auto mt-2 max-w-2xl text-neutral-300">
          Intimate by design. One film a week. Thoughtful reviews before discussion. If that sounds like you, we’d love to hear from you.
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <ButtonLink href="/request-invite" variant="primary" size="md">
            Request an invite
          </ButtonLink>
          <Link
            href="/philosophy"
            className="text-sm text-neutral-300 underline-offset-4 hover:text-white hover:underline"
          >
            Read our philosophy
          </Link>
        </div>
      </section>
    </main>
  );
};

export default Page;