// app/(public)/philosophy/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui/ButtonLink';

export const metadata: Metadata = {
  title: 'Philosophy · Eiga',
  description:
    'Eiga is a private, invite-only cinema club built for deep, sustained film discourse—small by design, curated with care.',
};

const Page = () => {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 md:py-14">
      <SectionHeader
        title="Philosophy"
        subtitle="Intimate scale. Serious discourse. One film a week."
      />

      <Card padding="lg" className="mb-8">
        <p className="text-pretty text-neutral-300">
          Eiga is a private cinema club for people who love thinking about movies as much as watching them.
          We keep membership small, the cadence steady, and the conversation deliberate. The goal isn’t to
          collect ratings—it’s to build an evolving conversation among a committed group.
        </p>
        <blockquote className="mt-4 border-l-2 border-olive-500/40 pl-4 text-sm text-neutral-400">
          “Quality over quantity. Presence over performance. Curiosity over consensus.”
        </blockquote>
      </Card>

      {/* Core principles */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-olive-300">Private, intimate scale</h3>
          <p className="mt-2 text-sm text-neutral-300">
            The club caps at 10 members. Small on purpose—so threads feel like a salon, not a timeline.
          </p>
        </Card>
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-olive-300">Quality over quantity</h3>
          <p className="mt-2 text-sm text-neutral-300">
            We privilege careful viewing and thoughtful writing. Shallow hot takes belong elsewhere.
          </p>
        </Card>
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-olive-300">Curated with input</h3>
          <p className="mt-2 text-sm text-neutral-300">
            An admin selects one film per week from member suggestions, steering balance across eras, regions, and forms.
          </p>
        </Card>
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-olive-300">Ritual and rhythm</h3>
          <p className="mt-2 text-sm text-neutral-300">
            One film a week. Watch Mon–Thu. Discuss Fri–Sun. Enough time to think, not enough to drift.
          </p>
        </Card>
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-olive-300">Public mystique</h3>
          <p className="mt-2 text-sm text-neutral-300">
            Visitors glimpse our standards via anonymized excerpts and aggregate ratings—never full threads.
          </p>
        </Card>
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-olive-300">Respect as a feature</h3>
          <p className="mt-2 text-sm text-neutral-300">
            We debate ideas, not people. Moderation is hands-on, and participation is expected.
          </p>
        </Card>
      </section>

      {/* Why private & How films are chosen */}
      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-neutral-100">Why private—and why small</h3>
          <ul className="mt-2 list-disc pl-5 text-sm text-neutral-300">
            <li>Accountability encourages care. When ten voices matter, each post matters.</li>
            <li>Intimacy keeps discourse legible—ideas can breathe without being buried.</li>
            <li>Continuity builds a shared vocabulary across weeks, years, and threads.</li>
          </ul>
        </Card>
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-neutral-100">How we choose films</h3>
          <ul className="mt-2 list-disc pl-5 text-sm text-neutral-300">
            <li>Members suggest weekly; the admin curates for balance across decade, country, and form.</li>
            <li>We mix canons with discoveries: documentaries, shorts, experimental, and popular cinema.</li>
            <li>Accessibility matters—region availability and content advisories are considered.</li>
          </ul>
        </Card>
      </section>

      {/* How the week works */}
      <section className="mt-10">
        <SectionHeader title="How a week works" />
        <Card padding="lg">
          <ol className="grid gap-3 md:grid-cols-4">
            <li className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-wide text-neutral-400">Monday</div>
              <div className="mt-1 font-semibold">The Setup</div>
              <p className="mt-1 text-sm text-neutral-300">
                Admin announces the film with context, themes, and viewing notes.
              </p>
            </li>
            <li className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-wide text-neutral-400">Mon–Thu</div>
              <div className="mt-1 font-semibold">Watch</div>
              <p className="mt-1 text-sm text-neutral-300">
                Members watch and prepare a review. No discussion yet—just notes.
              </p>
            </li>
            <li className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-wide text-neutral-400">Fri–Sun</div>
              <div className="mt-1 font-semibold">The Discourse</div>
              <p className="mt-1 text-sm text-neutral-300">
                Post your review, then enter threads. Spoilers are tagged. Scene-specific timestamps welcome.
              </p>
            </li>
            <li className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-wide text-neutral-400">Sunday night</div>
              <div className="mt-1 font-semibold">The Verdict</div>
              <p className="mt-1 text-sm text-neutral-300">
                Admin closes with highlights and selects next week’s film from member suggestions.
              </p>
            </li>
          </ol>
        </Card>
      </section>

      {/* What counts as a review */}
      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-neutral-100">What counts as a review</h3>
          <ul className="mt-2 list-disc pl-5 text-sm text-neutral-300">
            <li>100–1000 words with citations of scenes, choices, or moments (not vibes alone).</li>
            <li>Engage craft: staging, cutting, sound, performance, rhythm, writing, production design.</li>
            <li>Bring context: history, influences, reception—but earn it with close viewing.</li>
          </ul>
        </Card>
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-neutral-100">How we discuss</h3>
          <ul className="mt-2 list-disc pl-5 text-sm text-neutral-300">
            <li>Two-level threads keep focus; quote precisely and timestamp when possible.</li>
            <li>Disagree well: interpret charitably, then critique clearly.</li>
            <li>Flag spoilers, and prefer evidence over assertion.</li>
          </ul>
        </Card>
      </section>

      {/* House rules */}
      <section className="mt-10">
        <SectionHeader title="House rules" />
        <Card padding="lg">
          <ul className="grid gap-2 text-sm text-neutral-300">
            <li>• Reviews come first: 100–1000 words before you join discussion threads.</li>
            <li>• Keep it readable: threads are limited to two levels—enough for depth, not derailment.</li>
            <li>• Tag spoilers and use timestamps for scene-specific talk.</li>
            <li>• Argue in good faith. Critique ideas, not people. Civility is non-negotiable.</li>
            <li>• Participation matters: prolonged inactivity may lead to removal to keep the circle engaged.</li>
            <li>• Real names or consistent usernames—community trust over anonymity.</li>
          </ul>
        </Card>
      </section>

      {/* What we measure */}
      <section className="mt-10">
        <SectionHeader
          title="What we measure (and why)"
          subtitle="Signals that help us understand taste without gamifying it."
        />
        <div className="grid gap-4 md:grid-cols-3">
          <Card padding="lg">
            <h4 className="text-sm font-semibold text-olive-300">Average score</h4>
            <p className="mt-2 text-sm text-neutral-300">
              A group temperature check—not the point, but a useful compass.
            </p>
          </Card>
          <Card padding="lg">
            <h4 className="text-sm font-semibold text-olive-300">Dissent index</h4>
            <p className="mt-2 text-sm text-neutral-300">
              Standard deviation of scores—a proxy for how divided the room was.
            </p>
          </Card>
          <Card padding="lg">
            <h4 className="text-sm font-semibold text-olive-300">Contrarian score</h4>
            <p className="mt-2 text-sm text-neutral-300">
              How often your ratings diverge from the group average—a celebration of distinct taste.
            </p>
          </Card>
        </div>
        <p className="mt-4 text-xs text-neutral-500">
          Metrics are descriptive, not prescriptive. Visitors see titles and aggregates; member reviews and discussions remain private.
        </p>
      </section>

      {/* Moderation & accessibility */}
      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-neutral-100">Moderation & safety</h3>
          <ul className="mt-2 list-disc pl-5 text-sm text-neutral-300">
            <li>Firm boundaries around respect, harassment, and bigotry.</li>
            <li>Clear red lines and swift intervention when needed.</li>
            <li>Assume good faith; protect readerly attention.</li>
          </ul>
        </Card>
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-neutral-100">Access & time zones</h3>
          <ul className="mt-2 list-disc pl-5 text-sm text-neutral-300">
            <li>Asynchronous by design; show up across the window that works for you.</li>
            <li>Captioning and content advisories are encouraged in setups.</li>
            <li>Availability notes help the group plan (region locks, rentals, physical media).</li>
          </ul>
        </Card>
      </section>

      {/* Join CTA */}
      <section className="mt-12 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.03] p-6 text-center md:p-10">
        <h3 className="text-xl font-semibold">Want to join Eiga?</h3>
        <p className="mx-auto mt-2 max-w-2xl text-neutral-300">
          We maintain a short waitlist to preserve the club’s size and rhythm. Tell us about your interests
          and viewing habits—when a seat opens, we’ll reach out.
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <ButtonLink href="/request-invite" variant="primary" size="md">
            Request an invite
          </ButtonLink>
          <Link
            href="/archive"
            className="text-sm text-neutral-300 underline-offset-4 hover:text-white hover:underline"
          >
            Browse the archive
          </Link>
        </div>
      </section>
    </main>
  );
};

export default Page;