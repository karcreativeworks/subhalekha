import { NextRequest, NextResponse } from "next/server"

import type { WeddingRsvp } from "@/app/types/wedding-rsvp"
import { WEDDING_RSVPS_COLLECTION } from "@/lib/db/wedding-rsvps"
import { getDb } from "@/lib/db/mongodb"
import { toWeddingRsvpPublic } from "@/lib/rsvp/normalize-rsvp"
import { parseWeddingRsvpBody } from "@/lib/rsvp/parse-rsvp-body"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = parseWeddingRsvpBody(body)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const now = new Date()
    const record: WeddingRsvp = {
      ...parsed.data,
      createdAt: now,
      updatedAt: now,
    }

    const db = await getDb()
    const result = await db
      .collection<WeddingRsvp>(WEDDING_RSVPS_COLLECTION)
      .insertOne(record)

    return NextResponse.json(
      toWeddingRsvpPublic({ ...record, _id: result.insertedId }),
      { status: 201 },
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to submit RSVP"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
