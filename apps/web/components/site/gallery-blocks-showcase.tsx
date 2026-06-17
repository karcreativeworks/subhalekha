import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import type { GalleryBlockPublicWithPicCount } from "@/app/types/gallery"
import { getCloudflareImageUrl } from "@/lib/media/cloudflare-image"
import { cn } from "@workspace/ui/lib/utils"

import "./gallery-blocks-showcase.css"

interface GalleryBlocksShowcaseProps {
  eventSlug: string
  blocks: GalleryBlockPublicWithPicCount[]
}

/** Delay between each card's shine in the sequence (seconds). */
const SHINE_STAGGER_S = 0.55
/** Duration of one shine sweep (seconds). */
const SHINE_SWEEP_S = 1.15

function getShineCycleDuration(blockCount: number): number {
  return blockCount * SHINE_STAGGER_S + SHINE_SWEEP_S
}

export function GalleryBlocksShowcase({
  eventSlug,
  blocks,
}: GalleryBlocksShowcaseProps) {
  if (!blocks.length) {
    return (
      <p className="text-muted-foreground px-6 py-16 text-center text-sm">
        No gallery sections yet.
      </p>
    )
  }

  const shineCycleDuration = getShineCycleDuration(blocks.length)

  return (
    <div className="relative w-full">
      <p
        className={cn(
          "pointer-events-none fixed right-4 bottom-4 z-30 hidden items-center gap-2",
          "rounded-full border border-white/25 bg-black/80 px-4 py-2 text-xs font-medium tracking-wide text-white uppercase shadow-xl backdrop-blur-sm",
          "md:flex",
        )}
      >
        Scroll to explore
        <ChevronRight className="size-3.5" aria-hidden />
      </p>

      <div
        className={cn(
          "flex flex-col gap-0 p-1 select-none md:hidden",
          "min-h-[calc(100svh-4rem)]",
        )}
      >
        {blocks.map((block, index) => (
          <GalleryBlockCard
            key={block.id}
            block={block}
            eventSlug={eventSlug}
            index={index}
            shineCycleDuration={shineCycleDuration}
            variant="mobile"
          />
        ))}
      </div>

      <div
        className={cn(
          "hidden w-full md:block",
          "overflow-x-auto overflow-y-hidden",
          "snap-x snap-mandatory",
          "[scrollbar-width:thin]",
        )}
      >
        <div className="flex h-[calc(100svh-4rem)] w-max min-w-full flex-row gap-0 p-1 select-none">
          {blocks.map((block, index) => (
            <GalleryBlockCard
              key={block.id}
              block={block}
              eventSlug={eventSlug}
              index={index}
              shineCycleDuration={shineCycleDuration}
              variant="desktop"
            />
          ))}
        </div>
      </div>
    </div>
  )
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

function GalleryBlockCard({
  block,
  eventSlug,
  index,
  shineCycleDuration,
  variant,
}: {
  block: GalleryBlockPublicWithPicCount
  eventSlug: string
  index: number
  shineCycleDuration: number
  variant: "mobile" | "desktop"
}) {
  const href = `/${eventSlug}/gallery/${block.galleryBlockSlug}`
  const isDesktop = variant === "desktop"
  const coverSrc = getCloudflareImageUrl(
    isDesktop ? block.coverPicVertical : block.coverPicHorizontal,
    "large",
  )

  return (
    <Link
      href={href}
      className={cn(
        "group relative shrink-0 cursor-pointer overflow-hidden snap-start",
        "border-4 border-transparent hover:z-10",
        isDesktop
          ? [
            "h-[calc(100svh-4rem-8px)] w-[min(22vw,300px)] min-w-[200px] max-w-[300px]",
            "hover:border-white/80 dark:hover:border-black/80",
          ]
          : ["h-[32svh] min-h-[120px] w-full", "hover:border-white/80 dark:hover:border-black/80"],
      )}
    >
      <div className="card-shine relative h-full w-full overflow-hidden bg-black">
        <img
          src={coverSrc}
          alt={block.title}
          className={cn(
            "object-cover transition-all duration-500 ease-out h-full w-full",
            isDesktop
              ? [
                "opacity-60 grayscale",
                "group-hover:-translate-y-5 group-hover:opacity-100 group-hover:grayscale-0",
              ]
              : ["opacity-90", "group-hover:opacity-100"],
          )}
        />
        <CardShineOverlay
          index={index}
          shineCycleDuration={shineCycleDuration}
        />
      </div>

      <h2
        className={cn(
          "absolute bottom-0 left-0 z-[2] flex flex-row items-baseline gap-2 bg-black/85 px-3 py-2",
          "font-black tracking-tight text-white uppercase",
          "transition-transform duration-500 ease-out",
          "flex flex-col",
          isDesktop
            ? [
              "right-0 text-[clamp(1rem,2.5vw,2.75rem)]",
              "translate-y-full group-hover:translate-y-0",
            ]
            : ["text-xl"],
        )}
      >
        <span
          className={cn(
            "font-mono font-bold text-amber-300/90",
            isDesktop ? "text-[clamp(0.55rem,1vw,0.75rem)]" : "text-[10px]",
          )}
        >
          {block.picCount === 1 ? "1 pic" : `${block.picCount} pics`}
        </span>
        {block.title}
      </h2>
      <h2
        className={cn(
          "absolute bottom-0 left-0 z-[2] flex flex-row items-baseline gap-2 bg-black/85 px-3 py-2",
          "font-black tracking-tight text-white uppercase",
          "transition-transform duration-500 ease-out",
          isDesktop
            ? [
              "right-0 text-[clamp(1rem,2.5vw,2.75rem)]",
              "translate-y-full group-hover:translate-y-0",
            ]
            : ["text-xl"],
        )}>

      </h2>
    </Link>
  )
}
