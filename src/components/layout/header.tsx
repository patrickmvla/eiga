"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type NavItem = { href: string; label: string }

const navItems: NavItem[] = [
  { href: "/cinema", label: "Cinema" },
  { href: "/approach", label: "Approach" },
  { href: "/archive", label: "Archive" },
  { href: "/philosophy", label: "Philosophy" },
]

const NavLink = ({ href, label }: NavItem) => {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== "/" && pathname?.startsWith(href))
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={[
        "rounded-md px-3 py-1.5 text-sm transition-colors",
        isActive
          ? "border border-border bg-primary/10 text-foreground"
          : "text-muted-foreground hover:bg-card/40 hover:text-foreground",
      ].join(" ")}
    >
      {label}
    </Link>
  )
}

export const Header = () => {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Close mobile panel on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Prevent body scroll when menu is open (mobile)
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // Add subtle header state on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={[
        "sticky top-0 z-50 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:backdrop-blur",
        scrolled ? "border-border/80" : "border-border/60",
      ].join(" ")}
    >
      {/* Skip link for accessibility */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:rounded-md focus:bg-card/60 focus:px-3 focus:py-1.5 focus:text-sm focus:text-foreground"
      >
        Skip to content
      </a>

      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:py-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2" aria-label="Go to homepage">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border bg-card/60 text-xs">
              Ei
            </span>
            <span className="text-base font-semibold tracking-tight text-foreground">Eiga</span>
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}

          <Link
            href="/login"
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-card/40 hover:text-foreground"
          >
            Log in
          </Link>

          <Button asChild size="sm" className="ml-1">
            <Link href="/request-invite">Request invite</Link>
          </Button>
        </nav>

        {/* Mobile menu button */}
        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-center rounded-md border border-border bg-card/60 p-2 text-foreground hover:bg-card/80 md:hidden"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Mobile panel */}
      {open ? (
        <div id="mobile-nav" className="border-t border-border bg-background/90 md:hidden">
          <div className="mx-auto w-full max-w-6xl px-4 py-3">
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-sm text-foreground hover:bg-card/40"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-foreground hover:bg-card/40"
              >
                Log in
              </Link>
              <Button asChild size="sm" className="mt-2 w-full">
                <Link href="/request-invite" aria-label="Request an invite" onClick={() => setOpen(false)}>
                  Request invite
                </Link>
              </Button>
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  )
}