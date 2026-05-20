import { ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"

import type { CreateGalleryBlockRequest, Event, GalleryBlock } from "@/app/types/gallery"
import { apiErrorResponse } from "@/lib/api/route-errors"
import { ADMIN_ACCESS } from "@/lib/auth/access"
import {
  requireAdminAccess,
  requireAdminAnyAccess,
} from "@/lib/auth/require-access"
import { sortByEventBlockOrder } from "@/lib/gallery/event-block-order"
import { appendBlockToEvent } from "@/lib/gallery/event-blocks-db"
import { parseDateField } from "@/lib/gallery/parse-date"
import { toGalleryBlockPublic } from "@/lib/gallery/normalize"
import { parseSlugInput } from "@/lib/gallery/slug"
import { isValidTeam } from "@/lib/gallery/team"
import { isGalleryBlockSlugTaken } from "@/lib/gallery/unique-slug"
import { verifyParentEvent } from "@/lib/gallery/verify-parent-event"
import { getDb } from "@/lib/db/mongodb"

export async function GET(request: NextRequest) {
  try {
    await requireAdminAnyAccess([
      ADMIN_ACCESS.GALLERY_BLOCKS_MANAGER,
      ADMIN_ACCESS.EVENTS_MANAGER,
    ])
    const { searchParams } = new URL(request.url)
    const parentEventId = searchParams.get("parentEventId")
    const sort = searchParams.get("sort") || "captureDate"
    const order = searchParams.get("order") || "desc"

    const query: Record<string, unknown> = {}
    if (parentEventId) {
      query.parentEventId = parentEventId
    }

    const db = await getDb()
    const blocks = await db
      .collection<GalleryBlock>("galleryBlocks")
      .find(query)
      .sort({ [sort]: order === "asc" ? 1 : -1 })
      .toArray()

    const publicBlocks = blocks.map(toGalleryBlockPublic)

    if (parentEventId && ObjectId.isValid(parentEventId)) {
      const parentEvent = await db.collection<Event>("events").findOne({
        _id: new ObjectId(parentEventId),
      })
      if (parentEvent) {
        return NextResponse.json(
          sortByEventBlockOrder(publicBlocks, parentEvent.blocks),
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
      ADMIN_ACCESS.GALLERY_BLOCKS_MANAGER,
    )
    const body = (await request.json()) as CreateGalleryBlockRequest

    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const slugResult = parseSlugInput(body.galleryBlockSlug, "galleryBlockSlug")
    if ("error" in slugResult) {
      return NextResponse.json({ error: slugResult.error }, { status: 400 })
    }

    if (await isGalleryBlockSlugTaken(clientId, slugResult.slug)) {
      return NextResponse.json(
        { error: "A gallery block with this slug already exists" },
        { status: 409 },
      )
    }
    if (!body.coverPicHorizontal?.trim()) {
      return NextResponse.json(
        { error: "coverPicHorizontal is required" },
        { status: 400 },
      )
    }
    if (!body.coverPicVertical?.trim()) {
      return NextResponse.json(
        { error: "coverPicVertical is required" },
        { status: 400 },
      )
    }
    if (!body.parentEventId?.trim()) {
      return NextResponse.json(
        { error: "parentEventId is required" },
        { status: 400 },
      )
    }
    if (!isValidTeam(body.team)) {
      return NextResponse.json(
        { error: "team must be bride, groom, or both" },
        { status: 400 },
      )
    }

    const captureDate = parseDateField(body.captureDate, "captureDate")
    if (!captureDate) {
      return NextResponse.json(
        { error: "Valid captureDate is required" },
        { status: 400 },
      )
    }

    const parentExists = await verifyParentEvent(
      body.parentEventId.trim(),
      clientId,
    )
    if (!parentExists) {
      return NextResponse.json(
        { error: "Parent event not found" },
        { status: 400 },
      )
    }

    const now = new Date()
    const record: GalleryBlock = {
      clientId,
      parentEventId: body.parentEventId.trim(),
      coverPicHorizontal: body.coverPicHorizontal.trim(),
      coverPicVertical: body.coverPicVertical.trim(),
      title: body.title.trim(),
      galleryBlockSlug: slugResult.slug,
      subtitle: body.subtitle?.trim() || undefined,
      description: body.description?.trim() || undefined,
      tags: body.tags ?? [],
      team: body.team,
      captureDate,
      bgMusic: body.bgMusic?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    }

    const db = await getDb()
    const result = await db
      .collection<GalleryBlock>("galleryBlocks")
      .insertOne(record)

    const blockId = result.insertedId.toString()
    await appendBlockToEvent(body.parentEventId.trim(), clientId, blockId)

    return NextResponse.json(
      toGalleryBlockPublic({ ...record, _id: result.insertedId }),
      { status: 201 },
    )
  } catch (error) {
    return apiErrorResponse(error)
  }
}
