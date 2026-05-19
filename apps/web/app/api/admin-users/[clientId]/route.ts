import { NextRequest, NextResponse } from "next/server"

import { isValidAccessKey } from "@/lib/auth/access"
import { requireAdminAccess } from "@/lib/auth/require-access"
import {
  adminClientsCol,
  toPublicAdminClient,
} from "@/lib/db/admin-clients"

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Request failed"
  const status =
    message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
  return NextResponse.json({ error: message }, { status })
}

function sanitizeAccess(access: unknown): string[] | undefined {
  if (!Array.isArray(access)) return undefined
  return access.filter(
    (key): key is string => typeof key === "string" && isValidAccessKey(key),
  )
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  try {
    await requireAdminAccess("adminUsers")
    const { clientId } = await params
    const body = (await request.json()) as {
      clientName?: string
      apiKey?: string
      access?: string[]
      isValid?: boolean
    }

    const update: Record<string, unknown> = { updatedAt: new Date() }

    if (body.clientName !== undefined) {
      update.clientName = body.clientName.trim()
    }
    if (body.apiKey !== undefined && body.apiKey.trim()) {
      const col = await adminClientsCol()
      const duplicate = await col.findOne({
        apiKey: body.apiKey.trim(),
        clientId: { $ne: clientId },
      })
      if (duplicate) {
        return NextResponse.json(
          { error: "This client key is already in use" },
          { status: 409 },
        )
      }
      update.apiKey = body.apiKey.trim()
    }
    const access = sanitizeAccess(body.access)
    if (access !== undefined) {
      update.access = access
    }
    if (body.isValid !== undefined) {
      update.isValid = body.isValid
    }

    const col = await adminClientsCol()
    const result = await col.findOneAndUpdate(
      { clientId },
      { $set: update },
      { returnDocument: "after" },
    )

    if (!result) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 })
    }

    return NextResponse.json(toPublicAdminClient(result))
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  try {
    const { clientId: currentClientId } = await requireAdminAccess("adminUsers")
    const { clientId } = await params

    if (clientId === currentClientId) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 },
      )
    }

    const col = await adminClientsCol()
    const result = await col.updateOne(
      { clientId },
      { $set: { isValid: false, updatedAt: new Date() } },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return errorResponse(error)
  }
}
