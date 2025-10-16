// app/(auth)/invite/[code]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { CircleAlert, BadgeCheck, ClockAlert } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import { isValidInviteCode } from "@/lib/auth/config";

export const metadata: Metadata = {
  title: "Redeem invite · Eiga",
  description:
    "Use your invite code to join Eiga — a private cinema club for serious film discourse.",
};

type StatusParam = "invalid" | "used" | "expired" | undefined;

type PageProps = {
  params: Promise<{ code: string }>;
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
    case "email_in_use":
      return "That email is already associated with an account.";
    case "username_in_use":
      return "That username is taken. Please choose another.";
    case "create_failed":
      return "We couldn’t create your account. Please try again.";
    case "server":
      return "Something went wrong on our end. Try again shortly.";
    default:
      return "Please check your details and try again.";
  }
};

const badgeFor = (status: StatusParam) => {
  if (status === "invalid") {
    return {
      className: "border-destructive/30 bg-destructive/10 text-destructive",
      text: "Invalid code",
      icon: <CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />,
    };
  }
  if (status === "used") {
    return {
      className: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
      text: "Already used",
      icon: <ClockAlert className="h-3.5 w-3.5" aria-hidden="true" />,
    };
  }
  if (status === "expired") {
    return {
      className: "border-orange-500/30 bg-orange-500/10 text-orange-300",
      text: "Expired",
      icon: <ClockAlert className="h-3.5 w-3.5" aria-hidden="true" />,
    };
  }
  return {
    className: "border-primary/30 bg-primary/10 text-foreground",
    text: "Ready to redeem",
    icon: (
      <BadgeCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
    ),
  };
};

const Page = async ({ params, searchParams }: PageProps) => {
  const { code: raw } = await params;
  const sp = await searchParams;

  const rawCode = (raw || "").toString().trim();
  const code = rawCode ? rawCode.toUpperCase() : "";

  // If a code was submitted in the URL, validate and redirect to canonical route when valid.
  if (code && isValidInviteCode(code)) {
    // If the route is already /invite/[code], continue. Otherwise redirect (handles links like ?code=... elsewhere).
    // In this file we assume we're already on /invite/[code], so skip the redirect unless you want to normalize casing.
    // If you do want to normalize casing into the URL, uncomment:
    // redirect(`/invite/${encodeURIComponent(code)}`)
  }

  const status = getParam(sp, "status") as StatusParam; // 'invalid' | 'used' | 'expired'
  const error = getParam(sp, "error");

  // Optional prefills from redirect
  const preName = getParam(sp, "name") || "";
  const preUsername = getParam(sp, "username") || "";
  const preEmail = getParam(sp, "email") || "";

  const badge = badgeFor(status);
  const disableForm =
    status === "invalid" || status === "used" || status === "expired";

  return (
    <main id="main" className="mx-auto w-full max-w-md px-4 py-10 md:py-14">
      <SectionHeader
        title="Redeem invite"
        subtitle="Claim your seat and set up your account."
      />

      {/* Code badge and state */}
      <Card className="mb-6 border-border bg-card/40">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Invite code
              </div>
              <div className="mt-1 font-mono text-base font-semibold tracking-tight text-foreground">
                {code || "—"}
              </div>
            </div>
            <span
              className={[
                "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs",
                badge.className,
              ].join(" ")}
            >
              {badge.icon}
              {badge.text}
            </span>
          </div>

          {(status === "invalid" ||
            status === "used" ||
            status === "expired") && (
            <p className="mt-3 text-sm text-muted-foreground">
              This invite can’t be redeemed. Double-check your link or{" "}
              <Link
                href="/request-invite"
                className="text-primary underline underline-offset-4"
              >
                request a new invite
              </Link>
              .
            </p>
          )}

          {error && !status ? (
            <p
              className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive"
              aria-live="assertive"
            >
              {errorText(error)}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* Redeem form */}
      <Card className="border-border bg-card/40">
        <CardContent className="p-6">
          <form
            method="POST"
            action="/api/auth/redeem-invite"
            acceptCharset="UTF-8"
            className="grid gap-4"
            noValidate
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

            <fieldset
              disabled={disableForm}
              className="grid gap-4 disabled:opacity-60"
            >
              <div>
                <label
                  htmlFor="name"
                  className="mb-1 block text-xs text-muted-foreground"
                >
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  placeholder="Your name"
                  defaultValue={preName}
                  maxLength={80}
                  className="w-full rounded-md border border-border bg-card/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label
                  htmlFor="username"
                  className="mb-1 block text-xs text-muted-foreground"
                >
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
                  aria-describedby="username-help"
                  className="w-full rounded-md border border-border bg-card/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <p
                  id="username-help"
                  className="mt-1 text-xs text-muted-foreground"
                >
                  3–20 characters, letters/numbers/underscore.
                </p>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-xs text-muted-foreground"
                >
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
                  className="w-full rounded-md border border-border bg-card/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  We’ll send a one-time sign-in link to complete setup.
                </p>
              </div>

              <div className="flex items-start gap-2 rounded-md border border-border bg-card/60 p-3">
                <input
                  id="conduct"
                  name="conduct"
                  type="checkbox"
                  required
                  className="mt-0.5 h-4 w-4 rounded border-border bg-card/60 text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <label
                  htmlFor="conduct"
                  className="text-sm text-muted-foreground"
                >
                  I agree to uphold a respectful, thoughtful tone; tag spoilers;
                  and participate consistently.
                </label>
              </div>

              <Button
                type="submit"
                size="sm"
                className="justify-center disabled:opacity-50"
              >
                Redeem invite
              </Button>

              <div className="mt-2 text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-primary underline underline-offset-4"
                >
                  Log in
                </Link>
                .
              </div>
            </fieldset>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Don’t have a code?{" "}
        <Link
          href="/request-invite"
          className="text-primary underline underline-offset-4"
        >
          Request an invite
        </Link>
        .
      </div>
    </main>
  );
};

export default Page;