import type { AdminAccessKey } from "@/lib/auth/access"
import { hasAccess } from "@/lib/auth/access"
import { getClientIdFromSession } from "@/lib/auth/get-client-id"
import { findAdminClientByClientId } from "@/lib/db/admin-clients"

export async function getSessionAccess(): Promise<{
  clientId: string
  access: string[]
} | null> {
  const clientId = await getClientIdFromSession()
  if (!clientId) {
    return null
  }

  const client = await findAdminClientByClientId(clientId)
  if (!client) {
    return null
  }

  return {
    clientId,
    access: client.access ?? [],
  }
}

export async function requireAdminAccess(
  required: AdminAccessKey | string,
): Promise<{ clientId: string; access: string[] }> {
  const session = await getSessionAccess()
  if (!session) {
    throw new Error("Unauthorized")
  }

  if (!hasAccess(session.access, required)) {
    throw new Error("Forbidden")
  }

  return session
}
