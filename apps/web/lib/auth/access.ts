/** Known admin permission keys. */
export const ADMIN_ACCESS = {
  MEDIA_UPLOADER: "mediaUploader",
  ADMIN_USERS: "adminUsers",
  SUPER_ADMIN: "superAdmin",
} as const

export type AdminAccessKey =
  (typeof ADMIN_ACCESS)[keyof typeof ADMIN_ACCESS]

/** Granular permissions assignable per feature. */
export const ALL_ADMIN_ACCESS: AdminAccessKey[] = [
  ADMIN_ACCESS.MEDIA_UPLOADER,
  ADMIN_ACCESS.ADMIN_USERS,
]

export const ADMIN_ACCESS_LABELS: Record<AdminAccessKey, string> = {
  [ADMIN_ACCESS.MEDIA_UPLOADER]: "Media Uploader",
  [ADMIN_ACCESS.ADMIN_USERS]: "Admin Users",
  [ADMIN_ACCESS.SUPER_ADMIN]: "Super Admin",
}

export function isSuperAdmin(access: string[] | undefined): boolean {
  return access?.includes(ADMIN_ACCESS.SUPER_ADMIN) ?? false
}

export function isValidAccessKey(key: string): key is AdminAccessKey {
  return (
    ALL_ADMIN_ACCESS.includes(key as AdminAccessKey) ||
    key === ADMIN_ACCESS.SUPER_ADMIN
  )
}

export function hasAccess(
  access: string[] | undefined,
  required: AdminAccessKey | string,
): boolean {
  if (isSuperAdmin(access)) return true
  return access?.includes(required) ?? false
}

export function hasAnyAccess(
  access: string[] | undefined,
  required: (AdminAccessKey | string)[],
): boolean {
  if (isSuperAdmin(access)) return true
  if (!access?.length) return false
  return required.some((key) => access.includes(key))
}

/** First admin route the user may land on. */
export function getDefaultAdminPath(
  access: string[] | undefined,
): string | null {
  if (hasAccess(access, ADMIN_ACCESS.MEDIA_UPLOADER)) {
    return "/admin/media"
  }
  if (hasAccess(access, ADMIN_ACCESS.ADMIN_USERS)) {
    return "/admin/users"
  }
  return null
}
