import type { EventBlockRef, EventBlockType } from "@/app/types/gallery"

export function resolveEventBlockType(
  entry: EventBlockRef | undefined,
): EventBlockType {
  return entry?.blockType === "video" ? "video" : "gallery"
}

function blockRefKey(blockId: string, blockType: EventBlockType): string {
  return `${blockType}:${blockId}`
}

/** Sort refs by blockOrder and renumber 0…n-1. */
export function normalizeEventBlockRefs(
  blocks: EventBlockRef[] | undefined,
): EventBlockRef[] {
  if (!blocks?.length) return []
  return [...blocks]
    .sort((a, b) => a.blockOrder - b.blockOrder)
    .map((entry, index) => ({
      blockId: entry.blockId,
      blockOrder: index,
      ...(resolveEventBlockType(entry) === "video"
        ? { blockType: "video" as const }
        : {}),
    }))
}

export interface EventBlockIdentity {
  blockId: string
  blockType: EventBlockType
}

/** Merge stored order with live blocks (appends missing blocks at the end). */
export function reconcileEventBlockRefs(
  stored: EventBlockRef[] | undefined,
  blocksFromDb: EventBlockIdentity[],
): EventBlockRef[] {
  const keySet = new Set(
    blocksFromDb.map((b) => blockRefKey(b.blockId, b.blockType)),
  )
  const ordered = normalizeEventBlockRefs(stored).filter((entry) =>
    keySet.has(blockRefKey(entry.blockId, resolveEventBlockType(entry))),
  )
  const known = new Set(
    ordered.map((entry) => blockRefKey(entry.blockId, resolveEventBlockType(entry))),
  )
  const missing = blocksFromDb.filter(
    (b) => !known.has(blockRefKey(b.blockId, b.blockType)),
  )
  const next = [
    ...ordered,
    ...missing.map((block, offset) => ({
      blockId: block.blockId,
      blockOrder: ordered.length + offset,
      ...(block.blockType === "video" ? { blockType: "video" as const } : {}),
    })),
  ]
  return normalizeEventBlockRefs(next)
}

export function sortByEventBlockOrder<T extends { id: string }>(
  items: T[],
  blocks: EventBlockRef[] | undefined,
): T[] {
  if (!blocks?.length) return items
  const orderMap = new Map(blocks.map((entry) => [entry.blockId, entry.blockOrder]))
  return [...items].sort((a, b) => {
    const orderA = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER
    const orderB = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER
    if (orderA !== orderB) return orderA - orderB
    return a.id.localeCompare(b.id)
  })
}

export function sortItemsByEventBlockRefs<T>(
  items: T[],
  blocks: EventBlockRef[] | undefined,
  getKey: (item: T) => string,
): T[] {
  if (!blocks?.length) return items
  const orderMap = new Map(
    normalizeEventBlockRefs(blocks).map((entry) => [
      blockRefKey(entry.blockId, resolveEventBlockType(entry)),
      entry.blockOrder,
    ]),
  )
  return [...items].sort((a, b) => {
    const orderA = orderMap.get(getKey(a)) ?? Number.MAX_SAFE_INTEGER
    const orderB = orderMap.get(getKey(b)) ?? Number.MAX_SAFE_INTEGER
    if (orderA !== orderB) return orderA - orderB
    return getKey(a).localeCompare(getKey(b))
  })
}

export function blockIdsFromRefs(blocks: EventBlockRef[] | undefined): string[] {
  return normalizeEventBlockRefs(blocks).map((entry) => entry.blockId)
}

export function refsFromOrderedBlockIds(blockIds: string[]): EventBlockRef[] {
  return blockIds.map((blockId, blockOrder) => ({ blockId, blockOrder }))
}
