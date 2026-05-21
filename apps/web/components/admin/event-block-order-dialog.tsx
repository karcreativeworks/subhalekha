"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Images,
  Loader2,
  Video,
} from "lucide-react"
import { toast } from "sonner"

import type {
  EventBlockRef,
  EventBlockType,
  EventPublic,
  GalleryBlockPublic,
  VideoBlockPublic,
} from "@/app/types/gallery"
import {
  normalizeEventBlockRefs,
  reconcileEventBlockRefs,
  refsFromOrderedBlockIds,
  resolveEventBlockType,
} from "@/lib/gallery/event-block-order"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@workspace/ui/components/button"
import { adminFetch, createAdminFetcher } from "@/lib/admin/admin-api"

interface EventBlockOrderDialogProps {
  clientId?: string
  event: EventPublic | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

type SortableBlock = {
  key: string
  blockId: string
  blockType: EventBlockType
  title: string
  slug?: string
}

function blockEntryKey(blockId: string, blockType: EventBlockType): string {
  return `${blockType}:${blockId}`
}

function refsFromSortableKeys(keys: string[]): EventBlockRef[] {
  return keys.map((key, blockOrder) => {
    const [blockType, blockId] = key.split(":") as [EventBlockType, string]
    return {
      blockId,
      blockOrder,
      ...(blockType === "video" ? { blockType: "video" as const } : {}),
    }
  })
}

export function EventBlockOrderDialog({
  clientId,
  event,
  open,
  onOpenChange,
  onSaved,
}: EventBlockOrderDialogProps) {
  const [orderedKeys, setOrderedKeys] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const galleryUrl =
    open && event && clientId
      ? `/api/gallery-blocks?parentEventId=${event.id}`
      : null
  const videoUrl =
    open && event && clientId
      ? `/api/video-blocks?parentEventId=${event.id}`
      : null

  const { data: galleryBlocks, isLoading: galleryLoading } = useSWR<
    GalleryBlockPublic[]
  >(galleryUrl, createAdminFetcher(clientId))

  const { data: videoBlocks, isLoading: videoLoading } = useSWR<VideoBlockPublic[]>(
    videoUrl,
    createAdminFetcher(clientId),
  )

  const isLoading = galleryLoading || videoLoading

  const sortableBlocks = useMemo((): SortableBlock[] => {
    const items: SortableBlock[] = []
    for (const block of galleryBlocks ?? []) {
      items.push({
        key: blockEntryKey(block.id, "gallery"),
        blockId: block.id,
        blockType: "gallery",
        title: block.title,
        slug: block.galleryBlockSlug,
      })
    }
    for (const block of videoBlocks ?? []) {
      items.push({
        key: blockEntryKey(block.id, "video"),
        blockId: block.id,
        blockType: "video",
        title: block.title,
        slug: block.videoBlockSlug,
      })
    }
    return items
  }, [galleryBlocks, videoBlocks])

  const fetchedKeysKey = useMemo(
    () => sortableBlocks.map((b) => b.key).join(","),
    [sortableBlocks],
  )

  const storedOrderKey = useMemo(
    () =>
      event
        ? normalizeEventBlockRefs(event.blocks)
            .map((entry) =>
              blockEntryKey(entry.blockId, resolveEventBlockType(entry)),
            )
            .join(",")
        : "",
    [event?.id, event?.blocks],
  )

  useEffect(() => {
    if (open) return
    setOrderedKeys([])
  }, [open])

  useEffect(() => {
    if (!open || !event || isLoading) return

    const identities = sortableBlocks.map((b) => ({
      blockId: b.blockId,
      blockType: b.blockType,
    }))
    const reconciled = reconcileEventBlockRefs(event.blocks, identities)
    const nextKeys = reconciled.map((entry) =>
      blockEntryKey(entry.blockId, resolveEventBlockType(entry)),
    )

    setOrderedKeys((prev) => {
      if (
        prev.length === nextKeys.length &&
        prev.every((key, index) => key === nextKeys[index])
      ) {
        return prev
      }
      return nextKeys
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, event?.id, isLoading, fetchedKeysKey, storedOrderKey])

  const blockByKey = new Map(sortableBlocks.map((block) => [block.key, block]))

  const move = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= orderedKeys.length) return
    setOrderedKeys((prev) => {
      const next = [...prev]
      const [removed] = next.splice(index, 1)
      if (removed) next.splice(nextIndex, 0, removed)
      return next
    })
  }

  const handleSave = async () => {
    if (!event) return

    setIsSaving(true)
    try {
      const blocksPayload = refsFromSortableKeys(orderedKeys)
      const response = await adminFetch(
        `/api/events/${event.id}/blocks`,
        clientId,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blocks: normalizeEventBlockRefs(blocksPayload),
          }),
        },
      )

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error ?? "Failed to save block order")
      }

      toast.success("Content block order saved")
      onSaved()
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save block order",
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <Images className="size-5" />
            Sort content blocks
          </DialogTitle>
          {event ? (
            <p className="text-sm text-muted-foreground">{event.title}</p>
          ) : null}
        </DialogHeader>

        <div className="max-h-[50vh] overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : orderedKeys.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No gallery or video blocks linked to this event yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {orderedKeys.map((key, index) => {
                const block = blockByKey.get(key)
                return (
                  <li
                    key={key}
                    className="flex items-center gap-2 rounded-xl border bg-card p-3"
                  >
                    <GripVertical className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">
                          {block?.title ?? key}
                        </p>
                        <Badge variant="secondary" className="shrink-0 text-[10px]">
                          {block?.blockType === "video" ? (
                            <>
                              <Video className="mr-1 inline size-3" />
                              Video
                            </>
                          ) : (
                            <>
                              <Images className="mr-1 inline size-3" />
                              Gallery
                            </>
                          )}
                        </Badge>
                      </div>
                      {block?.slug ? (
                        <p className="truncate font-mono text-xs text-muted-foreground">
                          {block.slug}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8"
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                        aria-label="Move up"
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8"
                        disabled={index === orderedKeys.length - 1}
                        onClick={() => move(index, 1)}
                        aria-label="Move down"
                      >
                        <ArrowDown className="size-4" />
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={isSaving || !orderedKeys.length}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save order"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
