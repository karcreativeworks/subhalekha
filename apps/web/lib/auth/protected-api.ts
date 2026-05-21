export const protectedApiPathPatterns: RegExp[] = [
  /^\/api\/upload-url$/,
  /^\/api\/media-files(?:\/|$)/,
  /^\/api\/tags$/,
  /^\/api\/users$/,
  /^\/api\/events(?:\/|$)/, // includes /api/events/:id/blocks
  /^\/api\/gallery-blocks(?:\/|$)/,
  /^\/api\/video-blocks(?:\/|$)/,
  /^\/api\/admin-users(?:\/|$)/,
]

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1)
  }
  return pathname
}

/** Guest-site JSON under `/api/public/*` must stay unauthenticated (no session). */
export function isPublicApiPath(pathname: string): boolean {
  const n = normalizePathname(pathname)
  return n === "/api/public" || n.startsWith("/api/public/")
}

export function isProtectedApiPath(pathname: string): boolean {
  if (isPublicApiPath(pathname)) {
    return false
  }

  const normalized = normalizePathname(pathname)
  return protectedApiPathPatterns.some((pattern) => pattern.test(normalized))
}
