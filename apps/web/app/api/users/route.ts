import { NextRequest, NextResponse } from "next/server"

import type { CreateUserRequest, User } from "@/app/types/users"
import { requireAdminAccess } from "@/lib/auth/require-access"
import { getDb } from "@/lib/db/mongodb"

export async function GET() {
  try {
    await requireAdminAccess("mediaUploader")
    const db = await getDb()
    const users = await db
      .collection<User>("users")
      .find({})
      .sort({ displayName: 1 })
      .toArray()

    return NextResponse.json(users)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch users"
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { clientId } = await requireAdminAccess("mediaUploader")
    const body = (await request.json()) as CreateUserRequest
    const { id, displayName, notes } = body

    if (!id || !displayName) {
      return NextResponse.json(
        { error: "User id and displayName are required" },
        { status: 400 },
      )
    }

    const db = await getDb()
    const collection = db.collection<User>("users")

    const existing = await collection.findOne({ id })
    if (existing) {
      return NextResponse.json(
        { error: "A user with this id already exists" },
        { status: 409 },
      )
    }

    const user: User = {
      id,
      displayName,
      clientId,
      ...(notes ? { notes } : {}),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await collection.insertOne(user)

    return NextResponse.json(
      { ...user, _id: result.insertedId },
      { status: 201 },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create user"
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
