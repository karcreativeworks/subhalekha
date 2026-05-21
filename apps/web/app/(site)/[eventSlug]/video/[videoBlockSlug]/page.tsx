import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageHeader } from "@/components/site/page-header"
import { VideoPlayerEmbed } from "@/components/site/video-player-embed"
import {
  getPublicEventBySlug,
  getPublicVideoBlock,
} from "@/lib/gallery/public-event"

interface VideoBlockPageProps {
  params: Promise<{ eventSlug: string; videoBlockSlug: string }>
}

export async function generateMetadata({
  params,
}: VideoBlockPageProps): Promise<Metadata> {
  const { eventSlug, videoBlockSlug } = await params
  const event = await getPublicEventBySlug(eventSlug)
  if (!event) return { title: "Not found" }

  const block = await getPublicVideoBlock(event, videoBlockSlug)
  if (!block) return { title: "Not found" }

  return {
    title: `${block.title} · ${event.title}`,
    description: block.description ?? block.subtitle,
  }
}

export default async function VideoBlockPage({ params }: VideoBlockPageProps) {
  const { eventSlug, videoBlockSlug } = await params
  const event = await getPublicEventBySlug(eventSlug)

  if (!event) {
    notFound()
  }

  const block = await getPublicVideoBlock(event, videoBlockSlug)

  if (!block) {
    notFound()
  }

  return (
    <>
      <PageHeader
        title={block.title}
        subtitle={block.subtitle ?? event.title}
        description={block.description}
        backHref={`/${event.eventSlug}`}
        backLabel={`${event.title} home`}
      />

      <div className="px-4 pb-12 md:px-6">
        <VideoPlayerEmbed videoUrl={block.videoUrl} title={block.title} />
      </div>
    </>
  )
}
