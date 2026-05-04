import { useEffect, useMemo, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import { textStyleColorExtensions } from '../tiptapRichTextExtensions'
import {
  SingleBlockParagraph,
  createBlockEmptyDeleteExtension,
  initialSingleParagraphDoc,
} from '../singleBlockTipTap'
import { Info, AlertTriangle, CheckCircle, Lightbulb, AlertCircle, Palette } from 'lucide-react'
import clsx from 'clsx'
import BlockToolbar from '../BlockToolbar'
import { useSaveStatus } from '../../../contexts/SaveStatusContext'
import { TEXT_COLORS, BACKGROUND_COLORS } from '../../../utils/colors'
import {
  CALLOUT_PANEL_BG_KEY,
  CALLOUT_PANEL_TEXT_KEY,
  calloutPanelLeftAccent,
  getCalloutPanelColors,
} from '../../../utils/calloutPanelMeta'

const AUTOSAVE_DELAY = 800

const ICONS = [
  { name: 'Info', Icon: Info },
  { name: 'AlertTriangle', Icon: AlertTriangle },
  { name: 'CheckCircle', Icon: CheckCircle },
  { name: 'Lightbulb', Icon: Lightbulb },
  { name: 'AlertCircle', Icon: AlertCircle },
]

function getIcon(name) {
  return ICONS.find((i) => i.name === name) ?? ICONS[0]
}

/** Swatches for panel only: first = built-in blue theme (null in metadata), then real white, then presets. */
const PANEL_TEXT_SWATCHES = [
  { label: 'Classic theme', value: null, preview: '#1e3a8a' },
  { label: 'White', value: '#ffffff', preview: '#ffffff' },
  ...TEXT_COLORS.filter((c) => c.value != null).map((c) => ({ ...c, preview: c.value })),
]

const PANEL_BG_SWATCHES = [
  { label: 'Classic theme', value: null, preview: '#eff6ff' },
  { label: 'White', value: '#ffffff', preview: '#ffffff' },
  ...BACKGROUND_COLORS.filter((c) => c.value != null).map((c) => ({ ...c, preview: c.value })),
]

function CalloutPanelColorPicker({ block, onUpdate }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const meta = block.metadata_json && typeof block.metadata_json === 'object' ? block.metadata_json : {}
  const panel = getCalloutPanelColors(meta)

  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function patchPanel(patch) {
    onUpdate({
      metadata_json: { ...meta, ...patch },
    })
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Callout panel colours (inside the box)"
        className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium text-slate-500 hover:bg-slate-200/80 hover:text-slate-700"
      >
        <Palette className="size-3" />
        Panel
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 mt-1 w-52 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
            Callout panel only
          </p>
          <p className="mb-1.5 text-xs font-medium text-slate-500">Panel text</p>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {PANEL_TEXT_SWATCHES.map(({ label, value, preview }) => (
              <button
                key={`${label}-${value ?? 'classic'}`}
                type="button"
                title={label}
                onClick={() => patchPanel({ [CALLOUT_PANEL_TEXT_KEY]: value })}
                className={clsx(
                  'size-5 rounded border transition',
                  (value ?? null) === (panel.text ?? null)
                    ? 'ring-2 ring-slate-400 ring-offset-1'
                    : 'hover:scale-110',
                )}
                style={{
                  backgroundColor: preview,
                  borderColor: preview === '#ffffff' ? '#cbd5e1' : preview,
                }}
              />
            ))}
          </div>
          <p className="mb-1.5 text-xs font-medium text-slate-500">Panel background</p>
          <div className="flex flex-wrap gap-1.5">
            {PANEL_BG_SWATCHES.map(({ label, value, preview }) => (
              <button
                key={`${label}-${value ?? 'classic'}`}
                type="button"
                title={label}
                onClick={() => patchPanel({ [CALLOUT_PANEL_BG_KEY]: value })}
                className={clsx(
                  'size-5 rounded border transition',
                  (value ?? null) === (panel.background ?? null)
                    ? 'ring-2 ring-slate-400 ring-offset-1'
                    : 'hover:scale-110',
                )}
                style={{
                  backgroundColor: preview,
                  borderColor: preview === '#ffffff' || preview === '#eff6ff' ? '#cbd5e1' : preview,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CalloutBlock({ block, onUpdate, onFocusChange, onDeleteEmptyBlock }) {
  const { notifyChange } = useSaveStatus()
  const saveTimer = useRef(null)
  const onDeleteRef = useRef(onDeleteEmptyBlock)
  onDeleteRef.current = onDeleteEmptyBlock

  const blockEmptyDelete = useMemo(
    () => createBlockEmptyDeleteExtension(() => onDeleteRef.current?.()),
    [],
  )
  const iconName = block.metadata_json?.icon ?? 'Info'
  const { Icon } = getIcon(iconName)
  const panel = getCalloutPanelColors(block.metadata_json)
  const hasPanelBg = Boolean(panel.background)
  const hasPanelText = Boolean(panel.text)
  const panelLeftAccent = hasPanelBg ? calloutPanelLeftAccent(panel.background) : null

  const initialContent = useMemo(
    () =>
      initialSingleParagraphDoc(block.content_json, {
        type: 'doc',
        content: [{ type: 'paragraph' }],
      }),
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
      Placeholder.configure({ placeholder: 'Callout text…' }),
      blockEmptyDelete,
    ],
    content: initialContent,
    onFocus: () => onFocusChange?.(true),
    onUpdate: ({ editor }) => {
      notifyChange()
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        onUpdate({ content_json: editor.getJSON() })
      }, AUTOSAVE_DELAY)
    },
    onBlur: ({ editor }) => {
      onFocusChange?.(false)
      clearTimeout(saveTimer.current)
      onUpdate({ content_json: editor.getJSON() })
    },
  }, [block.id])

  function handleIconChange(name) {
    onUpdate({ metadata_json: { ...(block.metadata_json ?? {}), icon: name } })
  }

  return (
    <>
      <div
        className={clsx(
          'rounded-lg border border-l-4 px-4 py-3',
          !hasPanelBg && 'border-blue-200 border-l-blue-500 bg-blue-50',
          hasPanelBg && 'border-slate-300/40',
        )}
        style={{
          ...(hasPanelBg ? { backgroundColor: panel.background } : {}),
          ...(hasPanelText ? { color: panel.text } : {}),
          ...(panelLeftAccent ? { borderLeftColor: panelLeftAccent } : {}),
        }}
      >
        <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <Icon
            className={clsx(
              'size-4 shrink-0',
              hasPanelText ? 'text-current opacity-80' : 'text-blue-600',
            )}
          />
          <div className="flex flex-wrap items-center gap-1">
            {ICONS.map(({ name, Icon: Ic }) => (
              <button
                key={name}
                type="button"
                onClick={() => handleIconChange(name)}
                title={name}
                className={clsx(
                  'rounded p-0.5 transition',
                  name === iconName
                    ? hasPanelText || hasPanelBg
                      ? 'bg-slate-900/10 text-slate-800'
                      : 'bg-blue-200 text-blue-700'
                    : 'text-slate-400 hover:bg-black/5 hover:text-slate-600',
                )}
              >
                <Ic className="size-3.5" />
              </button>
            ))}
            <CalloutPanelColorPicker block={block} onUpdate={onUpdate} />
          </div>
        </div>
        <EditorContent
          editor={editor}
          className={clsx(
            'text-sm [&_.ProseMirror]:outline-none [&_.ProseMirror_strong]:font-semibold [&_.ProseMirror_em]:italic [&_.ProseMirror_u]:underline [&_.ProseMirror_s]:line-through [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:px-1 [&_.ProseMirror_code]:font-mono [&_.ProseMirror_a]:underline',
            hasPanelText
              ? 'text-inherit [&_.ProseMirror_a]:text-current [&_.ProseMirror_a]:opacity-90 [&_.ProseMirror_a]:underline'
              : 'text-blue-900 [&_.ProseMirror_code]:bg-blue-100/80 [&_.ProseMirror_a]:text-blue-600',
            hasPanelBg &&
              !hasPanelText &&
              '[&_.ProseMirror_code]:bg-black/[0.06] [&_.ProseMirror_a]:text-blue-600',
            hasPanelBg &&
              hasPanelText &&
              '[&_.ProseMirror_code]:bg-black/[0.08] [&_.ProseMirror_a]:text-current [&_.ProseMirror_a]:opacity-90',
          )}
        />
      </div>
      <BlockToolbar editor={editor} />
    </>
  )
}

export default CalloutBlock
