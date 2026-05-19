import type { ImageDelivery, ImageVariantKey, MediaFile } from "@/app/types/media"

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
  options: string,
): string {
  const host = normalizeZoneHost(zoneHost)
  return `https://${host}/cdn-cgi/image/${options}/${IMAGE_SOURCE_PLACEHOLDER}`
}

export function resolveCloudflareUrlTemplate(
  urlTemplate: string,
  sourceUrl: string,
): string {
  return urlTemplate.replaceAll(IMAGE_SOURCE_PLACEHOLDER, sourceUrl)
}

export function getCloudflareImageZone(): string | undefined {
  const zone = process.env.CLOUDFLARE_IMAGE_ZONE?.trim()
  return zone ? normalizeZoneHost(zone) : undefined
}

/** Build imageDelivery metadata persisted on new image uploads. */
export function buildImageDelivery(sourceUrl: string, zoneHost?: string): ImageDelivery | null {
  const zone = zoneHost ?? getCloudflareImageZone()
  if (!zone) return null

  const variants = {
    thumbnail: {
      options: DEFAULT_CLOUDFLARE_VARIANT_OPTIONS.thumbnail,
      urlTemplate: buildCloudflareUrlTemplate(
        zone,
        DEFAULT_CLOUDFLARE_VARIANT_OPTIONS.thumbnail,
      ),
    },
    medium: {
      options: DEFAULT_CLOUDFLARE_VARIANT_OPTIONS.medium,
      urlTemplate: buildCloudflareUrlTemplate(
        zone,
        DEFAULT_CLOUDFLARE_VARIANT_OPTIONS.medium,
      ),
    },
    large: {
      options: DEFAULT_CLOUDFLARE_VARIANT_OPTIONS.large,
      urlTemplate: buildCloudflareUrlTemplate(
        zone,
        DEFAULT_CLOUDFLARE_VARIANT_OPTIONS.large,
      ),
    },
    original: {
      options: "",
      urlTemplate: sourceUrl,
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
  variant: ImageVariantKey = "thumbnail",
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

  if (variant === "original" || !entry.urlTemplate.includes(IMAGE_SOURCE_PLACEHOLDER)) {
    return entry.urlTemplate || sourceUrl
  }

  return resolveCloudflareUrlTemplate(entry.urlTemplate, delivery.sourceUrl || sourceUrl)
}
