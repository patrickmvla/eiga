import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type CinemaManifestoProps = {
  className?: string
}

export const CinemaManifesto = ({ className }: CinemaManifestoProps) => (
  <Card className={["relative overflow-hidden", className].filter(Boolean).join(" ")}>
    {/* subtle olive glow */}
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 to-foreground/5" />
    <CardContent className="relative z-10 p-6 md:p-8">
      <div className="mb-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <Badge className="border-border/60 bg-black/40">Invite‑only</Badge>
        <Badge className="border-border/60 bg-black/40">One film / week</Badge>
        <Badge className="border-border/60 bg-black/40">Ten seats</Badge>
      </div>

      <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
        A love letter to cinema
      </h1>

      <p className="mt-3 text-pretty text-muted-foreground md:text-base">
        We watch deliberately. We write before we speak. We keep it small so attention can be large.
        From Ozu to Varda to Tsai, we take form seriously—rhythm, sound, bodies, light—because that’s
        where feeling begins.
      </p>

      <p className="mt-3 text-pretty text-muted-foreground md:text-base">
        Each week, one film. “The Setup” frames the watch; members submit reviews before we talk.
        Disagreement sharpens taste; generosity keeps it human.
      </p>

      <blockquote className="mt-4 border-l-2 border-primary/40 pl-4 text-sm text-muted-foreground">
        “Watch deliberately. Write generously. Argue in good faith.”
      </blockquote>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/request-invite">Request an invite</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/archive">Browse archive</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/philosophy">Our philosophy</Link>
        </Button>
      </div>
    </CardContent>
  </Card>
)