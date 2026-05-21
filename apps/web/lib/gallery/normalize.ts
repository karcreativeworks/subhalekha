import type { ObjectId } from "mongodb"

import type {
  Event,
  EventPublic,
  GalleryBlock,
  GalleryBlockPublic,
  VideoBlock,
  VideoBlockPublic,
} from "@/app/types/gallery"
import { getVideoThumbnailUrl } from "@/lib/media/video-url"
import { normalizeEventBlockRefs } from "@/lib/gallery/event-block-order"

function serializeDate(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString()
  }
  return value
}

function toId(value: ObjectId | string | undefined): string {
  if (!value) return ""
  return typeof value === "string" ? value : value.toString()
}

export function toEventPublic(doc: Event): EventPublic {
  const { _id, coverPicHorizontal, coverPicVertical, isVisible, ...rest } = doc
  return {
    ...rest,
    id: toId(_id),
    blocks: normalizeEventBlockRefs(rest.blocks),
    coverPicHorizontal: coverPicHorizontal?.trim() ?? "",
    coverPicVertical: coverPicVertical?.trim() ?? "",
    isVisible: isVisible !== false,
    eventDate: serializeDate(rest.eventDate),
    createdAt: serializeDate(rest.createdAt),
    updatedAt: serializeDate(rest.updatedAt),
  }
}

export function toGalleryBlockPublic(doc: GalleryBlock): GalleryBlockPublic {
  const { _id, coverPic, ...rest } = doc
  const legacyCover = coverPic ?? ""
  return {
    ...rest,
    id: toId(_id),
    coverPicHorizontal: rest.coverPicHorizontal ?? legacyCover,
    coverPicVertical: rest.coverPicVertical ?? legacyCover,
    captureDate: serializeDate(rest.captureDate),
    createdAt: serializeDate(rest.createdAt),
    updatedAt: serializeDate(rest.updatedAt),
  }
}

export function toVideoBlockPublic(doc: VideoBlock): VideoBlockPublic {
  const { _id, ...rest } = doc
  return {
    ...rest,
    id: toId(_id),
    thumbnailUrl: getVideoThumbnailUrl(rest.videoUrl),
    createdAt: serializeDate(rest.createdAt),
    updatedAt: serializeDate(rest.updatedAt),
  }
}
