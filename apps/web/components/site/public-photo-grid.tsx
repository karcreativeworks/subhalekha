"use client"

import { useEffect, useMemo, useState } from "react"

import type { MediaFile } from "@/app/types/media"
import { glassPanel } from "@/components/site/glass"
import { getMediaImageUrl } from "@/lib/media/cloudflare-image"
import { cn } from "@workspace/ui/lib/utils"

interface PublicPhotoGridProps {
  mediaFiles: MediaFile[]
  onPhotoClick?: (index: number) => void
  className?: string
}

function getFileId(file: MediaFile) {
  return typeof file._id === "string" ? file._id : file._id?.toString() ?? ""
}

export function PublicPhotoGrid({
  mediaFiles,
  onPhotoClick,
  className,
}: PublicPhotoGridProps) {
  const [numColumns, setNumColumns] = useState(2)

  useEffect(() => {
    const getColumns = () => {
      const width = window.innerWidth
      if (width >= 1280) return 4
      if (width >= 768) return 3
      return 2
    }

    const handleResize = () => setNumColumns(getColumns())
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const columns = useMemo(() => {
    const next: MediaFile[][] = Array.from({ length: numColumns }, () => [])
    mediaFiles.forEach((file, index) => {
      next[index % numColumns]?.push(file)
    })
    return next
  }, [mediaFiles, numColumns])

  if (!mediaFiles.length) {
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

  const flatIndexById = useMemo(() => {
    const map = new Map<string, number>()
    mediaFiles.forEach((file, index) => {
      const id = getFileId(file)
      if (id) map.set(id, index)
    })
    return map
  }, [mediaFiles])

  return (
    <div
      className={cn("flex items-start gap-2 sm:gap-3", className)}
      role="list"
    >
      {columns.map((column, columnIndex) => (
        <div
          key={columnIndex}
          className="flex min-w-0 flex-1 flex-col gap-2 sm:gap-3"
        >
          {column.map((file) => {
            const id = getFileId(file)
            const flatIndex = id ? flatIndexById.get(id) : undefined
            const src =
              getMediaImageUrl(file, "medium") ||
              getMediaImageUrl(file, "thumbnail") ||
              file.filePath ||
              ""

            return (
              <figure
                key={id}
                role="listitem"
                className={cn(
                  "overflow-hidden rounded-xl",
                  glassPanel("border-white/20 p-0"),
                )}
              >
                {src ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (flatIndex !== undefined) onPhotoClick?.(flatIndex)
                    }}
                    className="relative block w-full cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent hover:scale-105 transition-transform duration-400"
                    aria-label={`View ${file.caption || file.fileName || "photo"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={file.caption || file.fileName || "Gallery photo"}
                      loading="lazy"
                      className="block h-auto w-full object-cover"
                    />
                  </button>
                ) : (
                  <div className="bg-muted aspect-[3/4] w-full" aria-hidden />
                )}
                {file.caption ? (
                  <figcaption className="text-muted-foreground px-3 py-2 text-xs">
                    {file.caption}
                  </figcaption>
                ) : null}
              </figure>
            )
          })}
        </div>
      ))}
    </div>
  )
}
