"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export const MEDIA_UPLOADER_PAGE_SIZE = 50
export const MEDIA_PICKER_PAGE_SIZE = 24

interface MediaPaginationProps {
  page: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  isLoading?: boolean
  className?: string
}

export function MediaPagination({
  page,
  total,
  pageSize,
  onPageChange,
  isLoading = false,
  className,
}: MediaPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1
  const end = Math.min(safePage * pageSize, total)

  const canPrev = safePage > 1 && !isLoading
  const canNext = safePage < totalPages && !isLoading

  if (total === 0) {
    return null
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t pt-3",
        className,
      )}
    >
      <p className="text-sm text-muted-foreground">
        Showing {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canPrev}
          onClick={() => onPageChange(safePage - 1)}
        >
          <ChevronLeft className="mr-1 size-4" />
          Previous
        </Button>
        <span className="min-w-[5rem] text-center text-sm text-muted-foreground">
          Page {safePage} of {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canNext}
          onClick={() => onPageChange(safePage + 1)}
        >
          Next
          <ChevronRight className="ml-1 size-4" />
        </Button>
      </div>
    </div>
  )
}
