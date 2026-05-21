"use client"

import { useState } from "react"
import useSWR from "swr"
import {
  ArrowUpDown,
  CalendarDays,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import type { EventPublic, Team } from "@/app/types/gallery"
import { toDateInputValue, toTimeInputValue } from "@/lib/gallery/format-dates"
import { normalizeSlug } from "@/lib/gallery/slug"
import { TEAM_LABELS } from "@/lib/gallery/team"
import { EventBlockOrderDialog } from "@/components/admin/event-block-order-dialog"
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
import {
  adminFetch,
  createAdminFetcher,
  useAdminClientId,
} from "@/lib/admin/admin-api"

type FormState = {
  title: string
  eventSlug: string
  coverPicHorizontal: string
  coverPicVertical: string
  subtitle: string
  description: string
  tags: string[]
  team: Team
  eventDate: string
  eventTime: string
  isVisible: boolean
}

const emptyForm = (): FormState => ({
  title: "",
  eventSlug: "",
  coverPicHorizontal: "",
  coverPicVertical: "",
  subtitle: "",
  description: "",
  tags: [],
  team: "both",
  eventDate: "",
  eventTime: "",
  isVisible: false,
})

export function EventsManager() {
  const clientId = useAdminClientId()
  const { data: events = [], isLoading, mutate } = useSWR<EventPublic[]>(
    clientId ? "/api/events" : null,
    createAdminFetcher(clientId),
  )
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [orderEvent, setOrderEvent] = useState<EventPublic | null>(null)
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setDialogOpen(true)
  }

  const openEdit = (event: EventPublic) => {
    setEditingId(event.id)
    setForm({
      title: event.title,
      eventSlug: event.eventSlug ?? "",
      coverPicHorizontal: event.coverPicHorizontal ?? "",
      coverPicVertical: event.coverPicVertical ?? "",
      subtitle: event.subtitle ?? "",
      description: event.description ?? "",
      tags: event.tags ?? [],
      team: event.team,
      eventDate: toDateInputValue(event.eventDate),
      eventTime: toTimeInputValue(event.eventTime),
      isVisible: event.isVisible,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required")
      return
    }
    if (!form.eventDate) {
      toast.error("Event date is required")
      return
    }
    if (!form.eventTime.trim()) {
      toast.error("Event time is required")
      return
    }
    const eventSlug = normalizeSlug(form.eventSlug)
    if (!eventSlug) {
      toast.error("Event slug is required")
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        eventSlug,
        coverPicHorizontal: form.coverPicHorizontal.trim(),
        coverPicVertical: form.coverPicVertical.trim(),
        subtitle: form.subtitle.trim() || undefined,
        description: form.description.trim() || undefined,
        tags: form.tags,
        team: form.team,
        eventDate: form.eventDate,
        eventTime: form.eventTime.trim(),
        isVisible: form.isVisible,
      }

      const response = await adminFetch(
        editingId ? `/api/events/${editingId}` : "/api/events",
        clientId,
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

      toast.success(editingId ? "Event updated" : "Event created")
      await mutate()
      setDialogOpen(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save event",
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (
      !confirm(
        `Delete event "${title}"? Linked gallery blocks for this event will also be removed.`,
      )
    ) {
      return
    }

    const response = await adminFetch(`/api/events/${id}`, clientId, {
      method: "DELETE",
    })
    if (response.ok) {
      toast.success("Event deleted")
      void mutate()
    } else {
      const data = (await response.json()) as { error?: string }
      toast.error(data.error ?? "Failed to delete event")
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Events</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage wedding events shown across the site.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 size-4" />
          Add event
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : events.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No events yet. Create one to get started.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Team</th>
                <th className="px-4 py-3 font-medium">Public</th>
                <th className="px-4 py-3 font-medium">Tags</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-t">
                  <td className="px-4 py-3">
                    <p className="font-medium">{event.title}</p>
                    {event.subtitle ? (
                      <p className="text-xs text-muted-foreground">
                        {event.subtitle}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {event.eventSlug || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {toDateInputValue(event.eventDate) || "—"}
                  </td>
                  <td className="px-4 py-3">{event.eventTime}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{TEAM_LABELS[event.team]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={event.isVisible ? "default" : "outline"}>
                      {event.isVisible ? "Visible" : "Hidden"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(event.tags ?? []).length ? (
                        event.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        title="Sort gallery blocks"
                        onClick={() => {
                          setOrderEvent(event)
                          setOrderDialogOpen(true)
                        }}
                      >
                        <ArrowUpDown className="size-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(event)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => void handleDelete(event.id, event.title)}
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
              <CalendarDays className="size-5" />
              {editingId ? "Edit event" : "New event"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="event-title">Title</Label>
              <Input
                id="event-title"
                value={form.title}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, title: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-slug">Event slug</Label>
              <Input
                id="event-slug"
                value={form.eventSlug}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, eventSlug: event.target.value }))
                }
                onBlur={() =>
                  setForm((prev) => ({
                    ...prev,
                    eventSlug: normalizeSlug(prev.eventSlug),
                  }))
                }
                placeholder="e.g. mehendi-ceremony"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-subtitle">Subtitle</Label>
              <Input
                id="event-subtitle"
                value={form.subtitle}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, subtitle: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-description">Description</Label>
              <Textarea
                id="event-description"
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
            <CoverImageField
              clientId={clientId}
              id="event-cover-horizontal"
              label="Cover image (horizontal)"
              value={form.coverPicHorizontal}
              onChange={(coverPicHorizontal) =>
                setForm((prev) => ({ ...prev, coverPicHorizontal }))
              }
            />
            <CoverImageField
              clientId={clientId}
              id="event-cover-vertical"
              label="Cover image (vertical)"
              value={form.coverPicVertical}
              onChange={(coverPicVertical) =>
                setForm((prev) => ({ ...prev, coverPicVertical }))
              }
            />
            <TagMultiSelect
              clientId={clientId}
              selectedTags={form.tags}
              onTagsChange={(tags) => setForm((prev) => ({ ...prev, tags }))}
            />
            <TeamSelect
              value={form.team}
              onChange={(team) => setForm((prev) => ({ ...prev, team }))}
            />
            <div className="flex items-center gap-2">
              <input
                id="event-visible"
                type="checkbox"
                checked={form.isVisible}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    isVisible: event.target.checked,
                  }))
                }
                className="size-4 rounded border"
              />
              <Label htmlFor="event-visible" className="cursor-pointer">
                Visible on public site
              </Label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="event-date">Event date</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={form.eventDate}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      eventDate: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-time">Event time</Label>
                <Input
                  id="event-time"
                  type="time"
                  value={form.eventTime}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      eventTime: event.target.value,
                    }))
                  }
                />
              </div>
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

      <EventBlockOrderDialog
        clientId={clientId}
        event={orderEvent}
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
        onSaved={() => void mutate()}
      />
    </div>
  )
}
