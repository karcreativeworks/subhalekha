"use client"

import { useState } from "react"
import { Loader2, Plus, RefreshCw, Tag, X } from "lucide-react"
import { toast } from "sonner"

import { TagMultiSelect } from "@/components/media/tag-multi-select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Button } from "@workspace/ui/components/button"

interface BulkEditToolbarProps {
  selectedFiles: Set<string>
  onClearSelection: () => void
  onBulkUpdate: (
    fileIds: string[],
    operation: "add" | "remove" | "replace",
    tags: string[],
  ) => Promise<void>
  isUpdating?: boolean
}

export function BulkEditToolbar({
  selectedFiles,
  onClearSelection,
  onBulkUpdate,
  isUpdating = false,
}: BulkEditToolbarProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [operation, setOperation] = useState<"add" | "remove" | "replace">("add")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const selectedCount = selectedFiles.size

  if (selectedCount === 0) return null

  const handleBulkUpdate = async () => {
    if (!selectedTags.length) return
    try {
      await onBulkUpdate(Array.from(selectedFiles), operation, selectedTags)
      setShowDialog(false)
      setSelectedTags([])
      toast.success(`Updated ${selectedCount} file${selectedCount > 1 ? "s" : ""}`)
    } catch {
      toast.error("Failed to update files")
    }
  }

  return (
    <>
      <div className="mb-4 rounded-xl border border-primary/20 bg-primary/10 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              {selectedCount} file{selectedCount > 1 ? "s" : ""} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDialog(true)}
              disabled={isUpdating}
            >
              <Tag className="mr-2 size-4" />
              Edit tags
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={isUpdating}
          >
            Clear selection
          </Button>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Bulk edit tags</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Operation</Label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["add", "Add", Plus],
                    ["remove", "Remove", X],
                    ["replace", "Replace", RefreshCw],
                  ] as const
                ).map(([value, label, Icon]) => (
                  <Button
                    key={value}
                    type="button"
                    variant={operation === value ? "default" : "outline"}
                    onClick={() => setOperation(value)}
                  >
                    <Icon className="mr-2 size-4" />
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <TagMultiSelect
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              label={`Tags to ${operation}`}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleBulkUpdate()}
              disabled={!selectedTags.length || isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Updating…
                </>
              ) : (
                `Update ${selectedCount} file${selectedCount > 1 ? "s" : ""}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
