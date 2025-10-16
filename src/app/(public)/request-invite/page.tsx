import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle2, AlertTriangle } from "lucide-react"

import { SectionHeader } from "@/components/ui/section-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Request invite · Eiga",
  description:
    "Join the Eiga waitlist — a private, invite-only cinema club for deep film discourse.",
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const getParam = (sp: Record<string, string | string[] | undefined> | undefined, key: string, def = "") => {
  const v = sp?.[key]
  return (Array.isArray(v) ? v[0] : v) ?? def
}

const errorBannerMessage = (code?: string) => {
  switch (code) {
    case "invalid_email":
      return "Please enter a valid email address."
    case "about_too_short":
      return "Tell us a bit more — the “About” field must be at least 50 characters."
    case "conduct_required":
      return "You must agree to the code of conduct to continue."
    case "letterboxd_url":
      return "Letterboxd/social must be a full URL (e.g., https://letterboxd.com/yourname)."
    case "invalid":
      return "Please check your entries and try again."
    case "rate_limited":
      return "Too many attempts. Please try again in a few minutes."
    case "server":
      return "Something went wrong on our end. Please try again shortly."
    default:
      return null
  }
}

const Page = async ({ searchParams }: PageProps) => {
  const sp = await searchParams

  const success = getParam(sp, "success") === "1"
  const error = getParam(sp, "error") || undefined

  // Prefill convenience (if API redirects back with these)
  const preName = getParam(sp, "name")
  const preEmail = getParam(sp, "email")

  // Inline field error flags
  const errInvalidEmail = error === "invalid_email"
  const errAboutShort = error === "about_too_short"
  const errConduct = error === "conduct_required"
  const errLetterboxd = error === "letterboxd_url"

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 md:py-14">
      <SectionHeader
        title="Request an invite"
        subtitle="Join the waitlist — we’ll reach out when a seat opens."
      />

      {success ? (
        <Card className="mb-8 border-border bg-card/40" aria-live="polite">
          <CardContent className="flex items-start gap-3 p-6">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <h3 className="text-lg font-semibold text-foreground">Thanks for your interest.</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Your request is on our list. We review applications periodically and notify by email when a spot
                becomes available. In the meantime, you can{" "}
                <Link href="/archive" className="text-primary underline underline-offset-4">
                  browse the archive
                </Link>{" "}
                or read our{" "}
                <Link href="/philosophy" className="text-primary underline underline-offset-4">
                  philosophy
                </Link>
                .
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
              <h3 className="font-semibold text-foreground">Could not submit your request</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {errorBannerMessage(error) ?? "Please try again."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-6">
          <form method="POST" action="/api/waitlist" acceptCharset="UTF-8" className="grid gap-4" noValidate>
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
                <label htmlFor="name" className="mb-1 block text-xs text-muted-foreground">
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
                  className="w-full rounded-md border border-border bg-card/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-1 block text-xs text-muted-foreground">
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
                  aria-invalid={errInvalidEmail ? "true" : "false"}
                  className={`w-full rounded-md border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
                    errInvalidEmail
                      ? "border-destructive/40 bg-card/60 focus:ring-destructive/30"
                      : "border-border bg-card/60 focus:ring-primary/30"
                  }`}
                />
                {errInvalidEmail ? (
                  <p className="mt-1 text-xs text-destructive">Please enter a valid email address.</p>
                ) : null}
              </div>
            </div>

            <div>
              <label htmlFor="letterboxd" className="mb-1 block text-xs text-muted-foreground">
                Letterboxd (or social) — optional
              </label>
              <input
                id="letterboxd"
                name="letterboxd"
                type="url"
                placeholder="https://letterboxd.com/yourname"
                pattern="https?://.*"
                autoComplete="url"
                aria-invalid={errLetterboxd ? "true" : "false"}
                className={`w-full rounded-md border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
                  errLetterboxd
                    ? "border-destructive/40 bg-card/60 focus:ring-destructive/30"
                    : "border-border bg-card/60 focus:ring-primary/30"
                }`}
              />
              {errLetterboxd ? (
                <p className="mt-1 text-xs text-destructive">
                  Please enter a full URL (e.g., https://letterboxd.com/yourname).
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="about" className="mb-1 block text-xs text-muted-foreground">
                Tell us about your taste in film
              </label>
              <textarea
                id="about"
                name="about"
                required
                minLength={50}
                maxLength={2000}
                rows={5}
                placeholder="What kind of films move you? Directors, movements, or eras you’re exploring?"
                aria-describedby="about-help"
                aria-invalid={errAboutShort ? "true" : "false"}
                className={`w-full rounded-md border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
                  errAboutShort
                    ? "border-destructive/40 bg-card/60 focus:ring-destructive/30"
                    : "border-border bg-card/60 focus:ring-primary/30"
                }`}
              />
              <p id="about-help" className="mt-1 text-xs text-muted-foreground">
                Minimum 50 characters. Keep it under 2000 characters.
              </p>
              {errAboutShort ? (
                <p className="mt-1 text-xs text-destructive">Please write at least 50 characters.</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="threeFilms" className="mb-1 block text-xs text-muted-foreground">
                Three films that changed how you watch
              </label>
              <textarea
                id="threeFilms"
                name="threeFilms"
                rows={3}
                maxLength={500}
                placeholder="e.g., The Mirror (1975), A Brighter Summer Day (1991), Beau Travail (1999)"
                className="w-full rounded-md border border-border bg-card/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="timezone" className="mb-1 block text-xs text-muted-foreground">
                  Time zone
                </label>
                <input
                  id="timezone"
                  name="timezone"
                  placeholder="e.g., PST / GMT-8"
                  maxLength={50}
                  autoComplete="off"
                  className="w-full rounded-md border border-border bg-card/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label htmlFor="availability" className="mb-1 block text-xs text-muted-foreground">
                  Availability
                </label>
                <select
                  id="availability"
                  name="availability"
                  defaultValue="weekly"
                  className="w-full rounded-md border border-border bg-card/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="weekly">Weekly cadence (preferred)</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="hear" className="mb-1 block text-xs text-muted-foreground">
                How did you hear about Eiga? — optional
              </label>
              <input
                id="hear"
                name="hear"
                maxLength={120}
                placeholder="Friend, social, blog, etc."
                className="w-full rounded-md border border-border bg-card/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex items-start gap-2 rounded-md border border-border bg-card/60 p-3">
              <input
                id="conduct"
                name="conduct"
                type="checkbox"
                required
                aria-invalid={errConduct ? "true" : "false"}
                className={`mt-0.5 h-4 w-4 rounded border-border bg-card/60 text-primary focus:outline-none focus:ring-2 ${
                  errConduct ? "focus:ring-destructive/30" : "focus:ring-primary/30"
                }`}
              />
              <label htmlFor="conduct" className="text-sm text-muted-foreground">
                I agree to uphold a respectful, thoughtful tone; tag spoilers; and participate consistently.
              </label>
            </div>
            {errConduct ? (
              <p className="mt-1 text-xs text-destructive">You must agree to the code of conduct.</p>
            ) : null}

            <div className="mt-2 flex items-center gap-3">
              <Button type="submit" size="sm">Join the waitlist</Button>
              <p className="text-xs text-muted-foreground">We’ll email you if a seat opens. We never share your info.</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}

export default Page