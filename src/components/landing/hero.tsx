import Link from "next/link"
import Image from "next/image"
import { ShieldCheck, Clock, Ticket, Film, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { PosterBackdrop } from "@/components/landing/PosterBackdrop"
import type { PublicLandingData } from "@/lib/db/queries"
import { HeroCountdown } from "./hero-countdown"

type HeroProps = {
  currentFilm: PublicLandingData["currentFilm"] | null
  heroPoster: string | null
  currentSmallPoster: string | null
  seatsAvailable: number
  stats: PublicLandingData["stats"]
  showScrollHint?: boolean
}

export const Hero = ({
  currentFilm,
  heroPoster,
  currentSmallPoster,
  seatsAvailable,
  stats,
  showScrollHint = true,
}: HeroProps) => (
  <Card className="relative overflow-hidden border-border bg-card/40 shadow-lg">
    {/* Background poster */}
    <PosterBackdrop
      posterUrl={heroPoster}
      alt={currentFilm ? `${currentFilm.title} poster` : "Eiga"}
    />

    {/* Readability + olive glow overlays */}
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-black/10" />
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_10%_20%,color-mix(in_oklch,var(--primary)_22%,transparent),transparent)]" />
    <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(70%_80%_at_50%_30%,black,transparent)]" />

    <div className="relative z-10 p-6 md:p-10">
      <div className="grid grid-cols-1 items-end gap-8 md:grid-cols-[1fr_auto]">
        {/* Left: Title, meta, CTAs */}
        <div className="max-w-2xl">
          {/* Meta chips */}
          <div className="mb-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-black/40 px-2.5 py-1">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Invite‑only
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-black/40 px-2.5 py-1">
              <Clock className="h-3.5 w-3.5 text-primary" />
              Weekly cadence
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-black/40 px-2.5 py-1">
              <Ticket className="h-3.5 w-3.5 text-primary" />
              {stats.capacity} seats
            </span>
          </div>

          <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-5xl">
            Eiga — a private cinema club for serious film discourse
          </h1>
          <p className="mt-3 text-pretty text-muted-foreground md:text-lg">
            Ten members. One film a week. Thoughtful reviews before discussion.
            Curated, intimate, and spoiler‑savvy.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href="/request-invite">Request an invite</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/archive">Browse archive</Link>
            </Button>

            <Badge
              variant={seatsAvailable > 0 ? "default" : "secondary"}
              className="rounded-full px-3 py-1"
              aria-live="polite"
            >
              {seatsAvailable > 0
                ? `${seatsAvailable} seat${seatsAvailable === 1 ? "" : "s"} open`
                : "Waitlist only"}
            </Badge>
          </div>

          {!currentFilm ? (
            <div className="mt-3 text-sm text-muted-foreground">
              <HeroCountdown />
            </div>
          ) : null}
        </div>

        {/* Right: This week's film + stats */}
        <Card className="w-full max-w-sm border-border bg-black/40 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                This week’s film
              </div>
              {currentFilm ? (
                <span className="text-xs text-muted-foreground">{currentFilm.year}</span>
              ) : null}
            </div>

            {currentFilm ? (
              <div className="mt-3 flex items-center gap-3">
                <div className="relative h-16 w-11 overflow-hidden rounded-md border border-border bg-muted/20">
                  {currentSmallPoster ? (
                    <Image
                      src={currentSmallPoster}
                      alt={`${currentFilm.title} (${currentFilm.year})`}
                      fill
                      sizes="44px"
                      className="object-cover"
                      priority={false}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <Film className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-semibold">{currentFilm.title}</div>
                  <div className="text-sm text-muted-foreground">{currentFilm.year}</div>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Film className="h-4 w-4" />
                New selection drops Monday.
              </div>
            )}

            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <Card className="border-border bg-card/60">
                <CardContent className="p-3">
                  <div className="tabular-nums text-sm">
                    {stats.members}/{stats.capacity}
                  </div>
                  <div className="text-muted-foreground">Members</div>
                </CardContent>
              </Card>
              <Card className="border-border bg-card/60">
                <CardContent className="p-3">
                  <div className="tabular-nums text-sm">{stats.participation}%</div>
                  <div className="text-muted-foreground">Participation</div>
                  <div className="mt-2 h-1.5 rounded-full bg-white/10">
                    <div
                      className="h-1.5 rounded-full bg-primary/70"
                      style={{ width: `${Math.max(0, Math.min(stats.participation, 100))}%` }}
                      aria-hidden="true"
                    />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border bg-card/60">
                <CardContent className="p-3">
                  <div className="tabular-nums text-sm">{stats.avgReviewLength}</div>
                  <div className="text-muted-foreground">Avg words</div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    {showScrollHint ? (
      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center">
        <div className="flex items-center gap-2 rounded-full border border-border/60 bg-black/40 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          <ChevronDown className="h-3.5 w-3.5 animate-bounce" />
          Scroll
        </div>
      </div>
    ) : null}
  </Card>
)