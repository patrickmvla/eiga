import Link from "next/link"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Film, MessageSquareQuote } from "lucide-react"

import { getPublicLandingData, type PublicLandingData } from "@/lib/db/queries"
import { buildPosterUrl } from "@/lib/utils/tmdb"
import { Hero } from "@/components/landing/hero"
import { InviteCta } from "@/components/landing/invite-cta"
import { SectionHeader } from "@/components/ui/section-header"
import { DissentIndex } from "@/components/landing/dissent-index"

export const revalidate = 3600

// Normalize TMDB poster paths to full URLs; anything else returns null
const normalizePoster = (
  url?: string | null,
  tmdbSize: "w92" | "w154" | "w185" | "w342" | "w500" | "w780" = "w342"
): string | null => {
  if (!url) return null
  if (url.startsWith("http")) return url
  if (url.startsWith("/")) return buildPosterUrl(url, tmdbSize)
  return null
}

const Page = async () => {
  let data: PublicLandingData | null = null
  try {
    data = await getPublicLandingData()
  } catch {
    data = null
  }

  const currentFilm = data?.currentFilm ?? null
  const seatsAvailable = data?.seatsAvailable ?? 0
  const stats = data?.stats ?? {
    members: 0,
    capacity: 10,
    participation: 0,
    avgReviewLength: 0,
  }
  const excerpts = data?.excerpts ?? []
  const recentFilms = data?.recentFilms ?? []

  // Normalize posters
  const heroPoster = normalizePoster(currentFilm?.posterUrl, "w780")
  const currentSmallPoster = normalizePoster(currentFilm?.posterUrl, "w154")

  // Grid quality/perf balance
  const recentNormalized = recentFilms.map((f) => ({
    ...f,
    posterUrl: normalizePoster(f.posterUrl, "w342"),
  }))

  const hasExcerpts = excerpts.length > 0
  const hasRecent = recentNormalized.length > 0

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 md:py-14">
      <Hero
        currentFilm={currentFilm}
        heroPoster={heroPoster}
        currentSmallPoster={currentSmallPoster}
        seatsAvailable={seatsAvailable}
        stats={stats}
      />

      {/* Teaser excerpts */}
      <section className="mt-12">
        <SectionHeader title="From the discussion (anonymized)" />
        {hasExcerpts ? (
          <div className="grid gap-4 md:grid-cols-3">
            {excerpts.map((ex) => (
              <Card key={ex.id}>
                <CardContent className="p-6 text-sm text-muted-foreground">
                  “{ex.text}”
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Empty className="rounded-2xl border border-border bg-card/20">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessageSquareQuote className="h-8 w-8 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>No excerpts yet</EmptyTitle>
              <EmptyDescription>
                Check back after this week’s discussion.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>

      {/* Recent films */}
      <section className="mt-12">
        <SectionHeader
          title="Recently discussed"
          action={
            <Button asChild variant="link" className="px-0 text-foreground">
              <Link href="/archive">View full archive</Link>
            </Button>
          }
        />

        {hasRecent ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {recentNormalized.slice(0, 8).map((film) => (
              <Card key={film.id} className="overflow-hidden">
                <div className="relative aspect-[2/3] w-full">
                  {film.posterUrl ? (
                    <Image
                      src={film.posterUrl}
                      alt={`${film.title} (${film.year})`}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-muted" />
                  )}
                </div>
                <CardContent className="p-3">
                  <div className="truncate text-sm font-medium">{film.title}</div>
                  <div className="text-xs text-muted-foreground">{film.year}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Empty className="rounded-2xl border border-border bg-card/20">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Film className="h-8 w-8 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>Nothing in the archive yet</EmptyTitle>
              <EmptyDescription>First week coming soon.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/request-invite">Join the waitlist</Link>
              </Button>
            </EmptyContent>
          </Empty>
        )}

        <DissentIndex films={recentNormalized} />
      </section>

      {/* Invite CTA */}
      <InviteCta seatsAvailable={seatsAvailable} className="mt-12" />
    </main>
  )
}

export default Page