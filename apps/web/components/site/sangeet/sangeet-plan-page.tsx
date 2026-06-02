"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import useSWR from "swr"
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Mic2,
  Music,
  Pencil,
  Send,
  Sparkles,
  Trash2,
  User,
  Users,
  UsersRound,
  X,
} from "lucide-react"
import { toast } from "sonner"

import type {
  CreateSangeetPerformanceRequest,
  SangeetDurationMinutes,
  SangeetGang,
  SangeetPerformanceCreated,
  SangeetPerformanceListResponse,
  SangeetPerformancePublic,
  SangeetPerformanceType,
} from "@/app/types/sangeet-performance"
import {
  SANGEET_DURATIONS,
  SANGEET_GANGS,
  SANGEET_PERFORMANCE_TYPES,
} from "@/app/types/sangeet-performance"
import { useSiteGang } from "@/components/site/site-gang-provider"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import {
  SANGEET_DURATION_LABELS,
  SANGEET_GANG_LABELS,
  SANGEET_PERFORMANCE_TYPE_LABELS,
  SANGEET_PLAN_HERO_DESKTOP,
  SANGEET_PLAN_HERO_MOBILE,
} from "@/lib/sangeet/performance-constants"
import { SANGEET_PERFORMANCES_PAGE_SIZE } from "@/lib/sangeet/pagination"
import {
  addMySangeetPerformance,
  type MySangeetPerformanceRef,
  readMySangeetPerformances,
  removeMySangeetPerformance,
  isMySangeetPerformance,
  getMySangeetPerformanceToken,
} from "@/lib/sangeet/my-performances-storage"

const API_URL = "/api/public/sangeet/performances"

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    const data = (await response.json()) as { error?: string }
    throw new Error(data.error ?? "Failed to load performances")
  }
  return response.json() as Promise<SangeetPerformanceListResponse>
}

type FormState = {
  title: string
  performerCount: number
  performerNames: string
  performanceType: SangeetPerformanceType
  gang: SangeetGang
  songs: string
  durationMinutes: SangeetDurationMinutes
}

const emptyForm = (gang: SangeetGang = "bride"): FormState => ({
  title: "",
  performerCount: 1,
  performerNames: "",
  performanceType: "mixed_group_dance",
  gang,
  songs: "",
  durationMinutes: 2,
})

function performanceToForm(performance: SangeetPerformancePublic): FormState {
  return {
    title: performance.title,
    performerCount: performance.performerCount,
    performerNames: performance.performerNames,
    performanceType: performance.performanceType,
    gang: performance.gang,
    songs: performance.songs,
    durationMinutes: performance.durationMinutes,
  }
}

const sangeetPanelClassName = cn(
  "relative overflow-hidden rounded-2xl border border-sky-800/45 p-6 shadow-xl sm:p-8",
  "bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950",
  "ring-1 ring-sky-500/15",
)

const sangeetPanelGlowClassName =
  "pointer-events-none absolute -top-24 right-0 size-48 rounded-full bg-sky-500/10 blur-3xl"

const sangeetBadgeClassName =
  "border-sky-700/50 bg-sky-950/80 text-sky-200 hover:bg-sky-950/80"

const sangeetOutlineButtonClassName =
  "border-sky-700/60 bg-slate-950/50 text-sky-100 hover:bg-sky-950/80 hover:text-sky-50"

const sangeetFormControlClassName = cn(
  "border-sky-800/55 bg-slate-950/75 text-sky-50 shadow-inner",
  "placeholder:text-sky-200/35",
  "focus-visible:border-sky-400 focus-visible:ring-sky-400/35",
)

const sangeetFormSelectClassName = cn(
  "flex h-10 w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors",
  "focus-visible:ring-[3px]",
  sangeetFormControlClassName,
)

function FieldIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-950/90 text-sky-400 ring-1 ring-sky-700/45">
      {children}
    </span>
  )
}

function FormRow({
  icon,
  label,
  htmlFor,
  children,
}: {
  icon: React.ReactNode
  label: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={htmlFor}
        className="flex items-center gap-2 text-sky-100/95"
      >
        <FieldIcon>{icon}</FieldIcon>
        {label}
      </Label>
      {children}
    </div>
  )
}

function PerformanceOwnerActions({
  row,
  onEdit,
  onDelete,
}: {
  row: SangeetPerformancePublic
  onEdit: (performance: SangeetPerformancePublic) => void
  onDelete: (id: string, title: string) => void
}) {
  return (
    <div className="flex shrink-0 gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn("size-8", sangeetOutlineButtonClassName)}
        aria-label={`Edit ${row.title}`}
        onClick={() => onEdit(row)}
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-8 border-red-900/50 bg-slate-950/50 text-red-300 hover:bg-red-950/40 hover:text-red-200"
        aria-label={`Delete ${row.title}`}
        onClick={() => void onDelete(row.id, row.title)}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
}

function PerformanceSongsAndPerformers({
  row,
}: {
  row: SangeetPerformancePublic
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <p className="min-w-0 break-words whitespace-pre-wrap text-sky-50">
        {row.songs}
      </p>
      <p className="text-xs text-sky-200/60">
        {row.performerCount}{" "}
        {row.performerCount === 1 ? "performer" : "performers"}
        {": "}
        <span className="select-none blur-[5px]" aria-hidden>
          {row.performerNames}
        </span>
      </p>
    </div>
  )
}

function PerformanceListPagination({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
}) {
  return (
    <nav
      className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-sky-800/40 pt-5 sm:flex-row"
      aria-label="Performance list pagination"
    >
      <p className="text-sm text-sky-200/70">
        Page {page} of {totalPages}
        <span className="text-sky-200/50"> · {total} performances</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          className={sangeetOutlineButtonClassName}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="mr-1 size-4" />
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          className={sangeetOutlineButtonClassName}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="ml-1 size-4" />
        </Button>
      </div>
    </nav>
  )
}

function SangeetPerformanceCard({
  row,
  rowNumber,
  isMine,
  onEdit,
  onDelete,
}: {
  row: SangeetPerformancePublic
  rowNumber: number
  isMine: boolean
  onEdit: (performance: SangeetPerformancePublic) => void
  onDelete: (id: string, title: string) => void
}) {
  return (
    <article
      className={cn(
        "relative rounded-xl border border-sky-800/45 bg-slate-950/50 p-4 shadow-inner",
        "ring-1 ring-sky-500/10",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2 pr-20">
          <h3 className="text-base font-semibold leading-snug text-sky-50">
            #{rowNumber}. {row.title}
          </h3>
          <Badge
            variant="secondary"
            className={cn("absolute top-4 right-4 w-fit text-xs", sangeetBadgeClassName)}
          >
            {SANGEET_PERFORMANCE_TYPE_LABELS[row.performanceType]}
          </Badge>
        </div>
        {isMine ? (
          <PerformanceOwnerActions row={row} onEdit={onEdit} onDelete={onDelete} />
        ) : null}
      </div>

      <div className="mt-4">
        <PerformanceSongsAndPerformers row={row} />
      </div>

      <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-sky-200/65">
        <div className="flex gap-1.5">
          <dt className="font-medium text-sky-300/80">Gang</dt>
          <dd>{SANGEET_GANG_LABELS[row.gang]}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="font-medium text-sky-300/80">Duration</dt>
          <dd>{SANGEET_DURATION_LABELS[row.durationMinutes]}</dd>
        </div>
      </dl>
    </article>
  )
}

export function SangeetPlanPage() {
  const { gang: siteGang } = useSiteGang()
  const listSectionRef = useRef<HTMLElement>(null)
  const [page, setPage] = useState(1)
  const listUrl = `${API_URL}?page=${page}&limit=${SANGEET_PERFORMANCES_PAGE_SIZE}`

  const { data, isLoading, mutate } = useSWR<SangeetPerformanceListResponse>(
    listUrl,
    fetcher,
  )

  const performances = data?.items ?? []
  const totalPages = data?.totalPages ?? 1
  const total = data?.total ?? 0

  const [form, setForm] = useState<FormState>(() => emptyForm())
  const [myPerformances, setMyPerformances] = useState<MySangeetPerformanceRef[]>(
    [],
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setMyPerformances(readMySangeetPerformances())
  }, [])

  useEffect(() => {
    if (siteGang && !editingId) {
      setForm((prev) => ({ ...prev, gang: siteGang }))
    }
  }, [siteGang, editingId])

  const setPerformerCount = (count: number) => {
    const next = Math.min(10, Math.max(1, count))
    setForm((prev) => ({ ...prev, performerCount: next }))
  }

  const goToPage = (nextPage: number) => {
    setPage(nextPage)
    listSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const rowNumber = (index: number) =>
    (page - 1) * SANGEET_PERFORMANCES_PAGE_SIZE + index + 1

  const resetForm = () => {
    setEditingId(null)
    setForm(emptyForm(siteGang ?? "bride"))
  }

  const startEdit = (performance: SangeetPerformancePublic) => {
    setEditingId(performance.id)
    setForm(performanceToForm(performance))
    document.getElementById("sangeet-performance-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  const handleDelete = async (id: string, title: string) => {
    const token = getMySangeetPerformanceToken(id)
    if (!token) return

    if (!confirm(`Remove “${title}” from the plan?`)) return

    try {
      const response = await fetch(
        `${API_URL}/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submissionToken: token }),
        },
      )

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error ?? "Delete failed")
      }

      removeMySangeetPerformance(id)
      setMyPerformances(readMySangeetPerformances())
      if (editingId === id) resetForm()
      if (performances.length === 1 && page > 1) {
        setPage(page - 1)
      } else {
        await mutate()
      }
      toast.success("Performance removed")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete performance",
      )
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (
      !form.title.trim() ||
      !form.performerNames.trim() ||
      !form.songs.trim()
    ) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    const payload: CreateSangeetPerformanceRequest = {
      title: form.title.trim(),
      performerCount: form.performerCount,
      performerNames: form.performerNames.trim(),
      performanceType: form.performanceType,
      gang: form.gang,
      songs: form.songs.trim(),
      durationMinutes: form.durationMinutes,
    }

    try {
      if (editingId) {
        const token = getMySangeetPerformanceToken(editingId)
        if (!token) {
          throw new Error("You can only edit performances added on this device")
        }

        const response = await fetch(
          `${API_URL}/${encodeURIComponent(editingId)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payload, submissionToken: token }),
          },
        )

        if (!response.ok) {
          const data = (await response.json()) as { error?: string }
          throw new Error(data.error ?? "Update failed")
        }

        await mutate()
        resetForm()
        toast.success("Performance updated")
      } else {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const data = (await response.json()) as { error?: string }
          throw new Error(data.error ?? "Submit failed")
        }

        const created = (await response.json()) as SangeetPerformanceCreated
        addMySangeetPerformance(created.id, created.submissionToken)
        setMyPerformances(readMySangeetPerformances())
        setPage(1)
        await mutate()
        resetForm()
        toast.success("Performance added to the plan")
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save performance",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-black -mb-16">
      <section className="relative h-[calc(100svh-60px)] w-full overflow-hidden">
        <Image
          src={SANGEET_PLAN_HERO_MOBILE}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover md:hidden"
        />
        <Image
          src={SANGEET_PLAN_HERO_DESKTOP}
          alt=""
          fill
          priority
          sizes="100vw"
          className="hidden object-cover md:block"
        />
        <div
          className="absolute inset-0 md:top-[50%] bg-gradient-to-t from-black/80 via-black/25 to-black/10"
          aria-hidden
        />
        <div className="absolute inset-x-0 bottom-0 px-4 pb-10 pt-24 sm:px-6 flex flex-col items-end justify-end">
          <p className="text-white/80 text-xs md:text-xl font-medium tracking-[0.25em] uppercase">
            Sangeet guide
          </p>
          <h1 className="mt-2 text-3xl md:text-5xl font-semibold tracking-tight text-white sm:text-4xl">
            Performance plan
          </h1>
          <p className="mt-2 max-w-xl text-sm md:text-base text-white/85 sm:text-base text-right">
            Add your act below. Names stay hidden on this list until show day.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-10 px-2 pt-10 sm:px-6 pb-16">
        <section
          id="sangeet-performance-form"
          className={sangeetPanelClassName}
        >
          <div className={sangeetPanelGlowClassName} aria-hidden />
          <div className="relative mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-4xl font-semibold tracking-tight text-sky-400">
                {editingId ? "Edit your performance" : "Add your performance"}
              </h2>
              <p className="mt-1 text-sm text-sky-200/65">
                {editingId
                  ? "Update your entry, then save. Only performances added on this browser can be changed here."
                  : "Submit once per act. The schedule below updates immediately."}
              </p>
            </div>
            {editingId ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetForm}
                className={sangeetOutlineButtonClassName}
              >
                <X className="mr-2 size-4" />
                Cancel edit
              </Button>
            ) : null}
          </div>

          <form
            className="relative space-y-6"
            onSubmit={(event) => void handleSubmit(event)}
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <FormRow icon={<UsersRound className="size-4" />} label="Gang">
                <select
                  value={form.gang}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      gang: event.target.value as SangeetGang,
                    }))
                  }
                  className={sangeetFormSelectClassName}
                >
                  {SANGEET_GANGS.map((gang) => (
                    <option key={gang} value={gang}>
                      {SANGEET_GANG_LABELS[gang]}
                    </option>
                  ))}
                </select>
              </FormRow>

              <FormRow icon={<Sparkles className="size-4" />} label="Type">
                <select
                  value={form.performanceType}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      performanceType:
                        event.target.value as SangeetPerformanceType,
                    }))
                  }
                  className={sangeetFormSelectClassName}
                >
                  {SANGEET_PERFORMANCE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {SANGEET_PERFORMANCE_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </FormRow>

              <FormRow
                icon={<Users className="size-4" />}
                label="Total performers"
                htmlFor="sangeet-performer-count"
              >
                <Input
                  id="sangeet-performer-count"
                  type="number"
                  min={1}
                  max={10}
                  step={1}
                  inputMode="numeric"
                  value={form.performerCount}
                  onChange={(event) =>
                    setPerformerCount(Number(event.target.value))
                  }
                  className={sangeetFormControlClassName}
                  required
                />
              </FormRow>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormRow
                icon={<Mic2 className="size-4" />}
                label="Title of performance"
                htmlFor="sangeet-title"
              >
                <Input
                  id="sangeet-title"
                  value={form.title}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="e.g. Bollywood mashup"
                  className={sangeetFormControlClassName}
                  required
                />
              </FormRow>

              <FormRow icon={<Clock className="size-4" />} label="Duration">
                <select
                  value={form.durationMinutes}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      durationMinutes: Number(
                        event.target.value,
                      ) as SangeetDurationMinutes,
                    }))
                  }
                  className={sangeetFormSelectClassName}
                >
                  {SANGEET_DURATIONS.map((minutes) => (
                    <option key={minutes} value={minutes}>
                      {SANGEET_DURATION_LABELS[minutes]}
                    </option>
                  ))}
                </select>
              </FormRow>
            </div>

            <FormRow
              icon={<User className="size-4" />}
              label="Name / names of performers"
              htmlFor="sangeet-performer-names"
            >
              <Textarea
                id="sangeet-performer-names"
                value={form.performerNames}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    performerNames: event.target.value,
                  }))
                }
                placeholder="e.g. Priya, Ananya and friends"
                rows={2}
                className={sangeetFormControlClassName}
                required
              />
            </FormRow>

            <FormRow
              icon={<Music className="size-4" />}
              label="Songs / song titles"
              htmlFor="sangeet-songs"
            >
              <Textarea
                id="sangeet-songs"
                value={form.songs}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, songs: event.target.value }))
                }
                placeholder="List the songs or medley title"
                rows={3}
                className={sangeetFormControlClassName}
                required
              />
            </FormRow>

            <Button
              type="submit"
              size="lg"
              className="w-full bg-sky-500 text-slate-950 hover:bg-sky-400 sm:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {editingId ? "Saving…" : "Submitting…"}
                </>
              ) : (
                <>
                  <Send className="mr-2 size-4" />
                  {editingId ? "Save changes" : "Submit"}
                </>
              )}
            </Button>
          </form>
        </section>

        <section
          ref={listSectionRef}
          id="sangeet-performance-list"
          className={`${sangeetPanelClassName} pb-16`}
        >
          <div
            className="pointer-events-none absolute -bottom-24 left-0 size-48 rounded-full bg-sky-600/10 blur-3xl"
            aria-hidden
          />
          <div className="relative mb-6">
            <h2 className="text-4xl font-semibold tracking-tight text-sky-400">
              Scheduled performances
            </h2>
            <p className="mt-1 text-sm text-sky-200/65">
              Performer names are blurred for privacy. Newest entries appear first.
            </p>
          </div>

          {isLoading ? (
            <div className="relative flex justify-center py-12">
              <Loader2 className="size-6 animate-spin text-sky-400" />
            </div>
          ) : total === 0 ? (
            <p className="relative py-12 text-center text-sm text-sky-200/60">
              No performances yet. Be the first to add yours.
            </p>
          ) : (
            <>
              <ul className="relative flex flex-col gap-3 md:hidden" aria-label="Scheduled performances">
                {performances.map((row, index) => (
                  <li key={row.id}>
                    <SangeetPerformanceCard
                      row={row}
                      rowNumber={rowNumber(index)}
                      isMine={isMySangeetPerformance(row.id, myPerformances)}
                      onEdit={startEdit}
                      onDelete={handleDelete}
                    />
                  </li>
                ))}
              </ul>

              <div className="relative hidden overflow-x-auto rounded-xl border border-sky-800/45 md:block">
                <table className="w-full min-w-[640px] table-fixed text-sm text-sky-50">
                  <colgroup>
                    <col className="w-10" />
                    <col className="w-[18%]" />
                    <col />
                    <col className="w-28" />
                    <col className="w-16" />
                    <col className="w-[4.5rem]" />
                  </colgroup>
                  <thead className="bg-sky-950/80 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium text-sky-300/90">#</th>
                      <th className="px-4 py-3 font-medium text-sky-300/90">Title</th>
                      <th className="px-4 py-3 font-medium text-sky-300/90">
                        Songs & performers
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium text-sky-300/90">
                        Gang
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium text-sky-300/90">
                        Duration
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-sky-300/90">
                        Yours
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {performances.map((row, index) => (
                      <tr
                        key={row.id}
                        className="border-t border-sky-800/35 hover:bg-slate-950/40"
                      >
                        <td className="px-4 py-3 text-sky-200/55">
                          {rowNumber(index)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1.5">
                            <span className="font-medium text-sky-50">
                              {row.title}
                            </span>
                            <Badge
                              variant="secondary"
                              className={cn("w-fit text-xs", sangeetBadgeClassName)}
                            >
                              {SANGEET_PERFORMANCE_TYPE_LABELS[row.performanceType]}
                            </Badge>
                          </div>
                        </td>
                        <td className="min-w-0 px-4 py-3">
                          <PerformanceSongsAndPerformers row={row} />
                        </td>
                        <td className="px-4 py-3 text-sky-100/90">
                          {SANGEET_GANG_LABELS[row.gang]}
                        </td>
                        <td className="px-4 py-3 text-sky-100/90">
                          {SANGEET_DURATION_LABELS[row.durationMinutes]}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isMySangeetPerformance(row.id, myPerformances) ? (
                            <div className="flex justify-end">
                              <PerformanceOwnerActions
                                row={row}
                                onEdit={startEdit}
                                onDelete={handleDelete}
                              />
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <PerformanceListPagination
                page={page}
                totalPages={totalPages}
                total={total}
                onPageChange={goToPage}
              />
            </>
          )}
        </section>
      </div>
    </div>
  )
}
