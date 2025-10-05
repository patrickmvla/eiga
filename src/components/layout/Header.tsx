"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/ButtonLink";

const navItems = [
  { href: "/cinema", label: "Cinema" }, // new: curated TMDB posters page
  { href: "/approach", label: "Approach" },
  { href: "/archive", label: "Archive" },
  { href: "/philosophy", label: "Philosophy" },
];

const NavLink = ({ href, label }: { href: string; label: string }) => {
  const pathname = usePathname();
  const isActive =
    pathname === href || (href !== "/" && pathname?.startsWith(href));
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
        isActive
          ? "bg-white/10 text-white"
          : "text-neutral-300 hover:bg-white/5 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
};

export const Header = () => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close mobile panel on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open (mobile)
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-950/70 backdrop-blur">
      {/* Skip link for accessibility */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:rounded-md focus:bg-white/10 focus:px-3 focus:py-1.5 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:py-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2"
            aria-label="Go to homepage"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-white/15 bg-white/5 text-xs">
              Ei
            </span>
            <span className="text-base font-semibold tracking-tight text-white">
              Eiga
            </span>
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
          <Link
            href="/login"
            className="rounded-md px-3 py-1.5 text-sm text-neutral-300 hover:bg-white/5 hover:text-white"
          >
            Log in
          </Link>
          <ButtonLink
            href="/request-invite"
            variant="primary"
            size="sm"
            className="ml-1"
          >
            Request invite
          </ButtonLink>
        </nav>

        {/* Mobile menu button */}
        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 p-2 text-neutral-200 hover:bg-white/10 md:hidden"
        >
          {/* Hamburger / Close icon */}
          <svg
            className={`h-4 w-4 ${open ? "hidden" : "block"}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeWidth="2"
              strokeLinecap="round"
              d="M4 7h16M4 12h16M4 17h16"
            />
          </svg>
          <svg
            className={`h-4 w-4 ${open ? "block" : "hidden"}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeWidth="2"
              strokeLinecap="round"
              d="M6 6l12 12M18 6l-12 12"
            />
          </svg>
        </button>
      </div>

      {/* Mobile panel */}
      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-white/10 bg-neutral-950/80 md:hidden"
        >
          <div className="mx-auto w-full max-w-6xl px-4 py-3">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-sm text-neutral-200 hover:bg-white/5"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-neutral-200 hover:bg-white/5"
              >
                Log in
              </Link>
              <ButtonLink
                href="/request-invite"
                variant="primary"
                size="md"
                className="mt-2"
                ariaLabel="Request an invite"
                onClick={() => setOpen(false)}
              >
                Request invite
              </ButtonLink>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
};
