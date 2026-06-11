export const WEDDING_EVENT_IDS = [
  "pellikoduku_cheyatam",
  "haldi",
  "mehandi",
  "kankanam",
  "barat",
  "reception",
  "marriage",
  "wedding_rituals",
  "sangeet",
] as const

export type WeddingEventId = (typeof WEDDING_EVENT_IDS)[number]

export interface WeddingEventDetail {
  id: WeddingEventId
  title: string
  timing: string
  description: string
  monthDayLabel?: string
  dayName?: string
}

export interface WeddingDateDetail {
  key: string
  /** ISO date `YYYY-MM-DD` */
  isoDate: string
  monthDayLabel: string
  dayName: string
  isMain?: boolean
  events: WeddingEventDetail[]
}

export const WEDDING_RSVP_DATES: WeddingDateDetail[] = [
  {
    key: "jul_5",
    isoDate: "2026-07-05",
    monthDayLabel: "July 5",
    dayName: "Sunday",
    events: [
      {
        id: "pellikoduku_cheyatam",
        title: "Pellikoduku Cheyatam",
        timing: "Morning",
        description: "Traditional groom preparation ceremony.",
      },
      {
        id: "haldi",
        title: "Haldi",
        timing: "Afternoon",
        description: "Turmeric ceremony with family and friends.",
      },
    ],
  },
  {
    key: "jul_6",
    isoDate: "2026-07-06",
    monthDayLabel: "July 6",
    dayName: "Monday",
    events: [
      {
        id: "mehandi",
        title: "Mehandi",
        timing: "Evening",
        description: "Henna celebration with music and colour.",
      },
    ],
  },
  {
    key: "jul_7",
    isoDate: "2026-07-07",
    monthDayLabel: "July 7",
    dayName: "Tuesday",
    isMain: true,
    events: [
      {
        id: "kankanam",
        title: "Kankanam",
        timing: "Morning",
        description: "Sacred thread ceremony before the wedding.",
      },
      {
        id: "barat",
        title: "Barat",
        timing: "Afternoon",
        description: "Groom's procession to the venue.",
      },
      {
        id: "reception",
        title: "Reception",
        timing: "Evening",
        description: "Welcome celebration for family and guests.",
      },
      // {
      //   id: "marriage",
      //   title: "Marriage",
      //   timing: "Night",
      //   description: "The main wedding ceremony.",
      // },
    ],
  },
  {
    key: "jul_8",
    isoDate: "2026-07-08",
    monthDayLabel: "July 8",
    dayName: "Wednesday",
    events: [
      {
        id: "wedding_rituals",
        title: "Wedding Rituals",
        timing: "Early morning",
        description:
          "Main-wedding rituals and traditions that continue from early morning of July 8 - 6:45am.",
      },
    ],
  },
  {
    key: "jul_9",
    isoDate: "2026-07-09",
    monthDayLabel: "July 9",
    dayName: "Thursday",
    events: [
      {
        id: "sangeet",
        title: "Sangeet",
        timing: "Evening",
        description: "Music, dance, and performances from both sides.",
      },
    ],
  },
]

export const WEDDING_EVENT_BY_ID: Record<WeddingEventId, WeddingEventDetail> =
  Object.fromEntries(
    WEDDING_RSVP_DATES.flatMap((day) =>
      day.events.map(
        (event) =>
          [
            event.id,
            {
              ...event,
              monthDayLabel: day.monthDayLabel,
              dayName: day.dayName,
            },
          ] as const
      )
    )
  ) as Record<WeddingEventId, WeddingEventDetail>

export function isWeddingEventId(value: string): value is WeddingEventId {
  return (WEDDING_EVENT_IDS as readonly string[]).includes(value)
}

export function isWeddingDateKey(value: string): boolean {
  return WEDDING_RSVP_DATES.some((day) => day.key === value)
}

export function eventIdsForSelectedDates(
  selectedDates: string[]
): WeddingEventId[] {
  const ids: WeddingEventId[] = []
  for (const day of WEDDING_RSVP_DATES) {
    if (!selectedDates.includes(day.key)) continue
    for (const event of day.events) {
      ids.push(event.id)
    }
  }
  return ids
}

/** Each selected date = one night; days = nights + 1 (e.g. Jul 7 → 1 night / 2 days). */
export function summarizeRsvpSelection(selectedDates: string[]) {
  const nights = selectedDates.length
  const days = nights > 0 ? nights + 1 : 0
  const eventIds = eventIdsForSelectedDates(selectedDates)
  return { days, nights, eventCount: eventIds.length, eventIds }
}
