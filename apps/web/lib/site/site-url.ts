/** Production site URL for canonical links and OG resolution (fallbacks included). */
export function getSiteMetadataBaseUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (explicit) {
    const normalized = explicit.includes("://")
      ? explicit
      : `https://${explicit}`
    try {
      return new URL(normalized)
    } catch {
      /* fall through */
    }
  }

  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "")
    return new URL(`https://${host}`)
  }

  return new URL("http://localhost:3000")
}
