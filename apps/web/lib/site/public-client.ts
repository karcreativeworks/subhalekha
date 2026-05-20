/** Default tenant when only one client exists (matches seed-admin). */
const DEFAULT_PUBLIC_CLIENT_ID = "subhakar"

/** Tenant id for public guest pages. */
export function getPublicClientId(): string {
  return (
    process.env.PUBLIC_CLIENT_ID?.trim() ||
    process.env.ADMIN_CLIENT_ID?.trim() ||
    process.env.SEED_ADMIN_CLIENT_ID?.trim() ||
    DEFAULT_PUBLIC_CLIENT_ID
  )
}

export function isPublicDbConfigured(): boolean {
  return Boolean(
    process.env.MONGODB_URI?.trim() || process.env.DATABASE_MONGODB_URI?.trim(),
  )
}
