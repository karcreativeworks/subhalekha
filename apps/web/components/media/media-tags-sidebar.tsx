"use client"

import { useEffect, useState } from "react"
import { Hash, Plus } from "lucide-react"

import type { Tag } from "@/app/types/media"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@/components/ui/input"
import { cn } from "@workspace/ui/lib/utils"

interface MediaTagsSidebarProps {
  selectedTag: string | null
  onSelectTag: (tagId: string | null) => void
}

export function MediaTagsSidebar({
  selectedTag,
  onSelectTag,
}: MediaTagsSidebarProps) {
  const [tags, setTags] = useState<Tag[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateTag, setShowCreateTag] = useState(false)
  const [newTagId, setNewTagId] = useState("")
  const [newTagName, setNewTagName] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const fetchTags = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/tags")
      if (response.ok) {
        setTags((await response.json()) as Tag[])
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void fetchTags()
  }, [])

  const createTag = async () => {
    if (!newTagId.trim() || !newTagName.trim()) return

    const response = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: newTagId.trim().toLowerCase(),
        displayName: newTagName.trim(),
      }),
    })

    if (response.ok) {
      const tag = (await response.json()) as Tag
      setTags((prev) => [...prev, tag])
      setNewTagId("")
      setNewTagName("")
      setShowCreateTag(false)
    }
  }

  const filteredTags = tags.filter((tag) =>
    tag.id.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r bg-muted/20">
      <div className="border-b p-4">
        <h2 className="text-sm font-semibold">Tags</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Filter the library by tag
        </p>
      </div>

      <div className="space-y-3 p-4">
        <Input
          placeholder="Search tags…"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />

        <Button
          variant={selectedTag === null ? "default" : "outline"}
          className="w-full justify-start"
          onClick={() => onSelectTag(null)}
        >
          All files
        </Button>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading tags…</p>
        ) : (
          <div className="max-h-[50vh] space-y-1 overflow-y-auto">
            {filteredTags.map((tag) => (
              <Button
                key={tag.id}
                variant={selectedTag === tag.id ? "default" : "ghost"}
                className={cn("w-full justify-start")}
                onClick={() => onSelectTag(tag.id)}
              >
                <Hash className="mr-2 size-4 shrink-0" />
                <span className="truncate">{tag.displayName}</span>
              </Button>
            ))}
          </div>
        )}

        {showCreateTag ? (
          <div className="space-y-2 rounded-xl border p-3">
            <Input
              placeholder="tag-id"
              value={newTagId}
              onChange={(event) => setNewTagId(event.target.value)}
            />
            <Input
              placeholder="Display name"
              value={newTagName}
              onChange={(event) => setNewTagName(event.target.value)}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => void createTag()}>
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCreateTag(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowCreateTag(true)}
          >
            <Plus className="mr-2 size-4" />
            New tag
          </Button>
        )}
      </div>
    </aside>
  )
}
