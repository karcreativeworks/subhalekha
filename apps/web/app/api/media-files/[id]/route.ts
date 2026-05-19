import { ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"

import type { MediaFile, UpdateMediaFileRequest } from "@/app/types/media"
import { requireAdminAccess } from "@/lib/auth/require-access"
import { getDb } from "@/lib/db/mongodb"
import { normalizeMediaFile } from "@/lib/media/normalize-media"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { clientId } = await requireAdminAccess("mediaUploader")
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid media id" }, { status: 400 })
    }

    const db = await getDb()
    const file = await db.collection<MediaFile>("mediaFiles").findOne({
      _id: new ObjectId(id),
      clientId,
    })

    if (!file) {
      return NextResponse.json({ error: "Media file not found" }, { status: 404 })
    }

    return NextResponse.json(normalizeMediaFile(file))
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch media file"
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { clientId } = await requireAdminAccess("mediaUploader")
    const { id } = await params
    const body = (await request.json()) as UpdateMediaFileRequest

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid media id" }, { status: 400 })
    }

    const update: Record<string, unknown> = { updatedAt: new Date() }

    if (body.tags !== undefined) update.tags = body.tags
    if (body.taggedUsers !== undefined) update.taggedUsers = body.taggedUsers
    if (body.caption !== undefined) update.caption = body.caption
    if (body.fileName !== undefined) update.fileName = body.fileName

    const db = await getDb()
    const result = await db.collection<MediaFile>("mediaFiles").findOneAndUpdate(
      { _id: new ObjectId(id), clientId },
      { $set: update },
      { returnDocument: "after" },
    )

    if (!result) {
      return NextResponse.json({ error: "Media file not found" }, { status: 404 })
    }

    return NextResponse.json(normalizeMediaFile(result))
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update media file"
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { clientId } = await requireAdminAccess("mediaUploader")
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid media id" }, { status: 400 })
    }

    const db = await getDb()
    const result = await db.collection("mediaFiles").deleteOne({
      _id: new ObjectId(id),
      clientId,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Media file not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete media file"
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
