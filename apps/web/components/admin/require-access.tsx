"use client"

import type { AdminAccessKey } from "@/lib/auth/access"
import { hasAccess } from "@/lib/auth/access"
import { ForbiddenPage } from "@/components/admin/forbidden-page"
import { useSession } from "@/components/session-provider"

interface RequireAccessProps {
  access: AdminAccessKey
  children: React.ReactNode
}

export function RequireAccess({ access, children }: RequireAccessProps) {
  const sessionContext = useSession()

  if (sessionContext?.loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (!hasAccess(sessionContext?.session?.access, access)) {
    return <ForbiddenPage />
  }

  return <>{children}</>
}
