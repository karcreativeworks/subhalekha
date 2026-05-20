"use client"

import { useEffect, useState } from "react"
import { Copy, ExternalLink, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import type { MediaFile } from "@/app/types/media"
import { getMediaImageUrl } from "@/lib/media/cloudflare-image"
import { UserMultiSelect } from "@/components/media/user-multi-select"
import { TagMultiSelect } from "@/components/media/tag-multi-select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@workspace/ui/components/button"

function getFileId(file: MediaFile) {
  return typeof file._id === "string" ? file._id : file._id?.toString() ?? ""
}

interface MediaDetailDialogProps {
  mediaFile: MediaFile | null
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  onDelete?: (file: MediaFile) => void
}

export function MediaDetailDialog({
  mediaFile,
  isOpen,
  onClose,
  onSaved,
  onDelete,
}: MediaDetailDialogProps) {
  const [fileName, setFileName] = useState("")
  const [caption, setCaption] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [taggedUsers, setTaggedUsers] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isOpen || !mediaFile) return
    setFileName(mediaFile.fileName ?? "")
    setCaption(mediaFile.caption ?? "")
    setSelectedTags(mediaFile.tags ?? [])
    setTaggedUsers(mediaFile.taggedUsers ?? [])
  }, [isOpen, mediaFile])

  const handleSave = async () => {
    const id = mediaFile ? getFileId(mediaFile) : ""
    if (!id) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/media-files/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: fileName.trim() || undefined,
          caption: caption.trim(),
          tags: selectedTags,
          taggedUsers,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save")
      }

      toast.success("Media updated")
      onSaved()
      onClose()
    } catch {
      toast.error("Failed to update media")
    } finally {
      setIsSaving(false)
    }
  }

  if (!mediaFile) return null

  const originalSrc = mediaFile.filePath ?? ""
  const isAudio = mediaFile.contentType === "audio"

  const copyOriginalUrl = async () => {
    if (!originalSrc) return
    try {
      await navigator.clipboard.writeText(originalSrc)
      toast.success("URL copied to clipboard")
    } catch {
      toast.error("Could not copy URL")
    }
  }

  const previewSrc =
    mediaFile.contentType === "image"
      ? getMediaImageUrl(mediaFile, "large") || originalSrc
      : originalSrc

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[92vh] w-[min(96vw,1100px)] max-w-none flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>{fileName || "Media details"}</DialogTitle>
          <DialogDescription>
            Edit tags, caption, and tagged users for this file.
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[1.1fr_1fr]">
          <div className="flex min-h-[240px] items-center justify-center bg-neutral-950 p-4 lg:min-h-[420px]">
            {mediaFile.contentType === "image" && previewSrc ? (
              <img
                src={previewSrc}
                alt={fileName || "Media preview"}
                className="max-h-[50vh] max-w-full rounded-lg object-contain lg:max-h-[70vh]"
              />
            ) : mediaFile.contentType === "video" && originalSrc ? (
              <video
                src={originalSrc}
                controls
                className="max-h-[50vh] max-w-full rounded-lg lg:max-h-[70vh]"
              />
            ) : mediaFile.contentType === "audio" && originalSrc ? (
              <audio src={originalSrc} controls className="w-full max-w-md" />
            ) : (
              <p className="text-sm text-muted-foreground">No preview available</p>
            )}
          </div>

          <div className="space-y-5 overflow-y-auto border-t p-6 lg:border-t-0 lg:border-l">
            <div className="space-y-2">
              <Label htmlFor="media-file-name">File name</Label>
              <Input
                id="media-file-name"
                value={fileName}
                onChange={(event) => setFileName(event.target.value)}
                placeholder="Optional display name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="media-caption">Caption</Label>
              <Textarea
                id="media-caption"
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                placeholder="Describe this image or video…"
                rows={4}
              />
            </div>

            <TagMultiSelect
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              label="Tags"
            />

            <UserMultiSelect
              taggedUsers={taggedUsers}
              onTaggedUsersChange={setTaggedUsers}
            />

            {originalSrc ? (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={originalSrc} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 size-4" />
                    Open original file
                  </a>
                </Button>
                {isAudio ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void copyOriginalUrl()}
                  >
                    <Copy className="mr-2 size-4" />
                    Copy URL
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          {onDelete ? (
            <Button
              type="button"
              variant="destructive"
              className="mr-auto"
              onClick={() => {
                onDelete(mediaFile)
                onClose()
              }}
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
