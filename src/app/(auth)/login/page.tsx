// app/(auth)/login/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ButtonLink } from "@/components/ui/ButtonLink";

export const metadata: Metadata = {
  title: "Log in · Eiga",
  description:
    "Log in to Eiga — private cinema club for serious film discourse.",
};

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const getParam = (sp: PageProps["searchParams"], key: string) => {
  const v = sp?.[key];
  return Array.isArray(v) ? v[0] : v;
};

const Page = ({ searchParams }: PageProps) => {
  const sent = getParam(searchParams, "sent") === "1";
  const error = getParam(searchParams, "error");

  const callbackUrl = getParam(searchParams, "callbackUrl") || "/dashboard";

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10 md:py-14">
      <SectionHeader
        title="Log in"
        subtitle="We’ll email you a one-time link to access your account."
      />

      {sent ? (
        <Card padding="lg" className="mb-6 border-olive-500/30 bg-olive-500/10">
          <h3 className="text-white">Check your email</h3>
          <p className="mt-2 text-sm text-neutral-300">
            If your address is recognized, a sign-in link is on its way. It may
            take a minute. Be sure to check spam or promotions.
          </p>
        </Card>
      ) : null}

      {error ? (
        <Card padding="lg" className="mb-6 border-red-500/30 bg-red-500/10">
          <h3 className="text-white">Could not send link</h3>
          <p className="mt-2 text-sm text-neutral-300">
            {error === "invalid_email"
              ? "Please enter a valid email address."
              : "Something went wrong. Try again in a moment."}
          </p>
        </Card>
      ) : null}

      <Card padding="lg">
        <form
          method="POST"
          action="/api/auth/magic-link" /* TODO: implement Better-Auth route */
          acceptCharset="UTF-8"
          className="grid gap-4"
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

          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-xs text-neutral-400"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              required
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
            By logging in, you agree to uphold respectful, spoiler-tagged, and
            consistent participation.
          </div>
        </form>
      </Card>

      <div className="mt-6 grid gap-2">
        <ButtonLink href="/request-invite" variant="outline" size="md">
          I don’t have access — request an invite
        </ButtonLink>
        <div className="text-center text-sm text-neutral-400">
          Have an invite code?{" "}
          <Link
            href="/invite"
            className="text-olive-300 underline underline-offset-4 hover:text-olive-200"
          >
            Redeem it here
          </Link>
          .
        </div>
      </div>
    </main>
  );
};

export default Page;
