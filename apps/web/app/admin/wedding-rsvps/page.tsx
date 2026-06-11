"use client"

import { ADMIN_ACCESS } from "@/lib/auth/access"
import { WeddingRsvpsManager } from "@/components/admin/wedding-rsvps-manager"
import { RequireAccess } from "@/components/admin/require-access"

export default function AdminWeddingRsvpsPage() {
  return (
    <RequireAccess access={ADMIN_ACCESS.WEDDING_RSVP_MANAGER}>
      <WeddingRsvpsManager />
    </RequireAccess>
  )
}
