import type { WeddingRsvp, WeddingRsvpPublic } from "@/app/types/wedding-rsvp"

export function toWeddingRsvpPublic(doc: WeddingRsvp): WeddingRsvpPublic {
  const id =
    typeof doc._id === "string"
      ? doc._id
      : doc._id?.toString?.() ?? String(doc._id)

  return {
    id,
    guestName: doc.guestName,
    totalAttendees: doc.totalAttendees,
    adultCount: doc.adultCount,
    childrenCount: doc.childrenCount,
    gang: doc.gang,
    selectedDates: doc.selectedDates,
    eventIds: doc.eventIds,
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : String(doc.createdAt),
    updatedAt:
      doc.updatedAt instanceof Date
        ? doc.updatedAt.toISOString()
        : String(doc.updatedAt),
  }
}
