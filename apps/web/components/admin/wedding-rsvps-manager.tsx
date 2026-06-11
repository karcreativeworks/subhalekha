"use client"

import Link from "next/link"
import { useState } from "react"
import useSWR from "swr"
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Trash2,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import type {
  WeddingRsvpGang,
  WeddingRsvpListResponse,
  WeddingRsvpPublic,
} from "@/app/types/wedding-rsvp"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@workspace/ui/components/button"
import {
  adminFetch,
  createAdminFetcher,
  useAdminClientId,
} from "@/lib/admin/admin-api"
import { SANGEET_GANG_LABELS } from "@/lib/sangeet/performance-constants"
import { WEDDING_RSVPS_PAGE_SIZE } from "@/lib/rsvp/pagination"
import {
  WEDDING_EVENT_BY_ID,
  WEDDING_RSVP_DATES,
} from "@/lib/rsvp/wedding-events"

type GangFilter = WeddingRsvpGang | "all"

const dateLabelByKey = Object.fromEntries(
  WEDDING_RSVP_DATES.map((day) => [day.key, `${day.monthDayLabel} (${day.dayName})`]),
)

export function WeddingRsvpsManager() {
  const clientId = useAdminClientId()
  const [page, setPage] = useState(1)
  const [gangFilter, setGangFilter] = useState<GangFilter>("all")

  const listUrl =
    clientId &&
    `/api/wedding-rsvps?page=${page}&limit=${WEDDING_RSVPS_PAGE_SIZE}&gang=${gangFilter}`

  const { data, isLoading, mutate } = useSWR<WeddingRsvpListResponse>(
    listUrl,
    createAdminFetcher(clientId),
  )

  const [deleteTarget, setDeleteTarget] = useState<WeddingRsvpPublic | null>(
    null,
  )
  const [isDeleting, setIsDeleting] = useState(false)

  const items = data?.items ?? []
  const totalPages = data?.totalPages ?? 1
  const total = data?.total ?? 0

  const handleGangFilter = (next: GangFilter) => {
    setGangFilter(next)
    setPage(1)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)
    try {
      const response = await adminFetch(
        `/api/wedding-rsvps/${deleteTarget.id}`,
        clientId,
        { method: "DELETE" },
      )

      if (!response.ok) {
        const body = (await response.json()) as { error?: string }
        throw new Error(body.error ?? "Delete failed")
      }

      toast.success("RSVP deleted")
      setDeleteTarget(null)

      if (items.length === 1 && page > 1) {
        setPage(page - 1)
      } else {
        await mutate()
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete RSVP",
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Wedding RSVPs
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Guest responses from the public RSVP form.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/rsvp" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 size-4" />
            Public RSVP page
          </Link>
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-sm">Filter by team:</span>
        {(["all", "bride", "groom"] as const).map((value) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={gangFilter === value ? "default" : "outline"}
            onClick={() => handleGangFilter(value)}
          >
            {value === "all"
              ? "All"
              : SANGEET_GANG_LABELS[value as WeddingRsvpGang]}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">
          No RSVPs yet{gangFilter !== "all" ? " for this team" : ""}.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border">
            <table className="w-full min-w-[960px] text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Guest</th>
                  <th className="px-4 py-3 font-medium">Team</th>
                  <th className="px-4 py-3 font-medium">Attendees</th>
                  <th className="px-4 py-3 font-medium">Dates</th>
                  <th className="px-4 py-3 font-medium">Events</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, index) => {
                  const rowNumber =
                    (page - 1) * WEDDING_RSVPS_PAGE_SIZE + index + 1
                  return (
                    <tr key={row.id} className="border-t align-top">
                      <td className="text-muted-foreground px-4 py-3">
                        {rowNumber}
                      </td>
                      <td className="px-4 py-3 font-medium">{row.guestName}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">
                          {SANGEET_GANG_LABELS[row.gang]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 text-xs">
                          <span className="flex items-center gap-1.5">
                            <Users className="text-muted-foreground size-3.5" />
                            {row.totalAttendees} total
                          </span>
                          <span className="text-muted-foreground">
                            {row.adultCount} adults · {row.childrenCount}{" "}
                            children
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <ul className="space-y-1 text-xs">
                          {row.selectedDates.map((dateKey) => (
                            <li
                              key={dateKey}
                              className="flex items-center gap-1.5"
                            >
                              <CalendarDays className="text-muted-foreground size-3.5 shrink-0" />
                              {dateLabelByKey[dateKey] ?? dateKey}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-4 py-3">
                        <ul className="space-y-1 text-xs">
                          {row.eventIds.map((eventId) => (
                            <li key={eventId}>
                              {WEDDING_EVENT_BY_ID[eventId]?.title ?? eventId}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="text-muted-foreground px-4 py-3 text-xs whitespace-nowrap">
                        {new Date(row.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          aria-label={`Delete RSVP for ${row.guestName}`}
                          onClick={() => setDeleteTarget(row)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <nav
            className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row"
            aria-label="RSVP list pagination"
          >
            <p className="text-muted-foreground text-sm">
              Page {page} of {totalPages}
              <span> · {total} RSVPs</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="mr-1 size-4" />
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
                <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          </nav>
        </>
      )}

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteTarget(null)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete RSVP?</DialogTitle>
            <DialogDescription>
              This will permanently remove the RSVP for{" "}
              <span className="text-foreground font-medium">
                {deleteTarget?.guestName}
              </span>
              {deleteTarget ? (
                <>
                  {" "}
                  ({deleteTarget.totalAttendees}{" "}
                  {deleteTarget.totalAttendees === 1 ? "guest" : "guests"},{" "}
                  {SANGEET_GANG_LABELS[deleteTarget.gang]}). This cannot be
                  undone.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={() => void handleDelete()}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete RSVP"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
