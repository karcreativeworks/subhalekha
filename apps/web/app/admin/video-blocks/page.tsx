"use client"

import { ADMIN_ACCESS } from "@/lib/auth/access"
import { VideoBlocksManager } from "@/components/admin/video-blocks-manager"
import { RequireAccess } from "@/components/admin/require-access"

export default function AdminVideoBlocksPage() {
  return (
    <RequireAccess access={ADMIN_ACCESS.VIDEO_BLOCKS_MANAGER}>
      <VideoBlocksManager />
    </RequireAccess>
  )
}
