import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Info, AlertTriangle, CheckCircle, Lightbulb, AlertCircle } from 'lucide-react'
import clsx from 'clsx'
import BlockToolbar from '../BlockToolbar'

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

function CalloutBlock({ block, onUpdate, onFocusChange }) {
  const iconName = block.metadata_json?.icon ?? 'Info'
  const { Icon } = getIcon(iconName)

  const initialContent = block.content_json?.type === 'doc'
    ? block.content_json
    : { type: 'doc', content: [{ type: 'paragraph' }] }

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
      }),
      Placeholder.configure({ placeholder: 'Callout text…' }),
    ],
    content: initialContent,
    onFocus: () => onFocusChange?.(true),
    onBlur: ({ editor }) => {
      onFocusChange?.(false)
      onUpdate({ content_json: editor.getJSON() })
    },
  })

  function handleIconChange(name) {
    onUpdate({ metadata_json: { ...(block.metadata_json ?? {}), icon: name } })
  }

  return (
    <>
      <div className="rounded-lg border border-blue-200 border-l-4 border-l-blue-500 bg-blue-50 px-4 py-3">
        <div className="mb-2 flex items-center gap-2">
          <Icon className="size-4 shrink-0 text-blue-600" />
          {/* Icon picker */}
          <div className="flex gap-1">
            {ICONS.map(({ name, Icon: Ic }) => (
              <button
                key={name}
                onClick={() => handleIconChange(name)}
                title={name}
                className={clsx(
                  'rounded p-0.5 transition',
                  name === iconName
                    ? 'bg-blue-200 text-blue-700'
                    : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600',
                )}
              >
                <Ic className="size-3.5" />
              </button>
            ))}
          </div>
        </div>
        <EditorContent
          editor={editor}
          className={clsx(
            'text-sm [&_.ProseMirror]:outline-none [&_.ProseMirror_strong]:font-semibold [&_.ProseMirror_em]:italic [&_.ProseMirror_u]:underline [&_.ProseMirror_s]:line-through [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:bg-blue-100 [&_.ProseMirror_code]:px-1 [&_.ProseMirror_code]:font-mono',
            block.text_color ? 'text-inherit' : 'text-blue-900',
          )}
        />
      </div>
      <BlockToolbar editor={editor} />
    </>
  )
}

export default CalloutBlock
