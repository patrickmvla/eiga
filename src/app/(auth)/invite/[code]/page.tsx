// app/(auth)/invite/[code]/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';

export const metadata: Metadata = {
  title: 'Redeem invite · Eiga',
  description:
    'Use your invite code to join Eiga — a private cinema club for serious film discourse.',
};

type StatusParam = 'invalid' | 'used' | 'expired' | undefined;

type PageProps = {
  params: { code: string };
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const getParam = (sp: Record<string, string | string[] | undefined>, key: string) => {
  const v = sp?.[key];
  return Array.isArray(v) ? v[0] : v;
};

const statusBadge = (status: StatusParam) => {
  if (status === 'invalid') {
    return { cls: 'border border-red-500/30 bg-red-500/10 text-red-300', text: 'Invalid code' };
  }
  if (status === 'used') {
    return { cls: 'border border-yellow-500/30 bg-yellow-500/10 text-yellow-300', text: 'Already used' };
  }
  if (status === 'expired') {
    return { cls: 'border border-orange-500/30 bg-orange-500/10 text-orange-300', text: 'Expired' };
  }
  return { cls: 'border border-olive-500/30 bg-olive-500/10 text-olive-200', text: 'Ready to redeem' };
};

const errorText = (code?: string) => {
  switch (code) {
    case 'email_in_use':
      return 'That email is already associated with an account.';
    case 'username_in_use':
      return 'That username is taken. Please choose another.';
    case 'create_failed':
      return 'We couldn’t create your account. Please try again.';
    case 'server':
      return 'Something went wrong on our end. Try again shortly.';
    default:
      return 'Please check your details and try again.';
  }
};

const Page = async ({ params, searchParams }: PageProps) => {
  const sp = await searchParams;

  const code = params.code?.trim();
  const status = getParam(sp, 'status') as StatusParam; // 'invalid' | 'used' | 'expired'
  const error = getParam(sp, 'error'); // error codes from server (email_in_use, username_in_use, create_failed)

  // Optional prefills from redirect
  const preName = getParam(sp, 'name') || '';
  const preUsername = getParam(sp, 'username') || '';
  const preEmail = getParam(sp, 'email') || '';

  const badge = statusBadge(status);
  const disableForm = status === 'invalid' || status === 'used' || status === 'expired';

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10 md:py-14">
      <SectionHeader
        title="Redeem invite"
        subtitle="Claim your seat and set up your account."
      />

      {/* Code badge and state */}
      <Card padding="lg" className="mb-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-neutral-400">Invite code</div>
            <div className="mt-1 font-mono text-base font-semibold tracking-tight text-white">
              {code}
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs ${badge.cls}`}>{badge.text}</span>
        </div>

        {(status === 'invalid' || status === 'used' || status === 'expired') && (
          <p className="mt-3 text-sm text-neutral-400">
            This invite can’t be redeemed. Double-check your link or{' '}
            <Link
              href="/request-invite"
              className="text-olive-300 underline underline-offset-4 hover:text-olive-200"
            >
              request a new invite
            </Link>
            .
          </p>
        )}

        {error && !status ? (
          <p
            className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 p-2 text-sm text-red-300"
            aria-live="assertive"
          >
            {errorText(error)}
          </p>
        ) : null}
      </Card>

      {/* Redeem form */}
      <Card padding="lg">
        <form
          method="POST"
          action="/api/auth/redeem-invite"
          acceptCharset="UTF-8"
          className="grid gap-4"
        >
          {/* Honeypot */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="absolute left-[-9999px] top-[-9999px] h-0 w-0 opacity-0"
            aria-hidden="true"
          />

          {/* Hidden invite code */}
          <input type="hidden" name="code" value={code} />

          <fieldset disabled={disableForm} className="grid gap-4 disabled:opacity-60">
            <div>
              <label htmlFor="name" className="mb-1 block text-xs text-neutral-400">
                Name
              </label>
              <input
                id="name"
                name="name"
                placeholder="Your name"
                defaultValue={preName}
                maxLength={80}
                className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
              />
            </div>

            <div>
              <label htmlFor="username" className="mb-1 block text-xs text-neutral-400">
                Username
              </label>
              <input
                id="username"
                name="username"
                required
                minLength={3}
                maxLength={20}
                pattern="^[a-zA-Z0-9_]+$"
                placeholder="e.g., mizoguchi_fan"
                defaultValue={preUsername}
                className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
              />
              <p className="mt-1 text-xs text-neutral-500">3–20 characters, letters/numbers/underscore.</p>
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
                placeholder="you@example.com"
                defaultValue={preEmail}
                className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
              />
              <p className="mt-1 text-xs text-neutral-500">
                We’ll send a one-time sign-in link to complete setup.
              </p>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
              <input
                id="conduct"
                name="conduct"
                type="checkbox"
                required
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-neutral-900/60 text-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
              />
              <label htmlFor="conduct" className="text-sm text-neutral-300">
                I agree to uphold a respectful, thoughtful tone; tag spoilers; and participate consistently.
              </label>
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-olive-500 px-4 py-2 text-sm font-semibold text-neutral-950 transition-colors hover:bg-olive-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-olive-400/40 disabled:opacity-50"
            >
              Redeem invite
            </button>

            <div className="mt-2 text-xs text-neutral-500">
              Already have an account?{' '}
              <Link href="/login" className="text-olive-300 underline underline-offset-4 hover:text-olive-200">
                Log in
              </Link>
              .
            </div>
          </fieldset>
        </form>
      </Card>

      <div className="mt-6 text-center text-sm text-neutral-400">
        Don’t have a code?{' '}
        <Link
          href="/request-invite"
          className="text-olive-300 underline underline-offset-4 hover:text-olive-200"
        >
          Request an invite
        </Link>
        .
      </div>
    </main>
  );
};

export default Page;