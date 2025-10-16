import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import type { PublicLandingData } from "@/lib/db/queries"

type DissentIndexProps = {
  films: PublicLandingData["recentFilms"]
  className?: string
}

export const DissentIndex = ({ films, className }: DissentIndexProps) => {
  const ranked = films
    .filter((f) => typeof f.dissent === "number")
    .sort((a, b) => (b.dissent ?? 0) - (a.dissent ?? 0))
    .slice(0, 3)

  if (!ranked.length) return null

  return (
    <Card className={["mt-6", className].filter(Boolean).join(" ")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Dissent Index</CardTitle>
          <CardDescription className="text-xs">Most controversial lately</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {ranked.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between rounded-md border border-border bg-card/60 px-3 py-2"
            >
              <div className="min-w-0 truncate text-sm">
                {f.title} <span className="text-muted-foreground">({f.year})</span>
              </div>
              <Badge
                variant="secondary"
                className="ml-2 shrink-0 border-border bg-primary/10 text-foreground"
              >
                <span className="mr-1 tabular-nums">{(f.dissent ?? 0).toFixed(1)}</span>
                dissent
              </Badge>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          “Dissent” reflects how divided the group was (standard deviation of scores).
        </p>
      </CardContent>
    </Card>
  )
}