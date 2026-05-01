import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import {
  useManualContent,
  useAddRow,
  useUpdateRow,
  useDeleteRow,
  useReorderRows,
  useAddBlock,
} from '../../lib/queries/useManualEditor'
import { Button } from '../ui/Button'
import { StatusBadge } from '../ui/StatusBadge'
import LayoutRow from './LayoutRow'

// ── Inline title mutation ──────────────────────────────────────────────────────

function useUpdateManualTitle(manualId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (title) => {
      const { error } = await supabase
        .from('manual')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', manualId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manual-content', manualId] })
      qc.invalidateQueries({ queryKey: ['manuals'] })
    },
  })
}

// ── Editor ────────────────────────────────────────────────────────────────────

function ManualEditor({ manualId }) {
  const { data, isLoading, isError, error } = useManualContent(manualId)

  const addRow = useAddRow(manualId)
  const updateRow = useUpdateRow(manualId)
  const deleteRow = useDeleteRow(manualId)
  const reorderRows = useReorderRows(manualId)
  const addBlock = useAddBlock(manualId)
  const updateTitle = useUpdateManualTitle(manualId)

  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  function handleTitleClick() {
    setTitleDraft(data?.manual?.title ?? '')
    setEditingTitle(true)
  }

  function commitTitle() {
    const trimmed = titleDraft.trim()
    if (trimmed && trimmed !== data?.manual?.title) {
      updateTitle.mutate(trimmed)
    }
    setEditingTitle(false)
  }

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const rows = data?.rows ?? []
    const oldIndex = rows.findIndex((r) => r.id === active.id)
    const newIndex = rows.findIndex((r) => r.id === over.id)

    const reordered = arrayMove(rows, oldIndex, newIndex).map((r) => r.id)
    reorderRows.mutate(reordered)
  }

  // ── Loading / error states ─────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        Loading…
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-red-500">
        {error.message}
      </div>
    )
  }

  const { manual, rows } = data
  const rowIds = rows.map((r) => r.id)

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-3">
          <Link
            to="/admin/manuals"
            className="flex shrink-0 items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="size-3.5" />
            Manuals
          </Link>

          <div className="flex min-w-0 flex-1 items-center gap-3">
            {editingTitle ? (
              <input
                autoFocus
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur()
                  if (e.key === 'Escape') setEditingTitle(false)
                }}
                className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-1 text-lg font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            ) : (
              <button
                onClick={handleTitleClick}
                className="min-w-0 flex-1 truncate text-left text-lg font-semibold text-slate-900 hover:text-slate-600"
                title="Click to edit title"
              >
                {manual.title}
              </button>
            )}
            <StatusBadge status={manual.status} />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => addRow.mutate()}
              disabled={addRow.isPending}
            >
              <Plus className="size-4" />
              Add Row
            </Button>
            <Button size="sm" disabled title="Publishing coming in a later phase">
              Publish
            </Button>
          </div>
        </div>
      </div>

      {/* Editor body */}
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        {(addRow.isError || deleteRow.isError) && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {addRow.error && <p>Add row: {addRow.error.message}</p>}
            {deleteRow.error && <p>Delete row: {deleteRow.error.message}</p>}
          </div>
        )}

        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-white py-20 text-center">
            <p className="text-sm text-slate-400">No content yet — add your first row</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => addRow.mutate()}
              disabled={addRow.isPending}
            >
              <Plus className="size-4" />
              Add Row
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {rows.map((row) => (
                  <LayoutRow
                    key={row.id}
                    row={row}
                    manualId={manualId}
                    onColumnCountChange={(count) =>
                      updateRow.mutate({ rowId: row.id, column_count: count })
                    }
                    onDelete={() => deleteRow.mutate(row.id)}
                    onAddBlock={(columnIndex, blockType) =>
                      addBlock.mutate({ rowId: row.id, columnIndex, blockType })
                    }
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}

export default ManualEditor
