import { ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"

import type { CreateVideoBlockRequest, Event, VideoBlock } from "@/app/types/gallery"
import { apiErrorResponse } from "@/lib/api/route-errors"
import { ADMIN_ACCESS } from "@/lib/auth/access"
import {
  requireAdminAccess,
  requireAdminAnyAccess,
} from "@/lib/auth/require-access"
import { appendBlockToEvent } from "@/lib/gallery/event-blocks-db"
import { sortByEventBlockOrder } from "@/lib/gallery/event-block-order"
import { toVideoBlockPublic } from "@/lib/gallery/normalize"
import { parseSlugInput } from "@/lib/gallery/slug"
import { isVideoBlockSlugTaken } from "@/lib/gallery/unique-slug"
import { verifyParentEvent } from "@/lib/gallery/verify-parent-event"
import { isValidVideoUrl } from "@/lib/media/video-url"
import { getDb } from "@/lib/db/mongodb"

export async function GET(request: NextRequest) {
  try {
    await requireAdminAnyAccess([
      ADMIN_ACCESS.VIDEO_BLOCKS_MANAGER,
      ADMIN_ACCESS.EVENTS_MANAGER,
    ])
    const { searchParams } = new URL(request.url)
    const parentEventId = searchParams.get("parentEventId")

    const query: Record<string, unknown> = {}
    if (parentEventId) {
      query.parentEventId = parentEventId
    }

    const db = await getDb()
    const blocks = await db
      .collection<VideoBlock>("videoBlocks")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    const publicBlocks = blocks.map(toVideoBlockPublic)

    if (parentEventId && ObjectId.isValid(parentEventId)) {
      const parentEvent = await db.collection<Event>("events").findOne({
        _id: new ObjectId(parentEventId),
      })
      if (parentEvent) {
        const videoRefs = (parentEvent.blocks ?? []).filter(
          (entry) => entry.blockType === "video",
        )
        return NextResponse.json(
          sortByEventBlockOrder(publicBlocks, videoRefs),
        )
      }
    }

    return NextResponse.json(publicBlocks)
  } catch (error) {
    return apiErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { clientId } = await requireAdminAccess(
      ADMIN_ACCESS.VIDEO_BLOCKS_MANAGER,
    )
    const body = (await request.json()) as CreateVideoBlockRequest

    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const slugResult = parseSlugInput(body.videoBlockSlug, "videoBlockSlug")
    if ("error" in slugResult) {
      return NextResponse.json({ error: slugResult.error }, { status: 400 })
    }

    if (await isVideoBlockSlugTaken(slugResult.slug)) {
      return NextResponse.json(
        { error: "A video block with this slug already exists" },
        { status: 409 },
      )
    }

    if (!body.videoUrl?.trim() || !isValidVideoUrl(body.videoUrl)) {
      return NextResponse.json(
        { error: "A valid video URL is required" },
        { status: 400 },
      )
    }

    if (!body.parentEventId?.trim()) {
      return NextResponse.json(
        { error: "parentEventId is required" },
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

    const now = new Date()
    const record: VideoBlock = {
      clientId,
      parentEventId: body.parentEventId.trim(),
      title: body.title.trim(),
      videoBlockSlug: slugResult.slug,
      videoUrl: body.videoUrl.trim(),
      subtitle: body.subtitle?.trim() || undefined,
      description: body.description?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    }

    const db = await getDb()
    const result = await db.collection<VideoBlock>("videoBlocks").insertOne(record)

    const blockId = result.insertedId.toString()
    await appendBlockToEvent(body.parentEventId.trim(), blockId, "video")

    return NextResponse.json(
      toVideoBlockPublic({ ...record, _id: result.insertedId }),
      { status: 201 },
    )
  } catch (error) {
    return apiErrorResponse(error)
  }
}
