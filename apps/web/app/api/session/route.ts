import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { getSessionAccess } from "@/lib/auth/require-access"
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session"

export async function GET() {
  const sessionToken = (await cookies()).get(SESSION_COOKIE)?.value
  if (!sessionToken) {
    return NextResponse.json({ isAuthenticated: false }, { status: 401 })
  }

  const tokenSession = await verifySessionToken(sessionToken)
  if (!tokenSession) {
    return NextResponse.json({ isAuthenticated: false }, { status: 401 })
  }

  const liveSession = await getSessionAccess()
  if (!liveSession) {
    return NextResponse.json({ isAuthenticated: false }, { status: 401 })
  }

  return NextResponse.json({
    isAuthenticated: true,
    clientId: liveSession.clientId,
    access: liveSession.access,
  })
}
