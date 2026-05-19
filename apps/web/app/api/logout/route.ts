import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { SESSION_COOKIE } from "@/lib/auth/session"

export async function POST() {
  ;(await cookies()).set(SESSION_COOKIE, "", {
    expires: new Date(0),
    path: "/",
  })

  return NextResponse.json({ message: "Logged out successfully" })
}
