const normalizePath = (pathname: string): string => {
  if (!pathname) return "/"
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1)
  }
  return pathname
}

/** Pages that stay public (no login). */
export const publicPagePatterns: RegExp[] = [/^\/$/, /^\/login$/]

/** Auth API routes excluded from API middleware checks. */
export const authApiExemptPatterns: RegExp[] = [
  /^\/api\/login$/,
  /^\/api\/logout$/,
  /^\/api\/session$/,
]

export const isPublicPagePath = (pathname: string): boolean => {
  const normalized = normalizePath(pathname)
  return publicPagePatterns.some((pattern) => pattern.test(normalized))
}

export const isAuthApiExemptPath = (pathname: string): boolean => {
  const normalized = normalizePath(pathname)
  return authApiExemptPatterns.some((pattern) => pattern.test(normalized))
}

export const isAdminPagePath = (pathname: string): boolean => {
  const normalized = normalizePath(pathname)
  return normalized === "/admin" || normalized.startsWith("/admin/")
}
