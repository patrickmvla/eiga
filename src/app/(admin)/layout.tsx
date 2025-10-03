// app/(admin)/layout.tsx
import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/utils';

const NavLink = ({ href, label }: { href: string; label: string }) => (
  <Link
    href={href}
    className="rounded-md px-3 py-1.5 text-sm text-neutral-300 hover:bg-white/5 hover:text-white"
  >
    {label}
  </Link>
);

const AdminLayout = async ({ children }: { children: ReactNode }) => {
  // Dev bypass: set EIGA_OPEN_ADMIN=1 in .env.local to skip admin checks
  const devOpen =
    process.env.NODE_ENV !== 'production' &&
    process.env.EIGA_OPEN_ADMIN === '1';

  const session = await auth().catch(() => null);

  if (!devOpen) {
    if (!session?.user) {
      redirect('/login?callbackUrl=/manage');
    }
    if (session.user.role !== 'admin') {
      redirect('/dashboard');
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-neutral-950/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:py-4">
          {/* Brand */}
          <Link href="/manage" className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-white/15 bg-white/5 text-xs">
              Ei
            </span>
            <span className="text-base font-semibold tracking-tight text-white">Eiga</span>
            <span className="ml-2 inline-flex items-center rounded-full border border-olive-500/30 bg-olive-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-olive-200">
              Admin
            </span>
          </Link>

          {/* Nav */}
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink href="/manage" label="Manage" />
            <NavLink href="/select-film" label="Select film" />
            <NavLink href="/invites" label="Invites" />
            <Link
              href="/dashboard"
              className="ml-2 rounded-md px-3 py-1.5 text-sm text-neutral-300 hover:bg-white/5 hover:text-white"
              title="Back to app"
            >
              Back to app
            </Link>
            <form method="POST" action="/api/auth/signout" className="ml-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md border border-olive-500/30 bg-olive-500/10 px-3 py-1.5 text-sm text-olive-200 transition-colors hover:bg-olive-500/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-olive-400/40"
              >
                Sign out
              </button>
            </form>
          </nav>

          {/* Mobile shortcuts */}
          <div className="md:hidden">
            <Link
              href="/dashboard"
              className="rounded-md px-3 py-1.5 text-sm text-neutral-300 hover:bg-white/5 hover:text-white"
            >
              Back
            </Link>
          </div>
        </div>

        {/* Mobile nav row */}
        <div className="border-t border-white/10 bg-neutral-950/70 md:hidden">
          <div className="mx-auto w-full max-w-6xl overflow-x-auto px-4 py-2">
            <div className="flex items-center gap-2">
              <NavLink href="/manage" label="Manage" />
              <NavLink href="/select-film" label="Select film" />
              <NavLink href="/invites" label="Invites" />
            </div>
          </div>
        </div>

        {/* Optional dev banner */}
        {devOpen ? (
          <div className="border-t border-yellow-500/20 bg-yellow-500/10">
            <div className="mx-auto w-full max-w-6xl px-4 py-1 text-xs text-yellow-300">
              Admin preview (dev bypass enabled)
            </div>
          </div>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">{children}</main>
    </>
  );
};

export default AdminLayout;