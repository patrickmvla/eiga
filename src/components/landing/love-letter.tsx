import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"

type LoveLetterProps = {
  className?: string
  actions?: ReactNode
}

export const LoveLetter = ({ className, actions }: LoveLetterProps) => (
  <Card className={["overflow-hidden", className].filter(Boolean).join(" ")}>
    <CardContent className="p-6 md:p-8">
      <article
        aria-labelledby="love-letter-heading"
        className="relative rounded-xl border border-border/60 bg-gradient-to-br from-primary/10 to-foreground/5 p-5 md:p-6"
      >
        <h3 id="love-letter-heading" className="sr-only">
          A love letter to cinema
        </h3>

        <p className="text-pretty text-muted-foreground first-letter:mr-2 first-letter:text-5xl first-letter:font-semibold first-letter:leading-[0.8]">
          Dear cinema— You taught us to look slowly: at hands hesitating on doorframes, at faces that flicker
          with time. Each week we gather to watch one film with intention, to write before we speak, and to
          let disagreement refine taste rather than calcify it.
        </p>

        <p className="mt-3 text-pretty text-muted-foreground">
          We return to threads, not answers: melancholy and memory; bodies and rhythm; the ethics of watching
          and listening; play as form; work and dignity. Not to pin cinema down—but to be changed by it.
        </p>

        <blockquote className="mt-4 border-l-2 border-primary/40 pl-4 text-sm text-muted-foreground">
          “Watch deliberately. Write generously. Argue in good faith.”
        </blockquote>

        <p className="mt-4 text-sm italic text-muted-foreground">With care, Eiga</p>

        {actions ? <div className="mt-6 flex flex-wrap items-center gap-3">{actions}</div> : null}
      </article>
    </CardContent>
  </Card>
)