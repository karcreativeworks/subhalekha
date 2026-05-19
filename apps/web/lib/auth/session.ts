export const SESSION_COOKIE = "session_token"
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

export type SessionPayload = {
  clientId: string
  access: string[]
  expires: number
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error("SESSION_SECRET is not configured")
  }
  return secret
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function base64UrlToBuffer(value: string): ArrayBuffer {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/")
  const padLength = (4 - (padded.length % 4)) % 4
  const base64 = padded + "=".repeat(padLength)
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

async function hmac(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data))
  return bufferToBase64Url(signature)
}

export async function createSessionToken(
  clientId: string,
  access: string[] = [],
  ttlSeconds = SESSION_TTL_SECONDS,
): Promise<string> {
  const payload: SessionPayload = {
    clientId,
    access,
    expires: Date.now() + ttlSeconds * 1000,
  }
  const data = bufferToBase64Url(
    new TextEncoder().encode(JSON.stringify(payload)).buffer,
  )
  const signature = await hmac(data)
  return `${data}.${signature}`
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  const [data, signature] = token.split(".")
  if (!data || !signature) {
    return null
  }

  const expected = await hmac(data)
  if (signature !== expected) {
    return null
  }

  try {
    const json = new TextDecoder().decode(base64UrlToBuffer(data))
    const payload = JSON.parse(json) as SessionPayload
    if (payload.expires < Date.now()) {
      return null
    }
    return payload
  } catch {
    return null
  }
}
