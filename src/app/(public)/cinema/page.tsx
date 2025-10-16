import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SectionHeader } from "@/components/ui/section-header"
import { ThemeSection } from "@/components/landing/theme-section"
import { ThemeTextList } from "@/components/landing/theme-text-list"
import { CinemaManifesto } from "@/components/landing/cinema-manifesto"
import { CinePrinciples } from "@/components/landing/cine-principles"
import { searchMovies, TMDB_ENABLED } from "@/lib/utils/tmdb"

export const revalidate = 86400 // refresh daily

type CuratedItem = { title: string; year?: number }
type CuratedTheme = {
  key: string
  title: string
  blurb: string
  films: CuratedItem[]
}

const themes: CuratedTheme[] = [
  {
    key: "melancholy-memory",
    title: "Melancholy & Memory",
    blurb:
      "Echoes across time: gestures repeated, recollection refracted through color and rhythm.",
    films: [
      { title: "In the Mood for Love", year: 2000 },
      { title: "The Mirror", year: 1975 },
      { title: "A Brighter Summer Day", year: 1991 },
      { title: "Tokyo Story", year: 1953 },
    ],
  },
  {
    key: "rhythms-bodies",
    title: "Rhythms & Bodies",
    blurb: "Choreography, discipline, and the human figure set to image and time.",
    films: [
      { title: "Beau Travail", year: 1999 },
      { title: "The Red Shoes", year: 1948 },
      { title: "All That Jazz", year: 1979 },
      { title: "Climax", year: 2018 },
    ],
  },
  {
    key: "sound-surveillance",
    title: "Sound & Surveillance",
    blurb: "Ethics of listening and looking: rooms that keep secrets; sound that confesses.",
    films: [
      { title: "The Conversation", year: 1974 },
      { title: "Blow Out", year: 1981 },
      { title: "Berberian Sound Studio", year: 2012 },
      { title: "Memories of Murder", year: 2003 },
    ],
  },
  {
    key: "play-form",
    title: "Play & Form",
    blurb: "Time, identity, and image bent into games that open real emotion.",
    films: [
      { title: "Celine and Julie Go Boating", year: 1974 },
      { title: "Persona", year: 1966 },
      { title: "La Jetée", year: 1962 },
      { title: "PlayTime", year: 1967 },
    ],
  },
  {
    key: "work-dignity",
    title: "Work & Dignity",
    blurb: "Labor, solidarity, and the grace of everyday effort.",
    films: [
      { title: "Killer of Sheep", year: 1978 },
      { title: "The Ascent", year: 1977 },
      { title: "Parasite", year: 2019 },
      { title: "Seven Samurai", year: 1954 },
    ],
  },
]

type Poster = { title: string; year: number | null; posterUrl: string | null }

const resolvePoster = async ({ title, year }: CuratedItem): Promise<Poster> => {
  try {
    const results = await searchMovies(title, {
      year: typeof year === "number" ? year : undefined,
      includeAdult: false,
      language: "en-US",
    })
    if (!results.length) return { title, year: year ?? null, posterUrl: null }
    const exact = typeof year === "number" ? results.find((r) => r.year === year) : undefined
    const pick = exact ?? results[0]
    return { title: pick.title, year: pick.year ?? null, posterUrl: pick.posterUrl ?? null }
  } catch {
    return { title, year: year ?? null, posterUrl: null }
  }
}

const fetchTheme = async (theme: CuratedTheme) => {
  const posters = await Promise.all(theme.films.map(resolvePoster))
  return { ...theme, posters }
}

const Page = async () => {
  const loaded = TMDB_ENABLED ? await Promise.all(themes.map(fetchTheme)) : null

  const sections = themes.map((t, i) => ({
    theme: t,
    posters: loaded?.[i]?.posters.filter((p) => p.posterUrl) ?? null,
  }))

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 md:py-14">
      <SectionHeader
        title="A love letter to cinema"
        subtitle="Programming across decades, countries, and forms — small on purpose, serious about discourse."
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/philosophy">Philosophy</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/request-invite">Request invite</Link>
            </Button>
          </div>
        }
      />

      <CinemaManifesto />
      <CinePrinciples />

      <Card className="mt-10">
        <CardContent className="p-6 md:p-8">
          <p className="text-pretty text-muted-foreground">
            We see films as art—built from rhythm, sound, performance, light, and history. Each
            week we curate one film and ask members to write before we gather. Over time,
            threads emerge: melancholy and memory; bodies and choreography; ethics of listening;
            games of form; labor and dignity.
          </p>
        </CardContent>
      </Card>

      {sections.map(({ theme, posters }) =>
        posters && posters.length ? (
          <ThemeSection
            key={theme.key}
            title={theme.title}
            subtitle={theme.blurb}
            posters={posters}
            action={
              <Button asChild variant="link" className="px-0 text-foreground">
                <Link href="/archive">Explore more</Link>
              </Button>
            }
          />
        ) : (
          <ThemeTextList
            key={theme.key}
            title={theme.title}
            subtitle={theme.blurb}
            items={theme.films}
          />
        )
      )}

      <Card className="mt-12">
        <CardContent className="rounded-2xl bg-gradient-to-br from-primary/10 to-foreground/5 p-6 text-center md:p-10">
          <h3 className="text-xl font-semibold">Want to join Eiga?</h3>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
            Intimate by design. One film a week. Thoughtful reviews before discussion. If that
            sounds like you, we’d love to hear from you.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Button asChild>
              <Link href="/request-invite">Request an invite</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/archive">Browse archive</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

export default Page