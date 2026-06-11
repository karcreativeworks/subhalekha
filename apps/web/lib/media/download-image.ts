import type { MediaFile } from "@/app/types/media"

const ALLOWED_DOWNLOAD_HOSTS = new Set([
  "media.subhalekha.live",
  "aidev.blr1.cdn.digitaloceanspaces.com",
  "aidev.blr1.digitaloceanspaces.com",
])

export function isAllowedMediaDownloadUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return (
      parsed.protocol === "https:" &&
      ALLOWED_DOWNLOAD_HOSTS.has(parsed.hostname)
    )
  } catch {
    return false
  }
}

export function getMediaDownloadFilename(file: MediaFile, imageUrl: string): string {
  const name = file.fileName?.trim()
  if (name) return name

  try {
    const base = new URL(imageUrl).pathname.split("/").pop()
    if (base) return base
  } catch {
    // ignore
  }

  return "photo.jpg"
}

/** Trigger a file download via the same-origin proxy (works for cross-origin CDN URLs). */
export function triggerMediaDownload(file: MediaFile, imageUrl: string): void {
  if (!imageUrl || !isAllowedMediaDownloadUrl(imageUrl)) return

  const filename = getMediaDownloadFilename(file, imageUrl)
  const proxyUrl = `/api/public/media-download?url=${encodeURIComponent(imageUrl)}&filename=${encodeURIComponent(filename)}`

  const anchor = document.createElement("a")
  anchor.href = proxyUrl
  anchor.download = filename
  anchor.rel = "noopener"
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}
