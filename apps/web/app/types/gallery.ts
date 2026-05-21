import type { ObjectId } from "mongodb"

export const TEAM_VALUES = ["bride", "groom", "both"] as const
export type Team = (typeof TEAM_VALUES)[number]

export const EVENT_BLOCK_TYPES = ["gallery", "video"] as const
export type EventBlockType = (typeof EVENT_BLOCK_TYPES)[number]

/** Manual sort entry for content blocks on an event (gallery + video). */
export interface EventBlockRef {
  blockId: string
  blockOrder: number
  /** Defaults to gallery when omitted (legacy events). */
  blockType?: EventBlockType
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
  /** When false, hidden from the public guest site (admin still lists the event). */
  isVisible?: boolean
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
  isVisible?: boolean
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
  isVisible?: boolean
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

export interface VideoBlock {
  _id?: ObjectId | string
  clientId: string
  parentEventId: string
  title: string
  videoBlockSlug: string
  videoUrl: string
  subtitle?: string
  description?: string
  createdAt: Date | string
  updatedAt: Date | string
}

export type VideoBlockPublic = Omit<VideoBlock, "_id"> & {
  id: string
  /** Resolved preview image (YouTube thumbnail when applicable). */
  thumbnailUrl: string | null
}

export interface CreateVideoBlockRequest {
  parentEventId: string
  title: string
  videoBlockSlug: string
  videoUrl: string
  subtitle?: string
  description?: string
}

export interface UpdateVideoBlockRequest {
  parentEventId?: string
  title?: string
  videoBlockSlug?: string
  videoUrl?: string
  subtitle?: string
  description?: string
}

/** Unified public grid card for event landing. */
export type EventContentGridItem =
  | {
      kind: "gallery"
      id: string
      title: string
      href: string
      imageUrl: string
      hasSlideshow: boolean
    }
  | {
      kind: "video"
      id: string
      title: string
      href: string
      imageUrl: string | null
    }
