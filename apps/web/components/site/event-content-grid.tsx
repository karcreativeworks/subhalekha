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
  "group relative overflow-hidden min-h-[50vh]",
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
          <img
            src={item.imageUrl}
            alt={item.title}
            className="object-cover transition-opacity duration-300 group-hover:opacity-90 h-full w-full"
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
          "absolute bottom-[50%] right-[50%] translate-y-[50%] translate-x-[50%] z-[2] flex size-[100px] items-center justify-center rounded-full",
          "bg-black/55 text-white backdrop-blur-sm",
        )}
        aria-hidden
      >
        <Icon className={cn("size-[50px]", usePlayIcon && "ml-0.5 fill-current")} />
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
      <DialogContent
        overlayClassName="bg-black"
        className={cn(
          "fixed inset-0 top-0 left-0 z-50 flex h-svh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden",
          "rounded-none border-0 bg-black p-0 shadow-none",
          "[&>button]:top-4 [&>button]:right-4 [&>button]:text-white [&>button]:opacity-80 [&>button]:hover:opacity-100",
        )}
      >
        {video ? (
          <>
            <DialogHeader className="shrink-0 space-y-1 border-b border-white/10 px-6 py-4 pr-14 text-left">
              <DialogTitle className="text-white">{video.title}</DialogTitle>
              {video.subtitle ? (
                <DialogDescription className="text-white/65">
                  {video.subtitle}
                </DialogDescription>
              ) : null}
            </DialogHeader>

            <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-4 md:px-8 md:py-6">
              <VideoPlayerEmbed
                videoUrl={video.videoUrl}
                title={video.title}
                className="aspect-video h-auto max-h-full w-full max-w-full rounded-xl ring-white/10"
              />
            </div>

            {video.description ? (
              <p className="text-white/70 shrink-0 border-t border-white/10 px-6 py-4 text-sm whitespace-pre-line">
                {video.description}
              </p>
            ) : null}
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
      <section className="px-4 pb-2 md:px-2">
        {title ? (
          <h2 className="text-muted-foreground mx-auto mb-4 text-sm font-medium tracking-wide uppercase">
            {title}
          </h2>
        ) : null}
        <div className="mx-auto grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-2 lg:gap-4">
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
