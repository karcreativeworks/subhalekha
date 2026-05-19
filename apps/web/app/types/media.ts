import type { ObjectId } from "mongodb"

export interface Tag {
  _id?: ObjectId
  id: string
  displayName: string
  clientId?: string
  createdAt: Date
  updatedAt: Date
}

export type ImageVariantKey = "thumbnail" | "medium" | "large" | "original"

/** One Cloudflare /cdn-cgi/image variant (options + resolvable template). */
export interface ImageVariantTemplate {
  /** Comma-separated transform params, e.g. `width=320,fit=scale-down,format=auto`. */
  options: string
  /**
   * Full URL template with `{source}` replaced by `imageDelivery.sourceUrl`.
   * Example: `https://media.example.com/cdn-cgi/image/width=320,.../{source}`
   */
  urlTemplate: string
}

/** CDN transform config (Cloudflare Image Resizing). */
export interface ImageDelivery {
  provider: "cloudflare"
  /** Hostname on Cloudflare with transformations enabled (no scheme). */
  zoneHost: string
  /** Canonical original asset URL (e.g. Spaces CDN). */
  sourceUrl: string
  variants: Record<ImageVariantKey, ImageVariantTemplate>
}

export interface MediaFile {
  _id?: ObjectId | string
  tags: string[]
  /** User ids (`users` collection) tagged in this media. */
  taggedUsers: string[]
  caption?: string
  clientId: string
  createdAt: Date | string
  updatedAt: Date | string
  contentType: "video" | "audio" | "image" | "document" | "unknown"
  contentMimeType: string
  contentSubType: string
  contentSource: string
  contentSourceUrl?: string
  metadata?: Record<string, unknown>
  fileName?: string
  fileSize?: number
  /** Original file URL; for images with `imageDelivery`, use variant URLs in the grid. */
  filePath?: string
  /** Cloudflare transform templates for responsive image sizes. */
  imageDelivery?: ImageDelivery
}

export interface CreateTagRequest {
  id: string
  displayName: string
}

export interface CreateMediaFileRequest {
  tags: string[]
  taggedUsers?: string[]
  caption?: string
  contentType: MediaFile["contentType"]
  contentMimeType: string
  contentSubType?: string
  contentSource: string
  contentSourceUrl?: string
  metadata?: Record<string, unknown>
  fileName?: string
  fileSize?: number
  filePath?: string
}

export interface UpdateMediaFileRequest {
  tags?: string[]
  taggedUsers?: string[]
  caption?: string
  fileName?: string
}
