"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { Loader2, Pencil, Play, Plus, Trash2, Video } from "lucide-react"
import { toast } from "sonner"

import type { EventPublic, VideoBlockPublic } from "@/app/types/gallery"
import { normalizeSlug } from "@/lib/gallery/slug"
import { getVideoThumbnailUrl } from "@/lib/media/video-url"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@workspace/ui/components/button"
import {
  adminFetch,
  createAdminFetcher,
  useAdminClientId,
} from "@/lib/admin/admin-api"

type FormState = {
  parentEventId: string
  title: string
  videoBlockSlug: string
  videoUrl: string
  subtitle: string
  description: string
}

const emptyForm = (): FormState => ({
  parentEventId: "",
  title: "",
  videoBlockSlug: "",
  videoUrl: "",
  subtitle: "",
  description: "",
})

export function VideoBlocksManager() {
  const clientId = useAdminClientId()
  const { data: blocks = [], isLoading, mutate } = useSWR<VideoBlockPublic[]>(
    clientId ? "/api/video-blocks" : null,
    createAdminFetcher(clientId),
  )
  const { data: events = [] } = useSWR<EventPublic[]>(
    clientId ? "/api/events" : null,
    createAdminFetcher(clientId),
  )

  const eventTitleById = useMemo(() => {
    const map = new Map<string, string>()
    for (const event of events) {
      map.set(event.id, event.title)
    }
    return map
  }, [events])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)

  const previewThumbnail = getVideoThumbnailUrl(form.videoUrl)

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setDialogOpen(true)
  }

  const openEdit = (block: VideoBlockPublic) => {
    setEditingId(block.id)
    setForm({
      parentEventId: block.parentEventId,
      title: block.title,
      videoBlockSlug: block.videoBlockSlug ?? "",
      videoUrl: block.videoUrl,
      subtitle: block.subtitle ?? "",
      description: block.description ?? "",
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required")
      return
    }
    if (!form.parentEventId) {
      toast.error("Parent event is required")
      return
    }
    if (!form.videoUrl.trim()) {
      toast.error("Video URL is required")
      return
    }

    const slug = normalizeSlug(form.videoBlockSlug || form.title)
    if (!slug) {
      toast.error("URL slug is required")
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        parentEventId: form.parentEventId,
        title: form.title.trim(),
        videoBlockSlug: slug,
        videoUrl: form.videoUrl.trim(),
        subtitle: form.subtitle.trim() || undefined,
        description: form.description.trim() || undefined,
      }

      const response = await adminFetch(
        editingId ? `/api/video-blocks/${editingId}` : "/api/video-blocks",
        clientId,
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      )

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error ?? "Failed to save video block")
      }

      toast.success(editingId ? "Video block updated" : "Video block created")
      setDialogOpen(false)
      void mutate()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save video block",
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete video block “${title}”?`)) return

    try {
      const response = await adminFetch(
        `/api/video-blocks/${id}`,
        clientId,
        { method: "DELETE" },
      )
      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error ?? "Failed to delete")
      }
      toast.success("Video block deleted")
      void mutate()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete video block",
      )
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Video blocks</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Add YouTube or other video links. Thumbnails are generated from YouTube URLs.
          </p>
        </div>
        <Button onClick={openCreate} disabled={!events.length}>
          <Plus className="mr-2 size-4" />
          Add video
        </Button>
      </div>

      {!events.length && !isLoading ? (
        <p className="mb-4 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          Create at least one event before adding videos.
        </p>
      ) : null}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : blocks.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No video blocks yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Preview</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {blocks.map((block) => (
                <tr key={block.id} className="border-t">
                  <td className="px-4 py-3">
                    {block.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={block.thumbnailUrl}
                        alt=""
                        className="aspect-square h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{block.title}</p>
                    {block.subtitle ? (
                      <p className="text-xs text-muted-foreground">
                        {block.subtitle}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {block.videoBlockSlug || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {eventTitleById.get(block.parentEventId) ??
                      block.parentEventId}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(block)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => void handleDelete(block.id, block.title)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="size-5" />
              {editingId ? "Edit video block" : "New video block"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="video-parent-event">Parent event</Label>
              <select
                id="video-parent-event"
                value={form.parentEventId}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    parentEventId: event.target.value,
                  }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select event…</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="video-title">Title</Label>
              <Input
                id="video-title"
                value={form.title}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, title: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="video-slug">URL slug</Label>
              <Input
                id="video-slug"
                value={form.videoBlockSlug}
                placeholder="auto-from-title"
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    videoBlockSlug: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="video-url">Video URL</Label>
              <Input
                id="video-url"
                type="url"
                placeholder="https://www.youtube.com/watch?v=…"
                value={form.videoUrl}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, videoUrl: event.target.value }))
                }
              />
              <p className="text-muted-foreground text-xs">
                Supports YouTube links (thumbnail preview). Other HTTPS video URLs
                can be saved but may not show a preview.
              </p>
            </div>

            {previewThumbnail ? (
              <div className="overflow-hidden rounded-xl border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewThumbnail}
                  alt="Video thumbnail preview"
                  className="aspect-video w-full object-cover"
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="video-subtitle">Subtitle</Label>
              <Input
                id="video-subtitle"
                value={form.subtitle}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, subtitle: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="video-description">Description</Label>
              <Textarea
                id="video-description"
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSave()} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
