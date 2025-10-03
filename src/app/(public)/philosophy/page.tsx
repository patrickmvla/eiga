// app/(public)/philosophy/page.tsx
import type { Metadata } from 'next';
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

      {/* House rules */}
      <section className="mt-10">
        <SectionHeader title="House rules" />
        <Card padding="lg">
          <ul className="grid gap-2 text-sm text-neutral-300">
            <li>
              • Reviews come first: 100–1000 words before you join discussion threads.
            </li>
            <li>
              • Keep it readable: threads are limited to two levels—enough for depth, not derailment.
            </li>
            <li>
              • Tag spoilers and use timestamps for scene-specific talk.
            </li>
            <li>
              • Argue in good faith. Critique ideas, not people. Civility is non-negotiable.
            </li>
            <li>
              • Participation matters: prolonged inactivity may lead to removal to keep the circle engaged.
            </li>
            <li>
              • Real names or consistent usernames—community trust over anonymity.
            </li>
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
          Visitors can see titles and aggregates; member reviews and discussions remain private.
        </p>
      </section>

      {/* Join CTA */}
      <section className="mt-12 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.03] p-6 text-center md:p-10">
        <h3 className="text-xl font-semibold">Want to join Eiga?</h3>
        <p className="mx-auto mt-2 max-w-2xl text-neutral-300">
          We maintain a short waitlist to preserve the club’s size and rhythm. Tell us about your interests
          and viewing habits—when a seat opens, we’ll reach out.
        </p>
        <div className="mt-4">
          <ButtonLink href="/request-invite" variant="primary" size="md">
            Request an invite
          </ButtonLink>
        </div>
      </section>
    </main>
  );
};

export default Page;