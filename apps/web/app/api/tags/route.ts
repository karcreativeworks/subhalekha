import { NextRequest, NextResponse } from "next/server"

import type { CreateTagRequest, Tag } from "@/app/types/media"
import { TAG_ADMIN_ACCESS } from "@/lib/auth/access"
import { requireAdminAnyAccess } from "@/lib/auth/require-access"
import { getDb } from "@/lib/db/mongodb"

export async function GET() {
  try {
    await requireAdminAnyAccess(TAG_ADMIN_ACCESS)
    const db = await getDb()
    const tags = await db
      .collection<Tag>("tags")
      .find({})
      .sort({ displayName: 1 })
      .toArray()

    return NextResponse.json(tags)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch tags"
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { clientId } = await requireAdminAnyAccess(TAG_ADMIN_ACCESS)
    const body = (await request.json()) as CreateTagRequest
    const { id, displayName } = body

    if (!id || !displayName) {
      return NextResponse.json(
        { error: "Tag id and displayName are required" },
        { status: 400 },
      )
    }

    const db = await getDb()
    const collection = db.collection<Tag>("tags")

    const existingTag = await collection.findOne({ id, clientId })
    if (existingTag) {
      return NextResponse.json(
        { error: "Tag with this id already exists" },
        { status: 409 },
      )
    }

    const tag: Tag = {
      id,
      displayName,
      clientId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await collection.insertOne(tag)

    return NextResponse.json(
      {
        ...tag,
        _id: result.insertedId,
      },
      { status: 201 },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create tag"
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
