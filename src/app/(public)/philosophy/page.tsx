import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SectionHeader } from "@/components/ui/section-header"

import {
  Users,
  CheckCircle2,
  ListChecks,
  Clock,
  Eye,
  ShieldCheck,
  CalendarDays,
  Film,
  MessageSquare,
  ScrollText,
  PenLine,
  MessageSquareQuote,
  BarChart3,
  Activity,
  TrendingUp,
  Shield,
  Globe,
  ChevronRight,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Philosophy · Eiga",
  description:
    "Eiga is a private, invite-only cinema club built for deep, sustained film discourse—small by design, curated with care.",
}

const MetaChip = ({ children }: { children: React.ReactNode }) => (
  <span className="rounded-full border border-border bg-black/40 px-2.5 py-1 text-xs text-muted-foreground">
    {children}
  </span>
)

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <li className="flex gap-2">
    <ChevronRight className="mt-0.5 h-4 w-4 flex-none text-primary" />
    <span>{children}</span>
  </li>
)

const Page = () => (
  <main className="mx-auto w-full max-w-6xl px-4 py-10 md:py-14">
    {/* Hero */}
    <Card className="relative overflow-hidden border-border bg-card/40">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/12 to-foreground/5" />
      <CardContent className="relative z-10 p-6 md:p-8">
        <div className="mb-3 flex flex-wrap gap-2">
          <MetaChip>Invite‑only</MetaChip>
          <MetaChip>Ten seats</MetaChip>
          <MetaChip>One film / week</MetaChip>
          <MetaChip>Reviews first</MetaChip>
        </div>

        <div className="flex flex-col items-start gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
              Philosophy
            </h1>
            <p className="mt-2 max-w-2xl text-pretty text-muted-foreground">
              Intimate scale. Serious discourse. One film a week. We’re here to watch deliberately,
              write generously, and argue in good faith.
            </p>
          </div>
          <div className="mt-2 flex gap-2 md:mt-0">
            <Button asChild variant="outline" size="sm">
              <Link href="/archive">Browse archive</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/request-invite">Request invite</Link>
            </Button>
          </div>
        </div>

        <blockquote className="mt-4 border-l-2 border-primary/40 pl-4 text-sm text-muted-foreground">
          “Quality over quantity. Presence over performance. Curiosity over consensus.”
        </blockquote>
      </CardContent>
    </Card>

    {/* Core principles */}
    <section className="mt-10 grid gap-4 md:grid-cols-3">
      <Card className="border-border bg-card/40">
        <CardContent className="p-6">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Users className="h-4 w-4" />
            <h3 className="text-sm font-semibold">Private, intimate scale</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            The club caps at ten members. Small on purpose—so threads feel like a salon, not a timeline.
          </p>
        </CardContent>
      </Card>
      <Card className="border-border bg-card/40">
        <CardContent className="p-6">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <CheckCircle2 className="h-4 w-4" />
            <h3 className="text-sm font-semibold">Quality over quantity</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            We privilege careful viewing and thoughtful writing. Shallow hot takes belong elsewhere.
          </p>
        </CardContent>
      </Card>
      <Card className="border-border bg-card/40">
        <CardContent className="p-6">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <ListChecks className="h-4 w-4" />
            <h3 className="text-sm font-semibold">Curated with input</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            An admin selects one film per week from member suggestions, balancing eras, regions, and forms.
          </p>
        </CardContent>
      </Card>
      <Card className="border-border bg-card/40">
        <CardContent className="p-6">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Clock className="h-4 w-4" />
            <h3 className="text-sm font-semibold">Ritual and rhythm</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            One film a week. Watch Mon–Thu. Discuss Fri–Sun. Enough time to think—not enough to drift.
          </p>
        </CardContent>
      </Card>
      <Card className="border-border bg-card/40">
        <CardContent className="p-6">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Eye className="h-4 w-4" />
            <h3 className="text-sm font-semibold">Public mystique</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Visitors see anonymized excerpts and aggregates—never full threads. Standards visible, privacy preserved.
          </p>
        </CardContent>
      </Card>
      <Card className="border-border bg-card/40">
        <CardContent className="p-6">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <ShieldCheck className="h-4 w-4" />
            <h3 className="text-sm font-semibold">Respect as a feature</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            We debate ideas, not people. Moderation is hands‑on, and participation is expected.
          </p>
        </CardContent>
      </Card>
    </section>

    {/* Why private & How films are chosen */}
    <section className="mt-10 grid gap-4 md:grid-cols-2">
      <Card className="border-border bg-card/40">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-foreground">Why private—and why small</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <Bullet>Accountability encourages care. When ten voices matter, each post matters.</Bullet>
            <Bullet>Intimacy keeps discourse legible—ideas can breathe without being buried.</Bullet>
            <Bullet>Continuity builds a shared vocabulary across weeks, years, and threads.</Bullet>
          </ul>
        </CardContent>
      </Card>
      <Card className="border-border bg-card/40">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-foreground">How we choose films</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <Bullet>Members suggest weekly; the admin curates across decade, country, and form.</Bullet>
            <Bullet>We mix canons with discoveries: docs, shorts, experimental, and popular cinema.</Bullet>
            <Bullet>Accessibility matters—region availability and advisories are considered.</Bullet>
          </ul>
        </CardContent>
      </Card>
    </section>

    {/* How the week works */}
    <section className="mt-10">
      <SectionHeader title="How a week works" />
      <div className="grid gap-3 md:grid-cols-4">
        <Card className="border-border bg-card/40">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <CalendarDays className="h-4 w-4 text-primary" />
              Monday
            </div>
            <div className="mt-1 font-semibold text-foreground">The Setup</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Admin announces the film with context, themes, and viewing notes.
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/40">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <Film className="h-4 w-4 text-primary" />
              Mon–Thu
            </div>
            <div className="mt-1 font-semibold text-foreground">Watch</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Members watch and prepare a review. No discussion yet—just notes.
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/40">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <MessageSquare className="h-4 w-4 text-primary" />
              Fri–Sun
            </div>
            <div className="mt-1 font-semibold text-foreground">The Discourse</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Post your review, then enter threads. Spoilers tagged. Scene‑specific timestamps welcome.
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/40">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <ScrollText className="h-4 w-4 text-primary" />
              Sunday night
            </div>
            <div className="mt-1 font-semibold text-foreground">The Verdict</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Admin closes with highlights and selects next week’s film from member suggestions.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>

    {/* Reviews + Discussion */}
    <section className="mt-10 grid gap-4 md:grid-cols-2">
      <Card className="border-border bg-card/40">
        <CardContent className="p-6">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <PenLine className="h-4 w-4" />
            <h3 className="text-sm font-semibold text-foreground">What counts as a review</h3>
          </div>
          <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
            <Bullet>100–1000 words citing scenes, choices, or moments (not vibes alone).</Bullet>
            <Bullet>Engage craft: staging, cutting, sound, performance, rhythm, writing, design.</Bullet>
            <Bullet>Bring context—history, influences, reception—earned by close viewing.</Bullet>
          </ul>
        </CardContent>
      </Card>
      <Card className="border-border bg-card/40">
        <CardContent className="p-6">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <MessageSquareQuote className="h-4 w-4" />
            <h3 className="text-sm font-semibold text-foreground">How we discuss</h3>
          </div>
          <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
            <Bullet>Two‑level threads keep focus; quote precisely and timestamp when possible.</Bullet>
            <Bullet>Disagree well: interpret charitably, then critique clearly.</Bullet>
            <Bullet>Flag spoilers, and prefer evidence over assertion.</Bullet>
          </ul>
        </CardContent>
      </Card>
    </section>

    {/* House rules */}
    <section className="mt-10">
      <SectionHeader title="House rules" />
      <Card className="border-border bg-card/40">
        <CardContent className="p-6">
          <ul className="grid gap-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
              <span>Reviews come first: 100–1000 words before you join discussion threads.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
              <span>Keep it readable: threads limited to two levels—depth without derailment.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
              <span>Tag spoilers and use timestamps for scene‑specific talk.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
              <span>Argue in good faith. Critique ideas, not people. Civility is non‑negotiable.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
              <span>Participation matters: prolonged inactivity may lead to removal.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
              <span>Real names or consistent usernames—community trust over anonymity.</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </section>

    {/* What we measure */}
    <section className="mt-10">
      <SectionHeader
        title="What we measure (and why)"
        subtitle="Signals that help us understand taste without gamifying it."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border bg-card/40">
          <CardContent className="p-6">
            <div className="mb-2 flex items-center gap-2 text-primary">
              <BarChart3 className="h-4 w-4" />
              <h4 className="text-sm font-semibold">Average score</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              A group temperature check—not the point, but a useful compass.
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/40">
          <CardContent className="p-6">
            <div className="mb-2 flex items-center gap-2 text-primary">
              <Activity className="h-4 w-4" />
              <h4 className="text-sm font-semibold">Dissent index</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Standard deviation of scores—a proxy for how divided the room was.
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/40">
          <CardContent className="p-6">
            <div className="mb-2 flex items-center gap-2 text-primary">
              <TrendingUp className="h-4 w-4" />
              <h4 className="text-sm font-semibold">Contrarian score</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              How often your ratings diverge from the group average—a celebration of distinct taste.
            </p>
          </CardContent>
        </Card>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Metrics are descriptive, not prescriptive. Visitors see titles and aggregates; member reviews and discussions remain private.
      </p>
    </section>

    {/* Moderation & accessibility */}
    <section className="mt-10 grid gap-4 md:grid-cols-2">
      <Card className="border-border bg-card/40">
        <CardContent className="p-6">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Shield className="h-4 w-4" />
            <h3 className="text-sm font-semibold text-foreground">Moderation & safety</h3>
          </div>
          <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
            <Bullet>Firm boundaries around respect, harassment, and bigotry.</Bullet>
            <Bullet>Clear red lines and swift intervention when needed.</Bullet>
            <Bullet>Assume good faith; protect readerly attention.</Bullet>
          </ul>
        </CardContent>
      </Card>
      <Card className="border-border bg-card/40">
        <CardContent className="p-6">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Globe className="h-4 w-4" />
            <h3 className="text-sm font-semibold text-foreground">Access & time zones</h3>
          </div>
          <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
            <Bullet>Asynchronous by design; show up across the window that works for you.</Bullet>
            <Bullet>Captioning and content advisories are encouraged in setups.</Bullet>
            <Bullet>Availability notes help the group plan (region locks, rentals, physical media).</Bullet>
          </ul>
        </CardContent>
      </Card>
    </section>

    {/* Join CTA */}
    <Card className="mt-12">
      <CardContent className="rounded-2xl bg-gradient-to-br from-primary/10 to-foreground/5 p-6 text-center md:p-10">
        <h3 className="text-xl font-semibold">Want to join Eiga?</h3>
        <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
          We maintain a short waitlist to preserve the club’s size and rhythm. Tell us about your interests
          and viewing habits—when a seat opens, we’ll reach out.
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button asChild>
            <Link href="/request-invite">Request an invite</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/archive">Browse the archive</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  </main>
)

export default Page