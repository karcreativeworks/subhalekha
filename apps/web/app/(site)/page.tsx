import type { Metadata } from "next"

import { LandingHome } from "@/components/site/landing/landing-home"
import { getPublicEventsList } from "@/lib/gallery/public-event"
import { getDaysUntilCountdown } from "@/lib/site/countdown"
import { buildSiteHomeMetadata } from "@/lib/site/share-metadata"

import "@/components/site/landing/landing-parallax-scene.css"

export const metadata: Metadata = buildSiteHomeMetadata()

export default async function SiteHomePage() {
  const events = await getPublicEventsList()
  const days = getDaysUntilCountdown()

  return (
    <LandingHome
      days={days}
      events={events.map((e) => ({
        id: e.id,
        title: e.title,
        eventSlug: e.eventSlug,
        subtitle: e.subtitle,
        coverPicHorizontal: e.coverPicHorizontal,
        coverPicVertical: e.coverPicVertical,
      }))}
    />
  )
}
