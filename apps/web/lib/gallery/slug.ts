/** URL-safe slug: lowercase letters, numbers, hyphens. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function isValidSlug(value: string): boolean {
  return SLUG_PATTERN.test(value)
}

export function parseSlugInput(
  value: string | undefined,
  fieldLabel: string,
): { slug: string } | { error: string } {
  const slug = normalizeSlug(value ?? "")
  if (!slug) {
    return { error: `${fieldLabel} is required` }
  }
  if (!isValidSlug(slug)) {
    return {
      error: `${fieldLabel} must use lowercase letters, numbers, and hyphens only`,
    }
  }
  return { slug }
}
