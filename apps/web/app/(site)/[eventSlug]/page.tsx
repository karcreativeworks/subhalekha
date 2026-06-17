import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { EventContentGrid } from "@/components/site/event-content-grid"
import { GalleryBlocksShowcase } from "@/components/site/gallery-blocks-showcase"
import { PageHeader } from "@/components/site/page-header"
import type { EventContentGridItem } from "@/app/types/gallery"
import {
  getPublicEventBySlug,
  getPublicGalleryBlocksForEvent,
  getPublicVideoBlocksForEvent,
} from "@/lib/gallery/public-event"
import { buildEventLandingMetadata } from "@/lib/site/share-metadata"
import { cn } from "@workspace/ui/lib/utils"
import { getCloudflareImageUrl } from "@/lib/media/cloudflare-image"

interface EventHomePageProps {
  params: Promise<{ eventSlug: string }>
}

export async function generateMetadata({
  params,
}: EventHomePageProps): Promise<Metadata> {
  const { eventSlug } = await params
  const event = await getPublicEventBySlug(eventSlug)
  if (!event) return { title: "Not found" }
  return buildEventLandingMetadata(event)
}

function formatEventDate(value: string | Date) {
  try {
    const date = value instanceof Date ? value : new Date(value)
    return new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date)
  } catch {
    return String(value)
  }
}

export default async function EventHomePage({ params }: EventHomePageProps) {
  const { eventSlug } = await params
  const event = await getPublicEventBySlug(eventSlug)

  if (!event) {
    notFound()
  }

  const [galleryBlocks, videoBlocks] = await Promise.all([
    getPublicGalleryBlocksForEvent(event),
    getPublicVideoBlocksForEvent(event),
  ])

  const videoGridItems: EventContentGridItem[] = videoBlocks.map((block) => ({
    kind: "video",
    id: block.id,
    title: block.title,
    href: `/${event.eventSlug}/video/${block.videoBlockSlug}`,
    imageUrl: block.thumbnailUrl,
    videoUrl: block.videoUrl,
    subtitle: block.subtitle,
    description: block.description,
  }))

  return (
    <>
      <PageHeader
        className="mx-4 sm:mx-6"
        title={event.title}
        subtitle={event.subtitle}
        description={
          event.description ||
          "Welcome. Explore galleries, schedules, and more — sections will light up as you build them."
        }
        bgImageUrl={
          event.coverPicHorizontal?.trim()
            ? getCloudflareImageUrl(event.coverPicHorizontal, "medium")
            : undefined
        }
        backLabel="Back to home"
        backHref="/"
      />

      <GalleryBlocksShowcase eventSlug={event.eventSlug} blocks={galleryBlocks} />


      <EventContentGrid items={videoGridItems} />


      {/* <div className="grid gap-4 sm:grid-cols-2">
        <section className={cn(glassPanel("rounded-2xl p-6"))}>
          <h2 className="text-sm font-medium tracking-wide uppercase">
            When
          </h2>
          <p className="mt-2 text-lg">{formatEventDate(event.eventDate)}</p>
          {event.eventTime ? (
            <p className="text-muted-foreground mt-1 text-sm">
              {event.eventTime}
            </p>
          ) : null}
        </section>

        <section className={cn(glassPanel("rounded-2xl p-6"))}>
          <h2 className="text-sm font-medium tracking-wide uppercase">
            Gallery
          </h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Browse photo collections from this celebration.
          </p>
          <Link
            href={`/${event.eventSlug}/gallery`}
            className="mt-4 inline-flex rounded-lg bg-white/25 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/35 dark:bg-white/10 dark:hover:bg-white/20"
          >
            View galleries →
          </Link>
        </section>
      </div> */}
    </>
  )
}
