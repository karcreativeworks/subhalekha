"use client"

import { ADMIN_ACCESS } from "@/lib/auth/access"
import { GalleryBlocksManager } from "@/components/admin/gallery-blocks-manager"
import { RequireAccess } from "@/components/admin/require-access"

export default function AdminGalleryBlocksPage() {
  return (
    <RequireAccess access={ADMIN_ACCESS.GALLERY_BLOCKS_MANAGER}>
      <GalleryBlocksManager />
    </RequireAccess>
  )
}
