import { NextResponse } from "next/server"

export function apiErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Request failed"
  const status =
    message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
  return NextResponse.json({ error: message }, { status })
}
