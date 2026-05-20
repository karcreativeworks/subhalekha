"use client"

import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import dynamic from "next/dynamic"
import { useEffect, useRef, useState } from "react"

import {
  LANDING_ASSETS,
  LANDING_WORDS,
  PARALLAX_DEPTH,
  SPARROW_OFFSCREEN_PAD,
  SPARROW_SLOTS,
} from "@/components/site/landing/landing-assets"
import { cn } from "@workspace/ui/lib/utils"

gsap.registerPlugin(useGSAP)

const LandingThreeCanvas = dynamic(
  () =>
    import("@/components/site/landing/landing-three-canvas").then(
      (m) => m.LandingThreeCanvas,
    ),
  { ssr: false },
)

type ParallaxLayerKey = keyof typeof PARALLAX_DEPTH

interface LandingParallaxSceneProps {
  className?: string
  onIntroComplete?: () => void
}

export function LandingParallaxScene({
  className,
  onIntroComplete,
}: LandingParallaxSceneProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const layerRefs = useRef<Partial<Record<ParallaxLayerKey, HTMLDivElement>>>({})
  const fgTrackRef = useRef<HTMLDivElement>(null)
  const wordLeftRef = useRef<HTMLSpanElement>(null)
  const wordRightGroupRef = useRef<HTMLDivElement>(null)
  const woodpeckerRef = useRef<HTMLDivElement>(null)
  const flagRef = useRef<HTMLDivElement>(null)
  const sparrowRefs = useRef<(HTMLDivElement | null)[]>([])
  const onIntroCompleteRef = useRef(onIntroComplete)

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    onIntroCompleteRef.current = onIntroComplete
  }, [onIntroComplete])

  const setLayerRef =
    (key: ParallaxLayerKey) => (node: HTMLDivElement | null) => {
      if (node) layerRefs.current[key] = node
    }

  useGSAP(
    (_, contextSafe) => {
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches

      const layers = layerRefs.current
      const layerKeys = Object.keys(PARALLAX_DEPTH) as ParallaxLayerKey[]
      const sparrows = sparrowRefs.current.filter(Boolean) as HTMLDivElement[]
      const fgTrack = fgTrackRef.current
      let fgScrollReady = false

      const queueFgScroll = () => {
        if (!fgTrack || fgScrollReady || reducedMotion) return

        const imgs = fgTrack.querySelectorAll("img")
        const loaded = Array.from(imgs).every(
          (img) =>
            (img as HTMLImageElement).complete &&
            (img as HTMLImageElement).naturalWidth > 0,
        )
        if (!loaded) return

        fgScrollReady = true
        fgTrack.classList.add("fg-scroll-track--active")
      }

      fgTrack?.querySelectorAll("img").forEach((img) => {
        const el = img as HTMLImageElement
        el.addEventListener("load", queueFgScroll)
        if (el.complete) queueFgScroll()
      })

      const intro = gsap.timeline({
        defaults: { ease: "power2.out" },
        onComplete: () => onIntroCompleteRef.current?.(),
      })

      gsap.set(rootRef.current, { opacity: 1 })
      gsap.set(
        [
          layers.bg,
          layers.drift,
          layers.fog,
          layers.logo,
          layers.sparrows,
          layers.fg,
          wordLeftRef.current,
          wordRightGroupRef.current,
          woodpeckerRef.current,
          flagRef.current,
        ],
        { opacity: 0 },
      )

      intro
        .to(layers.bg!, { opacity: 1, duration: 1.4 }, 0)
        .to(layers.drift!, { opacity: 0.85, duration: 1.2 }, 0.25)
        .to(layers.fog!, { opacity: 0.7, duration: 1.1 }, 0.55)
        .fromTo(
          layers.logo!,
          { opacity: 0, scale: 0.92 },
          { opacity: 1, scale: 1, duration: 1.6 },
          0.75,
        )
        .fromTo(
          wordLeftRef.current,
          { opacity: 0, filter: "blur(12px)", x: 16 },
          { opacity: 1, filter: "blur(0px)", x: 0, duration: 2.2, ease: "sine.out" },
          1.1,
        )
        .fromTo(
          wordRightGroupRef.current,
          { opacity: 0, filter: "blur(12px)", x: -20 },
          { opacity: 1, filter: "blur(0px)", x: 0, duration: 2.2, ease: "sine.out" },
          1.1,
        )
        .fromTo(
          [woodpeckerRef.current, flagRef.current],
          { opacity: 0, y: 14, filter: "blur(8px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 1,
            stagger: 0.25,
            ease: "sine.out",
          },
          1.35,
        )
        .to(layers.sparrows!, { opacity: 1, duration: 0.9 }, 1.35)
        .to(layers.fg!, { opacity: 1, duration: 1.3, onComplete: queueFgScroll }, 1.55)

      if (!reducedMotion) {
        gsap.to(layers.drift!, {
          x: "+=36",
          duration: 28,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        })

        gsap.to(layers.fog!, {
          x: "-=24",
          duration: 22,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        })

        sparrows.forEach((el, i) => {
          const slot = SPARROW_SLOTS[i]
          if (!slot) return

          gsap.set(el, { scaleX: -1 })

          gsap.fromTo(
            el,
            {
              x: () =>
                window.innerWidth +
                SPARROW_OFFSCREEN_PAD +
                gsap.utils.random(0, 80),
            },
            {
              x: () => -(SPARROW_OFFSCREEN_PAD + el.offsetWidth),
              duration: slot.duration,
              delay: slot.delay,
              repeat: -1,
              repeatDelay: slot.gap,
              repeatRefresh: true,
              ease: "none",
            },
          )
        })

        const handleMove = (event: PointerEvent) => {
          const cx = window.innerWidth / 2
          const cy = window.innerHeight / 2
          const nx = (event.clientX - cx) / cx
          const ny = (event.clientY - cy) / cy

          layerKeys.forEach((key) => {
            const el = layers[key]
            if (!el) return
            const depth = PARALLAX_DEPTH[key]
            gsap.to(el, {
              x: nx * depth.x,
              y: ny * depth.y,
              duration: 1.1,
              ease: "power2.out",
              overwrite: "auto",
            })
          })
        }

        const onMove =
          typeof contextSafe === "function"
            ? contextSafe(handleMove)
            : handleMove

        window.addEventListener("pointermove", onMove)

        return () => {
          window.removeEventListener("pointermove", onMove)
        }
      } else {
        gsap.set(
          [
            layers.bg,
            layers.drift,
            layers.fog,
            layers.logo,
            layers.sparrows,
            layers.fg,
            wordLeftRef.current,
            wordRightGroupRef.current,
            woodpeckerRef.current,
            flagRef.current,
          ],
          { opacity: 1 },
        )
        queueFgScroll()
        intro.progress(1)
      }
    },
    { scope: rootRef },
  )

  return (
    <div
      ref={rootRef}
      className={cn(
        "pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-0",
        className,
      )}
      aria-hidden
    >
      <div className="absolute inset-0 bg-gradient-to-b from-sky-200/90 via-sky-100/70 to-amber-50/80 dark:from-sky-950 dark:via-slate-950 dark:to-rose-950/60" />

      {mounted ? (
        <div className="absolute inset-0">
          <LandingThreeCanvas />
        </div>
      ) : null}

      <ParallaxLayer
        layerRef={setLayerRef("bg")}
        src={LANDING_ASSETS.bg}
        className="scale-110 object-cover opacity-0"
        imgClassName="scale-105"
      />

      <ParallaxLayer
        layerRef={setLayerRef("drift")}
        src={LANDING_ASSETS.driftBg}
        className="scale-110 object-cover opacity-0 mix-blend-soft-light"
        imgClassName="scale-110"
      />

      <div
        ref={setLayerRef("sparrows")}
        className="absolute inset-x-0 top-0 bottom-1/2 z-[20] opacity-0 will-change-transform"
      >
        {SPARROW_SLOTS.map((slot, i) => (
          <div
            key={`sparrow-${i}`}
            ref={(node) => {
              sparrowRefs.current[i] = node
            }}
            className="absolute left-0 will-change-transform"
            style={{ top: slot.top }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LANDING_ASSETS.sparrow}
              alt=""
              className="bird-cutout h-14 w-auto sm:h-16 md:h-[4.5rem]"
              draggable={false}
            />
          </div>
        ))}
      </div>

      <div
        ref={woodpeckerRef}
        className="bird-cutout absolute bottom-[25%] right-[10%] mb-1 opacity-0 sm:mb-2 hidden md:block"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LANDING_ASSETS.woodpecker}
          alt=""
          className="h-12 w-auto sm:h-14 md:h-[200px]"
          draggable={false}
        />
      </div>

      <div
        ref={flagRef}
        className="bird-cutout absolute bottom-[55%] left-[20%] mb-1 opacity-0 sm:mb-2 hidden md:block"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LANDING_ASSETS.flag}
          alt=""
          className="h-12 w-auto sm:h-14 md:h-[60px]"
          draggable={false}
        />
      </div>

      <ParallaxLayer
        layerRef={setLayerRef("fog")}
        src={LANDING_ASSETS.fog}
        className="z-[10] scale-125 object-cover opacity-0 mix-blend-screen"
        imgClassName="scale-110 opacity-80"
      />

      <div
        ref={setLayerRef("fg")}
        className="fg-scroll-layer absolute inset-[-8%] z-[30] scale-110 overflow-hidden opacity-0 will-change-transform"
      >
        <div
          ref={fgTrackRef}
          className="fg-scroll-track will-change-transform"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LANDING_ASSETS.fg}
            alt=""
            className="fg-scroll-tile mix-blend-screen"
            draggable={false}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LANDING_ASSETS.fg}
            alt=""
            aria-hidden
            className="fg-scroll-tile mix-blend-screen"
            draggable={false}
          />
        </div>
      </div>

      <div
        ref={setLayerRef("logo")}
        className="absolute inset-0 z-[40] flex items-center justify-center opacity-0 will-change-transform"
      >
        <div className="flex items-center gap-3 sm:gap-6 md:gap-10">
          <span
            ref={wordLeftRef}
            className="text-foreground/90 shrink-0 text-3xl font-medium tracking-[0.25em] uppercase sm:text-2xl md:text-6xl lg:text-[8rem]"
          >
            {LANDING_WORDS.left}
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LANDING_ASSETS.logo}
            alt=""
            className="h-auto w-[min(52vw,340px)] max-w-none shrink-0 drop-shadow-[0_8px_32px_rgba(255,255,255,0.35)] sm:w-[min(58vw,380px)]"
            draggable={false}
          />
          <div
            ref={wordRightGroupRef}
            className="relative shrink-0"
          >
            <span className="text-foreground/90 block text-3xl font-medium tracking-[0.25em] uppercase sm:text-2xl md:text-6xl lg:text-[8rem]">
              {LANDING_WORDS.right}
            </span>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-[50] h-40 bg-gradient-to-t from-background/80 via-background/30 to-transparent" />
    </div>
  )
}

const ParallaxLayer = ({
  layerRef,
  src,
  className,
  imgClassName,
}: {
  layerRef: (node: HTMLDivElement | null) => void
  src: string
  className?: string
  imgClassName?: string
}) => (
  <div
    ref={layerRef}
    className={cn(
      "absolute inset-[-8%] will-change-transform",
      className,
    )}
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={src}
      alt=""
      className={cn("h-full w-full object-cover", imgClassName)}
      draggable={false}
    />
  </div>
)
