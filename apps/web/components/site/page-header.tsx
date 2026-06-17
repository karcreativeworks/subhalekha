import Link from "next/link"

import { glassPanel } from "@/components/site/glass"
import { cn } from "@workspace/ui/lib/utils"

import "./page-header.css"

/** Shine loop duration for the hero panel (single card). */
const HERO_SHINE_CYCLE_S = 2.8

interface PageHeaderProps {
  title: string
  subtitle?: string
  description?: string
  backHref?: string
  backLabel?: string
  className?: string
  bgImageUrl?: string
}

function HeroShineOverlay() {
  return (
    <div
      className="page-header-hero-shine pointer-events-none absolute inset-0 z-[2] overflow-hidden"
      aria-hidden
    >
      <div
        className="gallery-card-shine-beam"
        style={{ animationDuration: `${HERO_SHINE_CYCLE_S}s` }}
      />
    </div>
  )
}

function HeroTitleBlock({
  title,
  subtitle,
  variant,
}: {
  title: string
  subtitle?: string
  variant: "mobile" | "desktop"
}) {
  const isMobile = variant === "mobile"

  return (
    <div
      className={cn(
        isMobile && "mb-4 sm:hidden",
        !isMobile &&
        "relative z-10 hidden h-full min-h-[180px] flex-col items-end justify-end p-6 pl-8 text-right sm:flex sm:min-h-0",
      )}
    >
      {subtitle ? (
        <p
          className={cn(
            "page-header-hero-subtitle text-sm font-medium tracking-wide uppercase",
            isMobile ? "text-muted-foreground" : "text-white/85",
          )}
        >
          {subtitle}
        </p>
      ) : null}
      <h1
        className={cn(
          "page-header-hero-title mt-1 max-w-full font-medium tracking-tight",
          isMobile
            ? "text-2xl text-foreground"
            : "text-white transition-transform duration-500 ease-out group-hover:-translate-y-0.5 sm:text-4xl lg:text-5xl",
        )}
      >
        {title}
      </h1>
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  description,
  backHref,
  backLabel = "Back",
  className,
  bgImageUrl,
}: PageHeaderProps) {
  if (!bgImageUrl) {
    return (
      <header className={cn(glassPanel("mb-8 rounded-2xl p-6 sm:p-8"), className)}>
        {backHref ? (
          <Link
            href={backHref}
            className="text-muted-foreground hover:text-foreground mb-4 inline-flex text-sm transition-colors"
          >
            ← {backLabel}
          </Link>
        ) : null}
        {subtitle ? (
          <p className="text-muted-foreground text-sm tracking-wide uppercase">
            {subtitle}
          </p>
        ) : null}
        <h1 className="mt-1 text-2xl font-medium tracking-tight sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="text-muted-foreground mt-3 max-w-2xl text-sm break-words whitespace-pre-line sm:text-base">
            {description}
          </p>
        ) : null}
      </header>
    )
  }

  return (
    <header
      className={cn(
        "mb-8 overflow-hidden rounded-2xl",
        glassPanel("border-white/20 p-0"),
        "sm:min-h-[350px]",
        className,
      )}
    >
      <div className="flex min-h-[inherit] flex-col sm:flex-row sm:items-stretch">
        <div className="flex min-h-0 flex-1 flex-col p-6 sm:justify-start sm:p-8">
          {backHref ? (
            <Link
              href={backHref}
              className="text-muted-foreground hover:text-foreground mb-4 inline-flex text-sm transition-colors sm:mb-0"
            >
              ← {backLabel}
            </Link>
          ) : null}

          <HeroTitleBlock title={title} subtitle={subtitle} variant="mobile" />

          {description ? (
            <p className="text-muted-foreground mb-4 max-w-2xl text-sm md:text-2xl break-words whitespace-pre-line sm:mb-0 sm:mt-8 sm:text-base">
              {description}
            </p>
          ) : null}
        </div>

        <div className="group relative hidden w-full shrink-0 self-stretch overflow-hidden sm:block sm:w-[min(70%,840px)]">
          <img
            src={bgImageUrl}
            alt=""
            className={cn(
              "page-header-hero-media absolute inset-0 size-full object-cover object-center",
              "transition-transform duration-700 ease-out",
              "group-hover:scale-[1.03]",
            )}
          />
          <HeroShineOverlay />
          <div
            className={cn(
              "page-header-hero-gradient absolute inset-0 z-[3] hidden sm:block",
              "bg-gradient-to-t from-black/90 via-black/10 to-transparent",
            )}
            aria-hidden
          />
          <HeroTitleBlock title={title} subtitle={subtitle} variant="desktop" />
        </div>
      </div>
    </header>
  )
}
