import { NextRequest, NextResponse } from "next/server"

import { SANGEET_GANGS } from "@/app/types/sangeet-performance"
import type { WeddingRsvpGang } from "@/app/types/wedding-rsvp"
import { apiErrorResponse } from "@/lib/api/route-errors"
import { ADMIN_ACCESS } from "@/lib/auth/access"
import { requireAdminAccess } from "@/lib/auth/require-access"
import { listWeddingRsvpsPaginated } from "@/lib/db/wedding-rsvps"
import { WEDDING_RSVPS_PAGE_SIZE } from "@/lib/rsvp/pagination"

function parseGangFilter(value: string | null): WeddingRsvpGang | "all" {
  if (!value || value === "all") return "all"
  if ((SANGEET_GANGS as readonly string[]).includes(value)) {
    return value as WeddingRsvpGang
  }
  return "all"
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminAccess(ADMIN_ACCESS.WEDDING_RSVP_MANAGER)

    const { searchParams } = new URL(request.url)
    const page = Math.max(
      1,
      Number.parseInt(searchParams.get("page") || "1", 10) || 1,
    )
    const limit = Math.min(
      50,
      Math.max(
        1,
        Number.parseInt(
          searchParams.get("limit") || String(WEDDING_RSVPS_PAGE_SIZE),
          10,
        ) || WEDDING_RSVPS_PAGE_SIZE,
      ),
    )
    const gang = parseGangFilter(searchParams.get("gang"))

    const result = await listWeddingRsvpsPaginated(page, limit, gang)
    return NextResponse.json(result)
  } catch (error) {
    return apiErrorResponse(error)
  }
}
