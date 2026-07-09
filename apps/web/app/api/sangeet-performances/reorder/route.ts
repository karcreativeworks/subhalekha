import { NextRequest, NextResponse } from "next/server"

import type { ReorderSangeetPerformancesRequest } from "@/app/types/sangeet-performance"
import { apiErrorResponse } from "@/lib/api/route-errors"
import { ADMIN_ACCESS } from "@/lib/auth/access"
import { requireAdminAccess } from "@/lib/auth/require-access"
import {
  listSangeetPerformances,
  reorderSangeetPerformances,
} from "@/lib/db/sangeet-performances"

export async function PUT(request: NextRequest) {
  try {
    await requireAdminAccess(ADMIN_ACCESS.SANGEET_PLAN_MANAGER)
    const body = (await request.json()) as ReorderSangeetPerformancesRequest

    if (!Array.isArray(body.orderedIds)) {
      return NextResponse.json(
        { error: "orderedIds must be an array" },
        { status: 400 },
      )
    }

    await reorderSangeetPerformances(body.orderedIds)
    const performances = await listSangeetPerformances()
    return NextResponse.json(performances)
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return apiErrorResponse(error)
  }
}
