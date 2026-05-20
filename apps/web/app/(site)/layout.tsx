import type { ReactNode } from "react"
import { Toaster } from "sonner"

import { SiteShell } from "@/components/site/site-shell"
import { getPublicEventsList } from "@/lib/gallery/public-event"
import { toSiteNavEvents } from "@/lib/site/public-events"

export default async function SiteLayout({
  children,
}: {
  children: ReactNode
}) {
  const events = toSiteNavEvents(await getPublicEventsList())

  return (
    <>
      <SiteShell events={events}>{children}</SiteShell>
      <Toaster richColors position="top-center" />
    </>
  )
}
