import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bold, Italic, Underline, Strikethrough, Code, Link2, Link2Off, Check } from 'lucide-react'
import clsx from 'clsx'

/**
 * Floating formatting toolbar that appears above a TipTap text selection.
 *
 * Props:
 *   editor — a TipTap editor instance (may be null while editor is initialising)
 */
function BlockToolbar({ editor }) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const [linkMode, setLinkMode] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const toolbarRef = useRef(null)
  const linkInputRef = useRef(null)

  // Track selection changes to show/hide and position the toolbar
  useEffect(() => {
    if (!editor) return

    function update() {
      const { empty } = editor.state.selection
      if (empty || !editor.isFocused) {
        setVisible(false)
        setLinkMode(false)
        return
      }

      const { from, to } = editor.state.selection
      try {
        const startCoords = editor.view.coordsAtPos(from)
        const endCoords = editor.view.coordsAtPos(to)
        const midX = (startCoords.left + endCoords.right) / 2
        const topY = Math.min(startCoords.top, endCoords.top) - 44
        setPos({ top: topY, left: midX })
        setVisible(true)
      } catch {
        setVisible(false)
      }
    }

    editor.on('selectionUpdate', update)
    editor.on('focus', update)
    editor.on('blur', () => {
      // Small delay so clicks inside the toolbar don't immediately close it
      setTimeout(() => {
        if (!toolbarRef.current?.contains(document.activeElement)) {
          setVisible(false)
          setLinkMode(false)
        }
      }, 100)
    })

    // Cmd/Ctrl+K: open link input
    function onKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        const { empty } = editor.state.selection
        if (!empty) {
          const existing = editor.getAttributes('link').href ?? ''
          setLinkUrl(existing)
          setLinkMode(true)
          setVisible(true)
        }
      }
    }
    editor.view.dom.addEventListener('keydown', onKeyDown)

    return () => {
      editor.off('selectionUpdate', update)
      editor.off('focus', update)
      editor.off('blur', () => {})
      editor.view.dom.removeEventListener('keydown', onKeyDown)
    }
  }, [editor])

  // Focus link input when entering link mode
  useEffect(() => {
    if (linkMode) linkInputRef.current?.focus()
  }, [linkMode])

  function applyLink() {
    if (!editor) return
    const url = linkUrl.trim()
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    } else {
      editor.chain().focus().unsetLink().run()
    }
    setLinkMode(false)
    setLinkUrl('')
  }

  function removeLink() {
    editor?.chain().focus().unsetLink().run()
    setLinkMode(false)
  }

  if (!visible || !editor) return null

  const isLinkActive = editor.isActive('link')

  return createPortal(
    <div
      ref={toolbarRef}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        transform: 'translateX(-50%)',
        zIndex: 9998,
      }}
      // Stop mousedown from stealing focus from the editor
      onMouseDown={(e) => e.preventDefault()}
      className="flex items-center rounded-lg border border-slate-200 bg-white shadow-xl"
    >
      {linkMode ? (
        // ── Link input mode ──────────────────────────────────────────────────
        <div className="flex items-center gap-1 px-2 py-1">
          <Link2 className="size-3.5 shrink-0 text-slate-400" />
          <input
            ref={linkInputRef}
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); applyLink() }
              if (e.key === 'Escape') { setLinkMode(false) }
            }}
            placeholder="https://…"
            className="w-52 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300"
          />
          <button
            onClick={applyLink}
            className="rounded p-0.5 text-green-600 hover:bg-green-50"
            title="Apply link"
          >
            <Check className="size-3.5" />
          </button>
          {isLinkActive && (
            <button
              onClick={removeLink}
              className="rounded p-0.5 text-red-400 hover:bg-red-50"
              title="Remove link"
            >
              <Link2Off className="size-3.5" />
            </button>
          )}
        </div>
      ) : (
        // ── Formatting buttons ───────────────────────────────────────────────
        <div className="flex items-center divide-x divide-slate-100">
          <div className="flex items-center px-1 py-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive('bold')}
              title="Bold (⌘B)"
            >
              <Bold className="size-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive('italic')}
              title="Italic (⌘I)"
            >
              <Italic className="size-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              active={editor.isActive('underline')}
              title="Underline (⌘U)"
            >
              <Underline className="size-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              active={editor.isActive('strike')}
              title="Strikethrough"
            >
              <Strikethrough className="size-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              active={editor.isActive('code')}
              title="Inline code"
            >
              <Code className="size-3.5" />
            </ToolbarButton>
          </div>
          <div className="flex items-center px-1 py-1">
            <ToolbarButton
              onClick={() => {
                const existing = editor.getAttributes('link').href ?? ''
                setLinkUrl(existing)
                setLinkMode(true)
              }}
              active={isLinkActive}
              title="Link (⌘K)"
            >
              <Link2 className="size-3.5" />
            </ToolbarButton>
          </div>
        </div>
      )}
    </div>,
    document.body,
  )
}

function ToolbarButton({ children, onClick, active, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={clsx(
        'rounded p-1.5 transition',
        active
          ? 'bg-slate-900 text-white'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
      )}
    >
      {children}
    </button>
  )
}

export default BlockToolbar
