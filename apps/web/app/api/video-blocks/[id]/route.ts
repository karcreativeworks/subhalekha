import { ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"

import type { UpdateVideoBlockRequest, VideoBlock } from "@/app/types/gallery"
import { apiErrorResponse } from "@/lib/api/route-errors"
import { ADMIN_ACCESS } from "@/lib/auth/access"
import { requireAdminAccess } from "@/lib/auth/require-access"
import {
  moveBlockBetweenEvents,
  removeBlockFromEvent,
} from "@/lib/gallery/event-blocks-db"
import { toVideoBlockPublic } from "@/lib/gallery/normalize"
import { parseSlugInput } from "@/lib/gallery/slug"
import { isVideoBlockSlugTaken } from "@/lib/gallery/unique-slug"
import { verifyParentEvent } from "@/lib/gallery/verify-parent-event"
import { isValidVideoUrl } from "@/lib/media/video-url"
import { getDb } from "@/lib/db/mongodb"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminAccess(ADMIN_ACCESS.VIDEO_BLOCKS_MANAGER)
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid video block id" }, { status: 400 })
    }

    const db = await getDb()
    const block = await db.collection<VideoBlock>("videoBlocks").findOne({
      _id: new ObjectId(id),
    })

    if (!block) {
      return NextResponse.json({ error: "Video block not found" }, { status: 404 })
    }

    return NextResponse.json(toVideoBlockPublic(block))
  } catch (error) {
    return apiErrorResponse(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminAccess(ADMIN_ACCESS.VIDEO_BLOCKS_MANAGER)
    const { id } = await params
    const body = (await request.json()) as UpdateVideoBlockRequest

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid video block id" }, { status: 400 })
    }

    const db = await getDb()
    const existing = await db.collection<VideoBlock>("videoBlocks").findOne({
      _id: new ObjectId(id),
    })

    if (!existing) {
      return NextResponse.json({ error: "Video block not found" }, { status: 404 })
    }

    const update: Record<string, unknown> = { updatedAt: new Date() }

    if (body.title !== undefined) {
      if (!body.title.trim()) {
        return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 })
      }
      update.title = body.title.trim()
    }
    if (body.videoBlockSlug !== undefined) {
      const slugResult = parseSlugInput(body.videoBlockSlug, "videoBlockSlug")
      if ("error" in slugResult) {
        return NextResponse.json({ error: slugResult.error }, { status: 400 })
      }
      if (await isVideoBlockSlugTaken(slugResult.slug, id)) {
        return NextResponse.json(
          { error: "A video block with this slug already exists" },
          { status: 409 },
        )
      }
      update.videoBlockSlug = slugResult.slug
    }
    if (body.videoUrl !== undefined) {
      if (!body.videoUrl.trim() || !isValidVideoUrl(body.videoUrl)) {
        return NextResponse.json(
          { error: "A valid video URL is required" },
          { status: 400 },
        )
      }
      update.videoUrl = body.videoUrl.trim()
    }
    if (body.subtitle !== undefined) {
      update.subtitle = body.subtitle.trim() || undefined
    }
    if (body.description !== undefined) {
      update.description = body.description.trim() || undefined
    }
    if (body.parentEventId !== undefined) {
      if (!body.parentEventId.trim()) {
        return NextResponse.json(
          { error: "parentEventId cannot be empty" },
          { status: 400 },
        )
      }
      const parentExists = await verifyParentEvent(body.parentEventId.trim())
      if (!parentExists) {
        return NextResponse.json(
          { error: "Parent event not found" },
          { status: 400 },
        )
      }
      update.parentEventId = body.parentEventId.trim()
    }

    const result = await db.collection<VideoBlock>("videoBlocks").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: "after" },
    )

    if (!result) {
      return NextResponse.json({ error: "Video block not found" }, { status: 404 })
    }

    if (
      body.parentEventId !== undefined &&
      body.parentEventId.trim() !== existing.parentEventId
    ) {
      await moveBlockBetweenEvents(
        existing.parentEventId,
        body.parentEventId.trim(),
        id,
        "video",
      )
    }

    return NextResponse.json(toVideoBlockPublic(result))
  } catch (error) {
    return apiErrorResponse(error)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminAccess(ADMIN_ACCESS.VIDEO_BLOCKS_MANAGER)
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid video block id" }, { status: 400 })
    }

    const db = await getDb()
    const existing = await db.collection<VideoBlock>("videoBlocks").findOne({
      _id: new ObjectId(id),
    })

    if (!existing) {
      return NextResponse.json({ error: "Video block not found" }, { status: 404 })
    }

    await db.collection("videoBlocks").deleteOne({ _id: new ObjectId(id) })
    await removeBlockFromEvent(existing.parentEventId, id, "video")

    return NextResponse.json({ success: true })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
