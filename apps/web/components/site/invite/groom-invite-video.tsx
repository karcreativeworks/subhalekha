"use client"

import { Play, RotateCw } from "lucide-react"
import { useCallback, useRef, useState } from "react"

import { cn } from "@workspace/ui/lib/utils"

const VIDEO_SRC = "/invite/invite-groom.mp4"

interface GroomInviteVideoProps {
  onIntroComplete?: () => void
  onPlayingChange?: (isPlaying: boolean) => void
}

export function GroomInviteVideo({
  onIntroComplete,
  onPlayingChange,
}: GroomInviteVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasEnded, setHasEnded] = useState(false)

  const handlePlay = useCallback(async () => {
    const video = videoRef.current
    if (!video) return

    try {
      await video.play()
      setIsPlaying(true)
    } catch {
      setIsPlaying(false)
    }
  }, [])

  const handleReplay = useCallback(async () => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = 0
    setHasEnded(false)

    try {
      await video.play()
      setIsPlaying(true)
    } catch {
      setIsPlaying(false)
    }
  }, [])

  return (
    <section className="relative flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-black">
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        className={cn(
          "h-full w-full object-cover",
          "md:h-full md:w-auto md:max-w-full md:object-contain",
        )}
        playsInline
        preload="metadata"
        onPlay={() => {
          setIsPlaying(true)
          onPlayingChange?.(true)
        }}
        onPause={() => {
          setIsPlaying(false)
          onPlayingChange?.(false)
        }}
        onEnded={() => {
          setIsPlaying(false)
          setHasEnded(true)
          onPlayingChange?.(false)
          onIntroComplete?.()
        }}
      />

      {!isPlaying && !hasEnded ? (
        <button
          type="button"
          onClick={handlePlay}
          aria-label="Play video"
          className="absolute inset-0 flex items-center justify-center bg-black/25 transition-opacity hover:bg-black/35"
        >
          <span className="flex size-16 items-center justify-center rounded-full bg-white/90 text-black shadow-lg sm:size-20">
            <Play className="ml-1 size-8 fill-current sm:size-10" />
          </span>
        </button>
      ) : null}

      {hasEnded ? (
        <button
          type="button"
          onClick={handleReplay}
          aria-label="Replay video"
          className="absolute inset-0 flex items-center justify-center bg-black/25 transition-opacity hover:bg-black/35"
        >
          <span className="flex size-16 items-center justify-center rounded-full bg-white/90 text-black shadow-lg sm:size-20">
            <RotateCw className="size-8 sm:size-10" />
          </span>
        </button>
      ) : null}
    </section>
  )
}
