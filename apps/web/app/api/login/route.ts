import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { authenticateAdmin } from "@/lib/auth/credentials"
import {
  createSessionToken,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
} from "@/lib/auth/session"

export async function POST(request: Request) {
  try {
    const { clientId, clientKey } = (await request.json()) as {
      clientId?: string
      clientKey?: string
    }

    if (!clientId || !clientKey) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      )
    }

    const admin = await authenticateAdmin(clientId, clientKey)
    if (!admin) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      )
    }

    const sessionToken = await createSessionToken(
      admin.clientId,
      admin.access ?? [],
    )

    ;(await cookies()).set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_TTL_SECONDS,
      path: "/",
      sameSite: "lax",
    })

    return NextResponse.json({ message: "Logged in successfully" })
  } catch (error) {
    console.error(error)
    console.error("An internal error occurred")
    return NextResponse.json(
      { message: "An internal error occurred" },
      { status: 500 }
    )
  }
}
