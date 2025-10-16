import Image from "next/image"
import { Clapperboard } from "lucide-react"
import { ActorCard } from "@/components/approach/actor-card"

export type FilmShowcaseProps = {
  film: {
    title: string
    year?: number
    why: string
    posterUrl: string | null
    performances: { actor: string; role?: string; note: string }[]
    actorPosters: { name: string; role?: string; profileUrl: string | null }[]
  }
  className?: string
}

export const FilmShowcase = ({ film, className }: FilmShowcaseProps) => (
  <div className={["grid gap-4 md:grid-cols-[200px_1fr]", className].filter(Boolean).join(" ")}>
    <div className="relative aspect-[2/3] overflow-hidden rounded-md border border-border bg-muted/20">
      {film.posterUrl ? (
        <Image
          src={film.posterUrl}
          alt={`${film.title}${film.year ? ` (${film.year})` : ""}`}
          fill
          sizes="200px"
          className="object-cover"
        />
      ) : null}
    </div>

    <div className="space-y-3">
      <div>
        <h4 className="text-lg font-semibold text-foreground">
          {film.title} {film.year ? <span className="text-muted-foreground">({film.year})</span> : null}
        </h4>
        <p className="mt-1 text-sm italic text-muted-foreground">{film.why}</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Clapperboard className="h-3.5 w-3.5 text-primary" />
          Notable performances
        </div>
        {film.performances.map((perf, idx) => {
          const ap = film.actorPosters.find((p) => p.name === perf.actor)
          return (
            <ActorCard
              key={`${perf.actor}-${idx}`}
              name={perf.actor}
              role={perf.role}
              profileUrl={ap?.profileUrl ?? null}
              note={perf.note}
            />
          )
        })}
      </div>
    </div>
  </div>
)