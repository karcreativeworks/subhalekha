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

export function SiteShell({ events, children }: SiteShellProps) {
  const pathname = usePathname()
  const fullBleed = isGalleryIndexPath(pathname)

  return (
    <div className="relative min-h-svh">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-tl from-sky-100/80 via-background to-white-100/60 dark:from-rose-950/40 dark:via-background dark:to-sky-950/30"
        aria-hidden
      />
      <SiteNav events={events} />
      <main
        className={cn(
          "w-full pb-16 pt-16",
          fullBleed ? "px-0" : "mx-auto max-w-6xl px-4 sm:px-6",
        )}
      >
        {children}
      </main>
    </div>
  )
}
