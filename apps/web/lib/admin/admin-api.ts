import { useSession } from "@/components/session-provider"

/** Signed-in admin client id (session identity for permission checks, not document ownership). */
export function useAdminClientId(): string | undefined {
  return useSession()?.session?.clientId
}

/** Append session `clientId` as a query param for permission checks on the server. */
export function adminApiUrl(path: string, clientId: string): string {
  const question = path.indexOf("?")
  const pathname = question === -1 ? path : path.slice(0, question)
  const search = question === -1 ? "" : path.slice(question + 1)
  const params = new URLSearchParams(search)
  params.set("clientId", clientId)
  const query = params.toString()
  return `${pathname}?${query}`
}

/** Merge session `clientId` into a JSON request body. */
export function adminApiBody<T extends Record<string, unknown>>(
  clientId: string,
  body: T,
): T & { clientId: string } {
  return { ...body, clientId }
}

export function createAdminFetcher(clientId: string | undefined) {
  return (url: string) => {
    if (!clientId) {
      return Promise.reject(new Error("Not signed in"))
    }
    return fetch(adminApiUrl(url, clientId)).then((res) => res.json())
  }
}

export async function adminFetch(
  path: string,
  clientId: string | undefined,
  init?: RequestInit,
): Promise<Response> {
  if (!clientId) {
    throw new Error("Not signed in")
  }

  const method = (init?.method ?? "GET").toUpperCase()
  const headers = new Headers(init?.headers)

  if (method === "GET" || method === "DELETE") {
    return fetch(adminApiUrl(path, clientId), { ...init, headers })
  }

  if (
    init?.body &&
    typeof init.body === "string" &&
    headers.get("Content-Type")?.includes("application/json")
  ) {
    const parsed = JSON.parse(init.body) as Record<string, unknown>
    if ("clientId" in parsed) {
      return fetch(adminApiUrl(path, clientId), { ...init, headers })
    }
    return fetch(path, {
      ...init,
      headers,
      body: JSON.stringify(adminApiBody(clientId, parsed)),
    })
  }

  return fetch(adminApiUrl(path, clientId), { ...init, headers })
}
