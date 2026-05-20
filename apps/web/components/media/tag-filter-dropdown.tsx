"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import useSWR from "swr"
import { ChevronDown, Loader2, Tags, X } from "lucide-react"

import type { Tag } from "@/app/types/media"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface TagFilterDropdownProps {
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  className?: string
}

export function TagFilterDropdown({
  selectedTags,
  onTagsChange,
  className,
}: TagFilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: tags = [], isLoading } = useSWR<Tag[]>("/api/tags", fetcher)

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

  useEffect(() => {
    if (!open) {
      setSearch("")
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    return () => document.removeEventListener("mousedown", handlePointerDown)
  }, [open])

  const label =
    selectedTags.length === 0
      ? "Tags"
      : selectedTags.length === 1
        ? getDisplayName(selectedTags[0]!)
        : `${selectedTags.length} tags`

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between gap-2 font-normal"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="flex min-w-0 items-center gap-2">
          <Tags className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{label}</span>
          {selectedTags.length > 1 ? (
            <Badge variant="secondary" className="shrink-0 px-1.5 py-0">
              {selectedTags.length}
            </Badge>
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </Button>

      {open ? (
        <div className="absolute top-[calc(100%+4px)] right-0 z-50 w-64 rounded-xl border bg-popover p-2 shadow-lg">
          <Input
            placeholder="Filter tags…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="mb-2 h-8 text-sm"
          />

          {selectedTags.length > 0 ? (
            <div className="mb-2 flex flex-wrap gap-1 border-b pb-2">
              {selectedTags.map((tagId) => (
                <Badge key={tagId} variant="secondary" className="gap-1 pr-1">
                  {getDisplayName(tagId)}
                  <button
                    type="button"
                    onClick={() => toggleTag(tagId)}
                    className="rounded-full p-0.5 hover:bg-muted"
                    aria-label={`Remove ${getDisplayName(tagId)}`}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => onTagsChange([])}
              >
                Clear
              </Button>
            </div>
          ) : null}

          <div
            className="max-h-48 overflow-y-auto"
            role="listbox"
            aria-multiselectable
          >
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTags.length === 0 ? (
              <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                No tags found
              </p>
            ) : (
              filteredTags.map((tag) => {
                const selected = selectedTags.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted",
                      selected && "bg-primary/10 text-primary",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded border text-[10px]",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input",
                      )}
                    >
                      {selected ? "✓" : ""}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {tag.displayName}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      #{tag.id}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
