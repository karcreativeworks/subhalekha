/** Guest site wedding side (Bride vs Groom). */
export type SiteGangSide = "bride" | "groom"

export const SITE_GANG_SIDES: SiteGangSide[] = ["bride", "groom"]

export const SITE_GANG_STORAGE_KEY = "subhalekha-site-gang"

export const SITE_GANG_LABELS: Record<SiteGangSide, string> = {
  bride: "Bride Gang",
  groom: "Groom Gang",
}

export function isSiteGangSide(value: string): value is SiteGangSide {
  return SITE_GANG_SIDES.includes(value as SiteGangSide)
}

export function readSiteGangFromStorage(): SiteGangSide | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(SITE_GANG_STORAGE_KEY)
    return raw && isSiteGangSide(raw) ? raw : null
  } catch {
    return null
  }
}

export function writeSiteGangToStorage(gang: SiteGangSide): void {
  try {
    window.localStorage.setItem(SITE_GANG_STORAGE_KEY, gang)
  } catch {
    // ignore quota / private mode
  }
}
