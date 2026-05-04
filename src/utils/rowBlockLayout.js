import { arrayMove } from '@dnd-kit/sortable'

/** Ordered block ids per column index (0 … column_count - 1). */
export function layoutIdsByColumn(row) {
  const n = row.column_count ?? row.columns?.length ?? 0
  const out = []
  for (let i = 0; i < n; i++) {
    const col = row.columns.find((c) => c.index === i)
    if (!col) {
      out.push([])
      continue
    }
    const sorted = [...col.blocks].sort(
      (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
    )
    out.push(sorted.map((b) => b.id))
  }
  return out
}

/** Parse droppable / sortable `over.id` from the row block drag layer. */
export function parseBlockDropTarget(overId) {
  const s = String(overId)
  const append = s.match(/^col-(\d+)-append$/)
  if (append) return { kind: 'append', columnIndex: Number(append[1]) }
  const empty = s.match(/^col-(\d+)-empty$/)
  if (empty) return { kind: 'empty', columnIndex: Number(empty[1]) }
  return { kind: 'block', blockId: overId }
}

/**
 * Returns new columnLayouts (array of id arrays) after a block drag, or null if no change.
 */
export function mergeColumnLayoutsAfterDrop(row, activeId, overId) {
  const drop = parseBlockDropTarget(overId)
  const layout = layoutIdsByColumn(row).map((col) => [...col])
  const idStr = String(activeId)

  let fromCol = -1
  let fromIdx = -1
  for (let c = 0; c < layout.length; c++) {
    const i = layout[c].findIndex((id) => String(id) === idStr)
    if (i >= 0) {
      fromCol = c
      fromIdx = i
      break
    }
  }
  if (fromCol < 0) return null

  if (drop.kind === 'block' && String(drop.blockId) === idStr) return null

  let toCol
  let toIdx

  if (drop.kind === 'block') {
    toCol = -1
    for (let c = 0; c < layout.length; c++) {
      const i = layout[c].findIndex((id) => String(id) === String(drop.blockId))
      if (i >= 0) {
        toCol = c
        toIdx = i
        break
      }
    }
    if (toCol < 0) return null
  } else {
    toCol = drop.columnIndex
    if (toCol < 0 || toCol >= layout.length) return null
    toIdx = drop.kind === 'append' ? layout[toCol].length : 0
  }

  if (fromCol === toCol) {
    const list = [...layout[fromCol]]
    const oldI = list.findIndex((id) => String(id) === idStr)
    if (oldI < 0) return null

    if (drop.kind === 'block') {
      const newI = list.findIndex((id) => String(id) === String(drop.blockId))
      if (newI < 0 || oldI === newI) return null
      layout[fromCol] = arrayMove(list, oldI, newI)
      return layout
    }

    if (drop.kind === 'append') {
      if (oldI === list.length - 1) return null
      layout[fromCol] = arrayMove(list, oldI, list.length - 1)
      return layout
    }

    // empty — same column rare; move to top
    if (oldI === 0) return null
    layout[fromCol] = arrayMove(list, oldI, 0)
    return layout
  }

  const moving = layout[fromCol][fromIdx]
  layout[fromCol] = layout[fromCol].filter((_, i) => i !== fromIdx)
  const targetList = layout[toCol]
  const insertAt = Math.min(Math.max(0, toIdx), targetList.length)
  layout[toCol] = [...targetList.slice(0, insertAt), moving, ...targetList.slice(insertAt)]
  return layout
}
