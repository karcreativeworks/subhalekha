"use client"

import { useEffect, useRef, useState } from "react"
import { FileAudio, FileText, FileVideo, Image as ImageIcon, Upload } from "lucide-react"

import { detectContentType } from "@/lib/media/detect-content-type"
import { TagMultiSelect } from "@/components/media/tag-multi-select"
import { Dropzone } from "@/components/ui/dropzone"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Button } from "@workspace/ui/components/button"

interface UploadDialogProps {
  isOpen: boolean
  onClose: () => void
  onUploadComplete: () => void
  initialFiles?: File[]
  autoUpload?: boolean
  preselectedTags?: string[]
}

interface UploadProgressItem {
  file: File
  status: "pending" | "uploading" | "completed" | "error"
  progress: number
  mediaUrl?: string
  error?: string
}

export function UploadDialog({
  isOpen,
  onClose,
  onUploadComplete,
  initialFiles = [],
  autoUpload = false,
  preselectedTags = [],
}: UploadDialogProps) {
  const [files, setFiles] = useState<File[]>(initialFiles)
  const [selectedTags, setSelectedTags] = useState<string[]>(preselectedTags)
  const [uploadProgress, setUploadProgress] = useState<UploadProgressItem[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const uploadInProgressRef = useRef(false)

  useEffect(() => {
    setSelectedTags(preselectedTags)
  }, [preselectedTags])

  useEffect(() => {
    if (initialFiles.length > 0) {
      setFiles(initialFiles)
    }
  }, [initialFiles])

  useEffect(() => {
    if (files.length > 0) {
      setUploadProgress(
        files.map((file) => ({
          file,
          status: "pending",
          progress: 0,
        })),
      )
    }
  }, [files])


  const uploadFilesToStorage = async () => {
    if (files.length === 0 || uploadInProgressRef.current) return []

    uploadInProgressRef.current = true
    setIsUploading(true)

    try {
      const results = await Promise.all(
        files.map(async (file, index) => {
          setUploadProgress((prev) =>
            prev.map((item, itemIndex) =>
              itemIndex === index
                ? { ...item, status: "uploading", progress: 0 }
                : item,
            ),
          )

          const presignedResponse = await fetch(
            `/api/upload-url?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`,
          )

          if (!presignedResponse.ok) {
            throw new Error(`Failed to get upload URL for ${file.name}`)
          }

          const { uploadUrl, publicUrl } = (await presignedResponse.json()) as {
            uploadUrl: string
            publicUrl: string
          }

          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            xhr.open("PUT", uploadUrl)
            xhr.setRequestHeader("Content-Type", file.type)
            xhr.setRequestHeader("x-amz-acl", "public-read")
            xhr.upload.onprogress = (event) => {
              if (!event.lengthComputable) return
              const progress = (event.loaded / event.total) * 100
              setUploadProgress((prev) =>
                prev.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, progress } : item,
                ),
              )
            }
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) resolve()
              else reject(new Error(`Upload failed with status ${xhr.status}`))
            }
            xhr.onerror = () => reject(new Error("Network error during upload"))
            xhr.send(file)
          })

          setUploadProgress((prev) =>
            prev.map((item, itemIndex) =>
              itemIndex === index
                ? {
                  ...item,
                  status: "completed",
                  progress: 100,
                  mediaUrl: publicUrl,
                }
                : item,
            ),
          )

          return { file, publicUrl }
        }),
      )

      return results
    } finally {
      setIsUploading(false)
      uploadInProgressRef.current = false
    }
  }

  const createMediaEntries = async (
    uploaded: Array<{ file: File; publicUrl: string }>,
  ) => {
    setIsSaving(true)
    try {
      await Promise.all(
        uploaded.map(async ({ file, publicUrl }) => {
          const response = await fetch("/api/media-files", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tags: selectedTags,
              contentType: detectContentType(file),
              contentMimeType: file.type || "application/octet-stream",
              contentSubType: "full",
              contentSource: "upload",
              contentSourceUrl: "upload",
              fileName: file.name,
              fileSize: file.size,
              filePath: publicUrl,
              metadata: {},
            }),
          })

          if (!response.ok) {
            throw new Error(`Failed to save ${file.name}`)
          }
        }),
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpload = async () => {
    if (files.length === 0 || selectedTags.length === 0) return

    try {
      const uploaded = await uploadFilesToStorage()
      await createMediaEntries(uploaded)
      onUploadComplete()
      handleClose()
    } catch (error) {
      console.error(error)
    }
  }

  const handleClose = () => {
    setFiles([])
    setUploadProgress([])
    onClose()
  }

  const getIcon = (file: File) => {
    const type = detectContentType(file)
    if (type === "image") return <ImageIcon className="size-4" />
    if (type === "video") return <FileVideo className="size-4" />
    if (type === "audio") return <FileAudio className="size-4" />
    return <FileText className="size-4" />
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload media</DialogTitle>
          <DialogDescription>
            Bulk upload images and videos. Add at least one tag before saving.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Dropzone
            onDrop={(accepted) => setFiles((prev) => [...prev, ...accepted])}
            maxFiles={50}
          />

          <TagMultiSelect
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            label="Tags (required)"
          />

          {uploadProgress.length > 0 ? (
            <div className="space-y-2">
              {uploadProgress.map((item) => (
                <div
                  key={`${item.file.name}-${item.file.size}`}
                  className="rounded-xl border p-3"
                >
                  <div className="mb-2 flex items-center gap-2 text-sm">
                    {getIcon(item.file)}
                    <span className="truncate">{item.file.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {item.status}
                    </span>
                  </div>
                  <Progress value={item.progress} />
                  {item.error ? (
                    <p className="mt-1 text-xs text-destructive">{item.error}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleUpload()}
            disabled={
              files.length === 0 ||
              selectedTags.length === 0 ||
              isUploading ||
              isSaving
            }
          >
            <Upload className="mr-2 size-4" />
            {isUploading || isSaving
              ? "Uploading…"
              : `Upload ${files.length} file${files.length === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
