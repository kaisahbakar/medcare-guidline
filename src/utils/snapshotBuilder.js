/**
 * Converts the live rows-and-blocks structure (as returned by useManualContent)
 * into a frozen JSON snapshot suitable for storing in manual_version.content_snapshot.
 *
 * Shape:
 * {
 *   rows: [
 *     {
 *       display_order, column_count, column_width_fr,
 *       columns: [
 *         {
 *           column_index,
 *           blocks: [
 *             { block_type, content_json, text_color, background_color,
 *               file_url, metadata_json, display_order }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 */
export function buildSnapshot(rows) {
  return {
    rows: rows.map((row) => ({
      display_order: row.display_order,
      column_count: row.column_count,
      column_width_fr: row.column_width_fr ?? null,
      columns: row.columns.map((col) => ({
        column_index: col.index,
        blocks: col.blocks.map((block) => ({
          block_type: block.block_type,
          content_json: block.content_json ?? null,
          text_color: block.text_color ?? null,
          background_color: block.background_color ?? null,
          file_url: block.file_url ?? null,
          metadata_json: block.metadata_json ?? null,
          display_order: block.display_order,
        })),
      })),
    })),
  }
}
