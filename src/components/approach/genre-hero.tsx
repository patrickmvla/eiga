import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Skull,
  Rocket,
  Mountain,
  Heart,
  Moon,
  Activity,
  BookOpen,
  Camera,
  Smile,
  Palette,
  FlaskConical,
} from "lucide-react"

type GenreNavItem = { key: string; title: string }

const iconFor = (key: string) => {
  switch (key) {
    case "horror":
      return Skull
    case "sci-fi":
      return Rocket
    case "western":
      return Mountain
    case "romance":
      return Heart
    case "noir":
      return Moon
    case "thriller":
      return Activity
    case "documentary":
      return Camera
    case "comedy":
      return Smile
    case "animation":
      return Palette
    case "art-experimental":
      return FlaskConical
    case "drama":
    default:
      return BookOpen
  }
}

export const GenreHero = ({
  items,
  className,
}: {
  items: GenreNavItem[]
  className?: string
}) => (
  <Card className={["relative overflow-hidden border-border bg-card/40", className].filter(Boolean).join(" ")}>
    {/* subtle olive gradient */}
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/12 to-foreground/5" />
    <CardContent className="relative z-10 p-6 md:p-8">
      {/* meta */}
      <div className="mb-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="rounded-full border border-border bg-black/40 px-2.5 py-1">Invite‑only</span>
        <span className="rounded-full border border-border bg-black/40 px-2.5 py-1">One film / week</span>
        <span className="rounded-full border border-border bg-black/40 px-2.5 py-1">Reviews first</span>
      </div>

      <div className="flex flex-col items-start gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
            How we watch by genre
          </h1>
          <p className="mt-2 max-w-2xl text-pretty text-muted-foreground">
            Genres are lenses. We look for choices—script, performance, camera, color, sound, editing, design—and talk
            precisely about what a film does and how it does it.
          </p>
        </div>
        <div className="mt-2 flex gap-2 md:mt-0">
          <Button asChild variant="outline" size="sm">
            <Link href="/philosophy">Philosophy</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/request-invite">Request invite</Link>
          </Button>
        </div>
      </div>

      {/* Jump to genres (no horizontal scroll; responsive grid that wraps) */}
      <nav aria-label="Jump to a genre" className="mt-6">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Jump to a genre
        </div>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((item) => {
            const Icon = iconFor(item.key)
            return (
              <li key={item.key}>
                <a
                  href={`#${item.key}`}
                  className="inline-flex w-full items-center justify-start gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-sm text-foreground hover:bg-card/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="truncate">{item.title}</span>
                </a>
              </li>
            )
          })}
        </ul>
      </nav>
    </CardContent>
  </Card>
)