"use client"

import type { ReactNode } from "react"
import { toast } from "sonner"

import { cn } from "@workspace/ui/lib/utils"

interface ComingSoonTriggerProps {
  children: ReactNode
  label?: string
  className?: string
  asChild?: boolean
}

export function ComingSoonTrigger({
  children,
  label = "Coming soon",
  className,
}: ComingSoonTriggerProps) {
  return (
    <button
      type="button"
      className={cn(className)}
      onClick={() => toast.info(label, { description: "This section is not live yet." })}
    >
      {children}
    </button>
  )
}
