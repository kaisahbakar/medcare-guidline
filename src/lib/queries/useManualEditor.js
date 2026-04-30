import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'

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
      // 1. Fetch the manual itself
      const { data: manual, error: manualError } = await supabase
        .from('manual')
        .select('*')
        .eq('id', manualId)
        .single()

      if (manualError) throw manualError

      // 2. Fetch all layout rows for this manual, ordered by display_order
      const { data: rows, error: rowsError } = await supabase
        .from('layout_row')
        .select('*')
        .eq('manual_id', manualId)
        .order('display_order')

      if (rowsError) throw rowsError

      if (!rows.length) {
        return { manual, rows: [] }
      }

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

        return { ...row, columns }
      })

      return { manual, rows: hydratedRows }
    },
    enabled: !!manualId,
  })
}
