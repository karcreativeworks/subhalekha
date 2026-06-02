import type { Metadata } from "next"

import { SangeetPlanPage } from "@/components/site/sangeet/sangeet-plan-page"
import { buildSangeetPlanMetadata } from "@/lib/site/share-metadata"

export const metadata: Metadata = buildSangeetPlanMetadata()

export const dynamic = "force-dynamic"

export default function SangeetPlanRoutePage() {
  return <SangeetPlanPage />
}
