// app/(auth)/invite/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { isValidInviteCode } from "@/lib/auth/config";

export const metadata: Metadata = {
  title: "Enter invite code · Eiga",
  description: "Redeem your Eiga invite code to join the club.",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const getParam = (
  sp: Record<string, string | string[] | undefined>,
  key: string
) => {
  const v = sp?.[key];
  return Array.isArray(v) ? v[0] : v;
};

const Page = async ({ searchParams }: PageProps) => {
  const sp = await searchParams;
  const rawCode = (getParam(sp, "code") || "").toString().trim();
  const code = rawCode ? rawCode.toUpperCase() : "";

  // If a code was submitted via ?code=..., validate and redirect to /invite/[code]
  if (code && isValidInviteCode(code)) {
    redirect(`/invite/${encodeURIComponent(code)}`);
  }

  const invalid = Boolean(rawCode && !isValidInviteCode(code));

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10 md:py-14">
      <SectionHeader
        title="Redeem invite"
        subtitle="Enter your invite code to claim your seat."
      />

      {invalid ? (
        <Card
          padding="lg"
          className="mb-6 border-red-500/30 bg-red-500/10"
          aria-live="assertive"
        >
          <h3 className="text-white">Invalid code</h3>
          <p className="mt-2 text-sm text-neutral-300">
            Please check the code you entered and try again. Codes typically
            look like EIGA-ABCD-1234 or XXXX-XXXX-XXXX.
          </p>
        </Card>
      ) : null}

      <Card padding="lg">
        {/* This form uses GET so the page can validate and redirect without JS */}
        <form method="GET" action="/invite" className="grid gap-3" noValidate>
          <div>
            <label
              htmlFor="code"
              className="mb-1 block text-xs text-neutral-400"
            >
              Invite code
            </label>
            <input
              id="code"
              name="code"
              required
              defaultValue={rawCode}
              placeholder="e.g., EIGA-ABCD-1234"
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              aria-invalid={invalid ? "true" : "false"}
              className={`w-full rounded-lg border bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 ${
                invalid
                  ? "border-red-500/40 focus:ring-red-400/40"
                  : "border-white/10 focus:ring-olive-400/40"
              }`}
            />
            <p className="mt-1 text-xs text-neutral-500">
              Enter the code exactly as it appears (letters and numbers, dashes
              allowed).
            </p>
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-olive-500 px-4 py-2 text-sm font-semibold text-neutral-950 transition-colors hover:bg-olive-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-olive-400/40"
          >
            Continue
          </button>

          <div className="mt-2 text-xs text-neutral-500">
            Don’t have a code?{" "}
            <Link
              href="/request-invite"
              className="text-olive-300 underline underline-offset-4 hover:text-olive-200"
            >
              Request an invite
            </Link>
            .
          </div>
        </form>
      </Card>
    </main>
  );
};

export default Page;
