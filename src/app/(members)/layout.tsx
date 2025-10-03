// app/(members)/layout.tsx
import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/utils';

type SessionUser = {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'member';
  avatar_url?: string | null;
  is_active?: boolean;
};

const NavLink = ({ href, label }: { href: string; label: string }) => (
  <Link
    href={href}
    className="rounded-md px-3 py-1.5 text-sm text-neutral-300 hover:bg-white/5 hover:text-white"
  >
    {label}
  </Link>
);

const MembersLayout = async ({ children }: { children: ReactNode }) => {
  const session = await auth().catch(() => null) as null | { user?: SessionUser };

  if (!session?.user || session.user.is_active === false) {
    redirect('/login?callbackUrl=/dashboard');
  }
  const user = session.user;

  const profileHref = `/profile/${user.username}`;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-neutral-950/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:py-4">
          {/* Brand */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-white/15 bg-white/5 text-xs">
              Ei
            </span>
            <span className="text-base font-semibold tracking-tight text-white">Eiga</span>
          </Link>

          {/* Nav */}
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink href="/dashboard" label="Dashboard" />
            <NavLink href="/films" label="Films" />
            <NavLink href="/suggest" label="Suggest" />
            <NavLink href={profileHref} label="Profile" />
            {user.role === 'admin' ? <NavLink href="/manage" label="Admin" /> : null}
          </nav>

          {/* User + actions */}
          <div className="flex items-center gap-2">
            <Link
              href={profileHref}
              className="hidden items-center gap-2 rounded-md px-2 py-1.5 text-sm text-neutral-300 hover:bg-white/5 hover:text-white md:flex"
              title={user.username}
            >
              <span className="inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
                {user.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar_url} alt={user.username} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[10px] uppercase">
                    {user.username.slice(0, 2)}
                  </span>
                )}
              </span>
              <span className="max-w-[10rem] truncate">{user.username}</span>
            </Link>

            {/* Mobile nav shortcut */}
            <Link
              href="/dashboard"
              className="md:hidden rounded-md px-2 py-1.5 text-sm text-neutral-300 hover:bg-white/5 hover:text-white"
              aria-label="Go to dashboard"
            >
              Dashboard
            </Link>

            {/* Sign out (POST) */}
            <form method="POST" action="/api/auth/signout">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md border border-olive-500/30 bg-olive-500/10 px-3 py-1.5 text-sm text-olive-200 transition-colors hover:bg-olive-500/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-olive-400/40"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>

        {/* Mobile nav row */}
        <div className="border-t border-white/10 bg-neutral-950/70 md:hidden">
          <div className="mx-auto w-full max-w-6xl overflow-x-auto px-4 py-2">
            <div className="flex items-center gap-2">
              <NavLink href="/dashboard" label="Dashboard" />
              <NavLink href="/films" label="Films" />
              <NavLink href="/suggest" label="Suggest" />
              <NavLink href={profileHref} label="Profile" />
              {user.role === 'admin' ? <NavLink href="/manage" label="Admin" /> : null}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
        {children}
      </main>
    </>
  );
};

export default MembersLayout;