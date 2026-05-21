import { ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"

import type { GalleryBlock, UpdateGalleryBlockRequest } from "@/app/types/gallery"
import { apiErrorResponse } from "@/lib/api/route-errors"
import { ADMIN_ACCESS } from "@/lib/auth/access"
import { requireAdminAccess } from "@/lib/auth/require-access"
import { parseDateField } from "@/lib/gallery/parse-date"
import { toGalleryBlockPublic } from "@/lib/gallery/normalize"
import { parseSlugInput } from "@/lib/gallery/slug"
import { isValidTeam } from "@/lib/gallery/team"
import { isGalleryBlockSlugTaken } from "@/lib/gallery/unique-slug"
import {
  moveBlockBetweenEvents,
  removeBlockFromEvent,
} from "@/lib/gallery/event-blocks-db"
import { verifyParentEvent } from "@/lib/gallery/verify-parent-event"
import { getDb } from "@/lib/db/mongodb"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminAccess(ADMIN_ACCESS.GALLERY_BLOCKS_MANAGER)
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid gallery block id" },
        { status: 400 },
      )
    }

    const db = await getDb()
    const block = await db.collection<GalleryBlock>("galleryBlocks").findOne({
      _id: new ObjectId(id),
    })

    if (!block) {
      return NextResponse.json(
        { error: "Gallery block not found" },
        { status: 404 },
      )
    }

    return NextResponse.json(toGalleryBlockPublic(block))
  } catch (error) {
    return apiErrorResponse(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminAccess(ADMIN_ACCESS.GALLERY_BLOCKS_MANAGER)
    const { id } = await params
    const body = (await request.json()) as UpdateGalleryBlockRequest

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid gallery block id" },
        { status: 400 },
      )
    }

    const db = await getDb()
    const existing = await db.collection<GalleryBlock>("galleryBlocks").findOne({
      _id: new ObjectId(id),
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Gallery block not found" },
        { status: 404 },
      )
    }

    const update: Record<string, unknown> = { updatedAt: new Date() }

    if (body.title !== undefined) {
      if (!body.title.trim()) {
        return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 })
      }
      update.title = body.title.trim()
    }
    if (body.galleryBlockSlug !== undefined) {
      const slugResult = parseSlugInput(body.galleryBlockSlug, "galleryBlockSlug")
      if ("error" in slugResult) {
        return NextResponse.json({ error: slugResult.error }, { status: 400 })
      }
      if (await isGalleryBlockSlugTaken(slugResult.slug, id)) {
        return NextResponse.json(
          { error: "A gallery block with this slug already exists" },
          { status: 409 },
        )
      }
      update.galleryBlockSlug = slugResult.slug
    }
    if (body.coverPicHorizontal !== undefined) {
      if (!body.coverPicHorizontal.trim()) {
        return NextResponse.json(
          { error: "coverPicHorizontal cannot be empty" },
          { status: 400 },
        )
      }
      update.coverPicHorizontal = body.coverPicHorizontal.trim()
    }
    if (body.coverPicVertical !== undefined) {
      if (!body.coverPicVertical.trim()) {
        return NextResponse.json(
          { error: "coverPicVertical cannot be empty" },
          { status: 400 },
        )
      }
      update.coverPicVertical = body.coverPicVertical.trim()
    }
    if (body.subtitle !== undefined) {
      update.subtitle = body.subtitle.trim() || undefined
    }
    if (body.description !== undefined) {
      update.description = body.description.trim() || undefined
    }
    if (body.tags !== undefined) update.tags = body.tags
    if (body.team !== undefined) {
      if (!isValidTeam(body.team)) {
        return NextResponse.json(
          { error: "team must be bride, groom, or both" },
          { status: 400 },
        )
      }
      update.team = body.team
    }
    if (body.captureDate !== undefined) {
      const captureDate = parseDateField(body.captureDate, "captureDate")
      if (!captureDate) {
        return NextResponse.json(
          { error: "Valid captureDate is required" },
          { status: 400 },
        )
      }
      update.captureDate = captureDate
    }
    if (body.bgMusic !== undefined) {
      update.bgMusic = body.bgMusic.trim() || undefined
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

    const result = await db
      .collection<GalleryBlock>("galleryBlocks")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: update },
        { returnDocument: "after" },
      )

    if (!result) {
      return NextResponse.json(
        { error: "Gallery block not found" },
        { status: 404 },
      )
    }

    if (
      body.parentEventId !== undefined &&
      body.parentEventId.trim() !== existing.parentEventId
    ) {
      await moveBlockBetweenEvents(
        existing.parentEventId,
        body.parentEventId.trim(),
        id,
      )
    }

    return NextResponse.json(toGalleryBlockPublic(result))
  } catch (error) {
    return apiErrorResponse(error)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminAccess(ADMIN_ACCESS.GALLERY_BLOCKS_MANAGER)
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid gallery block id" },
        { status: 400 },
      )
    }

    const db = await getDb()
    const existing = await db.collection<GalleryBlock>("galleryBlocks").findOne({
      _id: new ObjectId(id),
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Gallery block not found" },
        { status: 404 },
      )
    }

    await db.collection("galleryBlocks").deleteOne({
      _id: new ObjectId(id),
    })

    await removeBlockFromEvent(existing.parentEventId, id, "gallery")

    return NextResponse.json({ success: true })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
