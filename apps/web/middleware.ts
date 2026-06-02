import { NextRequest, NextResponse } from "next/server"

import { isAdminPagePath } from "@/lib/auth/auth-config"
import { isProtectedApiPath, isPublicApiPath } from "@/lib/auth/protected-api"
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session"

async function getSessionClientId(
  request: NextRequest,
): Promise<string | null> {
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value
  if (!sessionToken) {
    return null
  }

  const session = await verifySessionToken(sessionToken)
  return session?.clientId ?? null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicApiPath(pathname)) {
    return NextResponse.next()
  }

  const clientId = await getSessionClientId(request)

  if (isProtectedApiPath(pathname)) {
    if (!clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const response = NextResponse.next()
    response.headers.set("x-client-id", clientId)
    return response
  }

  if (!isAdminPagePath(pathname)) {
    return NextResponse.next()
  }

  if (clientId) {
    return NextResponse.next()
  }

  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set("redirect", pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/upload-url",
    "/api/media-files",
    "/api/media-files/:path*",
    "/api/tags",
    "/api/users",
    "/api/admin-users",
    "/api/admin-users/:path*",
    "/api/events",
    "/api/events/:path*",
    "/api/events/:id/blocks",
    "/api/gallery-blocks",
    "/api/gallery-blocks/:path*",
    "/api/video-blocks",
    "/api/video-blocks/:path*",
    "/api/sangeet-performances",
    "/api/sangeet-performances/:path*",
    "/api/public/:path*",
  ],
}
