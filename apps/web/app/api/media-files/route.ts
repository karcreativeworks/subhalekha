import { NextRequest, NextResponse } from "next/server"

import type { CreateMediaFileRequest, MediaFile } from "@/app/types/media"
import { MEDIA_READ_ACCESS } from "@/lib/auth/access"
import {
  requireAdminAccess,
  requireAdminAnyAccess,
} from "@/lib/auth/require-access"
import { getDb } from "@/lib/db/mongodb"
import { buildImageDelivery } from "@/lib/media/cloudflare-image"
import { normalizeMediaFile } from "@/lib/media/normalize-media"

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminAnyAccess(MEDIA_READ_ACCESS)
    const db = await getDb()
    const collection = db.collection<MediaFile>("mediaFiles")
    const { searchParams } = new URL(request.url)

    const tag = searchParams.get("tag")
    const tags = searchParams.get("tags")
    const contentType = searchParams.get("contentType")
    const sort = searchParams.get("sort") || "createdAt"
    const order = searchParams.get("order") || "desc"
    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(searchParams.get("limit") || "50", 10) || 50),
    )
    const page = Math.max(
      1,
      Number.parseInt(searchParams.get("page") || "1", 10) || 1,
    )
    const offset = (page - 1) * limit
    const q = searchParams.get("q")?.trim() ?? ""

    const query: Record<string, unknown> = {}

    if (tag) {
      query.tags = { $in: [tag] }
    }
    if (tags) {
      query.tags = {
        $in: tags.includes(",") ? tags.split(",").map((t) => t.trim()) : [tags],
      }
    }
    if (contentType && contentType !== "all") {
      query.contentType = contentType
    }
    if (q) {
      const escaped = escapeRegex(q)
      query.$or = [
        { fileName: { $regex: escaped, $options: "i" } },
        { filePath: { $regex: escaped, $options: "i" } },
      ]
    }

    const sortObject = { [sort]: order === "asc" ? 1 : -1 } as Record<
      string,
      1 | -1
    >

    const [files, total] = await Promise.all([
      collection
        .find(query)
        .sort(sortObject)
        .skip(offset)
        .limit(limit)
        .toArray(),
      collection.countDocuments(query),
    ])

    return NextResponse.json({
      files: files.map((file) => normalizeMediaFile(file)),
      total,
      hasMore: offset + files.length < total,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch media files"
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { clientId } = await requireAdminAccess("mediaUploader")
    const body = (await request.json()) as CreateMediaFileRequest
    const {
      tags,
      taggedUsers,
      caption,
      contentType,
      contentMimeType,
      contentSubType,
      contentSource,
      contentSourceUrl,
      metadata,
      fileName,
      fileSize,
      filePath,
    } = body

    if (!tags?.length || !contentType || !contentMimeType || !contentSource) {
      return NextResponse.json(
        {
          error:
            "Required fields: tags, contentType, contentMimeType, contentSource",
        },
        { status: 400 },
      )
    }

    const db = await getDb()
    const collection = db.collection<MediaFile>("mediaFiles")

    if (filePath) {
      const existingFile = await collection.findOne({ filePath })
      if (existingFile) {
        return NextResponse.json(
          {
            ...normalizeMediaFile(existingFile),
            message: "Media file already exists",
          },
          { status: 200 },
        )
      }
    }

    const imageDelivery =
      contentType === "image" && filePath
        ? buildImageDelivery(filePath)
        : null

    const mediaFile: MediaFile = {
      tags,
      taggedUsers: taggedUsers ?? [],
      ...(caption !== undefined ? { caption } : {}),
      clientId,
      contentType,
      contentMimeType,
      contentSubType: contentSubType || "full",
      contentSource,
      contentSourceUrl,
      metadata: metadata ?? {},
      fileName,
      fileSize,
      filePath,
      ...(imageDelivery ? { imageDelivery } : {}),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await collection.insertOne(mediaFile)

    return NextResponse.json(
      normalizeMediaFile({
        ...mediaFile,
        _id: result.insertedId,
      }),
      { status: 201 },
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create media file"
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
