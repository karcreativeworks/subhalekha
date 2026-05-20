"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { useEffect, useState } from "react"

import { ComingSoonTrigger } from "@/components/site/coming-soon-trigger"
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
}

function NavPill({
  children,
  active,
  className,
}: {
  children: React.ReactNode
  active?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        "flex cursor-pointer items-center gap-1 rounded-full px-3 py-2 text-xs font-medium tracking-wide uppercase transition-colors select-none",
        active
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
}: {
  label: string
  children: React.ReactNode
  align?: "left" | "center"
}) {
  return (
    <div
      className={cn(
        "group relative flex flex-col",
        align === "center" && "items-center",
      )}
    >
      <NavPill>
        {label}
        <ChevronDown className="size-3.5 opacity-50 transition-transform duration-200 group-hover:rotate-180" />
      </NavPill>
      <div
        className={cn(
          glassPanel(
            "pointer-events-none absolute top-full z-50 min-w-[200px] bg-neutral-100 rounded-xl border-neutral-200/25 p-1 opacity-0 shadow-xl",
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
}: {
  href: string
  children: React.ReactNode
  onNavigate?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="block rounded-lg px-3 py-2 text-sm text-foreground/90 transition-colors bg-white backdrop-blur-sm hover:opacity-80"
    >
      {children}
    </Link>
  )
}

function MenuToggle({
  open,
  onClick,
}: {
  open: boolean
  onClick: () => void
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
        glassPanel("border-white/30 bg-white/20"),
      )}
    >
      <span className="relative block h-4 w-5">
        <span
          className={cn(
            "absolute left-0 block h-0.5 w-5 rounded-full bg-foreground transition-all duration-300 ease-out",
            open ? "top-2 rotate-45" : "top-0 rotate-0",
          )}
        />
        <span
          className={cn(
            "absolute left-0 top-2 block h-0.5 w-5 rounded-full bg-foreground transition-all duration-300 ease-out",
            open ? "scale-x-0 opacity-0" : "scale-x-100 opacity-100",
          )}
        />
        <span
          className={cn(
            "absolute left-0 block h-0.5 w-5 rounded-full bg-foreground transition-all duration-300 ease-out",
            open ? "top-2 -rotate-45" : "top-4 rotate-0",
          )}
        />
      </span>
    </button>
  )
}

function DesktopNav({ events, pathname }: { events: SiteNavEvent[]; pathname: string }) {
  const isHome = pathname === "/"

  return (
    <nav
      className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex"
      aria-label="Site"
    >
      <Link href="/">
        <NavPill active={isHome}>Home</NavPill>
      </Link>

      <NavDropdown label="Events">
        {events.length === 0 ? (
          <p className="text-muted-foreground px-3 py-2 text-xs">No events yet</p>
        ) : (
          events.map((event) => (
            <DropdownLink key={event.id} href={`/${event.eventSlug}`}>
              {event.title}
            </DropdownLink>
          ))
        )}
      </NavDropdown>

      <NavDropdown label="Gallery">
        {events.length === 0 ? (
          <p className="text-muted-foreground px-3 py-2 text-xs">No events yet</p>
        ) : (
          events.map((event) => (
            <DropdownLink
              key={event.id}
              href={`/${event.eventSlug}/gallery`}
            >
              {event.title}
            </DropdownLink>
          ))
        )}
      </NavDropdown>

      <NavDropdown label="Guide">
        {GUIDE_LINKS.map((item) => (
          <Link
            key={item.key}
            href={`/coming-soon?section=${item.key}`}
            className="block rounded-lg px-3 py-2 text-sm text-foreground/90 transition-colors hover:bg-white/15"
          >
            {item.label}
          </Link>
        ))}
      </NavDropdown>


      <Link href="/coming-soon">
        <NavPill active={pathname === "/coming-soon"}>Live</NavPill>
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
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="border-t border-white/10 pt-3 first:border-t-0 first:pt-0">
      <p className="text-muted-foreground mb-2 px-2 text-[10px] font-medium tracking-widest uppercase">
        {title}
      </p>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  )
}

function MobileNav({
  events,
  pathname,
  onNavigate,
}: {
  events: SiteNavEvent[]
  pathname: string
  onNavigate: () => void
}) {
  return (
    <nav className="flex flex-col gap-4" aria-label="Site">
      <MobileNavSection title="Main">
        <Link
          href="/"
          onClick={onNavigate}
          className={cn(
            "rounded-lg px-3 py-2 text-sm",
            pathname === "/" ? "bg-white/20 font-medium" : "hover:bg-white/10",
          )}
        >
          Home
        </Link>
        <Link
          href="/coming-soon"
          onClick={onNavigate}
          className={cn(
            "rounded-lg px-3 py-2 text-sm",
            pathname === "/coming-soon"
              ? "bg-white/20 font-medium"
              : "hover:bg-white/10",
          )}
        >
          Live
        </Link>
        <div className="flex items-center justify-between rounded-lg px-3 py-2">
          <span className="text-sm">Counter</span>
          <SiteCountdown />
        </div>
      </MobileNavSection>

      <MobileNavSection title="Events">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/${event.eventSlug}`}
            onClick={onNavigate}
            className="rounded-lg px-3 py-2 text-sm hover:bg-white/10"
          >
            {event.title}
          </Link>
        ))}
      </MobileNavSection>

      <MobileNavSection title="Gallery">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/${event.eventSlug}/gallery`}
            onClick={onNavigate}
            className="rounded-lg px-3 py-2 text-sm hover:bg-white/10"
          >
            {event.title}
          </Link>
        ))}
      </MobileNavSection>

      <MobileNavSection title="Guide">
        {GUIDE_LINKS.map((item) => (
          <Link
            key={item.key}
            href={`/coming-soon?section=${item.key}`}
            onClick={onNavigate}
            className="rounded-lg px-3 py-2 text-sm hover:bg-white/10"
          >
            {item.label}
          </Link>
        ))}
      </MobileNavSection>

      <div className="flex w-full items-stretch gap-2 border-t border-white/10 pt-4">
        <ThemeToggle className="shrink-0 self-center" />
        <ComingSoonTrigger
          className="min-w-0 flex-1 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-center text-sm font-medium"
          label="Login — coming soon"
        >
          Login
        </ComingSoonTrigger>
      </div>
    </nav>
  )
}

export function SiteNav({ events }: SiteNavProps) {
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

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16">
      <div className={cn(glassNavBar(), "h-full")}>
        <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="relative z-10 flex shrink-0 items-center">
            <Image
              src="/logo_letters_small.png"
              alt="Subhalekha"
              width={120}
              height={36}
              className="h-8 w-auto object-contain sm:h-9 dark:hidden"
              priority
            />
            <Image
              src="/logo_letters_small_dark.png"
              alt="Subhalekha"
              width={120}
              height={36}
              className="hidden h-8 w-auto object-contain sm:h-9 dark:block"
              priority
            />
          </Link>

          <DesktopNav events={events} pathname={pathname} />

          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <SiteCountdown className="hidden xl:inline" />
            <ComingSoonTrigger
              className={cn(
                glassPanel(
                  "rounded-full border-white/30 px-4 py-2 text-xs font-medium tracking-wide uppercase",
                ),
                "hover:bg-white/20",
              )}
              label="Login — coming soon"
            >
              Login
            </ComingSoonTrigger>
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <SiteCountdown className="hidden min-[400px]:inline sm:inline" />
            <MenuToggle
              open={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            />
          </div>
        </div>
      </div>

      <div
        className={cn(
          "fixed inset-0 top-16 z-40 transition-opacity duration-300 lg:hidden",
          "bg-background/50 backdrop-blur-sm",
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
              "mx-4 mt-3 max-h-[calc(100svh-5rem)] overflow-y-auto rounded-2xl border-white/30 p-4 shadow-2xl",
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
          />
        </div>
      </div>
    </header>
  )
}
