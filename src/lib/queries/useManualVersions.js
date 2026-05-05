import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'

const FETCH_TIMEOUT_MS = 25_000

function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms)
    }),
  ])
}

// ── Fetch all versions for a manual (newest first) ───────────────────────────

export function useManVersions(manualId) {
  return useQuery({
    queryKey: ['manual-versions', manualId],
    queryFn: async () => {
      if (!supabase) {
        throw new Error(
          'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env',
        )
      }
      const req = supabase
        .from('manual_version')
        .select('id, version_number, updated_at')
        .eq('manual_id', manualId)
        .order('version_number', { ascending: false })

      const { data, error } = await withTimeout(
        req,
        FETCH_TIMEOUT_MS,
        'Loading versions timed out. Check your network and Supabase project.',
      )

      if (error) throw error
      return data ?? []
    },
    enabled: Boolean(manualId),
    retry: 1,
  })
}

// ── Fetch a single version snapshot ─────────────────────────────────────────

export function useManVersionSnapshot(versionId) {
  return useQuery({
    queryKey: ['manual-version-snapshot', versionId],
    queryFn: async () => {
      if (!supabase) {
        throw new Error(
          'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env',
        )
      }
      const req = supabase
        .from('manual_version')
        .select('id, version_number, updated_at, content_snapshot')
        .eq('id', versionId)
        .single()

      const { data, error } = await withTimeout(
        req,
        FETCH_TIMEOUT_MS,
        'Loading snapshot timed out. Check your network and Supabase project.',
      )

      if (error) throw error
      return data
    },
    enabled: Boolean(versionId),
    retry: 1,
  })
}

// ── Publish: insert a new version row + update manual.status ────────────────

export function usePublishManual(manualId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ snapshot }) => {
      // Compute next version_number
      const { data: versions, error: vErr } = await supabase
        .from('manual_version')
        .select('version_number')
        .eq('manual_id', manualId)
        .order('version_number', { ascending: false })
        .limit(1)

      if (vErr) throw vErr

      const nextVersion = (versions?.[0]?.version_number ?? 0) + 1

      // Insert version row + update manual status — independent, run in parallel
      const now = new Date().toISOString()
      const [{ error: insertErr }, { error: updateErr }] = await Promise.all([
        supabase.from('manual_version').insert({
          manual_id: manualId,
          version_number: nextVersion,
          content_snapshot: snapshot,
          updated_at: now,
        }),
        supabase
          .from('manual')
          .update({ status: 'published', updated_at: now })
          .eq('id', manualId),
      ])

      if (insertErr) throw insertErr
      if (updateErr) throw updateErr

      return nextVersion
    },
    onSuccess: (nextVersion) => {
      // Update the cached manual status
      qc.setQueryData(['manual-content', manualId], (old) => {
        if (!old) return old
        return {
          ...old,
          manual: { ...old.manual, status: 'published', updated_at: new Date().toISOString() },
        }
      })
      // Invalidate version list and manual list
      qc.invalidateQueries({ queryKey: ['manual-versions', manualId] })
      qc.invalidateQueries({ queryKey: ['manuals'] })
      return nextVersion
    },
  })
}

// ── Restore: delete live rows+blocks then re-create from snapshot ─────────────

export function useRestoreVersion(manualId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ versionId }) => {
      // Fetch the snapshot for this version
      const { data: version, error: fetchErr } = await supabase
        .from('manual_version')
        .select('content_snapshot')
        .eq('id', versionId)
        .single()

      if (fetchErr) throw fetchErr

      const snapshot = version.content_snapshot
      if (!snapshot) throw new Error('This version has no snapshot to restore.')

      // 1. Fetch all current layout_row ids for this manual
      const { data: currentRows, error: rowsErr } = await supabase
        .from('layout_row')
        .select('id')
        .eq('manual_id', manualId)

      if (rowsErr) throw rowsErr

      // 2. Delete blocks for those rows (in case no CASCADE)
      if (currentRows?.length) {
        const rowIds = currentRows.map((r) => r.id)
        const { error: blockDelErr } = await supabase
          .from('manual_block')
          .delete()
          .in('layout_row_id', rowIds)

        if (blockDelErr) throw blockDelErr
      }

      // 3. Delete all layout_rows for this manual
      const { error: rowDelErr } = await supabase
        .from('layout_row')
        .delete()
        .eq('manual_id', manualId)

      if (rowDelErr) throw rowDelErr

      // 4. Re-create rows in parallel, then batch-insert all blocks in one call
      const rowResults = await Promise.all(
        snapshot.rows.map((snapRow) =>
          supabase
            .from('layout_row')
            .insert({
              manual_id: manualId,
              display_order: snapRow.display_order,
              column_count: snapRow.column_count,
              column_width_fr: snapRow.column_width_fr ?? null,
            })
            .select('id')
            .single(),
        ),
      )

      const firstRowErr = rowResults.find((r) => r.error)
      if (firstRowErr) throw firstRowErr.error

      const allBlocks = []
      snapshot.rows.forEach((snapRow, i) => {
        const newRowId = rowResults[i].data.id
        for (const col of snapRow.columns) {
          for (const block of col.blocks) {
            allBlocks.push({
              layout_row_id: newRowId,
              column_index: col.column_index,
              display_order: block.display_order,
              block_type: block.block_type,
              content_json: block.content_json,
              text_color: block.text_color,
              background_color: block.background_color,
              file_url: block.file_url,
              metadata_json: block.metadata_json,
            })
          }
        }
      })

      if (allBlocks.length) {
        const { error: blockInsErr } = await supabase.from('manual_block').insert(allBlocks)
        if (blockInsErr) throw blockInsErr
      }

      // 5. Set manual.status to 'draft'
      const { error: draftErr } = await supabase
        .from('manual')
        .update({ status: 'draft', updated_at: new Date().toISOString() })
        .eq('id', manualId)

      if (draftErr) throw draftErr
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manual-content', manualId] })
      qc.invalidateQueries({ queryKey: ['manuals'] })
    },
  })
}
