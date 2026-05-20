export const protectedApiPathPatterns: RegExp[] = [
  /^\/api\/upload-url$/,
  /^\/api\/media-files(?:\/|$)/,
  /^\/api\/tags$/,
  /^\/api\/users$/,
  /^\/api\/events(?:\/|$)/, // includes /api/events/:id/blocks
  /^\/api\/gallery-blocks(?:\/|$)/,
  /^\/api\/admin-users(?:\/|$)/,
]

/** Guest-site JSON under `/api/public/*` must stay unauthenticated (no session). */
function isPublicApiPath(normalizedPathname: string): boolean {
  return (
    normalizedPathname === "/api/public" ||
    normalizedPathname.startsWith("/api/public/")
  )
}

export function isProtectedApiPath(pathname: string): boolean {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname

  if (isPublicApiPath(normalized)) {
    return false
  }

  return protectedApiPathPatterns.some((pattern) => pattern.test(normalized))
}
