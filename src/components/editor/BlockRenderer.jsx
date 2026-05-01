import { useEffect, useRef, useState, useCallback } from 'react'
import { ChevronDown, GripVertical, Palette, Trash2 } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import clsx from 'clsx'
import {
  useUpdateBlock,
  useDeleteBlock,
  useChangeBlockType,
} from '../../lib/queries/useManualEditor'
import { EDITOR_BLOCK_TYPE_OPTIONS } from './blockTypeOptions'
import { TEXT_COLORS, BACKGROUND_COLORS } from '../../utils/colors'

import HeadingBlock from './blocks/HeadingBlock'
import ParagraphBlock from './blocks/ParagraphBlock'
import BulletedListBlock from './blocks/BulletedListBlock'
import NumberedListBlock from './blocks/NumberedListBlock'
import CalloutBlock from './blocks/CalloutBlock'
import DividerBlock from './blocks/DividerBlock'
import MediaBlock from './blocks/MediaBlock'

// ── Block type metadata ────────────────────────────────────────────────────────

const BLOCK_LABELS = {
  heading_1: 'H1',
  heading_2: 'H2',
  heading_3: 'H3',
  paragraph: 'P',
  bulleted_list: '• List',
  numbered_list: '1. List',
  callout: 'Callout',
  divider: 'Divider',
  media: 'Image',
}

// ── Block type picker ──────────────────────────────────────────────────────────

function BlockTypePicker({ block, manualId }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const changeType = useChangeBlockType(manualId)

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
        onClick={() => setOpen((o) => !o)}
        title="Change block type"
        disabled={changeType.isPending}
        className="flex items-center gap-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50"
      >
        {BLOCK_LABELS[block.block_type] ?? block.block_type}
        <ChevronDown className="size-3 opacity-70" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-1 max-h-56 w-44 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {EDITOR_BLOCK_TYPE_OPTIONS.map(({ blockType, label }) => (
            <button
              key={blockType}
              type="button"
              disabled={blockType === block.block_type || changeType.isPending}
              className={clsx(
                'w-full px-3 py-1.5 text-left text-sm',
                blockType === block.block_type
                  ? 'cursor-default bg-slate-50 text-slate-400'
                  : 'text-slate-700 hover:bg-slate-50',
              )}
              onClick={() => {
                changeType.mutate({ blockId: block.id, newType: blockType })
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

// ── Color picker popover ───────────────────────────────────────────────────────

function ColorPicker({ block, onUpdate }) {
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
        onClick={() => setOpen((o) => !o)}
        title="Text & background color"
        className="flex items-center gap-1 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      >
        <Palette className="size-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-7 z-30 w-52 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
          {/* Text color */}
          <p className="mb-1.5 text-xs font-medium text-slate-500">Text color</p>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {TEXT_COLORS.map(({ label, value }) => (
              <button
                key={label}
                title={label}
                onClick={() => onUpdate({ text_color: value })}
                className={clsx(
                  'size-5 rounded border transition',
                  block.text_color === value
                    ? 'ring-2 ring-slate-400 ring-offset-1'
                    : 'hover:scale-110',
                )}
                style={{
                  backgroundColor: value ?? '#ffffff',
                  borderColor: value ? value : '#e2e8f0',
                }}
              />
            ))}
          </div>

          {/* Background color */}
          <p className="mb-1.5 text-xs font-medium text-slate-500">Background</p>
          <div className="flex flex-wrap gap-1.5">
            {BACKGROUND_COLORS.map(({ label, value }) => (
              <button
                key={label}
                title={label}
                onClick={() => onUpdate({ background_color: value })}
                className={clsx(
                  'size-5 rounded border transition',
                  block.background_color === value
                    ? 'ring-2 ring-slate-400 ring-offset-1'
                    : 'hover:scale-110',
                )}
                style={{
                  backgroundColor: value ?? '#ffffff',
                  borderColor: value ? value : '#e2e8f0',
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Inner block content switcher ───────────────────────────────────────────────

function BlockContent({ block, onUpdate, onChangeType, onFocusChange }) {
  const props = { block, onUpdate, onChangeType, onFocusChange }

  switch (block.block_type) {
    case 'heading_1':
    case 'heading_2':
    case 'heading_3':
      return <HeadingBlock {...props} />
    case 'paragraph':
      return <ParagraphBlock {...props} />
    case 'bulleted_list':
      return <BulletedListBlock {...props} />
    case 'numbered_list':
      return <NumberedListBlock {...props} />
    case 'callout':
      return <CalloutBlock {...props} />
    case 'divider':
      return <DividerBlock />
    case 'media':
      return <MediaBlock {...props} />
    default:
      return (
        <p className="text-xs text-slate-400">[unknown block type: {block.block_type}]</p>
      )
  }
}

// ── BlockRenderer ──────────────────────────────────────────────────────────────

function BlockRenderer({ block, manualId }) {
  const updateBlock = useUpdateBlock(manualId)
  const deleteBlock = useDeleteBlock(manualId)
  const changeType = useChangeBlockType(manualId)
  const [isEditing, setIsEditing] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    color: block.text_color || undefined,
    backgroundColor: block.background_color || undefined,
  }

  function onUpdate(fields) {
    updateBlock.mutate({ blockId: block.id, ...fields })
  }

  // Stable callback so child blocks don't re-render from prop identity changes
  const handleFocusChange = useCallback((focused) => setIsEditing(focused), [])

  const handleChangeType = useCallback(
    (newType) => changeType.mutate({ blockId: block.id, newType }),
    [block.id, changeType],
  )

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'group relative rounded-md',
        isDragging ? 'opacity-50 shadow-lg ring-2 ring-blue-300' : '',
        block.background_color ? 'p-2' : '',
      )}
    >
      {/* Hover/edit controls */}
      <div
        className={clsx(
          'mb-1 flex items-center gap-1 transition-opacity duration-150',
          isEditing
            ? 'opacity-20'                           // faded while editing
            : 'opacity-0 group-hover:opacity-100',   // normal hover reveal
        )}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab rounded p-0.5 text-slate-300 hover:bg-slate-100 hover:text-slate-500 active:cursor-grabbing"
          aria-label="Drag to reorder block"
        >
          <GripVertical className="size-3.5" />
        </button>

        {/* Block type */}
        <BlockTypePicker block={block} manualId={manualId} />

        <div className="flex-1" />

        {/* Color picker */}
        <ColorPicker block={block} onUpdate={onUpdate} />

        {/* Delete */}
        <button
          onClick={() => deleteBlock.mutate(block.id)}
          className="rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-500"
          aria-label="Delete block"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {/* Block content */}
      <BlockContent
        block={block}
        onUpdate={onUpdate}
        onChangeType={handleChangeType}
        onFocusChange={handleFocusChange}
      />
    </div>
  )
}

export default BlockRenderer
