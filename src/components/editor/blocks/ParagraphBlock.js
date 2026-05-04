import { useMemo, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { textStyleColorExtensions } from '../tiptapRichTextExtensions'
import {
  SingleBlockParagraph,
  createBlockEmptyDeleteExtension,
  initialSingleParagraphDoc,
} from '../singleBlockTipTap'
import Placeholder from '@tiptap/extension-placeholder'
import { Extension } from '@tiptap/core'
import clsx from 'clsx'
import BlockToolbar from '../BlockToolbar'
import SlashMenu from '../SlashMenu'
import { EDITOR_BLOCK_TYPE_OPTIONS } from '../blockTypeOptions'
import { useSaveStatus } from '../../../contexts/SaveStatusContext'

const AUTOSAVE_DELAY = 800

// ── Slash-command helpers ──────────────────────────────────────────────────────

function filterItems(query) {
  if (!query) return EDITOR_BLOCK_TYPE_OPTIONS
  const q = query.toLowerCase()
  return EDITOR_BLOCK_TYPE_OPTIONS.filter(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      item.blockType.toLowerCase().replace(/_/g, ' ').includes(q),
  )
}

// ── ParagraphBlock ─────────────────────────────────────────────────────────────

function ParagraphBlock({ block, onUpdate, onChangeType, onFocusChange, onDeleteEmptyBlock }) {
  const { notifyChange } = useSaveStatus()
  const saveTimer = useRef(null)
  const onDeleteRef = useRef(onDeleteEmptyBlock)
  onDeleteRef.current = onDeleteEmptyBlock

  const blockEmptyDelete = useMemo(
    () => createBlockEmptyDeleteExtension(() => onDeleteRef.current?.()),
    [],
  )

  const [slash, setSlash] = useState({
    open: false,
    query: '',
    selectedIndex: 0,
    coords: null,
  })

  // Use ref so the extension closure never reads stale state
  const slashRef = useRef(slash)
  slashRef.current = slash

  const editorRef = useRef(null)

  function closeSlash() {
    setSlash((s) => ({ ...s, open: false, query: '' }))
  }

  function handleSlashSelect(blockType) {
    // useMouseDown in SlashMenu prevents blur, so editor still has focus here.
    // Clear the "/" text first, then swap the block type.
    editorRef.current?.commands.clearContent(false)
    closeSlash()
    onChangeType?.(blockType)
  }

  // ── TipTap extension for slash keyboard interception ──────────────────────
  const SlashExtension = useMemo(
    () =>
      Extension.create({
        name: 'slashCommand',
        priority: 1100,
        addKeyboardShortcuts() {
          return {
            ArrowUp: () => {
              if (!slashRef.current.open) return false
              setSlash((s) => ({ ...s, selectedIndex: Math.max(0, s.selectedIndex - 1) }))
              return true
            },
            ArrowDown: () => {
              if (!slashRef.current.open) return false
              const items = filterItems(slashRef.current.query)
              setSlash((s) => ({
                ...s,
                selectedIndex: Math.min(items.length - 1, s.selectedIndex + 1),
              }))
              return true
            },
            Enter: () => {
              if (!slashRef.current.open) return false
              const items = filterItems(slashRef.current.query)
              const selected = items[slashRef.current.selectedIndex]
              if (selected) handleSlashSelect(selected.blockType)
              return true
            },
            Escape: () => {
              if (!slashRef.current.open) return false
              closeSlash()
              return true
            },
          }
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  // ── Editor ────────────────────────────────────────────────────────────────

  const initialContent = useMemo(
    () =>
      initialSingleParagraphDoc(block.content_json, {
        type: 'doc',
        content: [{ type: 'paragraph' }],
      }),
    // Collapse legacy multi-<p> JSON when the stored content changes
    [block.id, JSON.stringify(block.content_json ?? null)],
  )

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        paragraph: false,
      }),
      SingleBlockParagraph,
      ...textStyleColorExtensions,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Write something… or type / for commands' }),
      SlashExtension,
      blockEmptyDelete,
    ],
    content: initialContent,
    onFocus: () => onFocusChange?.(true),
    onBlur: ({ editor }) => {
      onFocusChange?.(false)
      closeSlash()
      clearTimeout(saveTimer.current)
      onUpdate({ content_json: editor.getJSON() })
    },
    onUpdate: ({ editor }) => {
      const $from = editor.state.selection.$from
      const node = $from.node()
      const text = node.textContent

      if (node.type.name === 'paragraph' && text.startsWith('/')) {
        const query = text.slice(1)
        try {
          const coords = editor.view.coordsAtPos(editor.state.selection.from)
          setSlash({ open: true, query, selectedIndex: 0, coords })
        } catch {
          /* ignore coord errors */
        }
      } else if (slashRef.current.open) {
        closeSlash()
      }

      // Update editorRef every update so handleSlashSelect has a current reference
      editorRef.current = editor

      notifyChange()
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        onUpdate({ content_json: editor.getJSON() })
      }, AUTOSAVE_DELAY)
    },
    onCreate: ({ editor }) => {
      editorRef.current = editor
    },
  }, [block.id])

  const filteredItems = filterItems(slash.query)

  return (
    <>
      <EditorContent
        editor={editor}
        className={clsx(
          'leading-normal [&_.ProseMirror]:outline-none [&_.ProseMirror_strong]:font-semibold [&_.ProseMirror_em]:italic [&_.ProseMirror_u]:underline [&_.ProseMirror_s]:line-through [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:bg-slate-100 [&_.ProseMirror_code]:px-1 [&_.ProseMirror_code]:font-mono [&_.ProseMirror_code]:text-sm [&_.ProseMirror_a]:underline [&_.ProseMirror_a]:text-blue-600',
          block.text_color ? 'text-inherit' : 'text-slate-700',
        )}
      />
      <BlockToolbar editor={editor} />
      {slash.open && filteredItems.length > 0 && slash.coords && (
        <SlashMenu
          items={filteredItems}
          selectedIndex={slash.selectedIndex}
          coords={slash.coords}
          onSelect={handleSlashSelect}
          onClose={closeSlash}
        />
      )}
    </>
  )
}

export default ParagraphBlock
