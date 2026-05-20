"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import type { MediaFile } from "@/app/types/media"
import { PublicPhotoGrid } from "@/components/site/public-photo-grid"
import { glassPanel } from "@/components/site/glass"
import {
  PUBLIC_GALLERY_MAX_CHAINED_LOADS,
  PUBLIC_GALLERY_MEDIA_PAGE_SIZE,
  PUBLIC_GALLERY_SCROLL_ROOT_MARGIN,
} from "@/lib/gallery/public-media-constants"
import { cn } from "@workspace/ui/lib/utils"

interface PublicGalleryMediaResponse {
  files: MediaFile[]
  total: number
  hasMore: boolean
  page: number
  limit: number
}

interface PublicPhotoGridInfiniteProps {
  eventSlug: string
  galleryBlockSlug: string
  initialPhotos: MediaFile[]
  initialHasMore: boolean
  initialTotal: number
  className?: string
}

function getFileId(file: MediaFile) {
  return typeof file._id === "string" ? file._id : file._id?.toString() ?? ""
}

export function PublicPhotoGridInfinite({
  eventSlug,
  galleryBlockSlug,
  initialPhotos,
  initialHasMore,
  initialTotal,
  className,
}: PublicPhotoGridInfiniteProps) {
  const [photos, setPhotos] = useState(initialPhotos)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [total, setTotal] = useState(initialTotal)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)
  const hasMoreRef = useRef(hasMore)
  const pageRef = useRef(page)

  hasMoreRef.current = hasMore
  pageRef.current = page

  const loadMore = useCallback(async (): Promise<boolean> => {
    if (loadingRef.current || !hasMoreRef.current) return false

    loadingRef.current = true
    setLoading(true)
    setError(null)

    const nextPage = pageRef.current + 1

    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(PUBLIC_GALLERY_MEDIA_PAGE_SIZE),
      })
      const response = await fetch(
        `/api/public/events/${encodeURIComponent(eventSlug)}/gallery/${encodeURIComponent(galleryBlockSlug)}/media?${params}`,
      )

      if (!response.ok) {
        throw new Error("Failed to load more photos")
      }

      const data = (await response.json()) as PublicGalleryMediaResponse

      setPhotos((prev) => {
        const seen = new Set(prev.map(getFileId))
        const merged = [...prev]
        for (const file of data.files) {
          const id = getFileId(file)
          if (id && !seen.has(id)) {
            seen.add(id)
            merged.push(file)
          }
        }
        return merged
      })
      setPage(data.page)
      pageRef.current = data.page
      setHasMore(data.hasMore)
      hasMoreRef.current = data.hasMore
      setTotal(data.total)
      return data.hasMore
    } catch {
      setError("Could not load more photos. Scroll to try again.")
      return false
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [eventSlug, galleryBlockSlug])

  const loadMoreUntilCaughtUp = useCallback(
    async (chain = 0) => {
      if (chain >= PUBLIC_GALLERY_MAX_CHAINED_LOADS) return

      const loaded = await loadMore()
      if (!loaded || !hasMoreRef.current) return

      const sentinel = sentinelRef.current
      if (!sentinel) return

      const nearBottom =
        sentinel.getBoundingClientRect().top < window.innerHeight + 3200

      if (nearBottom) {
        await loadMoreUntilCaughtUp(chain + 1)
      }
    },
    [loadMore],
  )

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMoreUntilCaughtUp()
        }
      },
      { rootMargin: PUBLIC_GALLERY_SCROLL_ROOT_MARGIN },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadMoreUntilCaughtUp])

  const loadedLabel = useMemo(() => {
    if (total === 0) return null
    return `${photos.length} of ${total} photos`
  }, [photos.length, total])

  if (!photos.length) {
    return (
      <div
        className={cn(
          glassPanel("rounded-2xl p-10 text-center"),
          className,
        )}
      >
        <p className="text-muted-foreground text-sm">
          No photos in this gallery yet.
        </p>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* {loadedLabel ? (
        <p className="text-muted-foreground text-center text-xs tabular-nums">
          {loadedLabel}
        </p>
      ) : null} */}

      <PublicPhotoGrid mediaFiles={photos} />

      <div
        ref={sentinelRef}
        className="flex min-h-12 flex-col items-center justify-center gap-2 py-4"
        aria-live="polite"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <span className="border-primary size-5 animate-spin rounded-full border-2 border-t-transparent" />
            <span className="text-muted-foreground text-sm">Loading more…</span>
          </div>
        ) : null}
        {error ? (
          <button
            type="button"
            onClick={() => void loadMore()}
            className="text-muted-foreground text-sm underline-offset-4 hover:underline"
          >
            {error}
          </button>
        ) : null}
        {!hasMore && !loading ? (
          <p className="text-muted-foreground text-xs">You&apos;ve seen all photos</p>
        ) : null}
      </div>
    </div>
  )
}
