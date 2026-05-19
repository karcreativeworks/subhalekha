import { NextRequest, NextResponse } from "next/server"

import { isValidAccessKey } from "@/lib/auth/access"
import { requireAdminAccess } from "@/lib/auth/require-access"
import {
  adminClientsCol,
  findAdminClientByClientId,
  toPublicAdminClient,
  type DbAdminClient,
} from "@/lib/db/admin-clients"

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Request failed"
  const status =
    message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
  return NextResponse.json({ error: message }, { status })
}

function sanitizeAccess(access: unknown): string[] {
  if (!Array.isArray(access)) return []
  return access.filter(
    (key): key is string => typeof key === "string" && isValidAccessKey(key),
  )
}

export async function GET() {
  try {
    await requireAdminAccess("adminUsers")
    const clients = await adminClientsCol().then((col) =>
      col.find({}).sort({ clientId: 1 }).toArray(),
    )

    return NextResponse.json(clients.map(toPublicAdminClient))
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminAccess("adminUsers")
    const body = (await request.json()) as {
      clientId?: string
      apiKey?: string
      clientName?: string
      access?: string[]
      isValid?: boolean
    }

    const clientId = body.clientId?.trim()
    const apiKey = body.apiKey?.trim()
    const clientName = body.clientName?.trim() || clientId

    if (!clientId || !apiKey) {
      return NextResponse.json(
        { error: "clientId and apiKey are required" },
        { status: 400 },
      )
    }

    const existing = await findAdminClientByClientId(clientId)
    if (existing) {
      return NextResponse.json(
        { error: "Admin user with this clientId already exists" },
        { status: 409 },
      )
    }

    const col = await adminClientsCol()
    const duplicateKey = await col.findOne({ apiKey })
    if (duplicateKey) {
      return NextResponse.json(
        { error: "This client key is already in use" },
        { status: 409 },
      )
    }

    const access = sanitizeAccess(body.access)
    const record: DbAdminClient = {
      clientId,
      apiKey,
      clientName: clientName ?? clientId,
      isValid: body.isValid !== false,
      access,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await col.insertOne(record)

    return NextResponse.json(
      {
        ...toPublicAdminClient(record),
        apiKey,
      },
      { status: 201 },
    )
  } catch (error) {
    return errorResponse(error)
  }
}
