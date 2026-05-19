"use client"

import { useState } from "react"

import { ADMIN_ACCESS } from "@/lib/auth/access"
import { RequireAccess } from "@/components/admin/require-access"
import { MediaContent } from "@/components/media/media-content"
import { MediaTagsSidebar } from "@/components/media/media-tags-sidebar"

export default function AdminMediaPage() {
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [hashtagFilters, setHashtagFilters] = useState<string[]>([])

  return (
    <RequireAccess access={ADMIN_ACCESS.MEDIA_UPLOADER}>
      <div className="flex min-h-0 flex-1">
        <MediaTagsSidebar
          selectedTag={selectedTag}
          onSelectTag={(tagId) => {
            setSelectedTag(tagId)
            setHashtagFilters(tagId ? [tagId] : [])
          }}
        />
        <MediaContent
          selectedTag={selectedTag}
          hashtagFilters={hashtagFilters}
          onHashtagFiltersChange={setHashtagFilters}
        />
      </div>
    </RequireAccess>
  )
}
