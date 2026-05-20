/** Wedding countdown target (July 8, 2026, local midnight). */
export const COUNTDOWN_TARGET_ISO = "2026-07-08T00:00:00"

export function getCountdownTarget(): Date {
  return new Date(COUNTDOWN_TARGET_ISO)
}

export function getDaysUntilCountdown(from: Date = new Date()): number {
  const target = getCountdownTarget()
  const ms = target.getTime() - from.getTime()
  if (ms <= 0) return 0
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}
