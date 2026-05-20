"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import {
  Grid3X3,
  List,
  Search,
  SortAsc,
  SortDesc,
  Tags,
  X,
} from "lucide-react"
import { toast } from "sonner"

import type { MediaFile, Tag } from "@/app/types/media"
import { BulkEditToolbar } from "@/components/media/bulk-edit-toolbar"
import { MediaDetailDialog } from "@/components/media/media-detail-dialog"
import { MediaGrid } from "@/components/media/media-grid"
import {
  MEDIA_UPLOADER_PAGE_SIZE,
  MediaPagination,
} from "@/components/media/media-pagination"
import { UploadTrigger } from "@/components/media/upload-trigger"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface MediaContentProps {
  selectedTag: string | null
  hashtagFilters: string[]
  onHashtagFiltersChange: (filters: string[]) => void
}

export function MediaContent({
  selectedTag,
  hashtagFilters,
  onHashtagFiltersChange,
}: MediaContentProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [contentTypeFilter, setContentTypeFilter] = useState("all")
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest")
  const [hashtagInput, setHashtagInput] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [editMode, setEditMode] = useState(false)
  const [bulkSelectedFiles, setBulkSelectedFiles] = useState<Set<string>>(
    new Set(),
  )
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)
  const [detailFile, setDetailFile] = useState<MediaFile | null>(null)
  const [page, setPage] = useState(1)
  const [debouncedSearch, setDebouncedSearch] = useState("")

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedSearch(searchQuery.trim()),
      300,
    )
    return () => window.clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    setPage(1)
  }, [selectedTag, contentTypeFilter, hashtagFilters, sortOrder, debouncedSearch])

  const buildApiUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (selectedTag) params.append("tag", selectedTag)
    if (contentTypeFilter !== "all") {
      params.append("contentType", contentTypeFilter)
    }
    if (hashtagFilters.length > 0) {
      params.append("tags", hashtagFilters.join(","))
    }
    if (debouncedSearch) params.append("q", debouncedSearch)
    params.append("sort", "createdAt")
    params.append("order", sortOrder === "latest" ? "desc" : "asc")
    params.append("page", String(page))
    params.append("limit", String(MEDIA_UPLOADER_PAGE_SIZE))
    return `/api/media-files?${params.toString()}`
  }, [
    selectedTag,
    contentTypeFilter,
    hashtagFilters,
    sortOrder,
    debouncedSearch,
    page,
  ])

  const { data: filesData, mutate: mutateFiles, isLoading } = useSWR<{
    files?: MediaFile[]
    total?: number
    hasMore?: boolean
  }>(buildApiUrl, fetcher)
  const { data: tags = [] } = useSWR<Tag[]>("/api/tags", fetcher)

  const files = (filesData?.files ?? []) as MediaFile[]
  const total = filesData?.total ?? 0

  useEffect(() => {
    if (selectedTag) {
      onHashtagFiltersChange([selectedTag])
    }
  }, [selectedTag, onHashtagFiltersChange])

  const getTagDisplayName = (tagId: string) =>
    tags.find((tag) => tag.id === tagId)?.displayName ?? tagId

  const addHashtagFilter = (tag: string) => {
    const value = tag.trim()
    if (value && !hashtagFilters.includes(value)) {
      onHashtagFiltersChange([...hashtagFilters, value])
    }
  }

  const handleDeleteMedia = async (file: MediaFile) => {
    const id = typeof file._id === "string" ? file._id : file._id?.toString()
    if (!id || !confirm("Delete this media file?")) return

    const response = await fetch(`/api/media-files/${id}`, { method: "DELETE" })
    if (response.ok) {
      void mutateFiles()
      toast.success("Media deleted")
    } else {
      toast.error("Failed to delete media")
    }
  }

  const handleBulkUpdate = async (
    fileIds: string[],
    operation: "add" | "remove" | "replace",
    bulkTags: string[],
  ) => {
    setIsBulkUpdating(true)
    try {
      const response = await fetch("/api/media-files/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds, operation, tags: bulkTags }),
      })
      if (!response.ok) throw new Error("Bulk update failed")
      setBulkSelectedFiles(new Set())
      void mutateFiles()
    } finally {
      setIsBulkUpdating(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <div className="border-b bg-muted/30 p-4">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">
              {selectedTag
                ? `Files tagged “${getTagDisplayName(selectedTag)}”`
                : "All files"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Masonry grid for images and videos with bulk upload
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={editMode ? "default" : "outline"}
              onClick={() => {
                setEditMode((value) => !value)
                setBulkSelectedFiles(new Set())
              }}
            >
              <Tags className="mr-2 size-4" />
              {editMode ? "Done selecting" : "Select"}
            </Button>
            <UploadTrigger
              preselectedTags={hashtagFilters}
              onUploadComplete={() => void mutateFiles()}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Tags:
            </span>
            {hashtagFilters.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer gap-1"
                onClick={() =>
                  onHashtagFiltersChange(
                    hashtagFilters.filter((value) => value !== tag),
                  )
                }
              >
                #{getTagDisplayName(tag)}
                <X className="size-3" />
              </Badge>
            ))}
            <Input
              placeholder="Add hashtag…"
              value={hashtagInput}
              onChange={(event) => setHashtagInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === ",") {
                  event.preventDefault()
                  addHashtagFilter(hashtagInput)
                  setHashtagInput("")
                }
              }}
              onBlur={() => {
                if (hashtagInput.trim()) {
                  addHashtagFilter(hashtagInput)
                  setHashtagInput("")
                }
              }}
              className="h-8 w-36 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search files…"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-48 pl-9"
              />
            </div>
            <select
              value={contentTypeFilter}
              onChange={(event) => setContentTypeFilter(event.target.value)}
              className="h-9 rounded-xl border border-input bg-input/30 px-3 text-sm"
            >
              <option value="all">All types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
              <option value="document">Documents</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setSortOrder((value) => (value === "latest" ? "oldest" : "latest"))
              }
            >
              {sortOrder === "latest" ? (
                <SortDesc className="size-4" />
              ) : (
                <SortAsc className="size-4" />
              )}
            </Button>
            <div className="flex overflow-hidden rounded-xl border">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                className="rounded-none"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="size-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                className="rounded-none"
                onClick={() => setViewMode("list")}
              >
                <List className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        <UploadTrigger
          uiType="dropzone"
          dropzoneClassName="mb-4 min-h-[180px]"
          preselectedTags={hashtagFilters}
          autoUpload={hashtagFilters.length > 0}
          onUploadComplete={() => void mutateFiles()}
        />

        {editMode ? (
          <BulkEditToolbar
            selectedFiles={bulkSelectedFiles}
            onClearSelection={() => setBulkSelectedFiles(new Set())}
            onBulkUpdate={handleBulkUpdate}
            isUpdating={isBulkUpdating}
          />
        ) : null}

        {isLoading ? (
          <p className="py-12 text-center text-muted-foreground">
            Loading files…
          </p>
        ) : files.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            {debouncedSearch || hashtagFilters.length > 0 || selectedTag
              ? "No files match your filters."
              : "No files found. Upload images or videos to get started."}
          </p>
        ) : viewMode === "grid" ? (
          <>
          <MediaGrid
            mediaFiles={files}
            onDeleteMedia={(file) => void handleDeleteMedia(file)}
            onMediaUpdated={() => void mutateFiles()}
            editMode={editMode}
            bulkSelectedFiles={bulkSelectedFiles}
            onBulkFileSelect={(fileId, selected) => {
              setBulkSelectedFiles((prev) => {
                const next = new Set(prev)
                if (selected) next.add(fileId)
                else next.delete(fileId)
                return next
              })
            }}
            onBulkSelectAll={() =>
              setBulkSelectedFiles(
                new Set(
                  files
                    .map((file) =>
                      typeof file._id === "string"
                        ? file._id
                        : file._id?.toString(),
                    )
                    .filter(Boolean) as string[],
                ),
              )
            }
            onBulkDeselectAll={() => setBulkSelectedFiles(new Set())}
          />
          <MediaPagination
            className="mt-6"
            page={page}
            total={total}
            pageSize={MEDIA_UPLOADER_PAGE_SIZE}
            onPageChange={setPage}
            isLoading={isLoading}
          />
          </>
        ) : (
          <>
          <div className="space-y-2">
            {files.map((file) => {
              const id =
                typeof file._id === "string" ? file._id : file._id?.toString()
              return (
                <div
                  key={id}
                  className="flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-colors hover:bg-muted/40"
                  onClick={() => setDetailFile(file)}
                >
                  <div>
                    <p className="font-medium">{file.fileName ?? "Untitled"}</p>
                    <p className="text-sm text-muted-foreground">
                      {file.contentType} •{" "}
                      {new Date(file.createdAt).toLocaleDateString()}
                    </p>
                    {file.caption ? (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {file.caption}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {file.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          #{getTagDisplayName(tag)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation()
                      void handleDeleteMedia(file)
                    }}
                  >
                    Delete
                  </Button>
                </div>
              )
            })}
          </div>
          <MediaPagination
            className="mt-6"
            page={page}
            total={total}
            pageSize={MEDIA_UPLOADER_PAGE_SIZE}
            onPageChange={setPage}
            isLoading={isLoading}
          />
          </>
        )}
      </div>

      <MediaDetailDialog
        mediaFile={detailFile}
        isOpen={Boolean(detailFile)}
        onClose={() => setDetailFile(null)}
        onSaved={() => void mutateFiles()}
        onDelete={(file) => void handleDeleteMedia(file)}
      />
    </div>
  )
}
