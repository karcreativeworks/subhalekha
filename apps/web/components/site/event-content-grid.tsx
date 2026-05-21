"use client"

import Image from "next/image"
import Link from "next/link"
import { Grid3x3, Play } from "lucide-react"

import type { EventContentGridItem } from "@/app/types/gallery"
import { cn } from "@workspace/ui/lib/utils"

import "./gallery-blocks-showcase.css"

interface EventContentGridProps {
  items: EventContentGridItem[]
}

/** Delay between each card's shine in the sequence (seconds). */
const SHINE_STAGGER_S = 0.55
/** Duration of one shine sweep (seconds). */
const SHINE_SWEEP_S = 1.15

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

export function EventContentGrid({ items }: EventContentGridProps) {
  if (!items.length) {
    return (
      <p className="text-muted-foreground px-6 py-16 text-center text-sm">
        No galleries or videos yet.
      </p>
    )
  }

  const shineCycleDuration = getShineCycleDuration(items.length)

  return (
    <section className="px-4 pb-8 md:px-6">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:gap-4">
        {items.map((item, index) => (
          <ContentGridCard
            key={`${item.kind}-${item.id}`}
            item={item}
            index={index}
            shineCycleDuration={shineCycleDuration}
          />
        ))}
      </div>
    </section>
  )
}

function ContentGridCard({
  item,
  index,
  shineCycleDuration,
}: {
  item: EventContentGridItem
  index: number
  shineCycleDuration: number
}) {
  const usePlayIcon =
    item.kind === "video";
  const Icon = usePlayIcon ? Play : Grid3x3

  return (
    <Link
      href={item.href}
      className={cn(
        "group relative aspect-square overflow-hidden rounded-xl",
        "bg-black/80 ring-1 ring-white/10 transition-transform hover:scale-[1.02] hover:ring-white/25",
      )}
    >
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

      <div className="opacity-0 group-hover:opacity-100 absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent transition-opacity duration-300" />

      <div className=" absolute right-12 bottom-2 left-2 z-[1] flex flex-col justify-end">
        <p className="opacity-0 group-hover:opacity-100 truncate text-sm sm:text-xl font-bold text-white drop-shadow-md transition-opacity duration-300">
          {item.title}
        </p>
        <p className="opacity-0 group-hover:opacity-100 truncate text-xs font-bold text-white/50 transition-opacity duration-300">
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
        <Icon
          className={cn("size-4", usePlayIcon && "ml-0.5 fill-current")}
        />
      </span>
    </Link>
  )
}
