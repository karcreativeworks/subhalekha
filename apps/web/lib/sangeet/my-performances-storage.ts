export interface MySangeetPerformanceRef {
  id: string
  token: string
}

export const MY_SANGEET_PERFORMANCES_STORAGE_KEY =
  "subhalekha-sangeet-my-performances"

function parseStored(value: string | null): MySangeetPerformanceRef[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is MySangeetPerformanceRef =>
        !!item &&
        typeof item === "object" &&
        typeof (item as MySangeetPerformanceRef).id === "string" &&
        typeof (item as MySangeetPerformanceRef).token === "string",
    )
  } catch {
    return []
  }
}

export function readMySangeetPerformances(): MySangeetPerformanceRef[] {
  if (typeof window === "undefined") return []
  return parseStored(
    window.localStorage.getItem(MY_SANGEET_PERFORMANCES_STORAGE_KEY),
  )
}

function writeAll(entries: MySangeetPerformanceRef[]): void {
  try {
    window.localStorage.setItem(
      MY_SANGEET_PERFORMANCES_STORAGE_KEY,
      JSON.stringify(entries),
    )
  } catch {
    // ignore
  }
}

export function addMySangeetPerformance(id: string, token: string): void {
  const entries = readMySangeetPerformances().filter((item) => item.id !== id)
  entries.push({ id, token })
  writeAll(entries)
}

export function removeMySangeetPerformance(id: string): void {
  writeAll(readMySangeetPerformances().filter((item) => item.id !== id))
}

export function getMySangeetPerformanceToken(id: string): string | undefined {
  return readMySangeetPerformances().find((item) => item.id === id)?.token
}

export function isMySangeetPerformance(
  id: string,
  entries: MySangeetPerformanceRef[],
): boolean {
  return entries.some((item) => item.id === id)
}
