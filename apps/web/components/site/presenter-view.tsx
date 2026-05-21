"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize,
  Minimize,
  Pause,
  Play,
  Timer,
  Volume2,
  VolumeX,
  XIcon,
  ZoomIn,
  ZoomOut,
} from "lucide-react"

import type { MediaFile } from "@/app/types/media"
import { Dialog, DialogPortal } from "@/components/ui/dialog"
import { getMediaImageUrl } from "@/lib/media/cloudflare-image"
import { cn } from "@workspace/ui/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"

const MIN_SCALE = 1
const MAX_SCALE = 4
const SWIPE_THRESHOLD_PX = 48
const SLIDE_TRANSITION_MS = 320
const DEFAULT_SLIDESHOW_SECONDS = 3
const DEFAULT_SLIDESHOW_BG_MUSIC = "/songs/instrumental.mp3"
const PRESENTER_HISTORY_STATE = "presenter-view"

export function resolveSlideshowMusicUrl(bgMusicUrl?: string) {
  const trimmed = bgMusicUrl?.trim()
  return trimmed || DEFAULT_SLIDESHOW_BG_MUSIC
}

const SLIDESHOW_SPEED_OPTIONS = [
  { seconds: 6, label: "Slow" },
  { seconds: 5, label: "5s" },
  { seconds: 4, label: "4s" },
  { seconds: 3, label: "3s" },
  { seconds: 2, label: "2s" },
  { seconds: 1, label: "× Fast" },
] as const

const toolbarButtonClass =
  "rounded-full p-2 text-white/90 transition-colors hover:bg-white/15 disabled:opacity-40"

function getDefaultSpeedIndex(seconds = DEFAULT_SLIDESHOW_SECONDS) {
  const index = SLIDESHOW_SPEED_OPTIONS.findIndex(
    (option) => option.seconds === seconds,
  )
  return index >= 0 ? index : 3
}

export interface PresenterViewProps {
  photos: MediaFile[]
  open: boolean
  index: number
  onOpenChange: (open: boolean) => void
  onIndexChange?: (index: number) => void
  bgMusicUrl?: string
  /** Audio element rendered outside the dialog (required for reliable playback). */
  audioRef?: React.RefObject<HTMLAudioElement | null>
  /** Auto-start slideshow when opened (e.g. gallery Slideshow button). */
  autoStartSlideshow?: boolean
  defaultSlideshowSeconds?: number
}

function getPresenterFullUrl(file: MediaFile) {
  return (
    getMediaImageUrl(file, "original") ||
    getMediaImageUrl(file, "large") ||
    getMediaImageUrl(file, "medium") ||
    file.filePath ||
    ""
  )
}

function getPresenterDownloadUrl(file: MediaFile) {
  return (
    getMediaImageUrl(file, "original") ||
    getMediaImageUrl(file, "large") ||
    file.filePath ||
    getPresenterFullUrl(file)
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getPhotoKey(photo: MediaFile, fallbackIndex: number) {
  if (typeof photo._id === "string") return photo._id
  return photo._id?.toString() ?? String(fallbackIndex)
}

/** Indices to render in the horizontal track (prev, current, next). */
function getSlideRange(index: number, count: number): number[] {
  if (count <= 0) return []
  if (count === 1) return [0]

  const start = Math.max(0, index - 1)
  const end = Math.min(count - 1, index + 1)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

function preloadImage(url: string) {
  if (!url) return
  const img = new Image()
  img.src = url
}

interface PresenterSlideProps {
  photo: MediaFile
  alt: string
  isActive: boolean
  transform: string
  animateTransform: boolean
  slideWidthPercent: number
  immersive: boolean
}

function PresenterSlide({
  photo,
  alt,
  isActive,
  transform,
  animateTransform,
  slideWidthPercent,
}: PresenterSlideProps) {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const fullSrc = isMobile ? getMediaImageUrl(photo, "medium") : getPresenterFullUrl(photo)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(false)
  }, [fullSrc])

  useEffect(() => {
    if (!fullSrc) return
    const img = new Image()
    img.src = fullSrc
    if (img.complete) {
      setLoaded(true)
      return
    }
    const onLoad = () => setLoaded(true)
    img.addEventListener("load", onLoad)
    return () => img.removeEventListener("load", onLoad)
  }, [fullSrc])

  return (
    <div
      data-presenter-slide
      className="flex h-full shrink-0 items-center justify-center bg-black"
      style={{ width: `${slideWidthPercent}%` }}
    >
      <div
        data-presenter-image
        className={cn(
          "inline-block origin-center",
          animateTransform && "transition-transform duration-200 ease-out",
        )}
        style={{
          transform: isActive ? transform : undefined,
          transformOrigin: "center center",
        }}
        onClick={(event) => event.stopPropagation()}
        onDoubleClick={(event) => event.stopPropagation()}
      >
        {fullSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fullSrc}
            alt={isActive ? alt : ""}
            aria-hidden={!isActive}
            draggable={false}
            onLoad={() => setLoaded(true)}
            className={cn(
              "max-h-[calc(100vh-8rem)] w-auto max-w-full select-none bg-black object-contain transition-opacity duration-500 ease-out",
              loaded ? "opacity-100" : "opacity-0",
            )}
          />
        ) : (
          <p className="text-white/50 text-sm">Image unavailable</p>
        )}
      </div>
    </div>
  )
}

export function PresenterView({
  photos,
  open,
  index,
  onOpenChange,
  onIndexChange,
  bgMusicUrl,
  audioRef: externalAudioRef,
  autoStartSlideshow = false,
  defaultSlideshowSeconds = DEFAULT_SLIDESHOW_SECONDS,
}: PresenterViewProps) {
  const [scale, setScale] = useState(MIN_SCALE)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [trackPercent, setTrackPercent] = useState(0)
  const [transitionEnabled, setTransitionEnabled] = useState(false)
  const [slideshowPlaying, setSlideshowPlaying] = useState(false)
  const [slideshowSpeedIndex, setSlideshowSpeedIndex] = useState(() =>
    getDefaultSpeedIndex(defaultSlideshowSeconds),
  )
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false)
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false)
  const [audioMuted, setAudioMuted] = useState(false)

  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const fullscreenRootRef = useRef<HTMLDivElement>(null)
  const historyPushedRef = useRef(false)
  const indexRef = useRef(0)
  const internalAudioRef = useRef<HTMLAudioElement>(null)
  const audioRef = externalAudioRef ?? internalAudioRef
  const speedMenuRef = useRef<HTMLDivElement>(null)
  const pointerRef = useRef<{
    id: number
    startX: number
    startY: number
    panStartX: number
    panStartY: number
    mode: "swipe" | "pan" | null
  } | null>(null)
  const pinchRef = useRef<{ distance: number; scale: number } | null>(null)
  const suppressNavigateClickRef = useRef(false)

  const photoCount = photos.length
  const safeIndex = photoCount ? clamp(index, 0, photoCount - 1) : 0
  const currentPhoto = photos[safeIndex]
  const caption = currentPhoto?.caption || currentPhoto?.fileName
  const downloadUrl = currentPhoto ? getPresenterDownloadUrl(currentPhoto) : ""
  const slideshowIntervalMs =
    SLIDESHOW_SPEED_OPTIONS[slideshowSpeedIndex]!.seconds * 1000
  const slideshowSpeedLabel =
    SLIDESHOW_SPEED_OPTIONS[slideshowSpeedIndex]!.label

  indexRef.current = safeIndex
  const isImmersive = slideshowPlaying || isBrowserFullscreen
  const slideshowMusicUrl = useMemo(
    () => resolveSlideshowMusicUrl(bgMusicUrl),
    [bgMusicUrl],
  )

  const enterFullscreen = useCallback(async () => {
    const root = fullscreenRootRef.current
    if (!root || document.fullscreenElement) return
    try {
      await root.requestFullscreen()
    } catch {
      // Fullscreen may be blocked until a user gesture; ignore.
    }
  }, [])

  const exitFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) return
    try {
      await document.exitFullscreen()
    } catch {
      // ignore
    }
  }, [])

  const slideRange = useMemo(
    () => getSlideRange(safeIndex, photoCount),
    [safeIndex, photoCount],
  )
  const slideWidthPercent =
    slideRange.length > 0 ? 100 / slideRange.length : 100

  const resetTransform = useCallback(() => {
    setScale(MIN_SCALE)
    setPan({ x: 0, y: 0 })
    setDragOffset(0)
  }, [])

  const syncTrackToIndex = useCallback(
    (targetIndex: number, animate: boolean) => {
      const range = getSlideRange(targetIndex, photoCount)
      const slot = range.indexOf(targetIndex)
      const percent = range.length > 0 ? -(slot / range.length) * 100 : 0

      setTransitionEnabled(animate)
      setTrackPercent(percent)
      setDragOffset(0)
    },
    [photoCount],
  )

  useEffect(() => {
    if (!isAnimating) {
      syncTrackToIndex(safeIndex, false)
    }
  }, [safeIndex, photoCount, isAnimating, syncTrackToIndex])

  const goTo = useCallback(
    (nextIndex: number, animate = true) => {
      if (!photoCount || isAnimating) return
      const clamped = clamp(nextIndex, 0, photoCount - 1)
      if (clamped === safeIndex) return

      if (!animate || scale > MIN_SCALE) {
        resetTransform()
        onIndexChange?.(clamped)
        return
      }

      const currentRange = getSlideRange(safeIndex, photoCount)
      const currentSlot = currentRange.indexOf(safeIndex)
      const direction = clamped > safeIndex ? 1 : -1
      const targetSlot = currentSlot + direction

      if (targetSlot < 0 || targetSlot >= currentRange.length) {
        resetTransform()
        onIndexChange?.(clamped)
        return
      }

      setIsAnimating(true)
      setTransitionEnabled(true)
      setDragOffset(0)
      setTrackPercent(-(targetSlot / currentRange.length) * 100)

      window.setTimeout(() => {
        setTransitionEnabled(false)
        resetTransform()
        onIndexChange?.(clamped)
        setIsAnimating(false)
      }, SLIDE_TRANSITION_MS)
    },
    [
      photoCount,
      isAnimating,
      safeIndex,
      scale,
      resetTransform,
      onIndexChange,
    ],
  )

  const goPrev = useCallback(() => {
    setSlideshowPlaying(false)
    void exitFullscreen()
    goTo(safeIndex - 1)
  }, [goTo, safeIndex, exitFullscreen])

  const goNext = useCallback(() => {
    setSlideshowPlaying(false)
    void exitFullscreen()
    goTo(safeIndex + 1)
  }, [goTo, safeIndex, exitFullscreen])

  const dismissPresenter = useCallback(() => {
    setSlideshowPlaying(false)
    setSpeedMenuOpen(false)
    void exitFullscreen()
    onOpenChange(false)
  }, [exitFullscreen, onOpenChange])

  const close = useCallback(() => {
    if (historyPushedRef.current) {
      history.back()
      return
    }
    dismissPresenter()
  }, [dismissPresenter])

  useEffect(() => {
    if (!open) return

    history.pushState({ [PRESENTER_HISTORY_STATE]: true }, "")
    historyPushedRef.current = true

    const onPopState = () => {
      historyPushedRef.current = false
      dismissPresenter()
    }

    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [open, dismissPresenter])

  const zoomBy = useCallback((delta: number) => {
    setScale((prev) => {
      const next = clamp(prev + delta, MIN_SCALE, MAX_SCALE)
      if (next === MIN_SCALE) setPan({ x: 0, y: 0 })
      return next
    })
  }, [])

  const handleWheel = useCallback(
    (event: React.WheelEvent) => {
      event.preventDefault()
      const delta = event.deltaY < 0 ? 0.25 : -0.25
      zoomBy(delta)
    },
    [zoomBy],
  )

  const handleDoubleClick = useCallback(() => {
    setScale((prev) => {
      if (prev > MIN_SCALE) {
        setPan({ x: 0, y: 0 })
        return MIN_SCALE
      }
      return 2
    })
  }, [])

  useEffect(() => {
    if (!open) {
      setSlideshowPlaying(false)
      setSpeedMenuOpen(false)
      setIsBrowserFullscreen(false)
      setAudioMuted(false)
      audioRef.current?.pause()
      void exitFullscreen()
    }
  }, [open, exitFullscreen])

  useEffect(() => {
    const onFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement)
      setIsBrowserFullscreen(active)
      if (!active) {
        setSlideshowPlaying(false)
      }
    }

    document.addEventListener("fullscreenchange", onFullscreenChange)
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange)
  }, [])

  useEffect(() => {
    if (!open || !autoStartSlideshow || photoCount <= 1) return
    setSlideshowSpeedIndex(getDefaultSpeedIndex(defaultSlideshowSeconds))
    setSlideshowPlaying(true)
    void enterFullscreen()
  }, [
    open,
    autoStartSlideshow,
    photoCount,
    defaultSlideshowSeconds,
    enterFullscreen,
  ])

  useEffect(() => {
    if (!open || !slideshowPlaying || photoCount <= 1) return

    const id = window.setInterval(() => {
      const next = (indexRef.current + 1) % photoCount
      goTo(next, true)
    }, slideshowIntervalMs)

    return () => window.clearInterval(id)
  }, [open, slideshowPlaying, photoCount, goTo, slideshowIntervalMs])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.muted = audioMuted

    if (open && slideshowPlaying && !audioMuted) {
      void audio.play().catch(() => { })
      return
    }

    audio.pause()
  }, [open, slideshowPlaying, audioMuted, slideshowMusicUrl, audioRef])

  useEffect(() => {
    if (!speedMenuOpen) return

    const onPointerDown = (event: MouseEvent) => {
      if (!speedMenuRef.current?.contains(event.target as Node)) {
        setSpeedMenuOpen(false)
      }
    }

    window.addEventListener("pointerdown", onPointerDown)
    return () => window.removeEventListener("pointerdown", onPointerDown)
  }, [speedMenuOpen])

  const toggleSlideshow = useCallback(() => {
    if (photoCount <= 1) return
    setSlideshowPlaying((playing) => {
      const next = !playing
      if (next) {
        void enterFullscreen()
      } else {
        void exitFullscreen()
      }
      return next
    })
  }, [photoCount, enterFullscreen, exitFullscreen])

  const toggleBrowserFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void exitFullscreen()
      return
    }
    void enterFullscreen()
  }, [enterFullscreen, exitFullscreen])

  useEffect(() => {
    if (!open) {
      resetTransform()
      setIsAnimating(false)
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        setSpeedMenuOpen(false)
        if (document.fullscreenElement) {
          void exitFullscreen()
          setSlideshowPlaying(false)
        }
        return
      }
      if (event.key === " " || event.code === "Space") {
        event.preventDefault()
        toggleSlideshow()
        return
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        goPrev()
        return
      }
      if (event.key === "ArrowRight") {
        event.preventDefault()
        goNext()
        return
      }
      if (event.key === "ArrowUp") {
        event.preventDefault()
        zoomBy(0.5)
        return
      }
      if (event.key === "ArrowDown") {
        event.preventDefault()
        zoomBy(-0.5)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [
    open,
    goPrev,
    goNext,
    zoomBy,
    resetTransform,
    exitFullscreen,
    toggleSlideshow,
  ])

  useEffect(() => {
    if (!open) return

    for (const offset of [-1, 1]) {
      const i = safeIndex + offset
      if (i >= 0 && i < photoCount) {
        preloadImage(getPresenterFullUrl(photos[i]!))
      }
    }
  }, [open, safeIndex, photoCount, photos])

  const canGoPrev = safeIndex > 0
  const canGoNext = safeIndex < photoCount - 1

  const finishSwipe = useCallback(
    (deltaX: number) => {
      if (scale > MIN_SCALE || isAnimating) {
        setDragOffset(0)
        return
      }

      if (deltaX <= -SWIPE_THRESHOLD_PX && canGoNext) {
        goNext()
        return
      }
      if (deltaX >= SWIPE_THRESHOLD_PX && canGoPrev) {
        goPrev()
        return
      }

      setTransitionEnabled(true)
      setDragOffset(0)
      syncTrackToIndex(safeIndex, true)
    },
    [scale, isAnimating, canGoNext, canGoPrev, goNext, goPrev, safeIndex, syncTrackToIndex],
  )

  const isPresenterUiTarget = (target: EventTarget | null) => {
    return Boolean(
      target &&
      (target as HTMLElement).closest("[data-presenter-ui]"),
    )
  }

  const onPointerDown = (event: React.PointerEvent) => {
    if (event.button !== 0 || isAnimating) return
    if (isPresenterUiTarget(event.target)) return

    const isOnImage = Boolean(
      (event.target as HTMLElement).closest("[data-presenter-image]"),
    )
    const isPanMode = scale > MIN_SCALE

    if (isPanMode && isOnImage) {
      event.preventDefault()
    }

    suppressNavigateClickRef.current = false
    viewportRef.current?.setPointerCapture(event.pointerId)
    pointerRef.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      panStartX: pan.x,
      panStartY: pan.y,
      mode: isPanMode ? "pan" : "swipe",
    }
    setIsDragging(true)
    setTransitionEnabled(false)
  }

  const onPointerMove = (event: React.PointerEvent) => {
    const pointer = pointerRef.current
    if (!pointer || pointer.id !== event.pointerId) return

    const deltaX = event.clientX - pointer.startX
    const deltaY = event.clientY - pointer.startY

    if (Math.hypot(deltaX, deltaY) > 8) {
      suppressNavigateClickRef.current = true
    }

    if (pointer.mode === "pan" && scale > MIN_SCALE) {
      setPan({
        x: pointer.panStartX + deltaX,
        y: pointer.panStartY + deltaY,
      })
      return
    }

    if (pointer.mode === "swipe" && scale === MIN_SCALE) {
      if (Math.abs(deltaY) > Math.abs(deltaX) * 1.2) {
        pointer.mode = null
        setDragOffset(0)
        return
      }
      const atEdge =
        (!canGoPrev && deltaX > 0) || (!canGoNext && deltaX < 0)
      setDragOffset(atEdge ? deltaX * 0.25 : deltaX)
    }
  }

  const onPointerUp = (event: React.PointerEvent) => {
    const pointer = pointerRef.current
    if (!pointer || pointer.id !== event.pointerId) return

    viewportRef.current?.releasePointerCapture(event.pointerId)
    const deltaX = event.clientX - pointer.startX
    pointerRef.current = null
    setIsDragging(false)

    if (pointer.mode === "swipe") {
      finishSwipe(deltaX)
    }
  }

  const onTouchStart = (event: React.TouchEvent) => {
    if (event.touches.length !== 2) return
    const [a, b] = [event.touches[0]!, event.touches[1]!]
    const distance = Math.hypot(
      b.clientX - a.clientX,
      b.clientY - a.clientY,
    )
    pinchRef.current = { distance, scale }
  }

  const onTouchMove = (event: React.TouchEvent) => {
    if (event.touches.length !== 2 || !pinchRef.current) return
    event.preventDefault()
    const [a, b] = [event.touches[0]!, event.touches[1]!]
    const distance = Math.hypot(
      b.clientX - a.clientX,
      b.clientY - a.clientY,
    )
    const ratio = distance / pinchRef.current.distance
    const nextScale = clamp(pinchRef.current.scale * ratio, MIN_SCALE, MAX_SCALE)
    setScale(nextScale)
    if (nextScale <= MIN_SCALE) setPan({ x: 0, y: 0 })
  }

  const onTouchEnd = () => {
    pinchRef.current = null
    setScale((prev) => {
      if (prev <= MIN_SCALE) {
        setPan({ x: 0, y: 0 })
        return MIN_SCALE
      }
      return prev
    })
  }

  const handleViewportClick = useCallback(
    (event: React.MouseEvent) => {
      if (scale > MIN_SCALE || suppressNavigateClickRef.current) return

      const target = event.target as HTMLElement
      if (
        target.closest("[data-presenter-image]") ||
        target.closest("[data-presenter-ui]")
      ) {
        return
      }

      const rect = viewportRef.current?.getBoundingClientRect()
      if (!rect) return

      const clickX = event.clientX - rect.left
      const midX = rect.width / 2

      if (clickX < midX) {
        if (canGoPrev) goPrev()
        return
      }

      if (canGoNext) goNext()
    },
    [scale, canGoPrev, canGoNext, goPrev, goNext],
  )

  const imageTransform = `translate(${pan.x}px, ${pan.y}px) scale(${scale})`

  if (!photoCount) return null

  return (
    <>
      {!externalAudioRef ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <audio
          ref={internalAudioRef}
          src={slideshowMusicUrl}
          loop
          preload="auto"
          className="sr-only"
          aria-hidden
        />
      ) : null}

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (nextOpen) onOpenChange(true)
        }}
      >
        <DialogPortal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/80 backdrop-blur-md",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            isImmersive && "bg-black",
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-0 z-50 flex flex-col bg-black p-0 outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => {
            event.preventDefault()
            setSpeedMenuOpen(false)
            if (document.fullscreenElement) {
              void exitFullscreen()
              setSlideshowPlaying(false)
            }
          }}
          onPointerDownOutside={(event) => {
            event.preventDefault()
          }}
          onInteractOutside={(event) => {
            event.preventDefault()
          }}
        >
          <DialogPrimitive.Title className="sr-only">
            Photo {safeIndex + 1} of {photoCount}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            {caption ||
              "Gallery photo viewer. Space toggles slideshow. Click black area left or right of the image to change photos. Arrow keys: left/right photos, up/down zoom. Use the close button to exit."}
          </DialogPrimitive.Description>

          <div
            ref={fullscreenRootRef}
            className="flex min-h-0 flex-1 flex-col bg-black"
          >
            <div
              className={cn(
                "relative z-10 shrink-0 overflow-hidden transition-all duration-300 ease-out",
                isImmersive
                  ? "pointer-events-none max-h-0 -translate-y-full opacity-0"
                  : "max-h-24 translate-y-0 opacity-100",
              )}
              data-presenter-ui
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 px-4 py-3 sm:px-6">
                <div className="min-w-0 flex-1 pr-2">
                  {caption ? (
                    <p className="truncate text-sm font-medium text-white/95">
                      {caption}
                    </p>
                  ) : null}
                  <p
                    className={cn(
                      "text-xs text-white/60 tabular-nums",
                      caption && "mt-0.5",
                    )}
                  >
                    {safeIndex + 1} / {photoCount}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    close()
                  }}
                  onPointerDown={(event) => event.stopPropagation()}
                  className={`${toolbarButtonClass} cursor-pointer p-4`}
                  aria-label="Close"
                >
                  <XIcon className="size-8" />
                </button>
              </div>
            </div>

            <div className="relative flex min-h-0 w-full flex-1 flex-col">
              <div
                ref={viewportRef}
                className="relative min-h-0 w-full flex-1 touch-none overflow-hidden bg-black"
                onClick={handleViewportClick}
                onWheel={handleWheel}
                onPointerDownCapture={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onDoubleClick={handleDoubleClick}
                style={{
                  cursor:
                    scale > MIN_SCALE
                      ? isDragging
                        ? "grabbing"
                        : "grab"
                      : "default",
                }}
              >
                {canGoPrev ? (
                  <button
                    type="button"
                    data-presenter-ui
                    onClick={(event) => {
                      event.stopPropagation()
                      goPrev()
                    }}
                    onPointerDown={(event) => event.stopPropagation()}
                    className="cursor-pointer absolute left-3 top-1/2 z-30 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur-md transition-colors hover:bg-white/20 sm:left-5 sm:p-3"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="size-8" />
                  </button>
                ) : null}

                <div
                  ref={trackRef}
                  className={cn(
                    "flex h-full will-change-transform",
                    transitionEnabled &&
                    "transition-transform duration-300 ease-out",
                  )}
                  style={{
                    width: `${slideRange.length * 100}%`,
                    transform: `translateX(calc(${trackPercent}% + ${dragOffset}px))`,
                  }}
                >
                  {slideRange.map((photoIndex) => {
                    const photo = photos[photoIndex]!
                    const isActive = photoIndex === safeIndex
                    return (
                      <PresenterSlide
                        key={getPhotoKey(photo, photoIndex)}
                        photo={photo}
                        alt={
                          photo.caption || photo.fileName || "Gallery photo"
                        }
                        isActive={isActive}
                        transform={imageTransform}
                        animateTransform={
                          isActive && !isDragging && dragOffset === 0
                        }
                        slideWidthPercent={slideWidthPercent}
                        immersive={isImmersive}
                      />
                    )
                  })}
                </div>

                {canGoNext ? (
                  <button
                    type="button"
                    data-presenter-ui
                    onClick={(event) => {
                      event.stopPropagation()
                      goNext()
                    }}
                    onPointerDown={(event) => event.stopPropagation()}
                    className="cursor-pointer absolute right-3 top-1/2 z-30 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur-md transition-colors hover:bg-white/20 sm:right-5 sm:p-3"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="size-8" />
                  </button>
                ) : null}
              </div>

              <div
                data-presenter-ui
                className="relative z-20 flex w-full shrink-0 justify-center border-t border-white/10 bg-black px-2 py-2"
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <div className="flex items-center gap-0.5 rounded-full border border-white/10 bg-black/55 px-1.5 py-1 backdrop-blur-md">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      toggleBrowserFullscreen()
                    }}
                    className={cn(
                      toolbarButtonClass,
                      isBrowserFullscreen && "bg-white/15",
                    )}
                    aria-label={
                      isBrowserFullscreen
                        ? "Exit fullscreen"
                        : "Enter fullscreen"
                    }
                  >
                    {isBrowserFullscreen ? (
                      <Minimize className="size-5" />
                    ) : (
                      <Maximize className="size-5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      zoomBy(-0.5)
                    }}
                    disabled={scale <= MIN_SCALE}
                    className={toolbarButtonClass}
                    aria-label="Zoom out"
                  >
                    <ZoomOut className="size-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      zoomBy(0.5)
                    }}
                    disabled={scale >= MAX_SCALE}
                    className={toolbarButtonClass}
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="size-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      toggleSlideshow()
                    }}
                    disabled={photoCount <= 1}
                    className={cn(
                      "rounded-full cursor-pointer p-4 text-red-500 transition-colors bg-red-500/10 hover:bg-red-500/15 disabled:opacity-40",
                      slideshowPlaying && "bg-red-500/25 shadow-[0_0_12px_rgba(239,68,68,0.35)]",
                    )}
                    aria-label={
                      slideshowPlaying ? "Pause slideshow" : "Play slideshow"
                    }
                  >
                    {slideshowPlaying ? (
                      <Pause className="size-6" />
                    ) : (
                      <Play className="size-6 fill-current" />
                    )}
                  </button>
                  <div ref={speedMenuRef} className="relative">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        setSpeedMenuOpen((open) => !open)
                      }}
                      disabled={photoCount <= 1}
                      className={cn(
                        toolbarButtonClass,
                        speedMenuOpen && "bg-white/15",
                      )}
                      aria-label={`Slideshow speed: ${slideshowSpeedLabel}`}
                      aria-expanded={speedMenuOpen}
                    >
                      <Timer className="size-5" />
                    </button>
                    {speedMenuOpen ? (
                      <div className="absolute bottom-full left-1/2 z-30 mb-2 min-w-[7rem] -translate-x-1/2 rounded-lg border border-white/15 bg-black/90 py-1 shadow-lg backdrop-blur-md">
                        {SLIDESHOW_SPEED_OPTIONS.map((option, optionIndex) => (
                          <button
                            key={option.seconds}
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              setSlideshowSpeedIndex(optionIndex)
                              setSpeedMenuOpen(false)
                            }}
                            className={cn(
                              "flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-xs text-white/90 hover:bg-white/10",
                              optionIndex === slideshowSpeedIndex &&
                              "bg-white/15 font-medium",
                            )}
                          >
                            <span>{option.label}</span>
                            <span className="text-white/50 tabular-nums">
                              {option.seconds}s
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      setAudioMuted((muted) => !muted)
                    }}
                    className={cn(
                      toolbarButtonClass,
                      audioMuted && "bg-white/15",
                    )}
                    aria-label={audioMuted ? "Unmute slideshow music" : "Mute slideshow music"}
                    aria-pressed={audioMuted}
                  >
                    {audioMuted ? (
                      <VolumeX className="size-5" />
                    ) : (
                      <Volume2 className="size-5" />
                    )}
                  </button>
                  {downloadUrl ? (
                    <a
                      href={downloadUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(event) => event.stopPropagation()}
                      aria-label="Open photo in new tab"
                    >
                      <Download className="size-5" />
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </>
  )
}
