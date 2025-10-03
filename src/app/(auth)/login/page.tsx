// app/(auth)/login/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ButtonLink } from '@/components/ui/ButtonLink';

export const metadata: Metadata = {
  title: 'Log in · Eiga',
  description: 'Log in to Eiga — private cinema club for serious film discourse.',
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const getParam = (
  sp: Record<string, string | string[] | undefined> | undefined,
  key: string
) => {
  const v = sp?.[key];
  return Array.isArray(v) ? v[0] : v;
};

const errorText = (code?: string) => {
  switch (code) {
    case 'invalid_email':
      return 'Please enter a valid email address.';
    case 'invalid_token':
      return 'That sign-in link is invalid or expired. Please request a new one.';
    case 'inactive':
      return 'This account is inactive. Contact the admin if you think this is a mistake.';
    case 'server':
      return 'Something went wrong on our end. Try again shortly.';
    default:
      return 'Something went wrong. Try again in a moment.';
  }
};

const Page = async ({ searchParams }: PageProps) => {
  const sp = await searchParams;

  const sent = getParam(sp, 'sent') === '1';
  const error = getParam(sp, 'error');
  const callbackUrl = getParam(sp, 'callbackUrl') || '/dashboard';
  const preEmail = getParam(sp, 'email') || '';

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10 md:py-14">
      <SectionHeader
        title="Log in"
        subtitle="We’ll email you a one-time link to access your account."
      />

      {sent ? (
        <Card padding="lg" className="mb-6 border-olive-500/30 bg-olive-500/10" aria-live="polite">
          <h3 className="text-white">Check your email</h3>
          <p className="mt-2 text-sm text-neutral-300">
            If your address is recognized, a sign-in link is on its way. It may take a minute.
            Be sure to check spam or promotions.
          </p>
        </Card>
      ) : null}

      {error ? (
        <Card padding="lg" className="mb-6 border-red-500/30 bg-red-500/10" aria-live="assertive">
          <h3 className="text-white">Could not send link</h3>
          <p className="mt-2 text-sm text-neutral-300">{errorText(error)}</p>
        </Card>
      ) : null}

      <Card padding="lg">
        <form method="POST" action="/api/auth/magic-link" acceptCharset="UTF-8" className="grid gap-4" noValidate>
          {/* Honeypot for bots */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="absolute left-[-9999px] top-[-9999px] h-0 w-0 opacity-0"
            aria-hidden="true"
          />

          <div>
            <label htmlFor="email" className="mb-1 block text-xs text-neutral-400">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              required
              defaultValue={preEmail}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
            />
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-olive-500 px-4 py-2 text-sm font-semibold text-neutral-950 transition-colors hover:bg-olive-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-olive-400/40"
          >
            Send sign-in link
          </button>

          <div className="mt-2 text-xs text-neutral-500">
            By logging in, you agree to uphold respectful, spoiler-tagged, and consistent participation.
          </div>
        </form>
      </Card>

      <div className="mt-6 grid gap-2">
        <ButtonLink href="/request-invite" variant="outline" size="md">
          I don’t have access — request an invite
        </ButtonLink>
        <div className="text-center text-sm text-neutral-400">
          Have an invite code?{' '}
          <Link href="/invite" className="text-olive-300 underline underline-offset-4 hover:text-olive-200">
            Redeem it here
          </Link>
          .
        </div>
      </div>
    </main>
  );
};

export default Page;