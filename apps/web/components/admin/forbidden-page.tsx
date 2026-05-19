import Link from "next/link"
import { ShieldX } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

interface ForbiddenPageProps {
  title?: string
  description?: string
}

export function ForbiddenPage({
  title = "403 — Forbidden",
  description = "You do not have permission to view this page. Contact an administrator if you need access.",
}: ForbiddenPageProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldX className="size-7" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      <div className="mt-6 flex gap-2">
        <Button variant="outline" asChild>
          <Link href="/admin">Admin home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">View site</Link>
        </Button>
      </div>
    </div>
  )
}
