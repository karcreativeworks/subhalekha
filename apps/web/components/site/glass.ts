import { cn } from "@workspace/ui/lib/utils"

/** Shared glass surface tokens for the public site. */
export function glassPanel(className?: string) {
  return cn(
    "border border-white/20 bg-transparent shadow-lg backdrop-blur-sm",
    "dark:border-white/10 dark:bg-black/20",
    className
  )
}

export function glassNavBar(className?: string) {
  return cn(
    "border-b border-white/25 bg-white/15 backdrop-blur-2xl",
    "dark:border-white/10 dark:bg-black/25",
    className
  )
}
