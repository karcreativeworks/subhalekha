"use client"

import { useState } from "react"
import { ImageIcon } from "lucide-react"

import { MediaPickerDialog } from "@/components/media/media-picker-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@workspace/ui/components/button"

interface CoverImageFieldProps {
  /** Session client id for admin media picker API calls. */
  clientId?: string
  id?: string
  label?: string
  value: string
  onChange: (url: string) => void
  placeholder?: string
}

export function CoverImageField({
  clientId,
  id = "cover-image",
  label = "Cover image URL",
  value,
  onChange,
  placeholder = "https://…",
}: CoverImageFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <div className="flex gap-2">
          <Input
            id={id}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className="min-w-0 flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            title="Pick from media library"
            aria-label="Pick from media library"
            onClick={() => setPickerOpen(true)}
          >
            <ImageIcon className="size-4" />
          </Button>
        </div>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="Cover preview"
            className="mt-2 h-24 w-auto max-w-full rounded-lg border object-cover"
          />
        ) : null}
      </div>

      <MediaPickerDialog
        clientId={clientId}
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        selectedUrl={value}
        onSelect={onChange}
      />
    </>
  )
}
