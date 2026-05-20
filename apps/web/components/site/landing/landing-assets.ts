export const LANDING_ASSETS = {
  bg: "/landing/clouds_background.jpg",
  driftBg: "/landing/clouds_drifting_bg.jpg",
  fog: `/landing/${encodeURIComponent("—Pngtree—light cloud of fog png_8058994.png")}`,
  fg: "/landing/clouds_white-fg.png",
  sparrow: "/landing/flying_sparrow.gif",
  woodpecker: "/landing/flying_woodpecker.gif",
  logo: "/logo_transparent_main.png",
  flag: "/landing/hanuman_flag.gif",
  lotus: "/landing/lotus.gif",
} as const

/** Placeholder copy — edit text & font later. */
export const LANDING_WORDS = {
  left: "శుభ",
  right: "లేఖ",
} as const

/** Mouse parallax depth — higher = moves more with cursor. */
export const PARALLAX_DEPTH = {
  bg: { x: 14, y: 9 },
  drift: { x: 22, y: 14 },
  fog: { x: 32, y: 20 },
  logo: { x: 38, y: 24 },
  sparrows: { x: 48, y: 32 },
  fg: { x: 62, y: 38 },
} as const

/**
 * Sparrows fly left across the upper half.
 * `delay` staggers batch entry; `gap` pauses before the next pass.
 */
export const SPARROW_SLOTS = [
  { top: "8%", duration: 12, delay: 2.0, gap: 14 },
  { top: "16%", duration: 16, delay: 2.5, gap: 18 },
  { top: "24%", duration: 10, delay: 3.0, gap: 12 },
  { top: "12%", duration: 19, delay: 11.0, gap: 20 },
  { top: "30%", duration: 14, delay: 11.4, gap: 15 },
  { top: "36%", duration: 17, delay: 11.8, gap: 17 },
] as const

export const SPARROW_OFFSCREEN_PAD = 48
