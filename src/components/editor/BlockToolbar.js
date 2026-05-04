import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link2,
  Link2Off,
  Check,
  Palette,
  Highlighter,
  Ban,
} from 'lucide-react'
import clsx from 'clsx'
import { TEXT_COLORS, BACKGROUND_COLORS } from '../../utils/colors'

const TOOLBAR_GAP = 8
const TOOLBAR_Z = 10050

function readSelectionAnchor(editor) {
  if (!editor) return null
  const { empty } = editor.state.selection
  if (empty || !editor.isFocused) return null
  const { from, to } = editor.state.selection
  try {
    const startCoords = editor.view.coordsAtPos(from)
    const endCoords = editor.view.coordsAtPos(to)
    return {
      selTop: Math.min(startCoords.top, endCoords.top),
      selBottom: Math.max(startCoords.bottom, endCoords.bottom),
      midX: (startCoords.left + endCoords.right) / 2,
    }
  } catch {
    return null
  }
}

/**
 * Floating formatting toolbar that appears above a TipTap text selection.
 *
 * Props:
 *   editor — a TipTap editor instance (may be null while editor is initialising)
 */
function BlockToolbar({ editor }) {
  const [visible, setVisible] = useState(false)
  /** Viewport anchor from selection: top/bottom of highlight, horizontal center */
  const [anchor, setAnchor] = useState(null)
  const [floatStyle, setFloatStyle] = useState({ top: 0, left: 0 })
  /** Toolbar sits above selection vs below — color popovers flip to stay on-screen */
  const [openUpward, setOpenUpward] = useState(true)
  const [linkMode, setLinkMode] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [colorMenu, setColorMenu] = useState(null)
  const toolbarRef = useRef(null)
  const linkInputRef = useRef(null)
  const textColorInputRef = useRef(null)
  const bgColorInputRef = useRef(null)

  const measureAndPlace = useCallback(() => {
    const el = toolbarRef.current
    if (!el || !anchor) return
    const { height: h, width: w } = el.getBoundingClientRect()
    const spaceAbove = anchor.selTop - TOOLBAR_GAP
    const spaceBelow = window.innerHeight - anchor.selBottom - TOOLBAR_GAP
    const need = h + TOOLBAR_GAP
    const fitsAbove = spaceAbove >= need
    const fitsBelow = spaceBelow >= need
    let upward
    if (fitsAbove && fitsBelow) {
      upward = spaceAbove >= spaceBelow
    } else if (fitsAbove) {
      upward = true
    } else if (fitsBelow) {
      upward = false
    } else {
      upward = spaceAbove >= spaceBelow
    }

    let top = upward
      ? anchor.selTop - h - TOOLBAR_GAP
      : anchor.selBottom + TOOLBAR_GAP
    top = Math.max(TOOLBAR_GAP, Math.min(top, window.innerHeight - h - TOOLBAR_GAP))

    let left = anchor.midX - w / 2
    left = Math.max(TOOLBAR_GAP, Math.min(left, window.innerWidth - w - TOOLBAR_GAP))

    setOpenUpward(upward)
    setFloatStyle({ top, left })
  }, [anchor])

  useLayoutEffect(() => {
    if (!visible || !anchor) return
    measureAndPlace()
  }, [visible, anchor, measureAndPlace, linkMode, colorMenu])

  useEffect(() => {
    if (!visible || !editor) return
    function onViewportChange() {
      const next = readSelectionAnchor(editor)
      if (next) setAnchor(next)
    }
    window.addEventListener('scroll', onViewportChange, true)
    window.addEventListener('resize', onViewportChange)
    return () => {
      window.removeEventListener('scroll', onViewportChange, true)
      window.removeEventListener('resize', onViewportChange)
    }
  }, [visible, editor])

  // Track selection changes to show/hide and position the toolbar
  useEffect(() => {
    if (!editor) return

    function update() {
      const { empty } = editor.state.selection
      if (empty || !editor.isFocused) {
        setVisible(false)
        setAnchor(null)
        setLinkMode(false)
        setColorMenu(null)
        return
      }

      const next = readSelectionAnchor(editor)
      if (next) {
        setAnchor(next)
        setVisible(true)
      } else {
        setVisible(false)
        setAnchor(null)
      }
    }

    function onBlur() {
      // Small delay so clicks inside the toolbar don't immediately close it
      setTimeout(() => {
        if (!toolbarRef.current?.contains(document.activeElement)) {
          setVisible(false)
          setAnchor(null)
          setLinkMode(false)
        }
      }, 100)
    }

    editor.on('selectionUpdate', update)
    editor.on('focus', update)
    editor.on('blur', onBlur)

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
      editor.off('blur', onBlur)
      editor.view.dom.removeEventListener('keydown', onKeyDown)
    }
  }, [editor])

  useEffect(() => {
    if (!colorMenu) return
    function closeOutside(e) {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setColorMenu(null)
      }
    }
    document.addEventListener('mousedown', closeOutside)
    return () => document.removeEventListener('mousedown', closeOutside)
  }, [colorMenu])

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
  const textAttrs = editor.getAttributes('textStyle') || {}
  const hasTextColor = Boolean(textAttrs.color)
  const hasBgColor = Boolean(textAttrs.backgroundColor)
  const canInlineColor =
    typeof editor.commands.setColor === 'function' &&
    typeof editor.commands.setBackgroundColor === 'function'

  return createPortal(
    <div
      ref={toolbarRef}
      style={{
        position: 'fixed',
        top: floatStyle.top,
        left: floatStyle.left,
        zIndex: TOOLBAR_Z,
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
          {canInlineColor ? (
            <div className="relative flex items-center px-1 py-1">
              <ToolbarButton
                onClick={() => setColorMenu((m) => (m === 'text' ? null : 'text'))}
                active={colorMenu === 'text' || hasTextColor}
                title="Text color"
              >
                <Palette className="size-3.5" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => setColorMenu((m) => (m === 'bg' ? null : 'bg'))}
                active={colorMenu === 'bg' || hasBgColor}
                title="Highlight / background"
              >
                <Highlighter className="size-3.5" />
              </ToolbarButton>
              {colorMenu === 'text' && (
                <div
                  className={clsx(
                    'absolute left-0 z-[10000] w-52 rounded-lg border border-slate-200 bg-white p-2 shadow-xl',
                    openUpward ? 'top-full mt-1' : 'bottom-full mb-1',
                  )}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    Text color
                  </p>
                  <div className="mb-2 flex flex-wrap gap-1">
                    {TEXT_COLORS.filter((c) => c.value).map(({ label, value }) => (
                      <button
                        key={label}
                        type="button"
                        title={label}
                        onClick={() => {
                          editor.chain().focus().setColor(value).run()
                          setColorMenu(null)
                        }}
                        className="size-6 rounded border border-slate-200 shadow-sm ring-offset-1 hover:ring-2 hover:ring-slate-300"
                        style={{ backgroundColor: value }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 border-t border-slate-100 pt-2">
                    <input
                      ref={textColorInputRef}
                      type="color"
                      className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-white"
                      onChange={(e) => {
                        editor.chain().focus().setColor(e.target.value).run()
                      }}
                    />
                    <span className="text-xs text-slate-500">Custom</span>
                    <button
                      type="button"
                      onClick={() => {
                        editor.chain().focus().unsetColor().run()
                        setColorMenu(null)
                      }}
                      className="ml-auto flex items-center gap-0.5 rounded px-1.5 py-1 text-xs text-slate-600 hover:bg-slate-100"
                      title="Remove text color"
                    >
                      <Ban className="size-3" />
                      Clear
                    </button>
                  </div>
                </div>
              )}
              {colorMenu === 'bg' && (
                <div
                  className={clsx(
                    'absolute right-0 z-[10000] w-52 rounded-lg border border-slate-200 bg-white p-2 shadow-xl',
                    openUpward ? 'top-full mt-1' : 'bottom-full mb-1',
                  )}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    Background
                  </p>
                  <div className="mb-2 flex flex-wrap gap-1">
                    {BACKGROUND_COLORS.filter((c) => c.value).map(({ label, value }) => (
                      <button
                        key={label}
                        type="button"
                        title={label}
                        onClick={() => {
                          editor.chain().focus().setBackgroundColor(value).run()
                          setColorMenu(null)
                        }}
                        className="size-6 rounded border border-slate-200 shadow-sm ring-offset-1 hover:ring-2 hover:ring-slate-300"
                        style={{ backgroundColor: value }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 border-t border-slate-100 pt-2">
                    <input
                      ref={bgColorInputRef}
                      type="color"
                      className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-white"
                      onChange={(e) => {
                        editor.chain().focus().setBackgroundColor(e.target.value).run()
                      }}
                    />
                    <span className="text-xs text-slate-500">Custom</span>
                    <button
                      type="button"
                      onClick={() => {
                        editor.chain().focus().unsetBackgroundColor().run()
                        setColorMenu(null)
                      }}
                      className="ml-auto flex items-center gap-0.5 rounded px-1.5 py-1 text-xs text-slate-600 hover:bg-slate-100"
                      title="Remove highlight"
                    >
                      <Ban className="size-3" />
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
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
