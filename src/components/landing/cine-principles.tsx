import { Card, CardContent } from "@/components/ui/card"
import { Eye, PenLine, MessageSquare, UsersRound } from "lucide-react"

type CinePrinciplesProps = { className?: string }

const Item = ({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) => (
  <Card className="border-border/70 bg-card/50">
    <CardContent className="flex items-start gap-3 p-4">
      <div className="mt-0.5 text-primary">{icon}</div>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </div>
    </CardContent>
  </Card>
)

export const CinePrinciples = ({ className }: CinePrinciplesProps) => (
  <section className={["mt-8", className].filter(Boolean).join(" ")}>
    <div className="grid gap-3 md:grid-cols-2">
      <Item
        icon={<Eye className="h-4 w-4" />}
        title="Attention over speed"
        desc="We program for patience—frames, rhythms, and choices that reward careful looking."
      />
      <Item
        icon={<PenLine className="h-4 w-4" />}
        title="Write before talk"
        desc="Reviews first, then discussion. Language clarifies what we felt and why."
      />
      <Item
        icon={<MessageSquare className="h-4 w-4" />}
        title="Disagree well"
        desc="We argue in good faith—style, ethics, and taste can collide without contempt."
      />
      <Item
        icon={<UsersRound className="h-4 w-4" />}
        title="Small on purpose"
        desc="Ten members. One film. A room that can actually hear itself."
      />
    </div>
  </section>
)