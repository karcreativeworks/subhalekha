import { NextResponse } from "next/server"

import { apiErrorResponse } from "@/lib/api/route-errors"
import { ADMIN_ACCESS } from "@/lib/auth/access"
import { requireAdminAccess } from "@/lib/auth/require-access"
import { listSangeetPerformances } from "@/lib/db/sangeet-performances"

export async function GET() {
  try {
    await requireAdminAccess(ADMIN_ACCESS.SANGEET_PLAN_MANAGER)
    const performances = await listSangeetPerformances()
    return NextResponse.json(performances)
  } catch (error) {
    return apiErrorResponse(error)
  }
}
