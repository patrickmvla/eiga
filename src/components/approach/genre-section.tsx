import { Card, CardContent } from "@/components/ui/card"
import { SectionHeader } from "@/components/ui/section-header"
import { WatchForList } from "@/components/approach/watch-for-list"
import { FilmShowcase } from "@/components/approach/film-showcase"

export type GenreSectionProps = {
  id?: string
  title: string
  subtitle: string
  essence: string
  watchFor: string[]
  films: {
    title: string
    year?: number
    why: string
    posterUrl: string | null
    performances: { actor: string; role?: string; note: string }[]
    actorPosters: { name: string; role?: string; profileUrl: string | null }[]
  }[]
  action?: React.ReactNode
  className?: string
}

export const GenreSection = ({
  id,
  title,
  subtitle,
  essence,
  watchFor,
  films,
  action,
  className,
}: GenreSectionProps) => (
  <section id={id} className={["scroll-mt-24 pt-8", className].filter(Boolean).join(" ")}>
    <SectionHeader title={title} subtitle={subtitle} action={action} />
    <blockquote className="mb-4 border-l-2 border-primary/40 pl-3 italic text-muted-foreground">{essence}</blockquote>

    {/* Compact chips to avoid sidebar whitespace */}
    <WatchForList items={watchFor} variant="chips" />

    <div className="mt-6 grid gap-6 md:grid-cols-2">
      {films.map((film, idx) => (
        <Card key={idx} className="border-border bg-card/40">
          <CardContent className="p-6">
            <FilmShowcase film={film} />
          </CardContent>
        </Card>
      ))}
    </div>
  </section>
)