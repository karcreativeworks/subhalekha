import Link from "next/link"

import { glassPanel } from "@/components/site/glass"

export default function EventNotFound() {
  return (
    <div className={glassPanel("mx-auto mt-24 max-w-md rounded-2xl p-8 text-center")}>
      <h1 className="text-xl font-medium">Not found</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        This event or gallery does not exist.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block text-sm underline-offset-4 hover:underline"
      >
        Back to site
      </Link>
    </div>
  )
}
