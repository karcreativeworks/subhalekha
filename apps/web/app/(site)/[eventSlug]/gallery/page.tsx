import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageHeader } from "@/components/site/page-header"
import { GalleryBlocksShowcase } from "@/components/site/gallery-blocks-showcase"
import {
  getPublicEventBySlug,
  getPublicGalleryBlocksForEvent,
} from "@/lib/gallery/public-event"
import { buildEventGalleryIndexMetadata } from "@/lib/site/share-metadata"

interface GalleryIndexPageProps {
  params: Promise<{ eventSlug: string }>
}

export async function generateMetadata({
  params,
}: GalleryIndexPageProps): Promise<Metadata> {
  const { eventSlug } = await params
  const event = await getPublicEventBySlug(eventSlug)
  if (!event) return { title: "Not found" }
  return buildEventGalleryIndexMetadata(event)
}

export default async function GalleryIndexPage({
  params,
}: GalleryIndexPageProps) {
  const { eventSlug } = await params
  const event = await getPublicEventBySlug(eventSlug)

  if (!event) {
    notFound()
  }

  const blocks = await getPublicGalleryBlocksForEvent(event)

  return (
    <>
      {/* <PageHeader
        title="Gallery"
        subtitle={event.title}
        description={
          event.description?.trim() ||
          "Browse photo collections from this celebration."
        }
        backHref={`/${event.eventSlug}`}
        backLabel={`${event.title} home`}
        bgImageUrl={
          event.coverPicHorizontal.trim()
            ? event.coverPicHorizontal
            : undefined
        }
      /> */}
      <GalleryBlocksShowcase eventSlug={event.eventSlug} blocks={blocks} />
    </>
  )
}
