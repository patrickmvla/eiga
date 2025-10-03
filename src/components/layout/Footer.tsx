// components/layout/Footer.tsx
import Link from 'next/link';

export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-white/10 bg-neutral-950/60">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Brand + tagline */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-white/15 bg-white/5 text-xs">
                Ei
              </span>
              <span className="text-base font-semibold tracking-tight text-white">
                Eiga
              </span>
            </Link>
            <p className="mt-2 max-w-sm text-sm text-neutral-400">
              A private cinema club for serious film discourse. Ten members, one film a week.
            </p>
          </div>

          {/* Links */}
          <nav className="grid grid-cols-2 gap-4 text-sm text-neutral-300 sm:grid-cols-4">
            <Link href="/archive" className="hover:text-white hover:underline underline-offset-4">
              Archive
            </Link>
            <Link href="/philosophy" className="hover:text-white hover:underline underline-offset-4">
              Philosophy
            </Link>
            <Link href="/request-invite" className="hover:text-white hover:underline underline-offset-4">
              Request invite
            </Link>
            <Link href="/login" className="hover:text-white hover:underline underline-offset-4">
              Log in
            </Link>
          </nav>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-xs text-neutral-500 md:flex-row md:items-center">
          <p>© {year} Eiga. All rights reserved.</p>
          <p className="text-neutral-500">
            Built for intimate, thoughtful discourse — not the algorithm.
          </p>
        </div>
      </div>
    </footer>
  );
};