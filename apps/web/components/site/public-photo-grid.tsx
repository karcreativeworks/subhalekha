"use client"

import { useEffect, useMemo, useState } from "react"

import type { MediaFile } from "@/app/types/media"
import { glassPanel } from "@/components/site/glass"
import { getMediaImageUrl } from "@/lib/media/cloudflare-image"
import { cn } from "@workspace/ui/lib/utils"

interface PublicPhotoGridProps {
  mediaFiles: MediaFile[]
  className?: string
}

function getFileId(file: MediaFile) {
  return typeof file._id === "string" ? file._id : file._id?.toString() ?? ""
}

export function PublicPhotoGrid({ mediaFiles, className }: PublicPhotoGridProps) {
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
                  <div className="relative w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={file.caption || file.fileName || "Gallery photo"}
                      loading="lazy"
                      className="block h-auto w-full object-cover"
                    />
                  </div>
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
