import type { ReactNode } from "react"
import { Toaster } from "sonner"

import { SiteLayoutClient } from "@/components/site/site-layout-client"
import { getPublicEventsList } from "@/lib/gallery/public-event"
import { toSiteNavEvents } from "@/lib/site/public-events"

/** Mongo-backed nav must render at request time, not at build (Vercel). */
export const dynamic = "force-dynamic"

export default async function SiteLayout({
  children,
}: {
  children: ReactNode
}) {
  const events = toSiteNavEvents(await getPublicEventsList())

  return (
    <>
      <SiteLayoutClient events={events}>{children}</SiteLayoutClient>
      <Toaster richColors position="top-center" />
    </>
  )
}
