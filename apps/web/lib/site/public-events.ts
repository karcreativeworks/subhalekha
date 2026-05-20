import type { EventPublic } from "@/app/types/gallery"

/** Minimal event shape for site navigation dropdowns. */
export type SiteNavEvent = Pick<EventPublic, "id" | "title" | "eventSlug">

export function toSiteNavEvents(events: EventPublic[]): SiteNavEvent[] {
  return events.map(({ id, title, eventSlug }) => ({ id, title, eventSlug }))
}
