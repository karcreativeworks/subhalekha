"use client"

import { ADMIN_ACCESS } from "@/lib/auth/access"
import { EventsManager } from "@/components/admin/events-manager"
import { RequireAccess } from "@/components/admin/require-access"

export default function AdminEventsPage() {
  return (
    <RequireAccess access={ADMIN_ACCESS.EVENTS_MANAGER}>
      <EventsManager />
    </RequireAccess>
  )
}
