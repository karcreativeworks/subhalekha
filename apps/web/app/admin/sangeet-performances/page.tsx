"use client"

import { ADMIN_ACCESS } from "@/lib/auth/access"
import { SangeetPerformancesManager } from "@/components/admin/sangeet-performances-manager"
import { RequireAccess } from "@/components/admin/require-access"

export default function AdminSangeetPerformancesPage() {
  return (
    <RequireAccess access={ADMIN_ACCESS.SANGEET_PLAN_MANAGER}>
      <SangeetPerformancesManager />
    </RequireAccess>
  )
}
