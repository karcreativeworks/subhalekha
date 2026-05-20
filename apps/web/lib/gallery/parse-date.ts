export function parseDateField(
  value: string,
  fieldName: string,
): Date | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  return parsed
}
