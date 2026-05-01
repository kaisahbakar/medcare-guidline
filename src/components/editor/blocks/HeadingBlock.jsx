import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import clsx from 'clsx'
import BlockToolbar from '../BlockToolbar'

const LEVEL_MAP = { heading_1: 1, heading_2: 2, heading_3: 3 }

const SIZE_CLASSES = {
  heading_1: 'text-3xl font-bold',
  heading_2: 'text-2xl font-semibold',
  heading_3: 'text-xl font-semibold',
}

function HeadingBlock({ block, onUpdate, onFocusChange }) {
  const level = LEVEL_MAP[block.block_type] ?? 1
  const sizeClass = SIZE_CLASSES[block.block_type] ?? 'text-3xl font-bold'

  const initialContent = block.content_json?.type === 'doc'
    ? block.content_json
    : { type: 'doc', content: [{ type: 'heading', attrs: { level }, content: [] }] }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        bold: false,
        italic: false,
        strike: false,
        code: false,
        underline: false,
      }),
      Placeholder.configure({ placeholder: 'Heading…' }),
    ],
    content: initialContent,
    onFocus: () => onFocusChange?.(true),
    onBlur: ({ editor }) => {
      onFocusChange?.(false)
      onUpdate({ content_json: editor.getJSON() })
    },
  })

  return (
    <>
      <EditorContent
        editor={editor}
        className={clsx(
          sizeClass,
          '[&_.ProseMirror]:outline-none',
          block.text_color ? 'text-inherit' : 'text-slate-900',
        )}
      />
      <BlockToolbar editor={editor} />
    </>
  )
}

export default HeadingBlock
