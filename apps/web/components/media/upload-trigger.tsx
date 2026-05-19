"use client"

import { useState } from "react"
import { Upload } from "lucide-react"

import { UploadDialog } from "@/components/media/upload-dialog"
import { Dropzone } from "@/components/ui/dropzone"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

interface UploadTriggerProps {
  onUploadComplete?: () => void
  variant?: "default" | "outline" | "secondary" | "ghost"
  className?: string
  uiType?: "button" | "dropzone"
  dropzoneClassName?: string
  maxFiles?: number
  autoUpload?: boolean
  preselectedTags?: string[]
}

export function UploadTrigger({
  onUploadComplete,
  variant = "default",
  className,
  uiType = "button",
  dropzoneClassName,
  maxFiles = 20,
  autoUpload = false,
  preselectedTags = [],
}: UploadTriggerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  if (uiType === "dropzone") {
    return (
      <>
        <Dropzone
          className={cn(dropzoneClassName)}
          maxFiles={maxFiles}
          onDrop={(acceptedFiles) => {
            setSelectedFiles(acceptedFiles)
            setIsDialogOpen(true)
          }}
        />
        <UploadDialog
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false)
            setSelectedFiles([])
          }}
          onUploadComplete={() => {
            onUploadComplete?.()
            setIsDialogOpen(false)
            setSelectedFiles([])
          }}
          initialFiles={selectedFiles}
          autoUpload={autoUpload}
          preselectedTags={preselectedTags}
        />
      </>
    )
  }

  return (
    <>
      <Button
        variant={variant}
        className={className}
        onClick={() => setIsDialogOpen(true)}
      >
        <Upload className="mr-2 size-4" />
        Upload files
      </Button>
      <UploadDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onUploadComplete={() => {
          onUploadComplete?.()
          setIsDialogOpen(false)
        }}
        autoUpload={autoUpload}
        preselectedTags={preselectedTags}
      />
    </>
  )
}
