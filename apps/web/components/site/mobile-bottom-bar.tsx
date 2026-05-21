"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

import { glassPanel } from "@/components/site/glass"
import { cn } from "@workspace/ui/lib/utils"

const SCROLL_DELTA_THRESHOLD = 8
const TOP_REVEAL_OFFSET = 16

interface MobileBottomBarProps {
  children: ReactNode
  /** When true, bar stays hidden and non-interactive (e.g. no slideshow available). */
  hidden?: boolean
  className?: string
  contentClassName?: string
}

/**
 * Full-width fixed bottom bar (mobile only). Glass shell; children supply inner UI.
 * Hides while scrolling down, reappears when scrolling up.
 */
export function MobileBottomBar({
  children,
  hidden = false,
  className,
  contentClassName,
}: MobileBottomBarProps) {
  const [revealed, setRevealed] = useState(true)
  const lastScrollY = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {
    lastScrollY.current = window.scrollY

    const onScroll = () => {
      if (ticking.current) return
      ticking.current = true

      requestAnimationFrame(() => {
        const scrollY = window.scrollY
        const delta = scrollY - lastScrollY.current

        if (scrollY <= TOP_REVEAL_OFFSET) {
          setRevealed(true)
        } else if (delta > SCROLL_DELTA_THRESHOLD) {
          setRevealed(false)
        } else if (delta < -SCROLL_DELTA_THRESHOLD) {
          setRevealed(true)
        }

        lastScrollY.current = scrollY
        ticking.current = false
      })
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const isVisible = !hidden && revealed

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-40 md:hidden",
        "transition-transform duration-300 ease-out motion-reduce:transition-none",
        isVisible ? "translate-y-0" : "translate-y-full",
        className,
      )}
      aria-hidden={hidden}
    >
      <div
        className={cn(
          glassPanel(
            "pointer-events-auto w-full rounded-none border-x-0 border-b-0 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
          ),
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  )
}
