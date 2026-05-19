"use client"

import { useCallback, useEffect, useRef } from "react"
import { useDropzone } from "react-dropzone"
import { Upload } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

interface DropzoneProps {
  onDrop: (files: File[]) => void
  onPaste?: (e: ClipboardEvent) => void
  maxFiles?: number
  className?: string
  disabled?: boolean
  description?: string
  hint?: string
}

export function Dropzone({
  onDrop,
  onPaste,
  maxFiles = 20,
  className,
  disabled = false,
  description = "Drop your files here or click to upload",
  hint = "Images and videos • bulk upload supported",
}: DropzoneProps) {
  const dropzoneRef = useRef<HTMLDivElement>(null)

  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      onDrop(acceptedFiles)
    },
    [onDrop],
  )

  useEffect(() => {
    const node = dropzoneRef.current
    if (!node || !onPaste) return

    const handler = (event: ClipboardEvent) => onPaste(event)
    node.addEventListener("paste", handler)
    return () => node.removeEventListener("paste", handler)
  }, [onPaste])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: handleDrop,
    accept: {
      "video/*": [".mp4", ".mov", ".webm", ".avi"],
      "audio/*": [".mp3", ".wav", ".m4a"],
      "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"],
    },
    maxFiles,
    disabled,
  })

  return (
    <div
      {...getRootProps()}
      ref={dropzoneRef}
      tabIndex={0}
      className={cn(
        "flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/50",
        className,
      )}
    >
      <input {...getInputProps()} />
      <Upload className="mb-2 size-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        {isDragActive ? "Drop files here…" : description}
      </p>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          open()
        }}
        className="mt-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        Browse files
      </button>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}
