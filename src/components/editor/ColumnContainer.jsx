import { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { EDITOR_BLOCK_TYPE_OPTIONS } from './blockTypeOptions'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useReorderBlocks } from '../../lib/queries/useManualEditor'
import BlockRenderer from './BlockRenderer'

function AddBlockMenu({ onPick, disabled }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 disabled:opacity-50"
      >
        <Plus className="size-3" />
        Add block
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 z-20 mb-1 max-h-64 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {EDITOR_BLOCK_TYPE_OPTIONS.map(({ blockType, label }) => (
            <button
              key={blockType}
              type="button"
              className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => {
                onPick(blockType)
                setOpen(false)
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ColumnContainer({ rowId, columnIndex, blocks, manualId, onAddBlock }) {
  const reorderBlocks = useReorderBlocks(manualId)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const blockIds = blocks.map((b) => b.id)

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = blocks.findIndex((b) => b.id === active.id)
    const newIndex = blocks.findIndex((b) => b.id === over.id)

    const reordered = arrayMove(blocks, oldIndex, newIndex).map((b) => b.id)
    reorderBlocks.mutate({ rowId, columnIndex, blockIds: reordered })
  }

  return (
    <div className="min-h-20 rounded-lg border border-dashed border-slate-200 p-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {blocks.map((block) => (
              <BlockRenderer
                key={block.id}
                block={block}
                manualId={manualId}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {blocks.length === 0 ? (
        <div className="pt-2">
          <p className="mb-2 text-center text-xs text-slate-400">No blocks yet</p>
          <AddBlockMenu onPick={onAddBlock} />
        </div>
      ) : (
        <div className="mt-2">
          <AddBlockMenu onPick={onAddBlock} />
        </div>
      )}
    </div>
  )
}

export default ColumnContainer
