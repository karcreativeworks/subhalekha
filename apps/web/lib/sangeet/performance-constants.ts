import type {
  SangeetDurationMinutes,
  SangeetGang,
  SangeetPerformanceType,
} from "@/app/types/sangeet-performance"

export const SANGEET_PERFORMANCE_TYPE_LABELS: Record<
  SangeetPerformanceType,
  string
> = {
  male_group_dance: "Male group dance",
  female_group_dance: "Female group dance",
  mixed_group_dance: "Mixed group dance",
  couple_dance: "Couple dance",
  male_solo: "Male solo",
  female_solo: "Female solo",
  other_talent: "Other talent",
}

export const SANGEET_GANG_LABELS: Record<SangeetGang, string> = {
  bride: "Bride's gang",
  groom: "Groom's gang",
}

export const SANGEET_DURATION_LABELS: Record<SangeetDurationMinutes, string> = {
  1: "1 min",
  2: "2 min",
  3: "3 min",
}

export { SANGEET_PERFORMANCES_PAGE_SIZE } from "@/lib/sangeet/pagination"

/** Replace with `/public/guide/sangeet/hero-desktop.jpg` when assets are ready. */
export const SANGEET_PLAN_HERO_DESKTOP = "/sangeet/hero-desktop.png"
export const SANGEET_PLAN_HERO_OG_META = "/sangeet/hero-desktop-og.jpeg"

/** Replace with `/public/guide/sangeet/hero-mobile.jpg` when assets are ready. */
export const SANGEET_PLAN_HERO_MOBILE = "/sangeet/hero-mobile3.png"
