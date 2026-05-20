import Link from "next/link"

import { PageHeader } from "@/components/site/page-header"
import { glassPanel } from "@/components/site/glass"
import { getPublicEventsList } from "@/lib/gallery/public-event"
import { getDaysUntilCountdown } from "@/lib/site/countdown"
import { cn } from "@workspace/ui/lib/utils"

export default async function SiteHomePage() {
  const events = await getPublicEventsList()
  const days = getDaysUntilCountdown()

  return (
    <>
      <PageHeader
        title="Subhalekha"
        subtitle="Celebrations & memories"
        description="Welcome. Browse events, galleries, and guides — more sections are on the way."
      />

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
            Events
          </h2>
          {events.length === 0 ? (
            <p className="text-muted-foreground mt-2 text-sm">No events yet.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {events.map((event) => (
                <li key={event.id}>
                  <Link
                    href={`/${event.eventSlug}`}
                    className="text-sm font-medium underline-offset-4 hover:underline"
                  >
                    {event.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
