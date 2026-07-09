import type {
  SangeetPerformance,
  SangeetPerformancePublic,
} from "@/app/types/sangeet-performance"

function serializeDate(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString()
  }
  return String(value)
}

function coercePerformerNames(value: unknown): string {
  if (typeof value === "string") {
    return value
  }
  if (Array.isArray(value)) {
    return value.map((name) => String(name).trim()).filter(Boolean).join(", ")
  }
  return ""
}

export function toSangeetPerformancePublic(
  doc: SangeetPerformance,
): SangeetPerformancePublic {
  const id =
    doc._id != null
      ? typeof doc._id === "string"
        ? doc._id
        : doc._id.toString()
      : ""

  return {
    id,
    sortOrder: typeof doc.sortOrder === "number" ? doc.sortOrder : 0,
    title: doc.title,
    performerCount: doc.performerCount,
    performerNames: coercePerformerNames(doc.performerNames),
    performanceType: doc.performanceType,
    gang: doc.gang,
    songs: doc.songs,
    durationMinutes: doc.durationMinutes,
    createdAt: serializeDate(doc.createdAt),
    updatedAt: serializeDate(doc.updatedAt),
  }
}
