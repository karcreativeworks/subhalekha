import type { Metadata } from "next"

import type { EventPublic, GalleryBlockPublic } from "@/app/types/gallery"
import { getCloudflareImageUrl } from "@/lib/media/cloudflare-image"
import {
  SANGEET_PLAN_HERO_DESKTOP,
  SANGEET_PLAN_HERO_OG_META,
} from "@/lib/sangeet/performance-constants"
import { getSiteMetadataBaseUrl } from "@/lib/site/site-url"

const SITE_NAME = "Subhalekha"

/** Public OG image for the site homepage (`public/landing_og_image.png`). */
export const LANDING_OG_IMAGE_PATH = "/landing_og_image_small.jpeg"

/** Public OG image for the groom invite page (`public/invite/thumb-invite-groom.jpg`). */
export const GROOM_INVITE_OG_IMAGE_PATH = "/invite/thumb-invite-groom.jpg"

function absolutePublicOgImage(path: string): string {
  return new URL(path, getSiteMetadataBaseUrl()).href
}

/** Absolute URL suitable for og:image / twitter:image from a stored horizontal cover URL. */
export function absoluteOgImageFromHorizontalCover(
  horizontalUrl: string | undefined
): string | undefined {
  const trimmed = horizontalUrl?.trim()
  if (!trimmed) return undefined

  const sized = getCloudflareImageUrl(trimmed, "medium") || trimmed
  if (/^https?:\/\//i.test(sized)) {
    return sized
  }

  try {
    return new URL(
      sized.startsWith("/") ? sized : `/${sized}`,
      getSiteMetadataBaseUrl()
    ).href
  } catch {
    return undefined
  }
}

function openGraphImageEntry(
  horizontalUrl: string | undefined
): Array<{ url: string }> | undefined {
  const url = absoluteOgImageFromHorizontalCover(horizontalUrl)
  return url ? [{ url }] : undefined
}

/** Site homepage — uses `landing_og_image.png`. */
export function buildSiteHomeMetadata(): Metadata {
  const path = "/"
  const title = `${SITE_NAME} - శుభకర్ & శ్రీలేఖ పెళ్లి సందడి`
  const description =
    "Celebrations & Memories — Browse galleries and event photos. Check out Itenary, Map & Schedule.."
  const ogUrl = absolutePublicOgImage(LANDING_OG_IMAGE_PATH)
  const images = [{ url: ogUrl }]

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      siteName: SITE_NAME,
      type: "website",
      title,
      description,
      url: path,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  }
}

/** Groom invite page. */
export function buildGroomInviteMetadata(): Metadata {
  const path = "/invite/groom"
  const title = `శుభకర్ weds శ్రీలేఖ . July 7 & 8, 2026`
  const description =
    "తిక్కిరెడ్డి వారి పెళ్లి సందడి. You're invited to celebrate with us."
  const ogUrl = absolutePublicOgImage(GROOM_INVITE_OG_IMAGE_PATH)
  const images = [{ url: ogUrl }]

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      siteName: SITE_NAME,
      type: "website",
      title,
      description,
      url: path,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  }
}

/** Sangeet performance plan — public guide page. */
export function buildSangeetPlanMetadata(): Metadata {
  const path = "/guide/sangeet/plan"
  const title = `Sangeet performance plan · ${SITE_NAME}`
  const description =
    "View the sangeet schedule and add your act for the evening. Performer names stay private until show day."
  const ogUrl = absolutePublicOgImage(SANGEET_PLAN_HERO_OG_META)
  const images = [{ url: ogUrl }]

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      siteName: SITE_NAME,
      type: "website",
      title,
      description,
      url: path,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  }
}

/** Public event landing page — full event context. */
export function buildEventLandingMetadata(event: EventPublic): Metadata {
  const path = `/${event.eventSlug}`
  const title = event.title
  const description =
    event.description?.trim() ||
    `${event.title}${event.subtitle ? ` — ${event.subtitle}` : ""}`

  const ogUrl = absoluteOgImageFromHorizontalCover(event.coverPicHorizontal)
  const images = openGraphImageEntry(event.coverPicHorizontal)

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      siteName: SITE_NAME,
      type: "website",
      title,
      description,
      url: path,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogUrl ? [ogUrl] : undefined,
    },
  }
}

/** Event gallery index. */
export function buildEventGalleryIndexMetadata(event: EventPublic): Metadata {
  const path = `/${event.eventSlug}/gallery`
  const title = `Gallery · ${event.title} . ${SITE_NAME}`
  const description =
    event.description?.trim() ||
    `Photo galleries from ${event.title}${event.subtitle ? ` — ${event.subtitle}` : ""}`

  const ogUrl = absoluteOgImageFromHorizontalCover(event.coverPicHorizontal)
  const images = openGraphImageEntry(event.coverPicHorizontal)

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      siteName: SITE_NAME,
      type: "website",
      title,
      description,
      url: path,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogUrl ? [ogUrl] : undefined,
    },
  }
}

/** Single gallery block album page — OG uses horizontal cover. */
export function buildGalleryBlockMetadata(
  event: EventPublic,
  block: GalleryBlockPublic
): Metadata {
  const path = `/${event.eventSlug}/gallery/${block.galleryBlockSlug}`
  const title = `${block.title} · ${event.title}`
  const description =
    block.description?.trim() ||
    block.subtitle?.trim() ||
    `${block.title} — ${event.title}`

  const ogUrl = absoluteOgImageFromHorizontalCover(block.coverPicHorizontal)
  const images = openGraphImageEntry(block.coverPicHorizontal)

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      siteName: SITE_NAME,
      type: "website",
      title,
      description,
      url: path,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogUrl ? [ogUrl] : undefined,
    },
  }
}
