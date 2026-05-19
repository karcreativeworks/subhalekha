import { cookies } from "next/headers"
import { NextRequest } from "next/server"

import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session"

export async function getClientIdFromSession(): Promise<string | null> {
  const sessionToken = (await cookies()).get(SESSION_COOKIE)?.value
  if (!sessionToken) {
    return null
  }

  const session = await verifySessionToken(sessionToken)
  return session?.clientId ?? null
}

export async function requireClientId(): Promise<string> {
  const clientId = await getClientIdFromSession()
  if (!clientId) {
    throw new Error("Unauthorized")
  }
  return clientId
}

export function getClientIdFromRequest(req: NextRequest): string | null {
  return req.headers.get("x-client-id")
}
