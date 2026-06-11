import type { Metadata } from "next"

import { WeddingRsvpPage } from "@/components/site/rsvp/wedding-rsvp-page"
import { buildWeddingRsvpMetadata } from "@/lib/site/share-metadata"

export const metadata: Metadata = buildWeddingRsvpMetadata()

export const dynamic = "force-dynamic"

export default function WeddingRsvpRoutePage() {
  return <WeddingRsvpPage />
}
