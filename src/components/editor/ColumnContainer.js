import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDroppable } from '@dnd-kit/core'
import { MdAdd } from 'react-icons/md'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import clsx from 'clsx'
import { EDITOR_BLOCK_TYPE_OPTIONS } from './blockTypeOptions'
import BlockRenderer from './BlockRenderer'

const ADD_MENU_GAP = 8
const ADD_MENU_MAX_H = 280
const ADD_MENU_MIN_W = 200

function AddBlockMenu({ onPick, disabled }) {
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState(null)
  const wrapRef = useRef(null)
  const menuRef = useRef(null)

  const updateMenuPosition = useCallback(() => {
    const btn = wrapRef.current?.querySelector('button')
    if (!btn) return
    const r = btn.getBoundingClientRect()
    const spaceAbove = r.top - ADD_MENU_GAP
    const spaceBelow = window.innerHeight - r.bottom - ADD_MENU_GAP
    const width = Math.max(r.width, ADD_MENU_MIN_W)
    const left = Math.min(r.left, window.innerWidth - width - ADD_MENU_GAP)
    const maxH = ADD_MENU_MAX_H

    const openUpward = spaceAbove >= spaceBelow && spaceAbove > 72
    if (openUpward) {
      setMenuStyle({
        position: 'fixed',
        left,
        width,
        maxHeight: Math.min(maxH, Math.max(spaceAbove - 4, 96)),
        bottom: window.innerHeight - r.top + ADD_MENU_GAP,
      })
    } else {
      setMenuStyle({
        position: 'fixed',
        left,
        width,
        maxHeight: Math.min(maxH, Math.max(spaceBelow - 4, 96)),
        top: r.bottom + ADD_MENU_GAP,
      })
    }
  }, [])

  useLayoutEffect(() => {
    if (!open) {
      setMenuStyle(null)
      return
    }
    updateMenuPosition()
  }, [open, updateMenuPosition])

  useEffect(() => {
    if (!open) return
    function onViewportChange() {
      updateMenuPosition()
    }
    window.addEventListener('scroll', onViewportChange, true)
    window.addEventListener('resize', onViewportChange)
    return () => {
      window.removeEventListener('scroll', onViewportChange, true)
      window.removeEventListener('resize', onViewportChange)
    }
  }, [open, updateMenuPosition])

  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (wrapRef.current?.contains(e.target)) return
      if (menuRef.current?.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 disabled:opacity-50"
      >
        <MdAdd className="size-3" />
        Add block
      </button>

      {open &&
        menuStyle &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className="z-[10050] overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl"
          >
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
          </div>,
          document.body,
        )}
    </div>
  )
}

function ColumnAppendDrop({ columnIndex }) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${columnIndex}-append` })
  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'min-h-6 shrink-0 rounded transition-colors',
        isOver && 'bg-sky-100/90',
      )}
    />
  )
}

function ColumnContainer({ columnIndex, blocks, manualId, onAddBlock }) {
  const blockIds = blocks.map((b) => b.id)
  const isEmpty = blocks.length === 0

  const { setNodeRef, isOver } = useDroppable({
    id: `col-${columnIndex}-empty`,
    disabled: !isEmpty,
  })

  if (isEmpty) {
    return (
      <div className="min-h-20 rounded-lg border border-dashed border-slate-200 p-2">
        <SortableContext items={[]} strategy={verticalListSortingStrategy}>
          <div
            ref={setNodeRef}
            className={clsx(
              'flex min-h-16 flex-col justify-center rounded-md transition-colors',
              isOver && 'bg-sky-50 ring-2 ring-sky-200',
            )}
          >
            <p className="mb-2 text-center text-xs text-slate-400">No blocks yet</p>
            <AddBlockMenu onPick={onAddBlock} />
          </div>
        </SortableContext>
      </div>
    )
  }

  return (
    <div className="min-h-20 rounded-lg border border-dashed border-slate-200 p-2">
      <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {blocks.map((block) => (
            <BlockRenderer key={block.id} block={block} manualId={manualId} />
          ))}
          <ColumnAppendDrop columnIndex={columnIndex} />
        </div>
      </SortableContext>

      <div className="mt-2">
        <AddBlockMenu onPick={onAddBlock} />
      </div>
    </div>
  )
}

export default ColumnContainer
