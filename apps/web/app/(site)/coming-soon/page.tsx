import Link from "next/link"

import { PageHeader } from "@/components/site/page-header"
import { glassPanel } from "@/components/site/glass"
import { cn } from "@workspace/ui/lib/utils"

interface ComingSoonPageProps {
  searchParams: Promise<{ section?: string }>
}

const SECTION_LABELS: Record<string, string> = {
  map: "Map",
  itinerary: "Itinerary",
  dresscode: "Dresscode",
  schedule: "Schedule",
  live: "Live",
}

export default async function ComingSoonPage({
  searchParams,
}: ComingSoonPageProps) {
  const { section } = await searchParams
  const label = section
    ? (SECTION_LABELS[section] ?? section)
    : "This page"

  return (
    <>
      <PageHeader
        title={`${label} — coming soon`}
        description="We are still putting the finishing touches on this section. Check back soon."
        backHref="/"
        backLabel="Home"
      />
      <div className={cn(glassPanel("rounded-2xl p-8 text-center"))}>
        <p className="text-muted-foreground text-sm">
          Meanwhile, explore{" "}
          <Link href="/" className="text-foreground underline-offset-4 hover:underline">
            the homepage
          </Link>{" "}
          or an event gallery from the menu above.
        </p>
      </div>
    </>
  )
}
