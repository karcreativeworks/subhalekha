"use client"

import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import Image from "next/image"
import { useCallback, useRef, useState } from "react"

import {
  LandingBlocksSections,
  type LandingEvent,
} from "@/components/site/landing/landing-blocks-sections"
import { cn } from "@workspace/ui/lib/utils"

import { GroomInviteVideo } from "./groom-invite-video"

gsap.registerPlugin(useGSAP)

interface GroomInvitePageProps {
  days: number
  events: LandingEvent[]
}

export function GroomInvitePage({ days, events }: GroomInvitePageProps) {
  const [introDone, setIntroDone] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const handleIntroComplete = useCallback(() => setIntroDone(true), [])
  const handlePlayingChange = useCallback(
    (isPlaying: boolean) => setIsVideoPlaying(isPlaying),
    [],
  )

  const showInviteOverlay = introDone && !isVideoPlaying


  return (
    <div className="relative w-full">
      <section className="relative h-[100dvh] w-full">
        <GroomInviteVideo
          onIntroComplete={handleIntroComplete}
          onPlayingChange={handlePlayingChange}
        />

        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
          <div className="flex flex-1 flex-col items-center justify-end px-4 pb-6 pt-24 sm:px-6">
            <p
              className={cn(
                "text-white/80 max-w-md text-center text-xl tracking-[0.2em] uppercase transition-opacity duration-1000 sm:text-base",
                showInviteOverlay ? "opacity-100" : "opacity-0",
              )}
            >
              You're Invited!
            </p>

            <div
              className={cn(
                "mt-3 flex flex-col items-center gap-2 transition-opacity duration-1000 delay-300",
                showInviteOverlay ? "opacity-100" : "opacity-0",
              )}
            >
              <span className="text-white text-xs tracking-widest uppercase mb-4">
                Scroll to explore
              </span>
              <div className="bg-white h-8 w-1 animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* <section className="w-full bg-background">
        <Image
          src="/invite/digitalinvite-groom.png"
          alt="Digital wedding invitation"
          width={1200}
          height={1800}
          sizes="100vw"
          className="h-auto w-full"
          priority
        />
      </section> */}

      <LandingBlocksSections ref={contentRef} days={days} events={events} immediateVisible={true} />
    </div>
  )
}
