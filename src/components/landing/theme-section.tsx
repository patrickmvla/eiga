import type { ReactNode } from "react"
import { SectionHeader } from "@/components/ui/section-header"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { ImageOff } from "lucide-react"
import { PosterTile } from "@/components/landing/poster-tile"

export type ThemePoster = { title: string; year: number | null; posterUrl: string | null }

type ThemeSectionProps = {
  title: string
  subtitle?: string
  posters: ThemePoster[]
  action?: ReactNode
  className?: string
  gridClassName?: string
}

export const ThemeSection = ({
  title,
  subtitle,
  posters,
  action,
  className,
  gridClassName,
}: ThemeSectionProps) => {
  const hasPosters = posters.length > 0
  return (
    <section className={["mt-10", className].filter(Boolean).join(" ")}>
      <SectionHeader title={title} subtitle={subtitle} action={action} />
      {!hasPosters ? (
        <Empty className="rounded-2xl border border-border bg-card/20">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ImageOff className="h-8 w-8 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>Posters unavailable</EmptyTitle>
            <EmptyDescription>Check back soon.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className={["grid grid-cols-2 gap-4 md:grid-cols-4", gridClassName].filter(Boolean).join(" ")}>
          {posters.map((p) => (
            <PosterTile
              key={`${p.title}-${p.year ?? "n/a"}`}
              title={p.title}
              year={p.year}
              posterUrl={p.posterUrl}
            />
          ))}
        </div>
      )}
    </section>
  )
}