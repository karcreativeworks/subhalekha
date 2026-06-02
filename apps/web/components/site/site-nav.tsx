"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { useEffect, useState } from "react"

import { SiteGangSelect } from "@/components/site/site-gang-provider"
import { glassNavBar, glassPanel } from "@/components/site/glass"
import { ThemeToggle } from "@/components/site/theme-toggle"
import { SiteCountdown } from "@/components/site/site-countdown"
import type { SiteNavEvent } from "@/lib/site/public-events"
import { cn } from "@workspace/ui/lib/utils"

const GUIDE_LINKS = [
  { label: "Map", key: "map" },
  { label: "Itinerary", key: "itinerary" },
  { label: "Dresscode", key: "dresscode" },
  { label: "Schedule", key: "schedule" },
] as const

interface SiteNavProps {
  events: SiteNavEvent[]
  /** Fixed dark chrome (e.g. sangeet plan page) regardless of theme preference. */
  forceDarkNav?: boolean
}

function NavPill({
  children,
  active,
  className,
  darkNav,
}: {
  children: React.ReactNode
  active?: boolean
  className?: string
  darkNav?: boolean
}) {
  return (
    <span
      className={cn(
        "flex cursor-pointer items-center gap-1 rounded-full px-3 py-2 text-xs font-medium tracking-wide uppercase transition-colors select-none",
        darkNav
          ? active
            ? "bg-white/20 text-white"
            : "text-white/85 hover:bg-white/10 hover:text-white"
          : active
            ? "bg-white/20 text-foreground"
            : "text-foreground/85 hover:bg-white/10 hover:text-foreground",
        className,
      )}
    >
      {children}
    </span>
  )
}

function NavDropdown({
  label,
  children,
  align = "left",
  darkNav,
}: {
  label: string
  children: React.ReactNode
  align?: "left" | "center"
  darkNav?: boolean
}) {
  return (
    <div
      className={cn(
        "group relative flex flex-col",
        align === "center" && "items-center",
      )}
    >
      <NavPill darkNav={darkNav}>
        {label}
        <ChevronDown className="size-3.5 opacity-50 transition-transform duration-200 group-hover:rotate-180" />
      </NavPill>
      <div
        className={cn(
          glassPanel(
            darkNav
              ? "pointer-events-none absolute top-full z-50 min-w-[200px] rounded-xl border-white/10 bg-slate-950/95 p-1 opacity-0 shadow-xl"
              : "pointer-events-none absolute top-full z-50 min-w-[200px] rounded-xl border-neutral-200/25 bg-neutral-100 p-1 opacity-0 shadow-xl",
          ),
          "transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100",
          align === "center" ? "left-1/2 -translate-x-1/2" : "left-0",
        )}
      >
        {children}
      </div>
    </div>
  )
}

function DropdownLink({
  href,
  children,
  onNavigate,
  darkNav,
}: {
  href: string
  children: React.ReactNode
  onNavigate?: () => void
  darkNav?: boolean
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "block rounded-lg px-3 py-2 text-sm transition-colors backdrop-blur-sm",
        darkNav
          ? "bg-slate-900/80 text-sky-50/90 hover:bg-slate-800/90"
          : "bg-white text-foreground/90 hover:opacity-80",
      )}
    >
      {children}
    </Link>
  )
}

function MenuToggle({
  open,
  onClick,
  darkNav,
}: {
  open: boolean
  onClick: () => void
  darkNav?: boolean
}) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls="site-mobile-menu"
      aria-label={open ? "Close menu" : "Open menu"}
      onClick={onClick}
      className={cn(
        "relative flex size-11 shrink-0 items-center justify-center rounded-xl",
        glassPanel(
          darkNav
            ? "border-white/10 bg-black/30"
            : "border-white/30 bg-white/20",
        ),
      )}
    >
      <span className="relative block h-4 w-5">
        <span
          className={cn(
            "absolute left-0 block h-0.5 w-5 rounded-full transition-all duration-300 ease-out",
            darkNav ? "bg-white" : "bg-foreground",
            open ? "top-2 rotate-45" : "top-0 rotate-0",
          )}
        />
        <span
          className={cn(
            "absolute left-0 top-2 block h-0.5 w-5 rounded-full transition-all duration-300 ease-out",
            darkNav ? "bg-white" : "bg-foreground",
            open ? "scale-x-0 opacity-0" : "scale-x-100 opacity-100",
          )}
        />
        <span
          className={cn(
            "absolute left-0 block h-0.5 w-5 rounded-full transition-all duration-300 ease-out",
            darkNav ? "bg-white" : "bg-foreground",
            open ? "top-2 -rotate-45" : "top-4 rotate-0",
          )}
        />
      </span>
    </button>
  )
}

function DesktopNav({
  events,
  pathname,
  darkNav,
}: {
  events: SiteNavEvent[]
  pathname: string
  darkNav?: boolean
}) {
  const isHome = pathname === "/"

  return (
    <nav
      className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex"
      aria-label="Site"
    >
      <Link href="/">
        <NavPill active={isHome} darkNav={darkNav}>
          Home
        </NavPill>
      </Link>

      <NavDropdown label="Events" darkNav={darkNav}>
        {events.length === 0 ? (
          <p
            className={cn(
              "px-3 py-2 text-xs",
              darkNav ? "text-sky-200/60" : "text-muted-foreground",
            )}
          >
            No events yet
          </p>
        ) : (
          events.map((event) => (
            <DropdownLink
              key={event.id}
              href={`/${event.eventSlug}`}
              darkNav={darkNav}
            >
              {event.title}
            </DropdownLink>
          ))
        )}
      </NavDropdown>

      <NavDropdown label="Gallery" darkNav={darkNav}>
        {events.length === 0 ? (
          <p
            className={cn(
              "px-3 py-2 text-xs",
              darkNav ? "text-sky-200/60" : "text-muted-foreground",
            )}
          >
            No events yet
          </p>
        ) : (
          events.map((event) => (
            <DropdownLink
              key={event.id}
              href={`/${event.eventSlug}/gallery`}
              darkNav={darkNav}
            >
              {event.title}
            </DropdownLink>
          ))
        )}
      </NavDropdown>

      <NavDropdown label="Guide" darkNav={darkNav}>
        {GUIDE_LINKS.map((item) => (
          <Link
            key={item.key}
            href={`/coming-soon?section=${item.key}`}
            className={cn(
              "block rounded-lg px-3 py-2 text-sm transition-colors",
              darkNav
                ? "text-sky-50/90 hover:bg-white/10"
                : "text-foreground/90 hover:bg-white/15",
            )}
          >
            {item.label}
          </Link>
        ))}
      </NavDropdown>

      <Link href="/coming-soon">
        <NavPill active={pathname === "/coming-soon"} darkNav={darkNav}>
          Live
        </NavPill>
      </Link>

      {/* <NavPill className="cursor-default">
        <SiteCountdown />
      </NavPill> */}
    </nav>
  )
}

function MobileNavSection({
  title,
  children,
  darkNav,
}: {
  title: string
  children: React.ReactNode
  darkNav?: boolean
}) {
  return (
    <div className="border-t border-white/10 pt-3 first:border-t-0 first:pt-0">
      <p
        className={cn(
          "mb-2 px-2 text-[10px] font-medium tracking-widest uppercase",
          darkNav ? "text-sky-200/60" : "text-muted-foreground",
        )}
      >
        {title}
      </p>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  )
}

function mobileLinkClass(active: boolean, darkNav?: boolean) {
  return cn(
    "rounded-lg px-3 py-2 text-sm",
    darkNav ? "text-sky-50/90" : undefined,
    active ? "bg-white/20 font-medium" : "hover:bg-white/10",
  )
}

function MobileNav({
  events,
  pathname,
  onNavigate,
  darkNav,
}: {
  events: SiteNavEvent[]
  pathname: string
  onNavigate: () => void
  darkNav?: boolean
}) {
  return (
    <nav className="flex flex-col gap-4" aria-label="Site">
      <MobileNavSection title="Main" darkNav={darkNav}>
        <Link
          href="/"
          onClick={onNavigate}
          className={mobileLinkClass(pathname === "/", darkNav)}
        >
          Home
        </Link>
        <Link
          href="/coming-soon"
          onClick={onNavigate}
          className={mobileLinkClass(pathname === "/coming-soon", darkNav)}
        >
          Live
        </Link>
        <div
          className={cn(
            "flex items-center justify-between rounded-lg px-3 py-2",
            darkNav && "text-sky-50/90",
          )}
        >
          <span className="text-sm">Counter</span>
          <SiteCountdown />
        </div>
      </MobileNavSection>

      <MobileNavSection title="Events" darkNav={darkNav}>
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/${event.eventSlug}`}
            onClick={onNavigate}
            className={mobileLinkClass(false, darkNav)}
          >
            {event.title}
          </Link>
        ))}
      </MobileNavSection>

      <MobileNavSection title="Gallery" darkNav={darkNav}>
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/${event.eventSlug}/gallery`}
            onClick={onNavigate}
            className={mobileLinkClass(false, darkNav)}
          >
            {event.title}
          </Link>
        ))}
      </MobileNavSection>

      <MobileNavSection title="Guide" darkNav={darkNav}>
        {GUIDE_LINKS.map((item) => (
          <Link
            key={item.key}
            href={`/coming-soon?section=${item.key}`}
            onClick={onNavigate}
            className={mobileLinkClass(false, darkNav)}
          >
            {item.label}
          </Link>
        ))}
      </MobileNavSection>

      <div className="flex w-full items-center justify-between gap-2 border-t border-white/10 pt-4">
        <span
          className={cn(
            "px-2 text-xs tracking-wide uppercase",
            darkNav ? "text-sky-200/70" : "text-muted-foreground",
          )}
        >
          Your side
        </span>
        <SiteGangSelect className="min-w-0 flex-1" />
        <ThemeToggle
          className={cn(
            "shrink-0",
            darkNav && glassPanel("border-white/10 bg-black/30"),
          )}
        />
      </div>
    </nav>
  )
}

export function SiteNav({ events, forceDarkNav = false }: SiteNavProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileOpen])

  const darkNav = forceDarkNav

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16">
      <div
        className={cn(
          glassNavBar(),
          darkNav && "border-white/10 bg-black/40",
          "h-full",
        )}
      >
        <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="relative z-10 flex shrink-0 items-center">
            <Image
              src="/logo_letters_small.png"
              alt="Subhalekha"
              width={120}
              height={36}
              className={cn(
                "h-8 w-auto object-contain sm:h-9",
                darkNav ? "hidden" : "dark:hidden",
              )}
              priority
            />
            <Image
              src="/logo_letters_small_dark.png"
              alt="Subhalekha"
              width={120}
              height={36}
              className={cn(
                "h-8 w-auto object-contain sm:h-9",
                darkNav ? "block" : "hidden dark:block",
              )}
              priority
            />
          </Link>

          <DesktopNav
            events={events}
            pathname={pathname}
            darkNav={darkNav}
          />

          <div
            className={cn(
              "hidden shrink-0 items-center gap-2 lg:flex",
              darkNav && "text-sky-50/90",
            )}
          >
            <SiteCountdown className="hidden xl:inline" />
            <SiteGangSelect />
            <ThemeToggle
              className={darkNav ? glassPanel("border-white/10 bg-black/30") : undefined}
            />
          </div>

          <div
            className={cn(
              "flex items-center gap-2 lg:hidden",
              darkNav && "text-sky-50/90",
            )}
          >
            <SiteCountdown className="hidden min-[400px]:inline sm:inline" />
            <SiteGangSelect />
            <MenuToggle
              open={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
              darkNav={darkNav}
            />
          </div>
        </div>
      </div>

      <div
        className={cn(
          "fixed inset-0 top-16 z-40 transition-opacity duration-300 lg:hidden",
          darkNav ? "bg-black/60" : "bg-background/50",
          "backdrop-blur-sm",
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        aria-hidden={!mobileOpen}
        onClick={() => setMobileOpen(false)}
      >
        <div
          id="site-mobile-menu"
          role="dialog"
          aria-modal="true"
          className={cn(
            glassPanel(
              darkNav
                ? "mx-4 mt-3 max-h-[calc(100svh-5rem)] overflow-y-auto rounded-2xl border-white/10 bg-slate-950/95 p-4 text-sky-50/90 shadow-2xl"
                : "mx-4 mt-3 max-h-[calc(100svh-5rem)] overflow-y-auto rounded-2xl border-white/30 p-4 shadow-2xl",
            ),
            "transition-all duration-300 ease-out",
            mobileOpen
              ? "translate-y-0 opacity-100"
              : "-translate-y-2 opacity-0",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <MobileNav
            events={events}
            pathname={pathname}
            onNavigate={() => setMobileOpen(false)}
            darkNav={darkNav}
          />
        </div>
      </div>
    </header>
  )
}
