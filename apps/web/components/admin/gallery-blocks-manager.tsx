"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { Images, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import type { EventPublic, GalleryBlockPublic, Team } from "@/app/types/gallery"
import { toDateInputValue } from "@/lib/gallery/format-dates"
import { normalizeSlug } from "@/lib/gallery/slug"
import { TEAM_LABELS } from "@/lib/gallery/team"
import { TeamSelect } from "@/components/gallery/team-select"
import { CoverImageField } from "@/components/media/cover-image-field"
import { TagMultiSelect } from "@/components/media/tag-multi-select"
import { Badge } from "@/components/ui/badge"
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

const fetcher = (url: string) => fetch(url).then((res) => res.json())

type FormState = {
  parentEventId: string
  coverPicHorizontal: string
  coverPicVertical: string
  title: string
  galleryBlockSlug: string
  subtitle: string
  description: string
  tags: string[]
  team: Team
  captureDate: string
}

const emptyForm = (): FormState => ({
  parentEventId: "",
  coverPicHorizontal: "",
  coverPicVertical: "",
  title: "",
  galleryBlockSlug: "",
  subtitle: "",
  description: "",
  tags: [],
  team: "both",
  captureDate: "",
})

export function GalleryBlocksManager() {
  const { data: blocks = [], isLoading, mutate } = useSWR<GalleryBlockPublic[]>(
    "/api/gallery-blocks",
    fetcher,
  )
  const { data: events = [] } = useSWR<EventPublic[]>("/api/events", fetcher)

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

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setDialogOpen(true)
  }

  const openEdit = (block: GalleryBlockPublic) => {
    setEditingId(block.id)
    setForm({
      parentEventId: block.parentEventId,
      coverPicHorizontal: block.coverPicHorizontal,
      coverPicVertical: block.coverPicVertical,
      title: block.title,
      galleryBlockSlug: block.galleryBlockSlug ?? "",
      subtitle: block.subtitle ?? "",
      description: block.description ?? "",
      tags: block.tags ?? [],
      team: block.team,
      captureDate: toDateInputValue(block.captureDate),
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required")
      return
    }
    if (!form.coverPicHorizontal.trim()) {
      toast.error("Horizontal cover image is required")
      return
    }
    if (!form.coverPicVertical.trim()) {
      toast.error("Vertical cover image is required")
      return
    }
    if (!form.parentEventId) {
      toast.error("Parent event is required")
      return
    }
    if (!form.captureDate) {
      toast.error("Capture date is required")
      return
    }
    const galleryBlockSlug = normalizeSlug(form.galleryBlockSlug)
    if (!galleryBlockSlug) {
      toast.error("Gallery block slug is required")
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        parentEventId: form.parentEventId,
        coverPicHorizontal: form.coverPicHorizontal.trim(),
        coverPicVertical: form.coverPicVertical.trim(),
        title: form.title.trim(),
        galleryBlockSlug,
        subtitle: form.subtitle.trim() || undefined,
        description: form.description.trim() || undefined,
        tags: form.tags,
        team: form.team,
        captureDate: form.captureDate,
      }

      const response = await fetch(
        editingId ? `/api/gallery-blocks/${editingId}` : "/api/gallery-blocks",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      )

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error ?? "Save failed")
      }

      toast.success(editingId ? "Gallery block updated" : "Gallery block created")
      await mutate()
      setDialogOpen(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save gallery block",
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete gallery block "${title}"?`)) return

    const response = await fetch(`/api/gallery-blocks/${id}`, {
      method: "DELETE",
    })
    if (response.ok) {
      toast.success("Gallery block deleted")
      void mutate()
    } else {
      const data = (await response.json()) as { error?: string }
      toast.error(data.error ?? "Failed to delete gallery block")
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Gallery blocks</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage gallery sections linked to events.
          </p>
        </div>
        <Button onClick={openCreate} disabled={!events.length}>
          <Plus className="mr-2 size-4" />
          Add gallery block
        </Button>
      </div>

      {!events.length && !isLoading ? (
        <p className="mb-4 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          Create at least one event before adding gallery blocks.
        </p>
      ) : null}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : blocks.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No gallery blocks yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Covers</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Capture date</th>
                <th className="px-4 py-3 font-medium">Team</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {blocks.map((block) => (
                <tr key={block.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {block.coverPicHorizontal ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={block.coverPicHorizontal}
                          alt="Horizontal cover"
                          title="Horizontal"
                          className="h-12 w-16 rounded-lg object-cover"
                        />
                      ) : null}
                      {block.coverPicVertical ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={block.coverPicVertical}
                          alt="Vertical cover"
                          title="Vertical"
                          className="h-12 w-9 rounded-lg object-cover"
                        />
                      ) : null}
                      {!block.coverPicHorizontal && !block.coverPicVertical
                        ? "—"
                        : null}
                    </div>
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
                    {block.galleryBlockSlug || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {eventTitleById.get(block.parentEventId) ??
                      block.parentEventId}
                  </td>
                  <td className="px-4 py-3">
                    {toDateInputValue(block.captureDate) || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{TEAM_LABELS[block.team]}</Badge>
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
              <Images className="size-5" />
              {editingId ? "Edit gallery block" : "New gallery block"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="block-parent-event">Parent event</Label>
              <select
                id="block-parent-event"
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
            <CoverImageField
              id="block-cover-horizontal"
              label="Cover image (horizontal)"
              value={form.coverPicHorizontal}
              onChange={(coverPicHorizontal) =>
                setForm((prev) => ({ ...prev, coverPicHorizontal }))
              }
            />
            <CoverImageField
              id="block-cover-vertical"
              label="Cover image (vertical)"
              value={form.coverPicVertical}
              onChange={(coverPicVertical) =>
                setForm((prev) => ({ ...prev, coverPicVertical }))
              }
            />
            <div className="space-y-2">
              <Label htmlFor="block-title">Title</Label>
              <Input
                id="block-title"
                value={form.title}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, title: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="block-slug">Gallery block slug</Label>
              <Input
                id="block-slug"
                value={form.galleryBlockSlug}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    galleryBlockSlug: event.target.value,
                  }))
                }
                onBlur={() =>
                  setForm((prev) => ({
                    ...prev,
                    galleryBlockSlug: normalizeSlug(prev.galleryBlockSlug),
                  }))
                }
                placeholder="e.g. ceremony-highlights"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="block-subtitle">Subtitle</Label>
              <Input
                id="block-subtitle"
                value={form.subtitle}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, subtitle: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="block-description">Description</Label>
              <Textarea
                id="block-description"
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                rows={4}
              />
            </div>
            <TagMultiSelect
              selectedTags={form.tags}
              onTagsChange={(tags) => setForm((prev) => ({ ...prev, tags }))}
            />
            <TeamSelect
              value={form.team}
              onChange={(team) => setForm((prev) => ({ ...prev, team }))}
            />
            <div className="space-y-2">
              <Label htmlFor="block-capture-date">Capture date</Label>
              <Input
                id="block-capture-date"
                type="date"
                value={form.captureDate}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    captureDate: event.target.value,
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
