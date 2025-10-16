import Link from "next/link"

import { ApproachCta } from "@/components/approach/approach-cta"
import { GenreHero } from "@/components/approach/genre-hero"
import { GenreSection } from "@/components/approach/genre-section"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import {
  guides,
  type CuratedFilm,
  type GenreGuide,
} from "@/lib/content/approach-guides"
import { searchMovies, searchPerson, TMDB_ENABLED } from "@/lib/utils/tmdb"

export const revalidate = 86400

type ActorPoster = { name: string; role?: string; profileUrl: string | null }
type FilmWithPosters = CuratedFilm & { posterUrl: string | null; actorPosters: ActorPoster[] }
type GenreWithPosters = Omit<GenreGuide, "films"> & { films: FilmWithPosters[] }

const resolveFilm = async (film: CuratedFilm): Promise<FilmWithPosters> => {
  try {
    const movieResults = await searchMovies(film.title, {
      year: film.year,
      includeAdult: false,
      language: "en-US",
    })
    const movie = movieResults[0] ?? null

    const actorPosters = await Promise.all(
      film.performances.map(async (perf) => {
        try {
          const personResults = await searchPerson(perf.actor)
          const person = personResults[0] ?? null
          return { name: perf.actor, role: perf.role, profileUrl: person?.profileUrl ?? null }
        } catch {
          return { name: perf.actor, role: perf.role, profileUrl: null }
        }
      })
    )

    return { ...film, posterUrl: movie?.posterUrl ?? null, actorPosters }
  } catch {
    return {
      ...film,
      posterUrl: null,
      actorPosters: film.performances.map((p) => ({ name: p.actor, role: p.role, profileUrl: null })),
    }
  }
}

const fetchGenreWithPosters = async (guide: GenreGuide): Promise<GenreWithPosters> => {
  const films = await Promise.all(guide.films.map(resolveFilm))
  return { ...guide, films }
}

const Page = async () => {
  const genres: GenreWithPosters[] = TMDB_ENABLED
    ? await Promise.all(guides.map(fetchGenreWithPosters))
    : guides.map((g) => ({
        ...g,
        films: g.films.map((f) => ({
          ...f,
          posterUrl: null,
          actorPosters: f.performances.map((p) => ({ name: p.actor, role: p.role, profileUrl: null })),
        })),
      }))

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 md:py-14">
      <GenreHero items={guides.map(({ key, title }) => ({ key, title }))} />

      {/* Short framing paragraph (kept concise) */}
      <Card className="mt-8">
        <CardContent className="p-6 md:p-8">
          <p className="text-pretty text-muted-foreground">
            Reviews come first (100–1000 words), anchored in scenes and choices. Then we discuss—patiently, precisely,
            with care. Below, each genre shows what we attend to most, and a few films that embody those choices.
          </p>
        </CardContent>
      </Card>

      {genres.map((g) => (
        <GenreSection
          key={g.key}
          id={g.key}
          title={g.title}
          subtitle={g.blurb}
          essence={g.essence}
          watchFor={g.watchFor}
          films={g.films}
          action={
            <Button asChild variant="link" className="px-0 text-foreground">
              <Link href="/archive">Explore more</Link>
            </Button>
          }
        />
      ))}

      <ApproachCta />
    </main>
  )
}

export default Page