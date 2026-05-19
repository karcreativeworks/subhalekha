import { ADMIN_ACCESS } from "@/lib/auth/access"
import {
  findAdminClientByApiKey,
  type DbAdminClient,
} from "@/lib/db/admin-clients"

function matchesEnvCredentials(clientId: string, clientKey: string): boolean {
  const expectedId = process.env.ADMIN_CLIENT_ID
  const expectedKey = process.env.ADMIN_CLIENT_KEY

  if (!expectedId || !expectedKey) {
    return false
  }

  return clientId === expectedId && clientKey === expectedKey
}

function envBootstrapClient(
  clientId: string,
  clientKey: string,
): DbAdminClient {
  return {
    clientId,
    apiKey: clientKey,
    clientName: "Admin",
    isValid: true,
    access: [ADMIN_ACCESS.SUPER_ADMIN],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export async function authenticateAdmin(
  clientId: string,
  clientKey: string,
): Promise<DbAdminClient | null> {
  if (matchesEnvCredentials(clientId, clientKey)) {
    return envBootstrapClient(clientId, clientKey)
  }

  const client = await findAdminClientByApiKey(clientKey)
  if (!client || client.clientId !== clientId) {
    return null
  }

  return {
    ...client,
    access: client.access ?? [],
  }
}

export async function validateAdminCredentials(
  clientId: string,
  clientKey: string,
): Promise<boolean> {
  return Boolean(await authenticateAdmin(clientId, clientKey))
}
