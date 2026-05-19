"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { getDefaultAdminPath } from "@/lib/auth/access"
import { ForbiddenPage } from "@/components/admin/forbidden-page"
import { useSession } from "@/components/session-provider"

export function AdminHomeRedirect() {
  const router = useRouter()
  const sessionContext = useSession()

  useEffect(() => {
    if (sessionContext?.loading) return

    const path = getDefaultAdminPath(sessionContext?.session?.access)
    if (path) {
      router.replace(path)
    }
  }, [router, sessionContext?.loading, sessionContext?.session?.access])

  if (sessionContext?.loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (!getDefaultAdminPath(sessionContext?.session?.access)) {
    return (
      <ForbiddenPage
        title="No admin access"
        description="Your account is signed in but has no assigned permissions. Ask an administrator to grant access."
      />
    )
  }

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      Redirecting…
    </div>
  )
}
