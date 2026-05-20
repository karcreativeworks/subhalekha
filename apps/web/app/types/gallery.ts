import type { ObjectId } from "mongodb"

export const TEAM_VALUES = ["bride", "groom", "both"] as const
export type Team = (typeof TEAM_VALUES)[number]

/** Manual sort entry for gallery blocks on an event. */
export interface EventBlockRef {
  blockId: string
  blockOrder: number
}

export interface Event {
  _id?: ObjectId | string
  clientId: string
  title: string
  eventSlug: string
  /** Horizontal hero / Open Graph image (same role as gallery block horizontal cover). */
  coverPicHorizontal?: string
  /** Vertical cover for future layouts / parity with gallery blocks. */
  coverPicVertical?: string
  subtitle?: string
  description?: string
  tags: string[]
  team: Team
  eventDate: Date | string
  eventTime: string
  /** Ordered gallery blocks for this event (blockId + blockOrder). */
  blocks: EventBlockRef[]
  createdAt: Date | string
  updatedAt: Date | string
}

export interface GalleryBlock {
  _id?: ObjectId | string
  clientId: string
  parentEventId: string
  coverPicHorizontal: string
  coverPicVertical: string
  /** Legacy single cover; migrated reads use horizontal/vertical. */
  coverPic?: string
  title: string
  galleryBlockSlug: string
  subtitle?: string
  description?: string
  tags: string[]
  team: Team
  captureDate: Date | string
  /** Optional background music URL for public slideshow mode. */
  bgMusic?: string
  createdAt: Date | string
  updatedAt: Date | string
}

export type EventPublic = Omit<
  Event,
  "_id" | "coverPicHorizontal" | "coverPicVertical"
> & {
  id: string
  coverPicHorizontal: string
  coverPicVertical: string
}
export type GalleryBlockPublic = Omit<GalleryBlock, "_id"> & { id: string }

/** Public block with image count for gallery index cards (same tagging rules as media fetch). */
export type GalleryBlockPublicWithPicCount = GalleryBlockPublic & {
  picCount: number
}

export interface CreateEventRequest {
  title: string
  eventSlug: string
  coverPicHorizontal?: string
  coverPicVertical?: string
  subtitle?: string
  description?: string
  tags?: string[]
  team: Team
  eventDate: string
  eventTime: string
}

export interface UpdateEventRequest {
  title?: string
  eventSlug?: string
  coverPicHorizontal?: string
  coverPicVertical?: string
  subtitle?: string
  description?: string
  tags?: string[]
  team?: Team
  eventDate?: string
  eventTime?: string
}

export interface UpdateEventBlocksRequest {
  blocks: EventBlockRef[]
}

export interface CreateGalleryBlockRequest {
  parentEventId: string
  coverPicHorizontal: string
  coverPicVertical: string
  title: string
  galleryBlockSlug: string
  subtitle?: string
  description?: string
  tags?: string[]
  team: Team
  captureDate: string
  bgMusic?: string
}

export interface UpdateGalleryBlockRequest {
  parentEventId?: string
  coverPicHorizontal?: string
  coverPicVertical?: string
  title?: string
  galleryBlockSlug?: string
  subtitle?: string
  description?: string
  tags?: string[]
  team?: Team
  captureDate?: string
  bgMusic?: string
}
