const STORAGE_KEY = "subhalekha:wedding-rsvp-submitted"

export function readRsvpSubmitted(): boolean {
  if (typeof window === "undefined") return false
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1"
  } catch {
    return false
  }
}

export function writeRsvpSubmitted(): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, "1")
  } catch {
    // ignore quota / private mode
  }
}
