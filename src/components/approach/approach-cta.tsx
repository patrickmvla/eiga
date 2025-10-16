import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export const ApproachCta = ({ className }: { className?: string }) => (
  <Card className={["mt-12", className].filter(Boolean).join(" ")}>
    <CardContent className="rounded-2xl bg-gradient-to-br from-primary/10 to-foreground/5 p-6 text-center md:p-10">
      <h3 className="text-xl font-semibold">Careful viewing. Serious discourse.</h3>
      <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
        Genres as threads, craft as evidence, conversation as art—join our waitlist. We keep the circle small so each voice matters.
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <Button asChild>
          <Link href="/request-invite">Request an invite</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/philosophy">Read our philosophy</Link>
        </Button>
      </div>
    </CardContent>
  </Card>
)