"use client"

import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ChevronDown } from "lucide-react"
import { usePathname } from "next/navigation"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import { SiteGangIcon } from "@/components/site/site-gang-icon"
import { glassPanel } from "@/components/site/glass"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  readSiteGangFromStorage,
  SITE_GANG_LABELS,
  SITE_GANG_SIDES,
  type SiteGangSide,
  writeSiteGangToStorage,
} from "@/lib/site/gang-side"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

gsap.registerPlugin(useGSAP)

const HOME_WELCOME_DELAY_MS = 5000

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function isHomePath(pathname: string): boolean {
  return pathname === "/"
}

interface SiteGangContextValue {
  gang: SiteGangSide | null
  ready: boolean
  setGang: (gang: SiteGangSide) => void
}

const SiteGangContext = createContext<SiteGangContextValue | null>(null)

export function useSiteGang(): SiteGangContextValue {
  const value = useContext(SiteGangContext)
  if (!value) {
    throw new Error("useSiteGang must be used within SiteGangProvider")
  }
  return value
}

function SiteGangChoiceButton({
  side,
  onChoose,
  className,
  variant = "default",
}: {
  side: SiteGangSide
  onChoose: (gang: SiteGangSide) => void
  className?: string
  variant?: "default" | "welcome"
}) {
  if (variant === "welcome") {
    return (
      <button
        type="button"
        data-gang-choice={side}
        className={cn(
          "group relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border px-4 py-7 text-center transition-[border-color,box-shadow,transform] duration-300 ease-out",
          "border-white/20 bg-white/10 backdrop-blur-md",
          "hover:-translate-y-0.5 active:scale-[0.98]",
          side === "bride" &&
          "hover:border-rose-400/50 hover:bg-rose-500/10 hover:shadow-lg hover:shadow-rose-500/15",
          side === "groom" &&
          "hover:border-sky-400/50 hover:bg-sky-500/10 hover:shadow-lg hover:shadow-sky-500/15",
          className,
        )}
        onClick={() => onChoose(side)}
      >
        <span
          className={cn(
            "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
            side === "bride" && "bg-gradient-to-br from-rose-500/15 via-transparent to-transparent",
            side === "groom" && "bg-gradient-to-br from-sky-500/15 via-transparent to-transparent",
          )}
          aria-hidden
        />
        <span
          className={cn(
            "relative flex size-14 items-center justify-center rounded-full border transition-transform duration-300 group-hover:scale-105",
            side === "bride" &&
            "border-rose-300/40 bg-rose-500/10 shadow-inner shadow-rose-500/10",
            side === "groom" &&
            "border-sky-300/40 bg-sky-500/10 shadow-inner shadow-sky-500/10",
          )}
        >
          <SiteGangIcon side={side} size={28} />
        </span>
        <span className="relative text-base font-semibold tracking-tight">
          {SITE_GANG_LABELS[side]}
        </span>
      </button>
    )
  }

  return (
    <Button
      type="button"
      size="lg"
      variant="outline"
      className={cn(
        "h-auto flex-col gap-2 py-6 transition-colors",
        side === "bride" && "hover:border-rose-300/60 hover:bg-rose-50/80 dark:hover:bg-rose-950/30",
        side === "groom" && "hover:border-sky-300/60 hover:bg-sky-50/80 dark:hover:bg-sky-950/30",
        className,
      )}
      onClick={() => onChoose(side)}
    >
      <SiteGangIcon side={side} size={32} />
      <span className="text-base font-semibold">{SITE_GANG_LABELS[side]}</span>
    </Button>
  )
}

function SiteGangWelcomeDialog({
  open,
  onChoose,
}: {
  open: boolean
  onChoose: (gang: SiteGangSide) => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const descRef = useRef<HTMLParagraphElement>(null)
  const choicesRef = useRef<HTMLDivElement>(null)
  const choosingRef = useRef(false)

  useGSAP(
    () => {
      if (!open || !panelRef.current) return

      const panel = panelRef.current
      const title = titleRef.current
      const desc = descRef.current
      const buttons = choicesRef.current?.querySelectorAll("[data-gang-choice]")

      if (prefersReducedMotion()) {
        gsap.set([panel, title, desc, buttons], {
          opacity: 1,
          y: 0,
          scale: 1,
        })
        return
      }

      gsap.set(panel, { opacity: 0, scale: 0.94, y: 24 })
      gsap.set([title, desc], { opacity: 0, y: 14 })
      if (buttons?.length) {
        gsap.set(buttons, { opacity: 0, y: 20, scale: 0.96 })
      }

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } })
      tl.to(panel, { opacity: 1, scale: 1, y: 0, duration: 0.6 })
        .to(title, { opacity: 1, y: 0, duration: 0.45 }, "-=0.32")
        .to(desc, { opacity: 1, y: 0, duration: 0.45 }, "-=0.38")
      if (buttons?.length) {
        tl.to(
          buttons,
          { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.12 },
          "-=0.28",
        )
      }
    },
    { dependencies: [open], scope: panelRef, revertOnUpdate: true },
  )

  const handleChoose = useCallback(
    (side: SiteGangSide) => {
      if (choosingRef.current) return
      choosingRef.current = true

      const panel = panelRef.current
      if (!panel || prefersReducedMotion()) {
        onChoose(side)
        choosingRef.current = false
        return
      }

      gsap.to(panel, {
        opacity: 0,
        scale: 0.96,
        y: -12,
        duration: 0.28,
        ease: "power2.in",
        onComplete: () => {
          onChoose(side)
          choosingRef.current = false
        },
      })
    },
    [onChoose],
  )

  return (
    <Dialog open={open} onOpenChange={() => { }}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/65 backdrop-blur-md data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-500 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-300"
        className="max-w-md border-0 bg-transparent p-0 shadow-none"
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <div
          ref={panelRef}
          className={cn(
            glassPanel(
              "relative overflow-hidden rounded-3xl border-white/25 p-8 shadow-2xl shadow-black/25",
            ),
            "bg-gradient-to-br from-background/95 via-background/90 to-muted/40",
            "dark:border-white/10 dark:from-slate-950/95 dark:via-slate-900/90 dark:to-sky-950/35",
          )}
        >
          <div
            className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full bg-rose-400/25 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-16 size-56 rounded-full bg-sky-400/25 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
            aria-hidden
          />

          <DialogHeader className="relative space-y-1 text-center sm:text-center">
            <p className="text-muted-foreground text-[11px] font-medium tracking-[0.28em] uppercase">
              Subhalekha
            </p>
            <DialogTitle
              ref={titleRef}
              className="bg-gradient-to-r from-rose-600 via-rose-500 to-sky-600 bg-clip-text text-2xl md:text-6xl font-semibold tracking-tight text-transparent dark:from-rose-300 dark:via-rose-200 dark:to-sky-400"
            >
              Welcome
            </DialogTitle>
            <DialogDescription
              ref={descRef}
              className="text-muted-foreground mx-auto max-w-xs text-sm leading-relaxed"
            >
              Which side of the wedding are you on?
            </DialogDescription>
          </DialogHeader>

          <div
            ref={choicesRef}
            className="relative mt-8 grid gap-3 sm:grid-cols-2"
          >
            {SITE_GANG_SIDES.map((side) => (
              <SiteGangChoiceButton
                key={side}
                side={side}
                variant="welcome"
                onChoose={handleChoose}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function SiteGangProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isHome = isHomePath(pathname)
  const [gang, setGangState] = useState<SiteGangSide | null>(null)
  const [ready, setReady] = useState(false)
  const [homeWelcomeReady, setHomeWelcomeReady] = useState(false)

  useEffect(() => {
    setGangState(readSiteGangFromStorage())
    setReady(true)
  }, [])

  useEffect(() => {
    if (!isHome) {
      setHomeWelcomeReady(false)
      return
    }

    if (!ready || gang !== null) {
      setHomeWelcomeReady(false)
      return
    }

    setHomeWelcomeReady(false)
    const id = window.setTimeout(
      () => setHomeWelcomeReady(true),
      HOME_WELCOME_DELAY_MS,
    )
    return () => window.clearTimeout(id)
  }, [isHome, ready, gang, pathname])

  const setGang = useCallback((next: SiteGangSide) => {
    setGangState(next)
    writeSiteGangToStorage(next)
  }, [])

  const value = useMemo(
    () => ({ gang, ready, setGang }),
    [gang, ready, setGang],
  )

  const needsGangChoice = ready && gang === null
  const showWelcome = needsGangChoice && (!isHome || homeWelcomeReady)

  return (
    <SiteGangContext.Provider value={value}>
      {children}
      <SiteGangWelcomeDialog open={showWelcome} onChoose={setGang} />
    </SiteGangContext.Provider>
  )
}

/** Nav control with icons for bride / groom. */
export function SiteGangSelect({ className }: { className?: string }) {
  const { gang, ready, setGang } = useSiteGang()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const current: SiteGangSide = gang ?? "bride"

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [open])

  if (!ready) {
    return (
      <span
        className={cn(
          "inline-block h-9 min-w-[9.5rem] rounded-full bg-white/10",
          className,
        )}
        aria-hidden
      />
    )
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Wedding side: ${SITE_GANG_LABELS[current]}`}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex h-9 min-w-[9.5rem] items-center gap-2 rounded-full border border-white/30 bg-white/15 py-2 pr-8 pl-3 text-xs font-medium tracking-wide backdrop-blur-sm",
          "hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <SiteGangIcon side={current} size={16} />
        <span className="truncate">{SITE_GANG_LABELS[current]}</span>
        <ChevronDown
          className={cn(
            "pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 opacity-60 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label="Choose wedding side"
          className={cn(
            glassPanel(
              "absolute top-full right-0 z-50 mt-2 min-w-full overflow-hidden rounded-xl border-white/25 p-1 shadow-xl bg-white dark:bg-black/50 backdrop-blur-sm",
            ),
          )}
        >
          {SITE_GANG_SIDES.map((side) => {
            const selected = side === current
            return (
              <li key={side} role="option" aria-selected={selected}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors",
                    selected
                      ? "bg-white/25 text-foreground"
                      : "text-foreground/90 hover:bg-white/15",
                  )}
                  onClick={() => {
                    setGang(side)
                    setOpen(false)
                  }}
                >
                  <SiteGangIcon side={side} size={16} />
                  <span>{SITE_GANG_LABELS[side]}</span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
