import { ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"

import { requireAdminAccess } from "@/lib/auth/require-access"
import { getDb } from "@/lib/db/mongodb"

interface BulkUpdateRequest {
  fileIds: string[]
  operation: "add" | "remove" | "replace"
  tags: string[]
}

export async function PATCH(request: NextRequest) {
  try {
    const { clientId } = await requireAdminAccess("mediaUploader")
    const body = (await request.json()) as BulkUpdateRequest
    const { fileIds, operation, tags } = body

    if (!fileIds?.length) {
      return NextResponse.json({ error: "No file IDs provided" }, { status: 400 })
    }

    if (!operation || !tags?.length) {
      return NextResponse.json(
        { error: "Operation and tags are required" },
        { status: 400 },
      )
    }

    const objectIds = fileIds.map((id) => {
      if (!ObjectId.isValid(id)) {
        throw new Error(`Invalid file ID: ${id}`)
      }
      return new ObjectId(id)
    })

    const db = await getDb()
    const collection = db.collection("mediaFiles")
    const query = { _id: { $in: objectIds }, clientId }
    const existingFiles = await collection.find(query).toArray()

    if (existingFiles.length !== fileIds.length) {
      return NextResponse.json(
        { error: "Some files not found or access denied" },
        { status: 404 },
      )
    }

    const updateTime = new Date()
    let updateOperations: Array<{
      updateOne: {
        filter: { _id: ObjectId }
        update: Record<string, unknown>
      }
    }> = []

    switch (operation) {
      case "add":
        updateOperations = objectIds.map((id) => ({
          updateOne: {
            filter: { _id: id },
            update: {
              $set: { updatedAt: updateTime },
              $addToSet: { tags: { $each: tags } },
            },
          },
        }))
        break
      case "remove":
        updateOperations = objectIds.map((id) => ({
          updateOne: {
            filter: { _id: id },
            update: {
              $set: { updatedAt: updateTime },
              $pull: { tags: { $in: tags } },
            },
          },
        }))
        break
      case "replace":
        updateOperations = objectIds.map((id) => ({
          updateOne: {
            filter: { _id: id },
            update: {
              $set: {
                tags,
                updatedAt: updateTime,
              },
            },
          },
        }))
        break
      default:
        return NextResponse.json(
          { error: "Invalid operation. Must be add, remove, or replace" },
          { status: 400 },
        )
    }

    const result = await collection.bulkWrite(updateOperations)
    const updatedFiles = await collection.find(query).toArray()

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
      files: updatedFiles,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update media files"
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
