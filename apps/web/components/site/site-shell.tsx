"use client"

import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

import { SiteNav } from "@/components/site/site-nav"
import type { SiteNavEvent } from "@/lib/site/public-events"
import { cn } from "@workspace/ui/lib/utils"

interface SiteShellProps {
  events: SiteNavEvent[]
  children: ReactNode
}

/** Event gallery index: full-viewport block strip (Azuki-style). */
function isGalleryIndexPath(pathname: string): boolean {
  return /^\/[^/]+\/gallery\/?$/.test(pathname)
}

/** Event landing (`/{eventSlug}`): same full-bleed layout as gallery index. */
function isEventHomePath(pathname: string): boolean {
  const match = pathname.match(/^\/([^/]+)\/?$/)
  if (!match) return false
  const segment = match[1]
  if (segment === "coming-soon") return false
  return true
}

function isHomePath(pathname: string): boolean {
  return pathname === "/"
}

export function SiteShell({ events, children }: SiteShellProps) {
  const pathname = usePathname()
  const fullBleed =
    isGalleryIndexPath(pathname) ||
    isEventHomePath(pathname) ||
    isHomePath(pathname)
  const isHome = isHomePath(pathname)

  return (
    <div className="relative min-h-svh">
      {!isHome ? (
        <div
          className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-tl from-sky-100/80 via-background to-white-100/60 dark:from-rose-950/40 dark:via-background dark:to-sky-950/30"
          aria-hidden
        />
      ) : null}
      <SiteNav events={events} />
      <main
        className={cn(
          "w-full",
          isHome ? "pb-0 pt-0" : "pb-16 pt-16",
          fullBleed ? "px-0" : "mx-auto max-w-6xl px-4 sm:px-6",
        )}
      >
        {children}
      </main>
    </div>
  )
}
