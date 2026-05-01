import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import clsx from 'clsx'
import BlockToolbar from '../BlockToolbar'

const DEFAULT_CONTENT = {
  type: 'doc',
  content: [
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [] }],
        },
      ],
    },
  ],
}

function BulletedListBlock({ block, onUpdate, onFocusChange }) {
  const initialContent = block.content_json?.type === 'doc'
    ? block.content_json
    : DEFAULT_CONTENT

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Placeholder.configure({ placeholder: 'List item…' }),
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
          '[&_.ProseMirror]:outline-none [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ul]:space-y-1 [&_.ProseMirror_strong]:font-semibold [&_.ProseMirror_em]:italic [&_.ProseMirror_u]:underline [&_.ProseMirror_s]:line-through [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:bg-slate-100 [&_.ProseMirror_code]:px-1 [&_.ProseMirror_code]:font-mono [&_.ProseMirror_code]:text-sm',
          block.text_color ? 'text-inherit' : 'text-slate-700',
        )}
      />
      <BlockToolbar editor={editor} />
    </>
  )
}

export default BulletedListBlock
