export const protectedApiPathPatterns: RegExp[] = [
  /^\/api\/upload-url$/,
  /^\/api\/media-files(?:\/|$)/,
  /^\/api\/tags$/,
  /^\/api\/users$/,
  /^\/api\/events(?:\/|$)/, // includes /api/events/:id/blocks
  /^\/api\/gallery-blocks(?:\/|$)/,
  /^\/api\/admin-users(?:\/|$)/,
]

export function isProtectedApiPath(pathname: string): boolean {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname

  return protectedApiPathPatterns.some((pattern) => pattern.test(normalized))
}
