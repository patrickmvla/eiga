// app/(auth)/login/page.tsx
import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle2, AlertTriangle, Mail } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { SectionHeader } from "@/components/ui/section-header"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Log in · Eiga",
  description: "Log in to Eiga — private cinema club for serious film discourse.",
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const getParam = (
  sp: Record<string, string | string[] | undefined> | undefined,
  key: string
) => {
  const v = sp?.[key]
  return Array.isArray(v) ? v[0] : v
}

const errorText = (code?: string) => {
  switch (code) {
    case "invalid_email":
      return "Please enter a valid email address."
    case "invalid_token":
      return "That sign-in link is invalid or expired. Please request a new one."
    case "inactive":
      return "This account is inactive. Contact the admin if you think this is a mistake."
    case "server":
      return "Something went wrong on our end. Try again shortly."
    default:
      return "Something went wrong. Try again in a moment."
  }
}

const Page = async ({ searchParams }: PageProps) => {
  const sp = await searchParams

  const sent = getParam(sp, "sent") === "1"
  const error = getParam(sp, "error")
  const callbackUrl = getParam(sp, "callbackUrl") || "/dashboard"
  const preEmail = getParam(sp, "email") || ""

  const errInvalidEmail = error === "invalid_email"

  return (
    <main id="main" className="mx-auto w-full max-w-md px-4 py-10 md:py-14">
      <SectionHeader
        title="Log in"
        subtitle="We’ll email you a one-time link to access your account."
      />

      {sent ? (
        <Card className="mb-6 border-border bg-card/40" aria-live="polite">
          <CardContent className="flex items-start gap-3 p-6">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <h3 className="text-foreground">Check your email</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                If your address is recognized, a sign-in link is on its way. It may take a minute.
                Be sure to check spam or promotions.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card className="mb-6 border-destructive/30 bg-destructive/10" aria-live="assertive">
          <CardContent className="flex items-start gap-3 p-6">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" aria-hidden="true" />
            <div>
              <h3 className="text-foreground">Could not send link</h3>
              <p className="mt-1 text-sm text-muted-foreground">{errorText(error)}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-6">
          <form
            method="POST"
            action="/api/auth/magic-link"
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

            <div>
              <label htmlFor="email" className="mb-1 block text-xs text-muted-foreground">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  required
                  defaultValue={preEmail}
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-invalid={errInvalidEmail ? "true" : "false"}
                  className={[
                    "w-full rounded-md border px-8 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2",
                    errInvalidEmail
                      ? "border-destructive/40 bg-card/60 focus:ring-destructive/30"
                      : "border-border bg-card/60 focus:ring-primary/30",
                  ].join(" ")}
                />
              </div>
              <input type="hidden" name="callbackUrl" value={callbackUrl} />
              {errInvalidEmail ? (
                <p className="mt-1 text-xs text-destructive">Please enter a valid email address.</p>
              ) : null}
            </div>

            <Button type="submit" size="sm" className="justify-center">
              Send sign-in link
            </Button>

            <div className="mt-2 text-xs text-muted-foreground">
              By logging in, you agree to uphold respectful, spoiler-tagged, and consistent participation.
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/request-invite">I don’t have access — request an invite</Link>
        </Button>
        <div className="text-center text-sm text-muted-foreground">
          Have an invite code?{" "}
          <Link href="/invite" className="text-primary underline underline-offset-4">
            Redeem it here
          </Link>
          .
        </div>
      </div>
    </main>
  )
}

export default Page