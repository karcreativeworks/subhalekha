"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { Check, ImageIcon, Loader2, Search } from "lucide-react"

import type { MediaFile } from "@/app/types/media"
import { getMediaImageUrl } from "@/lib/media/cloudflare-image"
import { getMediaPickUrl } from "@/lib/media/media-pick-url"
import { useMediaPickerStore } from "@/stores/media-picker-store"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  MEDIA_PICKER_PAGE_SIZE,
  MediaPagination,
} from "@/components/media/media-pagination"
import { TagFilterDropdown } from "@/components/media/tag-filter-dropdown"
import { Input } from "@/components/ui/input"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { createAdminFetcher } from "@/lib/admin/admin-api"

function getFileId(file: MediaFile): string {
  return typeof file._id === "string" ? file._id : file._id?.toString() ?? ""
}

interface MediaPickerDialogProps {
  /** Session client id for admin API permission checks. */
  clientId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (url: string) => void
  selectedUrl?: string
  /** When true, only image files are shown. */
  imagesOnly?: boolean
}

export function MediaPickerDialog({
  clientId,
  open,
  onOpenChange,
  onSelect,
  selectedUrl,
  imagesOnly = true,
}: MediaPickerDialogProps) {
  const search = useMediaPickerStore((s) => s.search)
  const setSearch = useMediaPickerStore((s) => s.setSearch)
  const filterTags = useMediaPickerStore((s) => s.filterTags)
  const setFilterTags = useMediaPickerStore((s) => s.setFilterTags)
  const page = useMediaPickerStore((s) => s.page)
  const setPage = useMediaPickerStore((s) => s.setPage)

  const [debouncedSearch, setDebouncedSearch] = useState(() => search.trim())

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filterTags, setPage])

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      contentType: imagesOnly ? "image" : "all",
      sort: "createdAt",
      order: "desc",
      limit: String(MEDIA_PICKER_PAGE_SIZE),
      page: String(page),
    })
    if (debouncedSearch) params.set("q", debouncedSearch)
    if (filterTags.length > 0) params.set("tags", filterTags.join(","))
    return `/api/media-files?${params.toString()}`
  }, [debouncedSearch, filterTags, imagesOnly, page])

  const { data, isLoading } = useSWR<{
    files?: MediaFile[]
    total?: number
  }>(
    open ? apiUrl : null,
    clientId
      ? createAdminFetcher(clientId)
      : (url: string) => fetch(url).then((res) => res.json()),
  )

  const total = data?.total ?? 0
  const files = (data?.files ?? []).filter(
    (file) => !imagesOnly || file.contentType === "image",
  )

  const handlePick = (file: MediaFile) => {
    const url = getMediaPickUrl(file)
    if (!url) return
    onSelect(url)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="size-5" />
            Choose from media
          </DialogTitle>
        </DialogHeader>

        <div className="border-b px-6 py-3">
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by filename…"
                className="pl-9"
              />
            </div>
            <TagFilterDropdown
              selectedTags={filterTags}
              onTagsChange={setFilterTags}
              className="w-44 shrink-0 sm:w-52"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : files.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              {debouncedSearch || filterTags.length > 0
                ? "No images match your filters."
                : "No images uploaded yet. Add images in Media Uploader first."}
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {files.map((file) => {
                const fileId = getFileId(file)
                const pickUrl = getMediaPickUrl(file)
                const thumbUrl = getMediaImageUrl(file, "thumbnail") || pickUrl
                const isSelected = Boolean(
                  selectedUrl && pickUrl && selectedUrl === pickUrl,
                )

                return (
                  <button
                    key={fileId}
                    type="button"
                    disabled={!pickUrl}
                    onClick={() => handlePick(file)}
                    className={cn(
                      "group relative w-full overflow-hidden rounded-lg bg-muted ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isSelected && "ring-2 ring-primary",
                      !pickUrl && "cursor-not-allowed opacity-50",
                    )}
                  >
                    {thumbUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbUrl}
                        alt={file.fileName ?? "Media"}
                        className="h-auto w-full object-contain transition-transform group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                        No preview
                      </div>
                    )}
                    {isSelected ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/30">
                        <div className="rounded-full bg-primary p-1.5 text-primary-foreground">
                          <Check className="size-4" />
                        </div>
                      </div>
                    ) : null}
                  </button>
                )
              })}
            </div>
          )}
          <MediaPagination
            className="mt-4 border-t-0 pt-0"
            page={page}
            total={total}
            pageSize={MEDIA_PICKER_PAGE_SIZE}
            onPageChange={setPage}
            isLoading={isLoading}
          />
        </div>

        <div className="flex justify-end border-t px-6 py-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
