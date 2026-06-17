import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageHeader } from "@/components/site/page-header"
import { PublicPhotoGridInfinite } from "@/components/site/public-photo-grid-infinite"
import {
  getPublicEventBySlug,
  getPublicEventContentGrid,
  getPublicGalleryBlock,
  getPublicMediaForGalleryBlock,
} from "@/lib/gallery/public-event"
import { buildGalleryBlockMetadata } from "@/lib/site/share-metadata"
import { getCloudflareImageUrl } from "@/lib/media/cloudflare-image"

interface GalleryBlockPageProps {
  params: Promise<{ eventSlug: string; galleryBlockSlug: string }>
}

export async function generateMetadata({
  params,
}: GalleryBlockPageProps): Promise<Metadata> {
  const { eventSlug, galleryBlockSlug } = await params
  const event = await getPublicEventBySlug(eventSlug)
  if (!event) return { title: "Not found" }

  const block = await getPublicGalleryBlock(event, galleryBlockSlug)
  if (!block) return { title: "Not found" }

  return buildGalleryBlockMetadata(event, block)
}

export default async function GalleryBlockPage({
  params,
}: GalleryBlockPageProps) {
  const { eventSlug, galleryBlockSlug } = await params
  const event = await getPublicEventBySlug(eventSlug)

  if (!event) {
    notFound()
  }

  const block = await getPublicGalleryBlock(event, galleryBlockSlug)

  if (!block) {
    notFound()
  }

  const [{ files, hasMore, total }, allGridItems] = await Promise.all([
    getPublicMediaForGalleryBlock(block, { page: 1 }),
    getPublicEventContentGrid(event),
  ])

  const currentGalleryHref = `/${event.eventSlug}/gallery/${block.galleryBlockSlug}`
  const contentGridItems = allGridItems.filter(
    (item) => item.href !== currentGalleryHref,
  )

  return (
    <>
      <PageHeader
        title={block.title}
        subtitle={block.subtitle ?? event.title}
        description={block.description}
        backHref={`/${event.eventSlug}/gallery`}
        backLabel={`All galleries for ${event.title}`}
        bgImageUrl={
          block.coverPicHorizontal?.trim()
            ? getCloudflareImageUrl(block.coverPicHorizontal, "medium")
            : undefined
        }
      />

      <PublicPhotoGridInfinite
        eventSlug={event.eventSlug}
        galleryBlockSlug={block.galleryBlockSlug}
        bgMusicUrl={block.bgMusic}
        initialPhotos={files}
        initialHasMore={hasMore}
        initialTotal={total}
        contentGridItems={contentGridItems}
      />
    </>
  )
}
