import { useEffect, useRef, useState } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { MdDragIndicator, MdDelete } from 'react-icons/md'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import clsx from 'clsx'
import { Button } from '../ui/Button'
import ColumnContainer from './ColumnContainer'
import { useReorderRowBlocks } from '../../lib/queries/useManualEditor'
import { blockSortableCollisionDetection } from '../../utils/blockDnDCollision'
import { mergeColumnLayoutsAfterDrop } from '../../utils/rowBlockLayout'
import {
  gridTemplateColumnsFromFractions,
  MIN_COLUMN_FR,
  normalizeColumnFractions,
} from '../../utils/columnWidths'

const COLUMN_OPTIONS = [1, 2, 3, 4]

function LayoutRow({
  row,
  manualId,
  onColumnCountChange,
  onColumnWidthsChange,
  onDelete,
  onAddBlock,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: row.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const gridRef = useRef(null)
  const [dragFractions, setDragFractions] = useState(null)
  const latestFractionsRef = useRef(null)

  useEffect(() => {
    setDragFractions(null)
  }, [row.id, row.column_count, row.column_width_fr])

  const baseFractions = normalizeColumnFractions(row.column_width_fr, row.column_count)
  const activeFractions = dragFractions ?? baseFractions
  const gridTemplateColumns = gridTemplateColumnsFromFractions(activeFractions)

  const reorderRowBlocks = useReorderRowBlocks(manualId)
  const blockDragSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  function handleBlockDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const next = mergeColumnLayoutsAfterDrop(row, active.id, over.id)
    if (!next) return
    reorderRowBlocks.mutate({ rowId: row.id, columnLayouts: next })
  }

  function handleResizePointerDown(event, leftIndex) {
    if (event.button !== 0 || row.column_count < 2) return
    event.preventDefault()
    event.stopPropagation()

    const startX = event.clientX
    const startFr = [...normalizeColumnFractions(row.column_width_fr, row.column_count)]
    const pair = startFr[leftIndex] + startFr[leftIndex + 1]
    const target = event.currentTarget
    target.setPointerCapture(event.pointerId)

    function onMove(ev) {
      const width = gridRef.current?.offsetWidth || 1
      const dx = ev.clientX - startX
      const deltaFr = (dx / width) * pair
      const next = [...startFr]
      next[leftIndex] = Math.min(
        Math.max(MIN_COLUMN_FR, startFr[leftIndex] + deltaFr),
        pair - MIN_COLUMN_FR,
      )
      next[leftIndex + 1] = pair - next[leftIndex]
      latestFractionsRef.current = next
      setDragFractions(next)
    }

    function onUp(ev) {
      target.releasePointerCapture(ev.pointerId)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      const done = latestFractionsRef.current
      latestFractionsRef.current = null
      setDragFractions(null)
      if (done && onColumnWidthsChange) onColumnWidthsChange(done)
    }

    latestFractionsRef.current = startFr
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'rounded-xl border border-slate-200 bg-white',
        isDragging ? 'opacity-50 shadow-lg ring-2 ring-slate-300' : 'shadow-sm',
      )}
    >
      {/* Row controls bar */}
      <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab rounded p-0.5 text-slate-300 hover:bg-slate-100 hover:text-slate-500 active:cursor-grabbing"
          aria-label="Drag to reorder row"
        >
          <MdDragIndicator className="size-4" />
        </button>

        {/* Column count selector */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-400">Columns:</span>
          {COLUMN_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => onColumnCountChange(n)}
              className={clsx(
                'flex size-6 items-center justify-center rounded text-xs font-medium transition',
                row.column_count === n
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
              )}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Delete row */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          aria-label="Delete row"
          className="text-red-400 hover:bg-red-50 hover:text-red-600"
        >
          <MdDelete className="size-3.5" />
        </Button>
      </div>

      {/* Column grid — one DnD context so blocks can move between columns */}
      <DndContext
        sensors={blockDragSensors}
        collisionDetection={blockSortableCollisionDetection}
        onDragEnd={handleBlockDragEnd}
      >
        <div
          ref={gridRef}
          className="grid gap-2 p-3"
          style={{ gridTemplateColumns }}
        >
          {row.columns.map((col, i) => (
            <div key={col.index} className="relative min-w-0">
              <ColumnContainer
                columnIndex={col.index}
                blocks={col.blocks}
                manualId={manualId}
                onAddBlock={(blockType) => onAddBlock(col.index, blockType)}
              />
              {i < row.column_count - 1 ? (
                <button
                  type="button"
                  aria-label="Resize columns"
                  className="absolute top-0 bottom-0 z-10 w-2 cursor-col-resize touch-none border-0 bg-transparent p-0 outline-none hover:bg-slate-200/80"
                  style={{ right: '-0.25rem', marginRight: '-0.25rem' }}
                  onPointerDown={(e) => handleResizePointerDown(e, i)}
                />
              ) : null}
            </div>
          ))}
        </div>
      </DndContext>
    </div>
  )
}

export default LayoutRow
