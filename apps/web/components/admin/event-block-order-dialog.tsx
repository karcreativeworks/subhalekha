"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Images,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

import type { EventPublic, GalleryBlockPublic } from "@/app/types/gallery"
import {
  blockIdsFromRefs,
  normalizeEventBlockRefs,
  reconcileEventBlockRefs,
  refsFromOrderedBlockIds,
} from "@/lib/gallery/event-block-order"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@workspace/ui/components/button"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface EventBlockOrderDialogProps {
  event: EventPublic | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

export function EventBlockOrderDialog({
  event,
  open,
  onOpenChange,
  onSaved,
}: EventBlockOrderDialogProps) {
  const [orderedIds, setOrderedIds] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const blocksUrl =
    open && event ? `/api/gallery-blocks?parentEventId=${event.id}` : null

  const { data: blocks, isLoading, mutate } = useSWR<GalleryBlockPublic[]>(
    blocksUrl,
    fetcher,
  )

  const fetchedIdsKey = useMemo(
    () => (blocks ?? []).map((block) => block.id).join(","),
    [blocks],
  )

  const storedOrderKey = useMemo(
    () => (event ? blockIdsFromRefs(event.blocks).join(",") : ""),
    [event?.id, event?.blocks],
  )

  useEffect(() => {
    if (open) return
    setOrderedIds([])
  }, [open])

  useEffect(() => {
    if (!open || !event || isLoading || !blocks) return

    const blockIds = blocks.map((block) => block.id)
    const reconciled = reconcileEventBlockRefs(event.blocks, blockIds)
    const nextIds = reconciled.map((entry) => entry.blockId)

    setOrderedIds((prev) => {
      if (
        prev.length === nextIds.length &&
        prev.every((id, index) => id === nextIds[index])
      ) {
        return prev
      }
      return nextIds
    })
    // event + blocks read from closure; keys capture meaningful changes only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, event?.id, isLoading, fetchedIdsKey, storedOrderKey])

  const blockById = new Map((blocks ?? []).map((block) => [block.id, block]))

  const move = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= orderedIds.length) return
    setOrderedIds((prev) => {
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
      const blocksPayload = refsFromOrderedBlockIds(orderedIds)
      const response = await fetch(`/api/events/${event.id}/blocks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocks: normalizeEventBlockRefs(blocksPayload),
        }),
      })

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error ?? "Failed to save block order")
      }

      toast.success("Gallery block order saved")
      onSaved()
      void mutate()
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
            Sort gallery blocks
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
          ) : orderedIds.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No gallery blocks linked to this event yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {orderedIds.map((blockId, index) => {
                const block = blockById.get(blockId)
                return (
                  <li
                    key={blockId}
                    className="flex items-center gap-2 rounded-xl border bg-card p-3"
                  >
                    <GripVertical className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {block?.title ?? blockId}
                      </p>
                      {block?.galleryBlockSlug ? (
                        <p className="truncate font-mono text-xs text-muted-foreground">
                          {block.galleryBlockSlug}
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
                        disabled={index === orderedIds.length - 1}
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
            disabled={isSaving || !orderedIds.length}
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
