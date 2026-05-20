import type {
  ImageDelivery,
  ImageVariantKey,
  MediaFile,
} from "@/app/types/media"

/** Placeholder in stored urlTemplate; replaced with the canonical source URL. */
export const IMAGE_SOURCE_PLACEHOLDER = "{source}"

export const DEFAULT_CLOUDFLARE_VARIANT_OPTIONS: Record<
  Exclude<ImageVariantKey, "original">,
  string
> = {
  thumbnail: "width=320,fit=scale-down,format=auto,quality=75",
  medium: "width=800,fit=scale-down,format=auto,quality=80",
  large: "width=1600,fit=scale-down,format=auto,quality=85",
}

function normalizeZoneHost(zoneHost: string): string {
  return zoneHost.replace(/^https?:\/\//, "").replace(/\/$/, "")
}

export function buildCloudflareUrlTemplate(
  zoneHost: string,
  options: string
): string {
  const host = normalizeZoneHost(zoneHost)
  return `https://${host}/cdn-cgi/image/${options}/${IMAGE_SOURCE_PLACEHOLDER}`
}

export function resolveCloudflareUrlTemplate(
  urlTemplate: string,
  sourceUrl: string
): string {
  return urlTemplate.replaceAll(IMAGE_SOURCE_PLACEHOLDER, sourceUrl)
}

export function getCloudflareImageZone(): string | undefined {
  const zone = process.env.CLOUDFLARE_IMAGE_ZONE?.trim()
  return zone ? normalizeZoneHost(zone) : undefined
}

/** Pull canonical asset URL out of an existing `/cdn-cgi/image/...` URL. */
export function extractSourceFromCloudflareUrl(url: string): string | null {
  const marker = "/cdn-cgi/image/"
  const index = url.toLowerCase().indexOf(marker)
  if (index === -1) return null

  const afterMarker = url.slice(index + marker.length)
  const sourceMatch = afterMarker.match(/(https?:\/\/.+)/i)
  return sourceMatch?.[1] ?? null
}

/**
 * Resolve a stored image URL (original or already transformed) to a Cloudflare
 * variant. Falls back to the input URL when the zone is not configured.
 */
export function getCloudflareImageUrl(
  imageUrl: string,
  variant: ImageVariantKey = "medium"
): string {
  const trimmed = imageUrl?.trim()
  if (!trimmed) return ""

  const zone = getCloudflareImageZone()

  if (!zone) {
    return trimmed
  }

  if (zone && trimmed.includes(zone)) {
    return trimmed
  }

  const sourceUrl =
    extractSourceFromCloudflareUrl(trimmed)?.replace(".cdn", "") ??
    trimmed?.replace(".cdn", "")

  if (variant === "original") {
    return sourceUrl
  }
  const options = DEFAULT_CLOUDFLARE_VARIANT_OPTIONS[variant]
  const template = buildCloudflareUrlTemplate(zone, options)
  return resolveCloudflareUrlTemplate(template, sourceUrl)
}

/** Build imageDelivery metadata persisted on new image uploads. */
export function buildImageDelivery(
  sourceUrl: string,
  zoneHost?: string
): ImageDelivery | null {
  const zone = zoneHost ?? getCloudflareImageZone()
  if (!zone) return null

  const variants = {
    thumbnail: {
      options: DEFAULT_CLOUDFLARE_VARIANT_OPTIONS.thumbnail,
      urlTemplate: buildCloudflareUrlTemplate(
        zone,
        DEFAULT_CLOUDFLARE_VARIANT_OPTIONS.thumbnail
      ),
    },
    medium: {
      options: DEFAULT_CLOUDFLARE_VARIANT_OPTIONS.medium,
      urlTemplate: buildCloudflareUrlTemplate(
        zone,
        DEFAULT_CLOUDFLARE_VARIANT_OPTIONS.medium
      ),
    },
    large: {
      options: DEFAULT_CLOUDFLARE_VARIANT_OPTIONS.large,
      urlTemplate: buildCloudflareUrlTemplate(
        zone,
        DEFAULT_CLOUDFLARE_VARIANT_OPTIONS.large
      ),
    },
    original: {
      options: "",
      urlTemplate: sourceUrl.replace(
        process.env.SPACES_NORMAL_ENDPOINT ?? "",
        process.env.SPACES_CDN_ENDPOINT ?? ""
      ),
    },
  }

  return {
    provider: "cloudflare",
    zoneHost: normalizeZoneHost(zone),
    sourceUrl,
    variants,
  }
}

export function getMediaImageUrl(
  file: MediaFile,
  variant: ImageVariantKey = "thumbnail"
): string {
  const sourceUrl = file.imageDelivery?.sourceUrl ?? file.filePath ?? ""
  if (!sourceUrl) return ""

  const delivery = file.imageDelivery
  if (!delivery?.variants) {
    return sourceUrl
  }

  const entry = delivery.variants[variant]
  if (!entry) {
    return sourceUrl
  }

  if (
    variant === "original" ||
    !entry.urlTemplate.includes(IMAGE_SOURCE_PLACEHOLDER)
  ) {
    return entry.urlTemplate || sourceUrl
  }

  return resolveCloudflareUrlTemplate(
    entry.urlTemplate,
    delivery.sourceUrl || sourceUrl
  )
}
