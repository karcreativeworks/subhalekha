import type { ObjectId } from "mongodb"

import type { SangeetGang } from "@/app/types/sangeet-performance"
import type { WeddingEventId } from "@/lib/rsvp/wedding-events"

export type WeddingRsvpGang = SangeetGang

export interface WeddingRsvp {
  _id?: ObjectId | string
  guestName: string
  totalAttendees: number
  adultCount: number
  childrenCount: number
  gang: WeddingRsvpGang
  selectedDates: string[]
  eventIds: WeddingEventId[]
  createdAt: Date | string
  updatedAt: Date | string
}

export interface WeddingRsvpPublic {
  id: string
  guestName: string
  totalAttendees: number
  adultCount: number
  childrenCount: number
  gang: WeddingRsvpGang
  selectedDates: string[]
  eventIds: WeddingEventId[]
  createdAt: string
  updatedAt: string
}

export interface CreateWeddingRsvpRequest {
  guestName: string
  totalAttendees: number
  adultCount: number
  childrenCount: number
  gang: WeddingRsvpGang
  selectedDates: string[]
  eventIds: WeddingEventId[]
}

export interface WeddingRsvpListResponse {
  items: WeddingRsvpPublic[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}
