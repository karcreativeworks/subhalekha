"use client"

import type { ReactNode } from "react"

import { SiteGangProvider } from "@/components/site/site-gang-provider"
import { SiteShell } from "@/components/site/site-shell"
import type { SiteNavEvent } from "@/lib/site/public-events"

interface SiteLayoutClientProps {
  events: SiteNavEvent[]
  children: ReactNode
}

export function SiteLayoutClient({ events, children }: SiteLayoutClientProps) {
  return (
    <SiteGangProvider>
      <SiteShell events={events}>{children}</SiteShell>
    </SiteGangProvider>
  )
}
