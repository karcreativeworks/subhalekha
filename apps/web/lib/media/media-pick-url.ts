import type { MediaFile } from "@/app/types/media"
import { getMediaImageUrl } from "@/lib/media/cloudflare-image"

/** Canonical URL to store when a media file is chosen (e.g. gallery cover). */
export function getMediaPickUrl(file: MediaFile): string {
  if (file.contentType === "image") {
    return getMediaImageUrl(file, "original") || file.filePath || ""
  }
  return file.filePath ?? file.contentSourceUrl ?? ""
}
