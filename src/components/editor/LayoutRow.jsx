import { GripVertical, Trash2 } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import clsx from 'clsx'
import { Button } from '../ui/Button'
import ColumnContainer from './ColumnContainer'

const COLUMN_OPTIONS = [1, 2, 3, 4]

function LayoutRow({ row, manualId, onColumnCountChange, onDelete, onAddBlock }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: row.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
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
          <GripVertical className="size-4" />
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
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      {/* Column grid */}
      <div
        className="grid gap-2 p-3"
        style={{ gridTemplateColumns: `repeat(${row.column_count}, 1fr)` }}
      >
        {row.columns.map((col) => (
          <ColumnContainer
            key={col.index}
            rowId={row.id}
            columnIndex={col.index}
            blocks={col.blocks}
            manualId={manualId}
            onAddBlock={(blockType) => onAddBlock(col.index, blockType)}
          />
        ))}
      </div>
    </div>
  )
}

export default LayoutRow
