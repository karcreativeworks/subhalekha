/** Extract YouTube video id from common URL shapes. */
export function parseYouTubeVideoId(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null

  try {
    const parsed = new URL(trimmed)
    const host = parsed.hostname.replace(/^www\./, "")

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0]
      return id && /^[\w-]{11}$/.test(id) ? id : null
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = parsed.searchParams.get("v")
      if (v && /^[\w-]{11}$/.test(v)) return v

      const embedMatch = parsed.pathname.match(/\/embed\/([\w-]{11})/)
      if (embedMatch?.[1]) return embedMatch[1]

      const shortsMatch = parsed.pathname.match(/\/shorts\/([\w-]{11})/)
      if (shortsMatch?.[1]) return shortsMatch[1]
    }
  } catch {
    // fall through to loose patterns
  }

  const loose =
    trimmed.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([\w-]{11})/)?.[1] ??
    null
  return loose && /^[\w-]{11}$/.test(loose) ? loose : null
}

export function isYouTubeUrl(url: string): boolean {
  return parseYouTubeVideoId(url) !== null
}

/** High-quality default thumbnail for YouTube URLs. */
export function getYouTubeThumbnailUrl(videoId: string, quality: "hq" | "max" = "hq") {
  const file = quality === "max" ? "maxresdefault.jpg" : "hqdefault.jpg"
  return `https://i.ytimg.com/vi/${videoId}/${file}`
}

/** Best-effort preview image for external video URLs. */
export function getVideoThumbnailUrl(videoUrl: string): string | null {
  const ytId = parseYouTubeVideoId(videoUrl)
  if (ytId) return getYouTubeThumbnailUrl(ytId)
  return null
}

/** Embed URL for iframe playback (YouTube only for now). */
export function getVideoEmbedUrl(videoUrl: string): string | null {
  const ytId = parseYouTubeVideoId(videoUrl)
  if (ytId) return `https://www.youtube.com/embed/${ytId}?rel=0`
  return null
}

export function isValidVideoUrl(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed) return false
  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}
