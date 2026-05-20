export function toDateInputValue(value: string | Date | undefined): string {
  if (!value) return ""
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString().slice(0, 10)
}

export function toTimeInputValue(value: string | undefined): string {
  if (!value) return ""
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim())
  if (!match?.[1] || !match[2]) return value.slice(0, 5)
  return `${match[1].padStart(2, "0")}:${match[2]}`
}
