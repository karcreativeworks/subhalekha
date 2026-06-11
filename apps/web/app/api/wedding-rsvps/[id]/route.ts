import { ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"

import { apiErrorResponse } from "@/lib/api/route-errors"
import { ADMIN_ACCESS } from "@/lib/auth/access"
import { requireAdminAccess } from "@/lib/auth/require-access"
import { WEDDING_RSVPS_COLLECTION } from "@/lib/db/wedding-rsvps"
import { getDb } from "@/lib/db/mongodb"

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminAccess(ADMIN_ACCESS.WEDDING_RSVP_MANAGER)
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid RSVP id" }, { status: 400 })
    }

    const db = await getDb()
    const result = await db
      .collection(WEDDING_RSVPS_COLLECTION)
      .deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "RSVP not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
