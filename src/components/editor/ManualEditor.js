import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MdWarning, MdArrowBack, MdVisibility, MdHistory, MdDesktopWindows, MdAdd, MdClose, MdDelete } from 'react-icons/md'
import ManualReader from '../reader/ManualReader'
import ReaderBlock from '../reader/ReaderBlock'
import {
  gridTemplateColumnsFromFractions,
  normalizeColumnFractions,
} from '../../utils/columnWidths'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import {
  useManualContent,
  useAddRow,
  useUpdateRow,
  useDeleteRow,
  useReorderRows,
  useAddBlock,
} from '../../lib/queries/useManualEditor'
import { usePublishManual } from '../../lib/queries/useManualVersions'
import { buildSnapshot } from '../../utils/snapshotBuilder'
import { Button } from '../ui/Button'
import { StatusBadge } from '../ui/StatusBadge'
import { SaveStatusProvider, useSaveStatus } from '../../contexts/SaveStatusContext'
import LayoutRow from './LayoutRow'

const TITLE_AUTOSAVE_DELAY = 800
const STALE_POLL_INTERVAL = 30_000
const STALE_THRESHOLD_MS = 2_000

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
      return title
    },
    onSuccess: (title) => {
      qc.setQueryData(['manual-content', manualId], (old) => {
        if (!old) return old
        return {
          ...old,
          manual: { ...old.manual, title, updated_at: new Date().toISOString() },
        }
      })
      qc.invalidateQueries({ queryKey: ['manuals'] })
    },
  })
}

// ── Save indicator ─────────────────────────────────────────────────────────────

function SaveIndicator() {
  const { status, lastSavedAt } = useSaveStatus()
  const [, forceRender] = useState(0)

  // Re-render every 15s so the "X ago" label stays fresh
  useEffect(() => {
    const id = setInterval(() => forceRender((n) => n + 1), 15_000)
    return () => clearInterval(id)
  }, [])

  function formatAgo(ms) {
    const secs = Math.floor((Date.now() - ms) / 1000)
    if (secs < 5) return 'just now'
    if (secs < 60) return `${secs}s ago`
    return `${Math.floor(secs / 60)}m ago`
  }

  if (status === 'saving') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-slate-400">
        <span className="size-1.5 animate-pulse rounded-full bg-slate-400" />
        Saving…
      </span>
    )
  }

  if (status === 'unsaved') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-amber-600">
        <span className="size-1.5 rounded-full bg-amber-400" />
        Unsaved changes
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1.5 text-xs text-slate-400">
      <span className="size-1.5 rounded-full bg-green-400" />
      Saved · {formatAgo(lastSavedAt)}
    </span>
  )
}

// ── Delete manual modal ────────────────────────────────────────────────────────

function DeleteManualModal({ open, manualId, title, onClose, onDeleted }) {
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: rows } = await supabase
        .from('layout_row')
        .select('id')
        .eq('manual_id', manualId)

      if (rows?.length) {
        const rowIds = rows.map((r) => r.id)
        await supabase.from('manual_block').delete().in('layout_row_id', rowIds)
        await supabase.from('layout_row').delete().in('id', rowIds)
      }

      await supabase.from('manual_version').delete().eq('manual_id', manualId)

      const { error } = await supabase.from('manual').delete().eq('id', manualId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manuals'] })
      onDeleted()
    },
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-base font-semibold text-slate-900">Delete manual?</h2>
        <p className="mt-2 text-sm text-slate-600">
          <strong className="font-medium">{title || 'This manual'}</strong> and all its
          layout rows, blocks, and version history will be permanently deleted.
        </p>

        {mutation.isError && (
          <p className="mt-2 text-sm text-red-600">{mutation.error.message}</p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={mutation.isPending}
            className="rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:border-slate-300 hover:text-slate-900 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Deleting…' : 'Delete manual'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Preview modal ──────────────────────────────────────────────────────────────

function PreviewModal({ manual, rows, onClose }) {
  // Close on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-100"
      role="dialog"
      aria-modal="true"
      aria-label="Manual preview"
    >
      {/* Preview top bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-3 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <MdVisibility className="size-4" />
          Preview — what users see
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
            Draft · not yet published
          </span>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:border-slate-300 hover:text-slate-900"
          >
            <MdClose className="size-3.5" />
            Close preview
          </button>
        </div>
      </div>

      {/* Scrollable reader area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-6 py-10">
          <article className="w-full space-y-8 rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
            <header className="space-y-2 border-b border-slate-100 pb-6">
              <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
                {manual.title || <span className="italic text-slate-400">Untitled</span>}
              </h1>
              {manual.summary && (
                <p className="text-base leading-7 text-slate-500">{manual.summary}</p>
              )}
            </header>

            {rows.length === 0 ? (
              <p className="text-sm text-slate-400">This manual has no content yet.</p>
            ) : (
              rows.map((row) => (
                <section
                  key={row.id}
                  className="grid gap-6"
                  style={{
                    gridTemplateColumns: gridTemplateColumnsFromFractions(
                      normalizeColumnFractions(row.column_width_fr, row.column_count),
                    ),
                  }}
                >
                  {row.columns.map((column) => (
                    <div key={`${row.id}-${column.index}`} className="space-y-4">
                      {column.blocks.map((block) => (
                        <ReaderBlock key={block.id} block={block} />
                      ))}
                    </div>
                  ))}
                </section>
              ))
            )}
          </article>
        </div>
      </div>
    </div>
  )
}

// ── Editor inner (needs SaveStatusContext) ────────────────────────────────────

function ManualEditorInner({ manualId, data }) {
  const { manual, rows } = data
  const { status: saveStatus, notifySaving, notifySaved, notifyChange } = useSaveStatus()
  const navigate = useNavigate()

  const addRow = useAddRow(manualId)
  const updateRow = useUpdateRow(manualId)
  const deleteRow = useDeleteRow(manualId)
  const reorderRows = useReorderRows(manualId)
  const addBlock = useAddBlock(manualId)
  const updateTitle = useUpdateManualTitle(manualId)
  const publishManual = usePublishManual(manualId)

  function handlePublish() {
    const snapshot = buildSnapshot(rows)
    publishManual.mutate(
      { snapshot },
      {
        onSuccess: (versionNumber) => {
          toast.success(`Published v${versionNumber}`)
        },
        onError: (err) => {
          toast.error(`Publish failed: ${err.message}`)
        },
      },
    )
  }

  const [showPreview, setShowPreview] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  const [titleDraft, setTitleDraft] = useState(manual.title ?? '')
  const titleTimer = useRef(null)
  const lastSavedTitleRef = useRef(manual.title ?? '')

  // Clear pending title autosave on unmount
  useEffect(() => () => clearTimeout(titleTimer.current), [])

  // Keep draft in sync if manual data reloads (e.g. cross-tab stale refresh)
  useEffect(() => {
    setTitleDraft(manual.title ?? '')
    lastSavedTitleRef.current = manual.title ?? ''
  }, [manual.title])

  const [stale, setStale] = useState(false)
  // Snapshot updated_at in a ref so the poll interval isn't restarted on every
  // block save (which touches manual.updated_at in the cache).
  const savedUpdatedAtRef = useRef(manual.updated_at)

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const { data: row } = await supabase
          .from('manual')
          .select('updated_at')
          .eq('id', manualId)
          .single()
        if (!row) return
        const dbTs = new Date(row.updated_at).getTime()
        const localTs = new Date(savedUpdatedAtRef.current).getTime()
        if (dbTs > localTs + STALE_THRESHOLD_MS) setStale(true)
      } catch {
        /* ignore */
      }
    }, STALE_POLL_INTERVAL)
    return () => clearInterval(id)
  }, [manualId])

  // ── Title change handler (debounced) ──────────────────────────────────────────

  function handleTitleChange(e) {
    const value = e.target.value
    setTitleDraft(value)
    notifyChange()
    clearTimeout(titleTimer.current)
    titleTimer.current = setTimeout(() => {
      const trimmed = value.trim()
      if (trimmed && trimmed !== lastSavedTitleRef.current) {
        notifySaving()
        updateTitle.mutate(trimmed, {
          onSettled: () => {
            lastSavedTitleRef.current = trimmed
            notifySaved()
          },
        })
      }
    }, TITLE_AUTOSAVE_DELAY)
  }

  function handleTitleBlur() {
    clearTimeout(titleTimer.current)
    const trimmed = titleDraft.trim()
    if (trimmed && trimmed !== lastSavedTitleRef.current) {
      notifySaving()
      updateTitle.mutate(trimmed, {
        onSettled: () => {
          lastSavedTitleRef.current = trimmed
          notifySaved()
        },
      })
    }
  }

  // ── Row DnD ───────────────────────────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = rows.findIndex((r) => r.id === active.id)
    const newIndex = rows.findIndex((r) => r.id === over.id)
    reorderRows.mutate(arrayMove(rows, oldIndex, newIndex).map((r) => r.id))
  }

  const rowIds = rows.map((r) => r.id)

  return (
    <>
    {showPreview && (
      <PreviewModal
        manual={{ ...manual, title: titleDraft }}
        rows={rows}
        onClose={() => setShowPreview(false)}
      />
    )}
    <DeleteManualModal
      open={showDelete}
      manualId={manualId}
      title={titleDraft}
      onClose={() => setShowDelete(false)}
      onDeleted={() => navigate('/admin/manuals')}
    />
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Stale banner */}
      {stale && (
        <div className="flex items-center justify-between bg-amber-50 px-6 py-2 text-sm text-amber-800 border-b border-amber-200">
          <span className="flex items-center gap-2">
            <MdWarning className="size-4 shrink-0" />
            This page was updated in another tab. Reload to see the latest changes.
          </span>
          <button
            onClick={() => window.location.reload()}
            className="ml-4 shrink-0 rounded bg-amber-200 px-3 py-1 text-xs font-medium text-amber-900 hover:bg-amber-300"
          >
            Reload
          </button>
        </div>
      )}

      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-3">
          <Link
            to="/admin/manuals"
            className="flex shrink-0 items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
          >
            <MdArrowBack className="size-3.5" />
            Manuals
          </Link>

          <div className="flex min-w-0 flex-1 items-center gap-3">
            <input
              value={titleDraft}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
              className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-lg font-semibold text-slate-900 hover:border-slate-200 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="Untitled"
            />
            <StatusBadge status={manual.status} />
            <SaveIndicator />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              to={`/admin/manuals/${manualId}/versions`}
              className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:border-slate-300 hover:text-slate-900"
            >
              <MdHistory className="size-3.5" />
              Version History
            </Link>
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:border-slate-300 hover:text-slate-900"
            >
              <MdVisibility className="size-3.5" />
              Preview
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm text-red-600 hover:border-red-300 hover:bg-red-50"
            >
              <MdDelete className="size-3.5" />
              Delete
            </button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => addRow.mutate()}
              disabled={addRow.isPending}
            >
              <MdAdd className="size-4" />
              Add Row
            </Button>
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={saveStatus !== 'saved' || publishManual.isPending}
              title={saveStatus !== 'saved' ? 'Wait for autosave to settle' : undefined}
            >
              {publishManual.isPending
                ? 'Publishing…'
                : manual.status === 'published'
                  ? 'Republish'
                  : 'Publish'}
            </Button>
          </div>
        </div>
      </div>

      {/* Editor body */}
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        {(addRow.isError || deleteRow.isError || updateRow.isError) && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {addRow.error && <p>Add row: {addRow.error.message}</p>}
            {deleteRow.error && <p>Delete row: {deleteRow.error.message}</p>}
            {updateRow.error && <p>Update row: {updateRow.error.message}</p>}
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
              <MdAdd className="size-4" />
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
                      updateRow.mutate({
                        rowId: row.id,
                        column_count: count,
                        column_width_fr: null,
                      })
                    }
                    onColumnWidthsChange={(fractions) =>
                      updateRow.mutate({ rowId: row.id, column_width_fr: fractions })
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
    </>
  )
}

// ── ManualEditor (outer shell — owns loading state, provides context) ──────────

function ManualEditor({ manualId }) {
  const { data, isLoading, isError, error } = useManualContent(manualId)

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768,
  )

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  if (isMobile) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <MdDesktopWindows className="size-4 shrink-0" />
          Editing is desktop-only — showing read-only preview.
        </div>
        <div className="mx-auto w-full max-w-3xl px-4 py-8">
          {isLoading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : isError ? (
            <p className="text-sm text-red-500">{error?.message}</p>
          ) : (
            <ManualReader manualId={manualId} />
          )}
        </div>
      </div>
    )
  }

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

  return (
    <SaveStatusProvider>
      <ManualEditorInner manualId={manualId} data={data} />
    </SaveStatusProvider>
  )
}

export default ManualEditor
