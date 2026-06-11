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
import { LandingBlocksSections, LandingEvent } from "./landing-blocks-sections"

gsap.registerPlugin(useGSAP)

const LandingParallaxScene = dynamic(
  () =>
    import("@/components/site/landing/landing-parallax-scene").then(
      (m) => m.LandingParallaxScene,
    ),
  { ssr: false },
)

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

      <LandingBlocksSections ref={contentRef} days={days} events={events} />
    </div>
  )
}
