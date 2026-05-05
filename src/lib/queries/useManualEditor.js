import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import {
  getColumnWidthFrMap,
  isMissingColumnError,
  removeColumnWidthFrLocal,
  setColumnWidthFrLocal,
} from '../../utils/columnWidthStorage'

/**
 * Fetches a manual with its full block tree in one query function.
 *
 * Returned shape:
 * {
 *   manual: { id, title, status, category_id, ... },
 *   rows: [
 *     {
 *       id, manual_id, display_order, column_count, ...
 *       columns: [
 *         { index: 0, blocks: [{ id, block_type, content_json, display_order, ... }, ...] },
 *         { index: 1, blocks: [...] },
 *       ]
 *     },
 *     ...
 *   ]
 * }
 *
 * Rows are ordered by display_order.
 * Blocks within each column are ordered by display_order.
 * The columns array length equals the row's column_count, so empty columns
 * are represented as { index, blocks: [] }.
 */
export function useManualContent(manualId) {
  return useQuery({
    queryKey: ['manual-content', manualId],
    queryFn: async () => {
      // Fetch manual and rows in parallel — they are independent
      const [
        { data: manual, error: manualError },
        { data: rows, error: rowsError },
      ] = await Promise.all([
        supabase.from('manual').select('*').eq('id', manualId).single(),
        supabase.from('layout_row').select('*').eq('manual_id', manualId).order('display_order'),
      ])

      if (manualError) throw manualError
      if (rowsError) throw rowsError

      if (!rows.length) {
        return { manual, rows: [] }
      }

      const localColumnFr = getColumnWidthFrMap(manualId)

      const rowIds = rows.map((r) => r.id)

      // 3. Fetch all blocks for those rows in one round-trip
      const { data: blocks, error: blocksError } = await supabase
        .from('manual_block')
        .select('*')
        .in('layout_row_id', rowIds)
        .order('layout_row_id')
        .order('column_index')
        .order('display_order')

      if (blocksError) throw blocksError

      // 4. Group blocks by row, then by column index
      const blocksByRow = {}
      for (const block of blocks) {
        const rowId = block.layout_row_id
        if (!blocksByRow[rowId]) blocksByRow[rowId] = {}

        const col = block.column_index
        if (!blocksByRow[rowId][col]) blocksByRow[rowId][col] = []

        blocksByRow[rowId][col].push(block)
      }

      // 5. Build the nested structure
      const hydratedRows = rows.map((row) => {
        const rowBlocks = blocksByRow[row.id] ?? {}
        const columns = Array.from({ length: row.column_count }, (_, i) => ({
          index: i,
          blocks: rowBlocks[i] ?? [],
        }))

        const column_width_fr =
          row.column_width_fr !== undefined
            ? row.column_width_fr
            : localColumnFr[row.id] ?? localColumnFr[String(row.id)] ?? null

        return { ...row, column_width_fr, columns }
      })

      return { manual, rows: hydratedRows }
    },
    enabled: !!manualId,
  })
}

// ── Row mutations ──────────────────────────────────────────────────────────────

function hydrateLayoutRowFromDb(row) {
  const n = row.column_count ?? 1
  return {
    ...row,
    columns: Array.from({ length: n }, (_, i) => ({
      index: i,
      blocks: [],
    })),
  }
}

export function useAddRow(manualId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data: rows, error: selectError } = await supabase
        .from('layout_row')
        .select('display_order')
        .eq('manual_id', manualId)
        .order('display_order', { ascending: false })
        .limit(1)

      if (selectError) throw selectError

      const maxOrder = rows?.[0]?.display_order ?? 0

      const { data, error } = await supabase
        .from('layout_row')
        .insert({ manual_id: manualId, display_order: maxOrder + 1, column_count: 1 })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (newRow) => {
      qc.setQueryData(['manual-content', manualId], (old) => {
        if (!old) return old
        const hydrated = hydrateLayoutRowFromDb(newRow)
        const rows = [...old.rows, hydrated].sort(
          (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
        )
        return { ...old, rows }
      })
    },
    onSettled: (_data, error) => {
      if (error) {
        qc.invalidateQueries({ queryKey: ['manual-content', manualId] })
      }
    },
  })
}

export function useUpdateRow(manualId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (vars) => {
      const { rowId, column_count, display_order, column_width_fr } = vars

      // If reducing column_count, move orphaned blocks to the last remaining column
      if (column_count !== undefined) {
        const { data: currentRow } = await supabase
          .from('layout_row')
          .select('column_count')
          .eq('id', rowId)
          .single()

        if (currentRow && column_count < currentRow.column_count) {
          const targetColumn = column_count - 1

          const { data: orphanedBlocks } = await supabase
            .from('manual_block')
            .select('id, display_order')
            .eq('layout_row_id', rowId)
            .gte('column_index', column_count)
            .order('display_order')

          if (orphanedBlocks?.length) {
            const { data: lastInTarget } = await supabase
              .from('manual_block')
              .select('display_order')
              .eq('layout_row_id', rowId)
              .eq('column_index', targetColumn)
              .order('display_order', { ascending: false })
              .limit(1)

            const baseOrder = (lastInTarget?.[0]?.display_order ?? 0) + 1

            await Promise.all(
              orphanedBlocks.map((block, i) =>
                supabase
                  .from('manual_block')
                  .update({ column_index: targetColumn, display_order: baseOrder + i })
                  .eq('id', block.id),
              ),
            )
          }
        }
      }

      const updates = {}
      if (column_count !== undefined) updates.column_count = column_count
      if (display_order !== undefined) updates.display_order = display_order
      if (column_width_fr !== undefined) updates.column_width_fr = column_width_fr

      const widthOnly =
        Object.keys(updates).length === 1 &&
        updates.column_width_fr !== undefined &&
        column_width_fr !== undefined

      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('layout_row')
        .update(updates)
        .eq('id', rowId)

      if (error) {
        if (widthOnly && isMissingColumnError(error)) {
          setColumnWidthFrLocal(manualId, rowId, column_width_fr)
          return vars
        }
        throw error
      }

      if (column_width_fr !== undefined || column_count !== undefined) {
        removeColumnWidthFrLocal(manualId, rowId)
      }

      return vars
    },
    onMutate: async (vars) => {
      const { rowId, column_count, column_width_fr } = vars
      if (column_count === undefined && column_width_fr === undefined) return

      await qc.cancelQueries({ queryKey: ['manual-content', manualId] })
      const previous = qc.getQueryData(['manual-content', manualId])

      if (!previous) return { previous }

      if (column_count !== undefined) {
        const widthReset =
          column_width_fr !== undefined ? column_width_fr : null

        const newRows = previous.rows.map((row) => {
          if (String(row.id) !== String(rowId)) return row

          const allBlocks = row.columns.flatMap((c) => c.blocks)

          const newColumns = Array.from({ length: column_count }, (_, i) => ({
            index: i,
            blocks: allBlocks.filter((b) => b.column_index === i),
          }))

          const droppedBlocks = allBlocks.filter((b) => b.column_index >= column_count)
          if (droppedBlocks.length > 0 && column_count > 0) {
            newColumns[column_count - 1].blocks = [
              ...newColumns[column_count - 1].blocks,
              ...droppedBlocks.map((b) => ({ ...b, column_index: column_count - 1 })),
            ]
          }

          return {
            ...row,
            column_count,
            columns: newColumns,
            column_width_fr: widthReset,
          }
        })

        qc.setQueryData(['manual-content', manualId], { ...previous, rows: newRows })
        return { previous }
      }

      if (column_width_fr !== undefined) {
        const newRows = previous.rows.map((row) =>
          String(row.id) === String(rowId)
            ? { ...row, column_width_fr }
            : row,
        )
        qc.setQueryData(['manual-content', manualId], { ...previous, rows: newRows })
      }

      return { previous }
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        qc.setQueryData(['manual-content', manualId], context.previous)
      }
    },
    onSettled: (_data, error) => {
      if (error) {
        qc.invalidateQueries({ queryKey: ['manual-content', manualId] })
      }
    },
  })
}

export function useDeleteRow(manualId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (rowId) => {
      const { error: blocksError } = await supabase
        .from('manual_block')
        .delete()
        .eq('layout_row_id', rowId)

      const { error: rowError } = await supabase.from('layout_row').delete().eq('id', rowId)
      if (rowError) {
        // If block delete also failed, surface both messages so the root cause is clear
        const msg = blocksError
          ? `${blocksError.message}. If blocks use FK without CASCADE, allow DELETE on manual_block or add ON DELETE CASCADE.`
          : rowError.message
        throw new Error(msg)
      }
    },
    onMutate: async (rowId) => {
      await qc.cancelQueries({ queryKey: ['manual-content', manualId] })
      const previous = qc.getQueryData(['manual-content', manualId])
      if (previous) {
        qc.setQueryData(['manual-content', manualId], {
          ...previous,
          rows: previous.rows.filter((r) => String(r.id) !== String(rowId)),
        })
      }
      return { previous }
    },
    onError: (_err, _rowId, context) => {
      if (context?.previous) {
        qc.setQueryData(['manual-content', manualId], context.previous)
      }
    },
    onSettled: (_data, error) => {
      if (error) {
        qc.invalidateQueries({ queryKey: ['manual-content', manualId] })
      }
    },
  })
}

export function useReorderRows(manualId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (rowIds) => {
      await Promise.all(
        rowIds.map((id, index) =>
          supabase
            .from('layout_row')
            .update({
              display_order: index + 1,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id),
        ),
      )
    },
    onMutate: async (rowIds) => {
      await qc.cancelQueries({ queryKey: ['manual-content', manualId] })
      const previous = qc.getQueryData(['manual-content', manualId])

      if (previous) {
        const rowMap = Object.fromEntries(previous.rows.map((r) => [r.id, r]))
        const newRows = rowIds.map((id, i) => ({ ...rowMap[id], display_order: i + 1 }))
        qc.setQueryData(['manual-content', manualId], { ...previous, rows: newRows })
      }

      return { previous }
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        qc.setQueryData(['manual-content', manualId], context.previous)
      }
    },
    onSettled: (_data, error) => {
      if (error) {
        qc.invalidateQueries({ queryKey: ['manual-content', manualId] })
      }
    },
  })
}

// ── Block mutations ────────────────────────────────────────────────────────────

function updateBlockInManualCache(manualId, qc, updater) {
  qc.setQueryData(['manual-content', manualId], (old) => {
    if (!old) return old
    return updater(old)
  })
}

function initialContentJsonForBlockType(blockType) {
  switch (blockType) {
    case 'heading_1':
      return {
        type: 'doc',
        content: [{ type: 'heading', attrs: { level: 1 }, content: [] }],
      }
    case 'heading_2':
      return {
        type: 'doc',
        content: [{ type: 'heading', attrs: { level: 2 }, content: [] }],
      }
    case 'heading_3':
      return {
        type: 'doc',
        content: [{ type: 'heading', attrs: { level: 3 }, content: [] }],
      }
    case 'bulleted_list':
      return {
        type: 'doc',
        content: [
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [] }],
              },
            ],
          },
        ],
      }
    case 'numbered_list':
      return {
        type: 'doc',
        content: [
          {
            type: 'orderedList',
            content: [
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [] }],
              },
            ],
          },
        ],
      }
    case 'callout':
    case 'media':
      return { type: 'doc', content: [{ type: 'paragraph' }] }
    case 'divider':
      return {}
    case 'paragraph':
    default:
      return { type: 'doc', content: [{ type: 'paragraph' }] }
  }
}

export function useAddBlock(manualId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ rowId, columnIndex, blockType = 'paragraph' }) => {
      const { data: existing, error: existingError } = await supabase
        .from('manual_block')
        .select('display_order')
        .eq('layout_row_id', rowId)
        .eq('column_index', columnIndex)
        .order('display_order', { ascending: false })
        .limit(1)

      if (existingError) throw existingError

      const maxOrder = existing?.[0]?.display_order ?? 0

      const { data, error } = await supabase
        .from('manual_block')
        .insert({
          layout_row_id: rowId,
          column_index: columnIndex,
          display_order: maxOrder + 1,
          block_type: blockType,
          content_json: initialContentJsonForBlockType(blockType),
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (newBlock) => {
      updateBlockInManualCache(manualId, qc, (old) => ({
        ...old,
        rows: old.rows.map((row) => {
          if (String(row.id) !== String(newBlock.layout_row_id)) return row
          return {
            ...row,
            columns: row.columns.map((col) => {
              if (col.index !== newBlock.column_index) return col
              const blocks = [...col.blocks, newBlock].sort(
                (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
              )
              return { ...col, blocks }
            }),
          }
        }),
      }))
    },
    onSettled: (_data, error) => {
      if (error) {
        qc.invalidateQueries({ queryKey: ['manual-content', manualId] })
      }
    },
  })
}

export function useUpdateBlock(manualId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ blockId, ...fields }) => {
      const { error } = await supabase
        .from('manual_block')
        .update(fields)
        .eq('id', blockId)
      if (error) throw error

      // Touch manual.updated_at so cross-tab stale detection works.
      // Fire-and-forget — a failure here is non-critical.
      supabase
        .from('manual')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', manualId)
        .then(() => {})

      return { blockId, ...fields }
    },
    onSuccess: (result) => {
      const { blockId, ...patch } = result
      updateBlockInManualCache(manualId, qc, (old) => ({
        ...old,
        rows: old.rows.map((row) => ({
          ...row,
          columns: row.columns.map((col) => ({
            ...col,
            blocks: col.blocks.map((b) =>
              String(b.id) === String(blockId) ? { ...b, ...patch } : b,
            ),
          })),
        })),
      }))
    },
    onSettled: (_data, error) => {
      if (error) {
        qc.invalidateQueries({ queryKey: ['manual-content', manualId] })
      }
    },
  })
}

export function useDeleteBlock(manualId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (blockId) => {
      const { error } = await supabase.from('manual_block').delete().eq('id', blockId)
      if (error) throw error
    },
    onMutate: async (blockId) => {
      await qc.cancelQueries({ queryKey: ['manual-content', manualId] })
      const previous = qc.getQueryData(['manual-content', manualId])
      if (previous) {
        updateBlockInManualCache(manualId, qc, (old) => ({
          ...old,
          rows: old.rows.map((row) => ({
            ...row,
            columns: row.columns.map((col) => ({
              ...col,
              blocks: col.blocks.filter((b) => String(b.id) !== String(blockId)),
            })),
          })),
        }))
      }
      return { previous }
    },
    onError: (_err, _blockId, context) => {
      if (context?.previous) {
        qc.setQueryData(['manual-content', manualId], context.previous)
      }
    },
    onSettled: (_data, error) => {
      if (error) {
        qc.invalidateQueries({ queryKey: ['manual-content', manualId] })
      }
    },
  })
}

export function useReorderBlocks(manualId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ blockIds }) => {
      await Promise.all(
        blockIds.map((id, index) =>
          supabase.from('manual_block').update({ display_order: index + 1 }).eq('id', id),
        ),
      )
    },
    onMutate: async ({ rowId, columnIndex, blockIds }) => {
      await qc.cancelQueries({ queryKey: ['manual-content', manualId] })
      const previous = qc.getQueryData(['manual-content', manualId])

      if (previous) {
        const newRows = previous.rows.map((row) => {
          if (String(row.id) !== String(rowId)) return row
          const newColumns = row.columns.map((col) => {
            if (col.index !== columnIndex) return col
            const blockMap = Object.fromEntries(col.blocks.map((b) => [b.id, b]))
            const reordered = blockIds.map((id, i) => ({
              ...blockMap[id],
              display_order: i + 1,
            }))
            return { ...col, blocks: reordered }
          })
          return { ...row, columns: newColumns }
        })
        qc.setQueryData(['manual-content', manualId], { ...previous, rows: newRows })
      }

      return { previous }
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        qc.setQueryData(['manual-content', manualId], context.previous)
      }
    },
    onSettled: (_data, error) => {
      if (error) {
        qc.invalidateQueries({ queryKey: ['manual-content', manualId] })
      }
    },
  })
}

/** Reorder blocks within a row, including moving between columns (column_index + display_order). */
export function useReorderRowBlocks(manualId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ columnLayouts }) => {
      const tasks = []
      columnLayouts.forEach((blockIds, columnIndex) => {
        blockIds.forEach((id, order) => {
          tasks.push(
            supabase
              .from('manual_block')
              .update({ column_index: columnIndex, display_order: order + 1 })
              .eq('id', id),
          )
        })
      })
      const results = await Promise.all(tasks)
      for (const res of results) {
        if (res.error) throw res.error
      }
    },
    onMutate: async ({ rowId, columnLayouts }) => {
      await qc.cancelQueries({ queryKey: ['manual-content', manualId] })
      const previous = qc.getQueryData(['manual-content', manualId])
      if (!previous) return { previous }

      const blockMap = new Map()
      for (const row of previous.rows) {
        for (const col of row.columns) {
          for (const b of col.blocks) {
            blockMap.set(String(b.id), b)
          }
        }
      }

      const newRows = previous.rows.map((row) => {
        if (String(row.id) !== String(rowId)) return row
        const newColumns = columnLayouts.map((ids, columnIndex) => ({
          index: columnIndex,
          blocks: ids.map((id, i) => {
            const b = blockMap.get(String(id))
            if (!b) return null
            return { ...b, column_index: columnIndex, display_order: i + 1 }
          }).filter(Boolean),
        }))
        return { ...row, columns: newColumns }
      })

      qc.setQueryData(['manual-content', manualId], { ...previous, rows: newRows })
      return { previous }
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        qc.setQueryData(['manual-content', manualId], context.previous)
      }
    },
    onSettled: (_data, error) => {
      if (error) {
        qc.invalidateQueries({ queryKey: ['manual-content', manualId] })
      }
    },
  })
}

export function useChangeBlockType(manualId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ blockId, newType }) => {
      const payload = {
        block_type: newType,
        content_json: initialContentJsonForBlockType(newType),
      }
      if (newType !== 'media') {
        payload.file_url = null
      }
      if (newType !== 'callout') {
        payload.metadata_json = null
      }
      const { error } = await supabase.from('manual_block').update(payload).eq('id', blockId)
      if (error) throw error
      return { blockId, ...payload }
    },
    onSuccess: (result) => {
      const { blockId, ...patch } = result
      updateBlockInManualCache(manualId, qc, (old) => ({
        ...old,
        rows: old.rows.map((row) => ({
          ...row,
          columns: row.columns.map((col) => ({
            ...col,
            blocks: col.blocks.map((b) =>
              String(b.id) === String(blockId) ? { ...b, ...patch } : b,
            ),
          })),
        })),
      }))
    },
    onSettled: (_data, error) => {
      if (error) {
        qc.invalidateQueries({ queryKey: ['manual-content', manualId] })
      }
    },
  })
}
