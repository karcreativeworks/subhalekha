import type { CreateSangeetPerformanceRequest } from "@/app/types/sangeet-performance"
import {
  SANGEET_DURATIONS,
  SANGEET_GANGS,
  SANGEET_PERFORMANCE_TYPES,
} from "@/app/types/sangeet-performance"

function isPerformanceType(
  value: string,
): value is CreateSangeetPerformanceRequest["performanceType"] {
  return (SANGEET_PERFORMANCE_TYPES as readonly string[]).includes(value)
}

function isGang(value: string): value is CreateSangeetPerformanceRequest["gang"] {
  return (SANGEET_GANGS as readonly string[]).includes(value)
}

function isDuration(
  value: number,
): value is CreateSangeetPerformanceRequest["durationMinutes"] {
  return (SANGEET_DURATIONS as readonly number[]).includes(value)
}

function parsePerformerNames(raw: unknown): string {
  if (typeof raw === "string") {
    return raw.trim()
  }
  if (Array.isArray(raw)) {
    return raw.map((name) => String(name).trim()).filter(Boolean).join(", ")
  }
  return ""
}

export function parseSangeetPerformanceBody(
  body: unknown,
): { ok: true; data: CreateSangeetPerformanceRequest } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body" }
  }

  const raw = body as Record<string, unknown>
  const title = typeof raw.title === "string" ? raw.title.trim() : ""
  const performerCount = Number(raw.performerCount)
  const performanceType =
    typeof raw.performanceType === "string" ? raw.performanceType : ""
  const gang = typeof raw.gang === "string" ? raw.gang : ""
  const songs = typeof raw.songs === "string" ? raw.songs.trim() : ""
  const durationMinutes = Number(raw.durationMinutes)
  const performerNames = parsePerformerNames(raw.performerNames)

  if (!title) {
    return { ok: false, error: "Title is required" }
  }
  if (!Number.isInteger(performerCount) || performerCount < 1 || performerCount > 10) {
    return { ok: false, error: "Performer count must be between 1 and 10" }
  }
  if (!performerNames) {
    return { ok: false, error: "Name / names of performers is required" }
  }
  if (!isPerformanceType(performanceType)) {
    return { ok: false, error: "Invalid performance type" }
  }
  if (!isGang(gang)) {
    return { ok: false, error: "Invalid gang" }
  }
  if (!songs) {
    return { ok: false, error: "Songs are required" }
  }
  if (!isDuration(durationMinutes)) {
    return { ok: false, error: "Duration must be 1, 2, or 3 minutes" }
  }

  return {
    ok: true,
    data: {
      title,
      performerCount,
      performerNames,
      performanceType,
      gang,
      songs,
      durationMinutes,
    },
  }
}
