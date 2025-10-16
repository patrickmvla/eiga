import Link from "next/link"

export const Footer = () => {
  // Use UTC to avoid rare timezone hydration edge cases
  const year = new Date().getUTCFullYear()

  return (
    <footer className="mt-16 border-t border-border bg-background/70 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Brand + tagline */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2" aria-label="Go to homepage">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border bg-card/60 text-xs">
                Ei
              </span>
              <span className="text-base font-semibold tracking-tight text-foreground">Eiga</span>
            </Link>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              A private cinema club for serious film discourse. Ten members, one film a week.
            </p>
          </div>

          {/* Links */}
          <nav
            className="grid grid-cols-2 gap-3 text-sm text-muted-foreground sm:grid-cols-4"
            aria-label="Footer"
          >
            <Link href="/archive" className="underline-offset-4 hover:text-foreground hover:underline">
              Archive
            </Link>
            <Link href="/philosophy" className="underline-offset-4 hover:text-foreground hover:underline">
              Philosophy
            </Link>
            <Link href="/request-invite" className="underline-offset-4 hover:text-foreground hover:underline">
              Request invite
            </Link>
            <Link href="/login" className="underline-offset-4 hover:text-foreground hover:underline">
              Log in
            </Link>
          </nav>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row md:items-center">
          <p>© {year} Eiga. All rights reserved.</p>
          <p>Built for intimate, thoughtful discourse — not the algorithm.</p>
        </div>
      </div>
    </footer>
  )
}