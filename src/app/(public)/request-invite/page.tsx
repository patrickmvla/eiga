// app/(public)/request-invite/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Request invite · Eiga',
  description:
    'Join the Eiga waitlist — a private, invite-only cinema club for deep film discourse.',
};

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const getParam = (sp: PageProps['searchParams'], key: string, def = '') => {
  const v = sp?.[key];
  return (Array.isArray(v) ? v[0] : v) ?? def;
};

const errorMessage = (code?: string) => {
  switch (code) {
    case 'invalid':
      return 'Please check your entries and try again.';
    case 'rate_limited':
      return 'Too many attempts. Please try again in a few minutes.';
    case 'server':
      return 'Something went wrong on our end. Please try again shortly.';
    default:
      return null;
  }
};

const Page = ({ searchParams }: PageProps) => {
  const success = getParam(searchParams, 'success') === '1';
  const error = getParam(searchParams, 'error') || undefined;

  // Prefill convenience (kept if your API redirects back with these)
  const preName = getParam(searchParams, 'name');
  const preEmail = getParam(searchParams, 'email');

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 md:py-14">
      <SectionHeader
        title="Request an invite"
        subtitle="Join the waitlist — we’ll reach out when a seat opens."
      />

      {success ? (
        <Card padding="lg" className="mb-8 border-olive-500/30 bg-olive-500/10" aria-live="polite">
          <h3 className="text-lg font-semibold text-white">Thanks for your interest.</h3>
          <p className="mt-2 text-neutral-300">
            Your request is on our list. We review applications periodically and notify by email when a
            spot becomes available. In the meantime, you can{' '}
            <Link
              href="/archive"
              className="text-olive-300 underline underline-offset-4 hover:text-olive-200"
            >
              browse the archive
            </Link>{' '}
            or read our{' '}
            <Link
              href="/philosophy"
              className="text-olive-300 underline underline-offset-4 hover:text-olive-200"
            >
              philosophy
            </Link>
            .
          </p>
        </Card>
      ) : null}

      {error ? (
        <Card padding="lg" className="mb-6 border-red-500/30 bg-red-500/10" aria-live="assertive">
          <h3 className="text-white">Could not submit your request</h3>
          <p className="mt-2 text-sm text-neutral-200">{errorMessage(error) ?? 'Please try again.'}</p>
        </Card>
      ) : null}

      <Card padding="lg">
        <form
          method="POST"
          action="/api/waitlist"
          acceptCharset="UTF-8"
          className="grid gap-4"
          noValidate
        >
          {/* Honeypot for bots */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="absolute left-[-9999px] top-[-9999px] h-0 w-0 opacity-0"
            aria-hidden="true"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-1 block text-xs text-neutral-400">
                Name
              </label>
              <input
                id="name"
                name="name"
                required
                defaultValue={preName}
                placeholder="Your name"
                autoComplete="name"
                maxLength={80}
                className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-xs text-neutral-400">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                required
                defaultValue={preEmail}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
              />
            </div>
          </div>

          <div>
            <label htmlFor="letterboxd" className="mb-1 block text-xs text-neutral-400">
              Letterboxd (or social) — optional
            </label>
            <input
              id="letterboxd"
              name="letterboxd"
              type="url"
              placeholder="https://letterboxd.com/yourname"
              pattern="https?://.*"
              autoComplete="url"
              className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
            />
          </div>

          <div>
            <label htmlFor="about" className="mb-1 block text-xs text-neutral-400">
              Tell us about your taste in film
            </label>
            <textarea
              id="about"
              name="about"
              required
              minLength={50}
              maxLength={2000} // aligns with zod max
              rows={5}
              placeholder="What kind of films move you? Directors, movements, or eras you’re exploring?"
              aria-describedby="about-help"
              className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
            />
            <p id="about-help" className="mt-1 text-xs text-neutral-500">
              Minimum 50 characters. Keep it under 2000 characters.
            </p>
          </div>

          <div>
            <label htmlFor="threeFilms" className="mb-1 block text-xs text-neutral-400">
              Three films that changed how you watch
            </label>
            <textarea
              id="threeFilms"
              name="threeFilms"
              rows={3}
              maxLength={500}
              placeholder="e.g., The Mirror (1975), A Brighter Summer Day (1991), Beau Travail (1999)"
              className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="timezone" className="mb-1 block text-xs text-neutral-400">
                Time zone
              </label>
              <input
                id="timezone"
                name="timezone"
                placeholder="e.g., PST / GMT-8"
                maxLength={50}
                autoComplete="off"
                className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
              />
            </div>
            <div>
              <label htmlFor="availability" className="mb-1 block text-xs text-neutral-400">
                Availability
              </label>
              <select
                id="availability"
                name="availability"
                defaultValue="weekly"
                className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
              >
                <option value="weekly">Weekly cadence (preferred)</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="hear" className="mb-1 block text-xs text-neutral-400">
              How did you hear about Eiga? — optional
            </label>
            <input
              id="hear"
              name="hear"
              maxLength={120}
              placeholder="Friend, social, blog, etc."
              className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
            />
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
            <input
              id="conduct"
              name="conduct"
              type="checkbox"
              required
              className="mt-1 h-4 w-4 rounded border-white/20 bg-neutral-900/60 text-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
            />
            <label htmlFor="conduct" className="text-sm text-neutral-300">
              I agree to uphold a respectful, thoughtful tone; tag spoilers; and participate consistently.
            </label>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-olive-500 px-4 py-2 text-sm font-semibold text-neutral-950 transition-colors hover:bg-olive-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-olive-400/40"
            >
              Join the waitlist
            </button>
            <p className="text-xs text-neutral-500">
              We’ll email you if a seat opens. We never share your info.
            </p>
          </div>
        </form>
      </Card>
    </main>
  );
};

export default Page;