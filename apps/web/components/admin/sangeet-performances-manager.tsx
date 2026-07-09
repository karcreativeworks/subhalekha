"use client"

import Link from "next/link"
import { useState } from "react"
import useSWR from "swr"
import {
  ArrowDown,
  ArrowUp,
  Clock,
  ExternalLink,
  GripVertical,
  Loader2,
  Mic2,
  Music,
  Pencil,
  Sparkles,
  Trash2,
  User,
  Users,
  UsersRound,
} from "lucide-react"
import { toast } from "sonner"

import type {
  SangeetDurationMinutes,
  SangeetGang,
  SangeetPerformancePublic,
  SangeetPerformanceType,
} from "@/app/types/sangeet-performance"
import {
  SANGEET_DURATIONS,
  SANGEET_GANGS,
  SANGEET_PERFORMANCE_TYPES,
} from "@/app/types/sangeet-performance"
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
import {
  SANGEET_DURATION_LABELS,
  SANGEET_GANG_LABELS,
  SANGEET_PERFORMANCE_TYPE_LABELS,
} from "@/lib/sangeet/performance-constants"

type FormState = {
  title: string
  performerCount: string
  performerNames: string
  performanceType: SangeetPerformanceType
  gang: SangeetGang
  songs: string
  durationMinutes: SangeetDurationMinutes
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

function performanceToForm(performance: SangeetPerformancePublic): FormState {
  return {
    title: performance.title,
    performerCount: String(performance.performerCount),
    performerNames: performance.performerNames,
    performanceType: performance.performanceType,
    gang: performance.gang,
    songs: performance.songs,
    durationMinutes: performance.durationMinutes,
  }
}

export function SangeetPerformancesManager() {
  const clientId = useAdminClientId()
  const { data: performances = [], isLoading, mutate } = useSWR<
    SangeetPerformancePublic[]
  >(
    clientId ? "/api/sangeet-performances" : null,
    createAdminFetcher(clientId),
  )

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [reorderingId, setReorderingId] = useState<string | null>(null)

  const openEdit = (performance: SangeetPerformancePublic) => {
    setEditingId(performance.id)
    setForm(performanceToForm(performance))
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form || !editingId) return

    if (
      !form.title.trim() ||
      !form.performerNames.trim() ||
      !form.songs.trim()
    ) {
      toast.error("Please fill in all required fields")
      return
    }

    const performerCount = Number.parseInt(form.performerCount, 10)
    if (!Number.isInteger(performerCount) || performerCount < 1) {
      toast.error("Performer count must be at least 1")
      return
    }

    setIsSaving(true)
    try {
      const response = await adminFetch(
        `/api/sangeet-performances/${editingId}`,
        clientId,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title.trim(),
            performerCount,
            performerNames: form.performerNames.trim(),
            performanceType: form.performanceType,
            gang: form.gang,
            songs: form.songs.trim(),
            durationMinutes: form.durationMinutes,
          }),
        },
      )

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error ?? "Update failed")
      }

      toast.success("Performance updated")
      setDialogOpen(false)
      void mutate()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update performance",
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete performance “${title}”?`)) return

    try {
      const response = await adminFetch(
        `/api/sangeet-performances/${id}`,
        clientId,
        { method: "DELETE" },
      )
      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error ?? "Delete failed")
      }
      toast.success("Performance deleted")
      void mutate()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete performance",
      )
    }
  }

  const handleMove = async (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= performances.length) return

    const next = [...performances]
    const [removed] = next.splice(index, 1)
    if (!removed) return

    next.splice(nextIndex, 0, removed)
    const movingId = removed.id
    setReorderingId(movingId)

    await mutate(next, { revalidate: false })

    try {
      const response = await adminFetch(
        "/api/sangeet-performances/reorder",
        clientId,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderedIds: next.map((row) => row.id) }),
        },
      )

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error ?? "Reorder failed")
      }

      const updated = (await response.json()) as SangeetPerformancePublic[]
      await mutate(updated, { revalidate: false })
    } catch (error) {
      await mutate()
      toast.error(
        error instanceof Error ? error.message : "Failed to reorder performances",
      )
    } finally {
      setReorderingId(null)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Sangeet performances
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Reorder acts for the public plan page and edit any performance
            details. Performer names are visible here only.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/guide/sangeet/plan" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 size-4" />
            Public plan page
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
        </div>
      ) : performances.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">
          No performances yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Performers</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Gang</th>
                <th className="px-4 py-3 font-medium">Songs</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {performances.map((row, index) => (
                <tr key={row.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <GripVertical className="text-muted-foreground size-4 shrink-0" />
                      <div className="flex flex-col gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-7"
                          disabled={
                            index === 0 ||
                            reorderingId !== null
                          }
                          onClick={() => void handleMove(index, -1)}
                          aria-label="Move up"
                        >
                          <ArrowUp className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-7"
                          disabled={
                            index === performances.length - 1 ||
                            reorderingId !== null
                          }
                          onClick={() => void handleMove(index, 1)}
                          aria-label="Move down"
                        >
                          <ArrowDown className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </td>
                  <td className="text-muted-foreground px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3 font-medium">
                    <button
                      type="button"
                      className="hover:text-primary text-left transition-colors"
                      onClick={() => openEdit(row)}
                    >
                      {row.title}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-muted-foreground text-xs">
                        {row.performerCount}{" "}
                        {row.performerCount === 1 ? "performer" : "performers"}
                      </span>
                      <span className="break-words whitespace-pre-wrap">
                        {row.performerNames}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">
                      {SANGEET_PERFORMANCE_TYPE_LABELS[row.performanceType]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{SANGEET_GANG_LABELS[row.gang]}</td>
                  <td className="text-muted-foreground max-w-[200px] px-4 py-3 break-words whitespace-pre-wrap">
                    {row.songs}
                  </td>
                  <td className="px-4 py-3">
                    {SANGEET_DURATION_LABELS[row.durationMinutes]}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(row)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => void handleDelete(row.id, row.title)}
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
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic2 className="size-5" />
              Edit performance
            </DialogTitle>
          </DialogHeader>

          {form ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <UsersRound className="text-muted-foreground size-4" />
                    Gang
                  </Label>
                  <select
                    value={form.gang}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev
                          ? { ...prev, gang: event.target.value as SangeetGang }
                          : prev,
                      )
                    }
                    className={selectClassName}
                  >
                    {SANGEET_GANGS.map((gang) => (
                      <option key={gang} value={gang}>
                        {SANGEET_GANG_LABELS[gang]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Sparkles className="text-muted-foreground size-4" />
                    Type
                  </Label>
                  <select
                    value={form.performanceType}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev
                          ? {
                            ...prev,
                            performanceType:
                              event.target.value as SangeetPerformanceType,
                          }
                          : prev,
                      )
                    }
                    className={selectClassName}
                  >
                    {SANGEET_PERFORMANCE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {SANGEET_PERFORMANCE_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="admin-performer-count"
                    className="flex items-center gap-2"
                  >
                    <Users className="text-muted-foreground size-4" />
                    Total performers
                  </Label>
                  <Input
                    id="admin-performer-count"
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    value={form.performerCount}
                    onChange={(event) => {
                      const value = event.target.value
                      if (value !== "" && !/^\d+$/.test(value)) return
                      setForm((prev) =>
                        prev ? { ...prev, performerCount: value } : prev,
                      )
                    }}
                    onBlur={() => {
                      setForm((prev) => {
                        if (!prev) return prev
                        const parsed = Number.parseInt(prev.performerCount, 10)
                        if (!Number.isInteger(parsed) || parsed < 1) {
                          return { ...prev, performerCount: "1" }
                        }
                        return { ...prev, performerCount: String(parsed) }
                      })
                    }}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="admin-title" className="flex items-center gap-2">
                    <Mic2 className="text-muted-foreground size-4" />
                    Title
                  </Label>
                  <Input
                    id="admin-title"
                    value={form.title}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev ? { ...prev, title: event.target.value } : prev,
                      )
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="text-muted-foreground size-4" />
                    Duration
                  </Label>
                  <select
                    value={form.durationMinutes}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev
                          ? {
                            ...prev,
                            durationMinutes: Number(
                              event.target.value,
                            ) as SangeetDurationMinutes,
                          }
                          : prev,
                      )
                    }
                    className={selectClassName}
                  >
                    {SANGEET_DURATIONS.map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {SANGEET_DURATION_LABELS[minutes]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="admin-performer-names"
                  className="flex items-center gap-2"
                >
                  <User className="text-muted-foreground size-4" />
                  Name / names of performers
                </Label>
                <Textarea
                  id="admin-performer-names"
                  value={form.performerNames}
                  onChange={(event) =>
                    setForm((prev) =>
                      prev
                        ? { ...prev, performerNames: event.target.value }
                        : prev,
                    )
                  }
                  rows={2}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-songs" className="flex items-center gap-2">
                  <Music className="text-muted-foreground size-4" />
                  Songs / song titles
                </Label>
                <Textarea
                  id="admin-songs"
                  value={form.songs}
                  onChange={(event) =>
                    setForm((prev) =>
                      prev ? { ...prev, songs: event.target.value } : prev,
                    )
                  }
                  rows={3}
                  required
                />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSave()} disabled={isSaving || !form}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
