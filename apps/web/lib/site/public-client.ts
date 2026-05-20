/** True when MongoDB is configured for server-side public pages and APIs. */
export function isPublicDbConfigured(): boolean {
  return Boolean(
    process.env.MONGODB_URI?.trim() || process.env.DATABASE_MONGODB_URI?.trim(),
  )
}
