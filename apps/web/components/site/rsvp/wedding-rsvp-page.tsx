"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import {
  Baby,
  CalendarDays,
  Check,
  Heart,
  Loader2,
  PartyPopper,
  User,
  Users,
  UsersRound,
} from "lucide-react"
import { toast } from "sonner"

import type { CreateWeddingRsvpRequest } from "@/app/types/wedding-rsvp"
import { SANGEET_GANGS } from "@/app/types/sangeet-performance"
import { useSiteGang } from "@/components/site/site-gang-provider"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { SANGEET_GANG_LABELS } from "@/lib/sangeet/performance-constants"
import {
  readRsvpSubmitted,
  writeRsvpSubmitted,
} from "@/lib/rsvp/my-rsvp-storage"
import {
  RSVP_HERO_DESKTOP,
  RSVP_HERO_MOBILE,
  RSVP_SUCCESS_BACKGROUND,
} from "@/lib/rsvp/rsvp-constants"
import {
  summarizeRsvpSelection,
  WEDDING_EVENT_BY_ID,
  WEDDING_RSVP_DATES,
} from "@/lib/rsvp/wedding-events"

const API_URL = "/api/public/rsvp"

const rsvpPanelClassName = cn(
  "relative overflow-hidden rounded-2xl border border-amber-200/80 p-6 shadow-lg shadow-amber-900/5 sm:p-8",
  "bg-gradient-to-br from-white via-amber-50/100 to-amber-100/100",
  "ring-1 ring-amber-300/30",
)

const rsvpPanelGlowClassName =
  "pointer-events-none absolute -top-24 right-0 size-48 rounded-full bg-amber-300/25 blur-3xl"

const rsvpBadgeClassName =
  "border-amber-300/70 bg-amber-100 text-amber-900 hover:bg-amber-100"

const rsvpFormControlClassName = cn(
  "border-amber-200/80 bg-white/90 text-amber-950 shadow-sm",
  "placeholder:text-amber-700/35",
  "focus-visible:border-amber-400 focus-visible:ring-amber-400/30",
)

const rsvpFormSelectClassName = cn(
  "flex h-10 w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors",
  "focus-visible:ring-[3px]",
  rsvpFormControlClassName,
)

type FormState = {
  guestName: string
  adultCount: string
  childrenCount: string
  gang: CreateWeddingRsvpRequest["gang"]
  selectedDates: string[]
}

const emptyForm = (gang: CreateWeddingRsvpRequest["gang"] = "bride"): FormState => ({
  guestName: "",
  adultCount: "1",
  childrenCount: "0",
  gang,
  selectedDates: ["jul_7"],
})

function FieldIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 ring-1 ring-amber-200/80">
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
        className="flex items-center gap-2 text-amber-950/90"
      >
        <FieldIcon>{icon}</FieldIcon>
        {label}
      </Label>
      {children}
    </div>
  )
}

function SelectionSummary({ selectedDates }: { selectedDates: string[] }) {
  const { nights, days, eventCount } = summarizeRsvpSelection(selectedDates)

  if (selectedDates.length === 0) {
    return (
      <p className="text-sm text-amber-700/55">Select dates to see your plan</p>
    )
  }

  const nightLabel = nights === 1 ? "night" : "nights"
  const dayLabel = days === 1 ? "day" : "days"
  const eventLabel = eventCount === 1 ? "event" : "events"

  return (
    <p className="text-right text-sm font-medium text-amber-900 sm:text-base">
      <span className="text-amber-800">
        {nights} {nightLabel}
      </span>
      <span className="text-amber-600/50"> / </span>
      <span className="text-amber-800">
        {days} {dayLabel}
      </span>
      <span className="text-amber-600/50"> · </span>
      <span className="text-amber-600">
        {eventCount} {eventLabel}
      </span>
    </p>
  )
}

function RsvpSuccessScreen() {
  return (
    <section className="relative flex min-h-[calc(100svh)] w-full items-center justify-center overflow-hidden">
      <Image
        src={RSVP_SUCCESS_BACKGROUND}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-white/90 via-amber-50/70 to-amber-100/40"
        aria-hidden
      />
      <div className="relative px-6 py-24 text-center">
        <PartyPopper className="mx-auto mb-6 size-12 text-amber-600" />
        <h1 className="bg-gradient-to-r from-amber-800 via-amber-700 to-amber-900 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-6xl md:text-7xl">
          See You at the Wedding
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base text-amber-900/75 sm:text-lg">
          Your RSVP is in. We cannot wait to celebrate with you.
        </p>
      </div>
    </section>
  )
}

export function WeddingRsvpPage() {
  const { gang: siteGang } = useSiteGang()
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState<FormState>(() => emptyForm())
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setSubmitted(readRsvpSubmitted())
  }, [])

  useEffect(() => {
    if (siteGang) {
      setForm((prev) => ({ ...prev, gang: siteGang }))
    }
  }, [siteGang])

  const selectedEventIds = useMemo(
    () => summarizeRsvpSelection(form.selectedDates).eventIds,
    [form.selectedDates],
  )

  const computedTotalAttendees = useMemo(() => {
    const adults = Number.parseInt(form.adultCount, 10)
    const children = Number.parseInt(form.childrenCount, 10)
    if (!Number.isInteger(adults) || !Number.isInteger(children)) return null
    return adults + children
  }, [form.adultCount, form.childrenCount])

  const toggleDate = (dateKey: string) => {
    setForm((prev) => {
      const isSelected = prev.selectedDates.includes(dateKey)
      const selectedDates = isSelected
        ? prev.selectedDates.filter((key) => key !== dateKey)
        : [...prev.selectedDates, dateKey]
      return { ...prev, selectedDates }
    })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!form.guestName.trim()) {
      toast.error("Please enter your name")
      return
    }

    const adultCount = Number.parseInt(form.adultCount, 10)
    const childrenCount = Number.parseInt(form.childrenCount, 10)
    const totalAttendees = adultCount + childrenCount

    if (!Number.isInteger(adultCount) || adultCount < 0) {
      toast.error("Adult count must be 0 or more")
      return
    }
    if (!Number.isInteger(childrenCount) || childrenCount < 0) {
      toast.error("Children count must be 0 or more")
      return
    }
    if (totalAttendees < 1) {
      toast.error("At least one guest is required")
      return
    }
    if (form.selectedDates.length === 0) {
      toast.error("Select at least one date")
      return
    }

    const payload: CreateWeddingRsvpRequest = {
      guestName: form.guestName.trim(),
      totalAttendees,
      adultCount,
      childrenCount,
      gang: form.gang,
      selectedDates: form.selectedDates,
      eventIds: selectedEventIds,
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error ?? "Submit failed")
      }

      writeRsvpSubmitted()
      setSubmitted(true)
      toast.success("You're counted in!")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit RSVP",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="-mb-16 bg-gradient-to-b from-white via-amber-50 to-amber-100/60">
        <RsvpSuccessScreen />
      </div>
    )
  }

  return (
    <div className="-mb-16 bg-gradient-to-b from-white via-amber-50/80 to-amber-100/50">
      {/* <section className="relative h-[calc(100svh-60px)] w-full overflow-hidden">
        <Image
          src={RSVP_HERO_MOBILE}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-40 md:hidden"
        />
        <Image
          src={RSVP_HERO_DESKTOP}
          alt=""
          fill
          priority
          sizes="100vw"
          className="hidden object-cover opacity-40 md:block"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-amber-100/95 via-amber-50/75 to-white/90"
          aria-hidden
        />
        
      </section> */}



      <div className="fixed top-0 bottom-0 left-0 right-0 z-0">
        <Image
          src={RSVP_SUCCESS_BACKGROUND}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover top-0 bottom-0 left-0 right-0 w-full max-h-[100vh]"
        />
      </div>

      <div className="relative flex flex-col items-center gap-0 justify-center mx-auto max-w-6xl space-y-10 px-2 pt-[20vh] pb-0 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-amber-700 md:text-sm">
          Wedding RSVP
        </p>
        <h1 className="mt-0 bg-gradient-to-r from-amber-900 via-amber-700 to-amber-800 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl md:text-6xl">
          {siteGang === 'groom' ? "Subhakar weds Srilekha" : "Srilekha weds Subhakar"}
        </h1>
        <p className="text-center max-w-xl text-sm text-amber-900/70 sm:text-base">
          Our story continues… and we hope you’ll be there.<br />Tell us who is coming, and which days you
          will join us — July 5 through 9.
        </p>
      </div>
      <div className="mx-auto max-w-6xl space-y-10 px-2 pb-16 pt-24 sm:px-6">

        <section id="wedding-rsvp-form" className={rsvpPanelClassName}>
          <div className={rsvpPanelGlowClassName} aria-hidden />
          <div className="relative mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-4xl font-semibold tracking-tight text-amber-900">
                Join &amp; Celebrate with Us
              </h2>
              <p className="mt-1 text-sm text-amber-800/60">
                July 7 is the main wedding day — select any extra days, that you can make time for us.
              </p>
            </div>
            <SelectionSummary selectedDates={form.selectedDates} />
          </div>

          <form
            className="relative space-y-8"
            onSubmit={(event) => void handleSubmit(event)}
          >

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-950/90">
                <FieldIcon>
                  <CalendarDays className="size-4" />
                </FieldIcon>
                <div>
                  <p className="font-medium">Which days will you join?</p>
                  <p className="text-xs text-amber-800/55">
                    Tap a date to add its events to your plan.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
                {WEDDING_RSVP_DATES.map((day) => {
                  const isSelected = form.selectedDates.includes(day.key)
                  return (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => toggleDate(day.key)}
                      className={cn(
                        "relative flex min-h-[11rem] flex-col rounded-xl border p-4 text-left transition-all",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50",
                        isSelected
                          ? "border-amber-400 bg-amber-50/90 ring-2 ring-amber-300/40 shadow-md shadow-amber-900/5"
                          : "border-amber-200/70 bg-white/80 hover:border-amber-300 hover:bg-amber-50/50",
                      )}
                      aria-pressed={isSelected}
                    >
                      {day.isMain ? (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "absolute right-3 top-3 text-[10px]",
                            rsvpBadgeClassName,
                          )}
                        >
                          Main day
                        </Badge>
                      ) : null}
                      {isSelected ? (
                        <span className="absolute left-3 top-3 flex size-6 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm">
                          <Check className="size-3.5" />
                        </span>
                      ) : null}
                      <p className="mt-6 text-lg font-semibold text-amber-950">
                        {day.monthDayLabel}
                      </p>
                      <p className="text-xs font-medium uppercase tracking-wider text-amber-700/70">
                        {day.dayName}
                      </p>
                      <ul className="mt-3 flex flex-1 flex-col gap-1.5">
                        {day.events.length > 0 ? (
                          day.events.map((event) => (
                            <li
                              key={event.id}
                              className={cn(
                                "text-xs leading-snug",
                                isSelected
                                  ? "text-amber-900/85"
                                  : "text-amber-800/50",
                              )}
                            >
                              {event.title}
                            </li>
                          ))
                        ) : (
                          <li className="text-xs italic text-amber-700/45">
                            Rest day — no scheduled events
                          </li>
                        )}
                      </ul>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid">
              <FormRow
                icon={<User className="size-4" />}
                label="Your names (separated by comma)"
                htmlFor="rsvp-guest-name"
              >
                <Input
                  id="rsvp-guest-name"
                  value={form.guestName}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      guestName: event.target.value,
                    }))
                  }
                  placeholder="Name(s) of guests"
                  className={rsvpFormControlClassName}
                  required
                />
              </FormRow>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">

              <FormRow icon={<UsersRound className="size-4" />} label="Team">
                <select
                  value={form.gang}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      gang: event.target
                        .value as CreateWeddingRsvpRequest["gang"],
                    }))
                  }
                  className={rsvpFormSelectClassName}
                >
                  {SANGEET_GANGS.map((gang) => (
                    <option key={gang} value={gang}>
                      {SANGEET_GANG_LABELS[gang]}
                    </option>
                  ))}
                </select>
              </FormRow>

              <FormRow
                icon={<Users className="size-4" />}
                label="Adults"
                htmlFor="rsvp-adults"
              >
                <Input
                  id="rsvp-adults"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={form.adultCount}
                  onChange={(event) => {
                    const value = event.target.value
                    if (value !== "" && !/^\d+$/.test(value)) return
                    setForm((prev) => ({ ...prev, adultCount: value }))
                  }}
                  className={rsvpFormControlClassName}
                  required
                />
              </FormRow>

              <FormRow
                icon={<Baby className="size-4" />}
                label="Children"
                htmlFor="rsvp-children"
              >
                <Input
                  id="rsvp-children"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={form.childrenCount}
                  onChange={(event) => {
                    const value = event.target.value
                    if (value !== "" && !/^\d+$/.test(value)) return
                    setForm((prev) => ({ ...prev, childrenCount: value }))
                  }}
                  className={rsvpFormControlClassName}
                  required
                />
              </FormRow>
            </div>

            {selectedEventIds.length > 0 ? (
              <div className="space-y-3">
                <p className="flex items-center gap-2 text-sm font-medium text-amber-950">
                  <Heart className="size-4 text-amber-600" />
                  Your event list ( that which you can make it to based on dates selected )
                </p>
                <ul className="space-y-3 grid grid-cols-9 gap-2">
                  {selectedEventIds.map((eventId) => {
                    const event = WEDDING_EVENT_BY_ID[eventId]
                    return (
                      <li
                        key={eventId}
                        className="col-span-9 md:col-span-3 rounded-lg py-2.5"
                      >
                        <div className="flex flex-col items-start gap-0 mb-2">
                          <p className="font-medium text-amber-950 text-lg">
                            {event.title} - {event.monthDayLabel}
                          </p>
                          <p className="mt-0.5 text-xs text-amber-600 uppercase tracking-wider">
                            {event.dayName} - {event.timing}
                          </p>
                        </div>
                        <p className="mt-1 text-md text-neutral-800/60">
                          {event.description}
                        </p>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ) : null}


            {computedTotalAttendees !== null && computedTotalAttendees > 0 ? (
              <p className="text-md text-amber-800/70">
                <span className="font-medium text-amber-900 text-2xl">
                  {computedTotalAttendees}
                </span>{" "}
                {computedTotalAttendees === 1 ? "guest" : "guests"} total
              </p>
            ) : null}

            <div className="flex flex-col md:flex-row items-center justify-between">
              <h4 className="text-xl">We will be extremely glad if you can join us for all the events we have planned.</h4>
              <Button
                type="submit"
                size="lg"
                className="text-lg w-full bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md shadow-amber-900/15 hover:from-amber-500 hover:to-amber-400 sm:w-auto"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <PartyPopper className="mr-2 size-4" />
                    Count Us In
                  </>
                )}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
