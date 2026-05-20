"use client"

import { useEffect, useState } from "react"

import { getDaysUntilCountdown } from "@/lib/site/countdown"
import { cn } from "@workspace/ui/lib/utils"

interface SiteCountdownProps {
  className?: string
}

export function SiteCountdown({ className }: SiteCountdownProps) {
  const [days, setDays] = useState<number | null>(null)

  useEffect(() => {
    setDays(getDaysUntilCountdown())
    const id = window.setInterval(() => setDays(getDaysUntilCountdown()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  if (days === null) {
    return (
      <span
        className={cn(
          "text-xs font-medium tracking-wide uppercase tabular-nums",
          className,
        )}
        aria-hidden
      >
        ···
      </span>
    )
  }

  const label = days === 1 ? "Day to go" : "Days to go"

  return (
    <span
      className={cn(
        "text-xs font-medium tracking-wide whitespace-nowrap uppercase tabular-nums",
        className,
      )}
    >
      {days} {label}
    </span>
  )
}
