export function parseDbNameFromMongoUri(uri: string): string | undefined {
  if (!uri?.trim()) return undefined
  try {
    const withoutQuery = uri.split("?")[0] ?? ""
    const rest = withoutQuery.replace(/^mongodb(\+srv)?:\/\//i, "")
    const slash = rest.indexOf("/")
    if (slash === -1) return undefined
    const segment = rest.slice(slash + 1).split("/")[0]?.trim()
    if (!segment) return undefined
    return decodeURIComponent(segment)
  } catch {
    return undefined
  }
}

export function resolveMongoDbName(connectionUri: string): string {
  const fromEnv =
    process.env.DATABASE_MONGODB_DB?.trim() || process.env.MONGODB_DB?.trim()
  if (fromEnv) return fromEnv

  const fromUri = parseDbNameFromMongoUri(connectionUri)
  if (fromUri) return fromUri

  return process.env.NODE_ENV === "production"
    ? "subhalekha-prod"
    : "subhalekha-dev"
}
