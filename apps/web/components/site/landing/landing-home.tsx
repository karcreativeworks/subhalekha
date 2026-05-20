"use client"

import Image from "next/image"
import Link from "next/link"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import dynamic from "next/dynamic"
import { useCallback, useRef, useState } from "react"

import { glassPanel } from "@/components/site/glass"
import { getCloudflareImageUrl } from "@/lib/media/cloudflare-image"
import { cn } from "@workspace/ui/lib/utils"

gsap.registerPlugin(useGSAP)

const LandingParallaxScene = dynamic(
  () =>
    import("@/components/site/landing/landing-parallax-scene").then(
      (m) => m.LandingParallaxScene,
    ),
  { ssr: false },
)

interface LandingEvent {
  id: string
  title: string
  eventSlug: string
  subtitle?: string
  coverPicHorizontal: string
  coverPicVertical: string
}

interface LandingHomeProps {
  days: number
  events: LandingEvent[]
}

export function LandingHome({ days, events }: LandingHomeProps) {
  const [introDone, setIntroDone] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const handleIntroComplete = useCallback(() => setIntroDone(true), [])

  useGSAP(
    () => {
      if (!introDone || !contentRef.current) return

      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 36 },
        { opacity: 1, y: 0, duration: 1, ease: "power2.out" },
      )
    },
    { dependencies: [introDone], scope: contentRef },
  )

  return (
    <div className="relative min-h-[200svh]">
      <LandingParallaxScene onIntroComplete={handleIntroComplete} />

      <div className="relative z-10 flex min-h-svh flex-col">
        <div className="flex flex-1 flex-col items-center justify-end px-4 pb-10 pt-24 sm:px-6">
          <p
            className={cn(
              "text-foreground/80 max-w-md text-center text-sm tracking-[0.2em] uppercase transition-opacity duration-1000 sm:text-base",
              introDone ? "opacity-100" : "opacity-0",
            )}
          >
            Celebrations &amp; memories
          </p>

          <div
            className={cn(
              "mt-6 flex flex-col items-center gap-2 transition-opacity duration-1000 delay-300",
              introDone ? "opacity-100" : "opacity-0",
            )}
          >
            <span className="text-muted-foreground text-xs tracking-widest uppercase">
              Scroll to explore
            </span>
            <div className="bg-foreground/40 h-8 w-px animate-pulse" />
          </div>
        </div>
      </div>

      <div
        ref={contentRef}
        className={cn(
          "relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-16 opacity-0 sm:px-6 bg-background/90 min-h-[800px] backdrop-blur-sm rounded-2xl",
        )}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <section className={cn(glassPanel("rounded-2xl p-6"))}>
            <h2 className="text-sm font-medium tracking-wide uppercase">
              Countdown
            </h2>
            <p className="mt-2 text-3xl font-medium tabular-nums">
              {days}
              <span className="text-muted-foreground ml-2 text-base font-normal">
                {days === 1 ? "day" : "days"} until July 8, 2026
              </span>
            </p>
          </section>

          <section className={cn(glassPanel("rounded-2xl p-6"))}>
            <h2 className="text-sm font-medium tracking-wide uppercase">
              Posts &amp; Updates
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Check Back here in future for more frequent updates.
            </p>
          </section>
        </div>

        <h1 className="mt-8 text-3xl font-bold tracking-tight">
          Recent Events
        </h1>

        {events.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {events.map((event, index) => (
              <LandingEventCard
                key={event.id}
                event={event}
                index={index}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function LandingEventCard({
  event,
  index,
}: {
  event: LandingEvent
  index: number
}) {
  const isVertical = index % 2 === 0
  const coverSrc = getCloudflareImageUrl(
    isVertical ? event.coverPicVertical : event.coverPicHorizontal,
    "large",
  )

  return (
    <Link
      href={`/${event.eventSlug}`}
      className={cn(
        "group relative overflow-hidden rounded-xl",
        isVertical
          ? "col-span-1 h-[100px] sm:h-[350px]"
          : "col-span-2 h-24 sm:h-28",
      )}
    >
      <div className="relative h-full w-full bg-black/20">
        {coverSrc ? (
          <Image
            src={coverSrc}
            alt={event.title}
            fill
            priority={index < 2}
            sizes={isVertical ? "(max-width: 640px) 50vw, 200px" : "(max-width: 640px) 100vw, 400px"}
            className={cn(
              "object-cover transition-all duration-500 ease-out",
              "opacity-85 group-hover:scale-[1.02] group-hover:opacity-100",
            )}
          />
        ) : (
          <div className="bg-muted h-full w-full" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="absolute right-0 bottom-0 left-0 p-2.5 sm:p-3">
          <h3 className="text-sm sm:text-3xl font-semibold tracking-tight text-white">
            {event.title}
          </h3>
          {event.subtitle ? (
            <p className="mt-0.5 line-clamp-1 text-xs text-white/80">
              {event.subtitle}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
