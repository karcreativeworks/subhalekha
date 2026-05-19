"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { Loader2, Plus, X } from "lucide-react"

import type { Tag } from "@/app/types/media"
import { Badge } from "@/components/ui/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@workspace/ui/lib/utils"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface TagMultiSelectProps {
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  label?: string
  className?: string
}

export function TagMultiSelect({
  selectedTags,
  onTagsChange,
  label = "Tags",
  className,
}: TagMultiSelectProps) {
  const [search, setSearch] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const { data: tags = [], isLoading, mutate } = useSWR<Tag[]>("/api/tags", fetcher)

  const filteredTags = useMemo(() => {
    if (!search.trim()) return tags
    const query = search.toLowerCase()
    return tags.filter(
      (tag) =>
        tag.displayName.toLowerCase().includes(query) ||
        tag.id.toLowerCase().includes(query),
    )
  }, [tags, search])

  const getDisplayName = (tagId: string) =>
    tags.find((tag) => tag.id === tagId)?.displayName ?? tagId

  const toggleTag = (tagId: string) => {
    onTagsChange(
      selectedTags.includes(tagId)
        ? selectedTags.filter((id) => id !== tagId)
        : [...selectedTags, tagId],
    )
  }

  const createTag = async () => {
    const name = search.trim()
    if (!name || isCreating) return

    const id = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")

    setIsCreating(true)
    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, displayName: name }),
      })
      if (response.ok) {
        const newTag = (await response.json()) as Tag
        await mutate()
        onTagsChange([...selectedTags, newTag.id])
        setSearch("")
      }
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      {label ? <Label>{label}</Label> : null}

      {selectedTags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((tagId) => (
            <Badge key={tagId} variant="secondary" className="gap-1 pr-1">
              {getDisplayName(tagId)}
              <button
                type="button"
                onClick={() =>
                  onTagsChange(selectedTags.filter((id) => id !== tagId))
                }
                className="rounded-full p-0.5 hover:bg-muted"
                aria-label={`Remove ${getDisplayName(tagId)}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}

      <Input
        placeholder="Search or create a tag…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault()
            const exact = tags.find(
              (tag) =>
                tag.id === search.trim().toLowerCase() ||
                tag.displayName.toLowerCase() === search.trim().toLowerCase(),
            )
            if (exact) {
              toggleTag(exact.id)
              setSearch("")
              return
            }
            void createTag()
          }
        }}
      />

      <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border p-2">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          filteredTags.map((tag) => {
            const selected = selectedTags.includes(tag.id)
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted",
                  selected && "bg-primary/10 text-primary",
                )}
              >
                <span>{tag.displayName}</span>
                <span className="text-xs text-muted-foreground">#{tag.id}</span>
              </button>
            )
          })
        )}
      </div>

      {search.trim() &&
      !tags.some(
        (tag) =>
          tag.displayName.toLowerCase() === search.trim().toLowerCase() ||
          tag.id === search.trim().toLowerCase(),
      ) ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void createTag()}
          disabled={isCreating}
        >
          {isCreating ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Plus className="mr-2 size-4" />
          )}
          Create &quot;{search.trim()}&quot;
        </Button>
      ) : null}
    </div>
  )
}
