"use client"

import { ADMIN_ACCESS } from "@/lib/auth/access"
import { AdminUsersManager } from "@/components/admin/admin-users-manager"
import { RequireAccess } from "@/components/admin/require-access"

export default function AdminUsersPage() {
  return (
    <RequireAccess access={ADMIN_ACCESS.ADMIN_USERS}>
      <AdminUsersManager />
    </RequireAccess>
  )
}
