"use client"

import { ChevronDown } from "lucide-react"
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
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import {
  readSiteGangFromStorage,
  SITE_GANG_LABELS,
  SITE_GANG_SIDES,
  type SiteGangSide,
  writeSiteGangToStorage,
} from "@/lib/site/gang-side"

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
}: {
  side: SiteGangSide
  onChoose: (gang: SiteGangSide) => void
  className?: string
}) {
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
  return (
    <Dialog open={open} onOpenChange={() => { }}>
      <DialogContent
        className="max-w-md [&>button]:hidden"
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Welcome</DialogTitle>
          <DialogDescription>
            Which side of the wedding are you on? We&apos;ll remember your choice
            for this browser.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {SITE_GANG_SIDES.map((side) => (
            <SiteGangChoiceButton key={side} side={side} onChoose={onChoose} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function SiteGangProvider({ children }: { children: ReactNode }) {
  const [gang, setGangState] = useState<SiteGangSide | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setGangState(readSiteGangFromStorage())
    setReady(true)
  }, [])

  const setGang = useCallback((next: SiteGangSide) => {
    setGangState(next)
    writeSiteGangToStorage(next)
  }, [])

  const value = useMemo(
    () => ({ gang, ready, setGang }),
    [gang, ready, setGang],
  )

  const showWelcome = ready && gang === null

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
