import type { EventBlockRef } from "@/app/types/gallery"

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
    }))
}

/** Merge stored order with live block ids (appends missing blocks at the end). */
export function reconcileEventBlockRefs(
  stored: EventBlockRef[] | undefined,
  blockIdsFromDb: string[],
): EventBlockRef[] {
  const idSet = new Set(blockIdsFromDb)
  const ordered = normalizeEventBlockRefs(stored).filter((entry) =>
    idSet.has(entry.blockId),
  )
  const known = new Set(ordered.map((entry) => entry.blockId))
  const missing = blockIdsFromDb.filter((id) => !known.has(id))
  const next = [
    ...ordered,
    ...missing.map((blockId, offset) => ({
      blockId,
      blockOrder: ordered.length + offset,
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

export function blockIdsFromRefs(blocks: EventBlockRef[] | undefined): string[] {
  return normalizeEventBlockRefs(blocks).map((entry) => entry.blockId)
}

export function refsFromOrderedBlockIds(blockIds: string[]): EventBlockRef[] {
  return blockIds.map((blockId, blockOrder) => ({ blockId, blockOrder }))
}
