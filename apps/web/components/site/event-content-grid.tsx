"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { Grid3x3, Play } from "lucide-react"

import type { EventContentGridItem } from "@/app/types/gallery"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { VideoPlayerEmbed } from "@/components/site/video-player-embed"
import { cn } from "@workspace/ui/lib/utils"

import "./gallery-blocks-showcase.css"

interface EventContentGridProps {
  items: EventContentGridItem[]
  title?: string
}

type VideoGridItem = Extract<EventContentGridItem, { kind: "video" }>

/** Delay between each card's shine in the sequence (seconds). */
const SHINE_STAGGER_S = 0.55
/** Duration of one shine sweep (seconds). */
const SHINE_SWEEP_S = 1.15

const cardClassName = cn(
  "group relative aspect-square overflow-hidden rounded",
  "bg-black/80 ring-1 ring-white/10 transition-transform hover:scale-[1.02] hover:ring-white/25",
)

function getShineCycleDuration(blockCount: number): number {
  return blockCount * SHINE_STAGGER_S + SHINE_SWEEP_S
}

function CardShineOverlay({
  index,
  shineCycleDuration,
}: {
  index: number
  shineCycleDuration: number
}) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
      aria-hidden
    >
      <div
        className="gallery-card-shine-beam"
        style={{
          animationDuration: `${shineCycleDuration}s`,
          animationDelay: `${index * SHINE_STAGGER_S}s`,
        }}
      />
    </div>
  )
}

function CardVisual({
  item,
  index,
  shineCycleDuration,
}: {
  item: EventContentGridItem
  index: number
  shineCycleDuration: number
}) {
  const usePlayIcon = item.kind === "video"
  const Icon = usePlayIcon ? Play : Grid3x3

  return (
    <>
      <div className="card-shine absolute inset-0 overflow-hidden bg-black">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            priority={index < 4}
            className="object-cover transition-opacity duration-300 group-hover:opacity-90"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            unoptimized={item.kind === "video"}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950" />
        )}
        <CardShineOverlay
          index={index}
          shineCycleDuration={shineCycleDuration}
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="absolute right-12 bottom-2 left-2 z-[1] flex flex-col justify-end">
        <p className="truncate text-sm font-bold text-white opacity-0 drop-shadow-md transition-opacity duration-300 group-hover:opacity-100 sm:text-xl">
          {item.title}
        </p>
        <p className="truncate text-xs font-bold text-white/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          {usePlayIcon ? "Video" : "Gallery"}
        </p>
      </div>

      <span
        className={cn(
          "absolute right-2 bottom-2 z-[2] flex size-7 items-center justify-center rounded-full",
          "bg-black/55 text-white backdrop-blur-sm",
        )}
        aria-hidden
      >
        <Icon className={cn("size-4", usePlayIcon && "ml-0.5 fill-current")} />
      </span>
    </>
  )
}

function ContentGridCard({
  item,
  index,
  shineCycleDuration,
  onVideoOpen,
}: {
  item: EventContentGridItem
  index: number
  shineCycleDuration: number
  onVideoOpen: (item: VideoGridItem) => void
}) {
  if (item.kind === "video") {
    return (
      <button
        type="button"
        onClick={() => onVideoOpen(item)}
        className={cn(cardClassName, "cursor-pointer text-left")}
        aria-label={`Play ${item.title}`}
      >
        <CardVisual
          item={item}
          index={index}
          shineCycleDuration={shineCycleDuration}
        />
      </button>
    )
  }

  return (
    <Link href={item.href} className={cardClassName}>
      <CardVisual
        item={item}
        index={index}
        shineCycleDuration={shineCycleDuration}
      />
    </Link>
  )
}

function VideoPlayerDialog({
  video,
  open,
  onOpenChange,
}: {
  video: VideoGridItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl gap-0 overflow-hidden p-0 sm:max-w-4xl">
        {video ? (
          <>
            <DialogHeader className="space-y-1 px-6 pt-6 pr-12 text-left">
              <DialogTitle>{video.title}</DialogTitle>
              {video.subtitle ? (
                <DialogDescription>{video.subtitle}</DialogDescription>
              ) : null}
            </DialogHeader>
            <div className="px-6 pt-4 pb-6">
              <VideoPlayerEmbed
                videoUrl={video.videoUrl}
                title={video.title}
                className="max-w-none"
              />
              {video.description ? (
                <p className="text-muted-foreground mt-4 text-sm whitespace-pre-line">
                  {video.description}
                </p>
              ) : null}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export function EventContentGrid({ items, title }: EventContentGridProps) {
  const [activeVideo, setActiveVideo] = useState<VideoGridItem | null>(null)

  if (!items.length) {
    if (title) return null
    return (
      <p className="text-muted-foreground px-6 py-16 text-center text-sm">
        No galleries or videos yet.
      </p>
    )
  }

  const shineCycleDuration = getShineCycleDuration(items.length)

  return (
    <>
      <section className="px-4 pb-8 md:px-2">
        {title ? (
          <h2 className="text-muted-foreground mx-auto mb-4 text-sm font-medium tracking-wide uppercase">
            {title}
          </h2>
        ) : null}
        <div className="mx-auto grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-3 lg:gap-4">
          {items.map((item, index) => (
            <ContentGridCard
              key={`${item.kind}-${item.id}`}
              item={item}
              index={index}
              shineCycleDuration={shineCycleDuration}
              onVideoOpen={setActiveVideo}
            />
          ))}
        </div>
      </section>

      <VideoPlayerDialog
        video={activeVideo}
        open={activeVideo !== null}
        onOpenChange={(open) => {
          if (!open) setActiveVideo(null)
        }}
      />
    </>
  )
}
