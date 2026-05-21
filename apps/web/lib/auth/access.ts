/** Known admin permission keys. */
export const ADMIN_ACCESS = {
  MEDIA_UPLOADER: "mediaUploader",
  EVENTS_MANAGER: "eventsManager",
  GALLERY_BLOCKS_MANAGER: "galleryBlocksManager",
  VIDEO_BLOCKS_MANAGER: "videoBlocksManager",
  ADMIN_USERS: "adminUsers",
  SUPER_ADMIN: "superAdmin",
} as const

export type AdminAccessKey =
  (typeof ADMIN_ACCESS)[keyof typeof ADMIN_ACCESS]

/** Permissions assignable on the admin users page. */
export const ALL_ADMIN_ACCESS: AdminAccessKey[] = [
  ADMIN_ACCESS.MEDIA_UPLOADER,
  ADMIN_ACCESS.EVENTS_MANAGER,
  ADMIN_ACCESS.GALLERY_BLOCKS_MANAGER,
  ADMIN_ACCESS.VIDEO_BLOCKS_MANAGER,
  ADMIN_ACCESS.ADMIN_USERS,
  ADMIN_ACCESS.SUPER_ADMIN,
]

export const ADMIN_ACCESS_LABELS: Record<AdminAccessKey, string> = {
  [ADMIN_ACCESS.MEDIA_UPLOADER]: "Media Uploader",
  [ADMIN_ACCESS.EVENTS_MANAGER]: "Events",
  [ADMIN_ACCESS.GALLERY_BLOCKS_MANAGER]: "Gallery Blocks",
  [ADMIN_ACCESS.VIDEO_BLOCKS_MANAGER]: "Video Blocks",
  [ADMIN_ACCESS.ADMIN_USERS]: "Admin Users",
  [ADMIN_ACCESS.SUPER_ADMIN]: "Super Admin",
}

/** Permissions that may read or create shared tags (same collection as media). */
export const TAG_ADMIN_ACCESS: AdminAccessKey[] = [
  ADMIN_ACCESS.MEDIA_UPLOADER,
  ADMIN_ACCESS.EVENTS_MANAGER,
  ADMIN_ACCESS.GALLERY_BLOCKS_MANAGER,
  ADMIN_ACCESS.VIDEO_BLOCKS_MANAGER,
]

/** Permissions that may browse media (e.g. cover image picker). */
export const MEDIA_READ_ACCESS: AdminAccessKey[] = TAG_ADMIN_ACCESS

export function isSuperAdmin(access: string[] | undefined): boolean {
  return access?.includes(ADMIN_ACCESS.SUPER_ADMIN) ?? false
}

export function isValidAccessKey(key: string): key is AdminAccessKey {
  return ALL_ADMIN_ACCESS.includes(key as AdminAccessKey)
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
  if (hasAccess(access, ADMIN_ACCESS.EVENTS_MANAGER)) {
    return "/admin/events"
  }
  if (hasAccess(access, ADMIN_ACCESS.GALLERY_BLOCKS_MANAGER)) {
    return "/admin/gallery-blocks"
  }
  if (hasAccess(access, ADMIN_ACCESS.VIDEO_BLOCKS_MANAGER)) {
    return "/admin/video-blocks"
  }
  if (hasAccess(access, ADMIN_ACCESS.ADMIN_USERS)) {
    return "/admin/users"
  }
  return null
}
