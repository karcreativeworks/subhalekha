import type { MediaFile } from "@/app/types/media"

type MediaFileDoc = MediaFile & { userIds?: string[] }

/** Normalize legacy `userIds` → `taggedUsers` when reading from MongoDB. */
export function normalizeMediaFile<T extends MediaFileDoc>(file: T): MediaFile {
  const { userIds, ...rest } = file
  return {
    ...rest,
    taggedUsers: file.taggedUsers ?? userIds ?? [],
  }
}
