import type { CreateWeddingRsvpRequest } from "@/app/types/wedding-rsvp"
import { SANGEET_GANGS } from "@/app/types/sangeet-performance"
import {
  eventIdsForSelectedDates,
  isWeddingDateKey,
  isWeddingEventId,
} from "@/lib/rsvp/wedding-events"

function isGang(value: string): value is CreateWeddingRsvpRequest["gang"] {
  return (SANGEET_GANGS as readonly string[]).includes(value)
}

export function parseWeddingRsvpBody(
  body: unknown,
): { ok: true; data: CreateWeddingRsvpRequest } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body" }
  }

  const raw = body as Record<string, unknown>
  const guestName = typeof raw.guestName === "string" ? raw.guestName.trim() : ""
  const adultCount = Number(raw.adultCount)
  const childrenCount = Number(raw.childrenCount)
  const totalAttendees = adultCount + childrenCount
  const gang = typeof raw.gang === "string" ? raw.gang : ""

  const selectedDates = Array.isArray(raw.selectedDates)
    ? raw.selectedDates
        .filter((value): value is string => typeof value === "string")
        .filter(isWeddingDateKey)
    : []

  const uniqueDates = [...new Set(selectedDates)]

  if (!guestName) {
    return { ok: false, error: "Guest name is required" }
  }
  if (!Number.isInteger(totalAttendees) || totalAttendees < 1) {
    return { ok: false, error: "Total attendees must be at least 1" }
  }
  if (!Number.isInteger(adultCount) || adultCount < 0) {
    return { ok: false, error: "Adult count must be 0 or more" }
  }
  if (!Number.isInteger(childrenCount) || childrenCount < 0) {
    return { ok: false, error: "Children count must be 0 or more" }
  }
  if (!isGang(gang)) {
    return { ok: false, error: "Invalid team selection" }
  }
  if (uniqueDates.length === 0) {
    return { ok: false, error: "Select at least one date" }
  }

  const eventIdsFromDates = eventIdsForSelectedDates(uniqueDates)

  const eventIds = Array.isArray(raw.eventIds)
    ? raw.eventIds
        .filter((value): value is string => typeof value === "string")
        .filter(isWeddingEventId)
    : eventIdsFromDates

  const uniqueEventIds = [...new Set(eventIds)]

  for (const id of uniqueEventIds) {
    if (!eventIdsFromDates.includes(id)) {
      return { ok: false, error: "Invalid event selection for chosen dates" }
    }
  }

  return {
    ok: true,
    data: {
      guestName,
      totalAttendees,
      adultCount,
      childrenCount,
      gang,
      selectedDates: uniqueDates,
      eventIds: uniqueEventIds,
    },
  }
}
