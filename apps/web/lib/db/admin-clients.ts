import type { Collection } from "mongodb"

import { getDb } from "@/lib/db/mongodb"

export interface DbAdminClient {
  clientId: string
  apiKey: string
  clientName: string
  isValid: boolean
  /** Permission keys, e.g. mediaUploader, adminUsers */
  access: string[]
  createdAt: Date
  updatedAt: Date
}

export type AdminClientPublic = Omit<DbAdminClient, "apiKey">

const COLLECTION = "admin_clients"

export async function adminClientsCol(): Promise<Collection<DbAdminClient>> {
  return (await getDb()).collection<DbAdminClient>(COLLECTION)
}

export async function findAdminClientByApiKey(
  apiKey: string,
): Promise<DbAdminClient | null> {
  return adminClientsCol().then((col) => col.findOne({ apiKey, isValid: true }))
}

export async function findAdminClientByClientId(
  clientId: string,
): Promise<DbAdminClient | null> {
  return adminClientsCol().then((col) =>
    col.findOne({ clientId, isValid: true }),
  )
}

export function toPublicAdminClient(client: DbAdminClient): AdminClientPublic {
  const { apiKey: _apiKey, ...rest } = client
  return rest
}
