import { useMediaQuery } from "@/hooks/use-media-query"
import { getCloudflareImageUrl } from "@/lib/media/cloudflare-image"
import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"
import { forwardRef } from "react"
import { glassPanel } from "../glass"

export interface LandingEvent {
    id: string
    title: string
    eventSlug: string
    subtitle?: string
    coverPicHorizontal: string
    coverPicVertical: string
}

export interface LandingBlocksSectionsProps {
    days: number
    events: LandingEvent[]
    immediateVisible?: boolean
}

export const LandingBlocksSections = forwardRef<HTMLDivElement, LandingBlocksSectionsProps>(({
    days,
    events,
    immediateVisible = false,
}, ref) => {
    return (
        <div
            className={cn(
                "relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-16 sm:px-6 bg-background/90 min-h-[800px] backdrop-blur-sm rounded-2xl",
                immediateVisible ? "opacity-100" : "opacity-0",
            )}
            ref={ref}
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
                        Current Status &amp; Updates
                    </h2>
                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                        Invites out for distribution, Wedding Shopping in progress, Sangeet plans in motion.
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
    )
})


function LandingEventCard({
    event,
    index,
}: {
    event: LandingEvent
    index: number
}) {
    const isVertical = index % 2 === 0
    const isMobile = useMediaQuery("(max-width: 640px)")
    const coverSrc = getCloudflareImageUrl(
        isMobile ? event.coverPicHorizontal :
            isVertical ? event.coverPicVertical : event.coverPicHorizontal,
        "large",
    )

    return (
        <Link
            href={`/${event.eventSlug}`}
            className={cn(
                "group relative overflow-hidden rounded-xl col-span-2 h-[200px]",
                isVertical
                    ? "md:col-span-1 sm:h-[350px]"
                    : "md:col-span-2 sm:h-[350px]",
            )}
        >
            <div className="relative h-full w-full bg-black/20">
                {coverSrc ? (
                    <img
                        src={coverSrc}
                        alt={event.title}
                        className={cn(
                            "object-cover transition-all duration-500 ease-out",
                            isVertical ? "h-full w-full" : "h-full w-full",
                            "opacity-85 group-hover:scale-[1.02] group-hover:opacity-100",
                        )}
                    />
                ) : (
                    <div className="bg-muted h-full w-full" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute right-0 bottom-0 left-0 p-2.5 md:p-3">
                    <h3 className="text-xl md:text-3xl font-semibold tracking-tight text-white">
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
