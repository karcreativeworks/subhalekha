"use client"

import { BowTieIcon, DressIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import type { SiteGangSide } from "@/lib/site/gang-side"
import { cn } from "@workspace/ui/lib/utils"

const GANG_ICON = {
  bride: DressIcon,
  groom: BowTieIcon,
} as const

const GANG_ICON_COLOR = {
  bride: "text-rose-600 dark:text-rose-400",
  groom: "text-sky-700 dark:text-sky-400",
} as const

interface SiteGangIconProps {
  side: SiteGangSide
  size?: number
  className?: string
}

export function SiteGangIcon({ side, size = 18, className }: SiteGangIconProps) {
  return (
    <HugeiconsIcon
      icon={GANG_ICON[side]}
      size={size}
      strokeWidth={1.75}
      className={cn("shrink-0", GANG_ICON_COLOR[side], className)}
      aria-hidden
    />
  )
}
