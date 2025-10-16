// app/(auth)/invite/page.tsx
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { CircleAlert, KeyRound } from "lucide-react"

import { SectionHeader } from "@/components/ui/section-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { isValidInviteCode } from "@/lib/auth/config"

export const metadata: Metadata = {
  title: "Enter invite code · Eiga",
  description: "Redeem your Eiga invite code to join the club.",
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

const Page = async ({ searchParams }: PageProps) => {
  const sp = await searchParams
  const rawCode = (getParam(sp, "code") || "").toString().trim()
  const code = rawCode ? rawCode.toUpperCase() : ""

  // If a code was submitted via ?code=..., validate and redirect to /invite/[code]
  if (code && isValidInviteCode(code)) {
    redirect(`/invite/${encodeURIComponent(code)}`)
  }

  const invalid = Boolean(rawCode && !isValidInviteCode(code))

  return (
    <main id="main" className="mx-auto w-full max-w-md px-4 py-10 md:py-14">
      <SectionHeader
        title="Redeem invite"
        subtitle="Enter your invite code to claim your seat."
      />

      {invalid ? (
        <Card className="mb-6 border-destructive/30 bg-destructive/10" aria-live="assertive">
          <CardContent className="flex items-start gap-3 p-6">
            <CircleAlert className="mt-0.5 h-5 w-5 text-destructive" aria-hidden="true" />
            <div>
              <h3 className="font-semibold text-foreground">Invalid code</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Please check the code you entered and try again. Codes typically look like EIGA-ABCD-1234.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-6">
          {/* This form uses GET so the page can validate and redirect without JS */}
          <form method="GET" action="/invite" className="grid gap-3" noValidate>
            <div>
              <label htmlFor="code" className="mb-1 block text-xs text-muted-foreground">
                Invite code
              </label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                  aria-describedby="code-help"
                  className={[
                    "w-full rounded-md border px-8 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2",
                    invalid
                      ? "border-destructive/40 bg-card/60 focus:ring-destructive/30"
                      : "border-border bg-card/60 focus:ring-primary/30",
                  ].join(" ")}
                />
              </div>
              <p id="code-help" className="mt-1 text-xs text-muted-foreground">
                Enter exactly as it appears (letters and numbers; dashes allowed).
              </p>
            </div>

            <Button type="submit" size="sm" className="justify-center">
              Continue
            </Button>

            <div className="mt-2 text-xs text-muted-foreground">
              Don’t have a code?{" "}
              <Link href="/request-invite" className="text-primary underline underline-offset-4">
                Request an invite
              </Link>
              .
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}

export default Page