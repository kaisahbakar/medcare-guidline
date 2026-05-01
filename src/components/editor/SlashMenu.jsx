import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

/**
 * Floating slash-command menu.
 *
 * Props:
 *   items         — filtered EDITOR_BLOCK_TYPE_OPTIONS array
 *   selectedIndex — keyboard-highlighted row
 *   coords        — { top, left, bottom } from editor.view.coordsAtPos()
 *   onSelect(blockType) — user confirmed an item
 *   onClose       — user dismissed without selecting
 */
function SlashMenu({ items, selectedIndex, coords, onSelect, onClose }) {
  const listRef = useRef(null)

  // Scroll the highlighted item into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex]
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  // Click-outside to close
  useEffect(() => {
    function handler(e) {
      if (listRef.current && !listRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  if (!coords || items.length === 0) return null

  // Position the menu below the cursor line
  const style = {
    position: 'fixed',
    top: coords.bottom + 4,
    left: coords.left,
    zIndex: 9999,
  }

  return createPortal(
    <div
      style={style}
      className="w-52 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-xl"
    >
      <p className="px-3 pb-1 pt-0.5 text-xs text-slate-400">Block type</p>
      <ul ref={listRef} className="max-h-60 overflow-auto">
        {items.map((item, i) => (
          <li key={item.blockType}>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault() // prevent editor blur before selection
                onSelect(item.blockType)
              }}
              className={
                i === selectedIndex
                  ? 'flex w-full items-center gap-2 bg-slate-100 px-3 py-1.5 text-left text-sm font-medium text-slate-900'
                  : 'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50'
              }
            >
              <span className="w-10 shrink-0 font-mono text-xs text-slate-400">
                {SHORTHAND[item.blockType] ?? item.blockType.slice(0, 4)}
              </span>
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </div>,
    document.body,
  )
}

const SHORTHAND = {
  heading_1: 'H1',
  heading_2: 'H2',
  heading_3: 'H3',
  paragraph: 'P',
  bulleted_list: '• —',
  numbered_list: '1. —',
  callout: '💡',
  divider: '—',
  media: '🖼',
}

export default SlashMenu
