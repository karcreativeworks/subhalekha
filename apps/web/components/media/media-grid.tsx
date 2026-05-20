"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Check,
  ExternalLink,
  FileText,
  Play,
  Trash2,
  Volume2,
} from "lucide-react"

import type { MediaFile } from "@/app/types/media"
import { getMediaImageUrl } from "@/lib/media/cloudflare-image"
import { MediaDetailDialog } from "@/components/media/media-detail-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

interface MediaGridProps {
  mediaFiles: MediaFile[]
  onDeleteMedia: (file: MediaFile) => void
  onMediaUpdated?: () => void
  editMode?: boolean
  bulkSelectedFiles?: Set<string>
  onBulkFileSelect?: (fileId: string, selected: boolean) => void
  onBulkSelectAll?: () => void
  onBulkDeselectAll?: () => void
}

function getFileId(file: MediaFile) {
  return typeof file._id === "string" ? file._id : file._id?.toString() ?? ""
}

export function MediaGrid({
  mediaFiles,
  onDeleteMedia,
  onMediaUpdated,
  editMode = false,
  bulkSelectedFiles = new Set(),
  onBulkFileSelect,
  onBulkSelectAll,
  onBulkDeselectAll,
}: MediaGridProps) {
  const [numColumns, setNumColumns] = useState(4)
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null)

  useEffect(() => {
    const getColumns = () => {
      const width = window.innerWidth
      if (width >= 1536) return 6
      if (width >= 1280) return 5
      if (width >= 1024) return 4
      if (width >= 768) return 3
      if (width >= 640) return 2
      return 1
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

  const allFileIds = useMemo(
    () => mediaFiles.map(getFileId).filter(Boolean),
    [mediaFiles],
  )

  const allBulkSelected =
    allFileIds.length > 0 && allFileIds.every((id) => bulkSelectedFiles.has(id))

  if (!mediaFiles.length) {
    return null
  }

  return (
    <>
      {editMode ? (
        <div className="mb-4 flex items-center justify-between rounded-xl border bg-muted/40 p-3">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                allBulkSelected ? onBulkDeselectAll?.() : onBulkSelectAll?.()
              }
            >
              {allBulkSelected ? "Deselect all" : "Select all"}
            </Button>
            <span className="text-sm text-muted-foreground">
              {bulkSelectedFiles.size} of {allFileIds.length} selected
            </span>
          </div>
          {bulkSelectedFiles.size > 0 ? (
            <Button variant="ghost" size="sm" onClick={onBulkDeselectAll}>
              Clear selection
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="flex gap-2 md:gap-4">
        {columns.map((columnFiles, columnIndex) => (
          <div key={columnIndex} className="flex w-full flex-col gap-2 md:gap-4">
            {columnFiles.map((mediaFile) => {
              const fileId = getFileId(mediaFile)
              const isBulkSelected = bulkSelectedFiles.has(fileId)
              const originalSrc = mediaFile.contentType === 'image' ?
                getMediaImageUrl(mediaFile, "original")
                : mediaFile.filePath ?? ""
              const gridSrc =
                mediaFile.contentType === "image"
                  ? getMediaImageUrl(mediaFile, "thumbnail")
                  : originalSrc

              return (
                <div
                  key={fileId}
                  className={cn(
                    "group/media relative cursor-pointer overflow-hidden rounded-xl bg-neutral-900",
                    isBulkSelected && "ring-2 ring-primary",
                  )}
                  onClick={() => {
                    if (editMode) {
                      onBulkFileSelect?.(fileId, !isBulkSelected)
                      return
                    }
                    setSelectedFile(mediaFile)
                  }}
                >
                  {mediaFile.contentType === "image" ? (
                    <img
                      src={gridSrc || originalSrc}
                      srcSet={
                        mediaFile.imageDelivery
                          ? [
                            `${getMediaImageUrl(mediaFile, "thumbnail")} 320w`,
                            `${getMediaImageUrl(mediaFile, "medium")} 800w`,
                          ].join(", ")
                          : undefined
                      }
                      sizes="(max-width: 768px) 50vw, 20vw"
                      alt={mediaFile.fileName ?? "Image"}
                      loading="lazy"
                      decoding="async"
                      className="h-auto w-full object-cover transition-transform duration-300 group-hover/media:scale-105"
                    />
                  ) : mediaFile.contentType === "video" ? (
                    <div className="flex aspect-video items-center justify-center bg-black">
                      <Play className="size-8 text-white" />
                    </div>
                  ) : mediaFile.contentType === "audio" ? (
                    <div className="flex aspect-video flex-col items-center justify-center bg-neutral-800 p-4">
                      <Volume2 className="mb-2 size-8 text-neutral-400" />
                      <p className="line-clamp-2 text-center text-sm text-white">
                        {mediaFile.fileName ?? "Audio"}
                      </p>
                    </div>
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-neutral-800">
                      <FileText className="size-8 text-neutral-400" />
                    </div>
                  )}

                  {mediaFile.tags?.length ? (
                    <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                      {mediaFile.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="bg-black/70 text-white"
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  ) : null}

                  <div className="absolute inset-0 flex items-start justify-end gap-2 bg-black/0 p-2 opacity-0 transition-opacity group-hover/media:bg-black/30 group-hover/media:opacity-100">
                    {originalSrc ? (
                      <a
                        href={originalSrc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-white/90 p-2"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <ExternalLink className="size-4 text-neutral-900" />
                      </a>
                    ) : null}
                    <button
                      type="button"
                      className="rounded-full bg-red-500/90 p-2"
                      onClick={(event) => {
                        event.stopPropagation()
                        onDeleteMedia(mediaFile)
                      }}
                    >
                      <Trash2 className="size-4 text-white" />
                    </button>
                  </div>

                  {editMode ? (
                    <div className="absolute top-2 left-2">
                      <div
                        className={cn(
                          "flex size-5 items-center justify-center rounded border-2",
                          isBulkSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-white bg-white/80",
                        )}
                      >
                        {isBulkSelected ? <Check className="size-3" /> : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <MediaDetailDialog
        mediaFile={selectedFile}
        isOpen={Boolean(selectedFile)}
        onClose={() => setSelectedFile(null)}
        onSaved={() => onMediaUpdated?.()}
        onDelete={onDeleteMedia}
      />
    </>
  )
}
