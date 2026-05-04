import { useMemo, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import { textStyleColorExtensions } from '../tiptapRichTextExtensions'
import {
  SingleBlockHeading,
  createBlockEmptyDeleteExtension,
} from '../singleBlockTipTap'
import clsx from 'clsx'
import BlockToolbar from '../BlockToolbar'
import { useSaveStatus } from '../../../contexts/SaveStatusContext'

const AUTOSAVE_DELAY = 800

const LEVEL_MAP = { heading_1: 1, heading_2: 2, heading_3: 3 }

const SIZE_CLASSES = {
  heading_1: 'text-3xl font-bold',
  heading_2: 'text-2xl font-semibold',
  heading_3: 'text-xl font-semibold',
}

function HeadingBlock({ block, onUpdate, onFocusChange, onDeleteEmptyBlock }) {
  const level = LEVEL_MAP[block.block_type] ?? 1
  const sizeClass = SIZE_CLASSES[block.block_type] ?? 'text-3xl font-bold'
  const { notifyChange } = useSaveStatus()
  const saveTimer = useRef(null)
  const onDeleteRef = useRef(onDeleteEmptyBlock)
  onDeleteRef.current = onDeleteEmptyBlock

  const blockEmptyDelete = useMemo(
    () => createBlockEmptyDeleteExtension(() => onDeleteRef.current?.()),
    [],
  )

  const initialContent = useMemo(() => {
    const doc =
      block.content_json?.type === 'doc'
        ? block.content_json
        : { type: 'doc', content: [{ type: 'heading', attrs: { level }, content: [] }] }
    // Strip any trailing paragraph nodes that may have been saved when the
    // trailing-node bug was present, keeping only heading nodes.
    const headingNodes = (doc.content ?? []).filter((n) => n?.type === 'heading')
    return {
      ...doc,
      content: headingNodes.length
        ? headingNodes
        : [{ type: 'heading', attrs: { level }, content: [] }],
    }
  }, [block.block_type, level, JSON.stringify(block.content_json ?? null)])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        trailingNode: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      SingleBlockHeading.configure({ levels: [1, 2, 3] }),
      ...textStyleColorExtensions,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Heading…' }),
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
  }, [block.id, block.block_type])

  return (
    <>
      <EditorContent
        editor={editor}
        className={clsx(
          sizeClass,
          '[&_.ProseMirror]:outline-none [&_.ProseMirror_strong]:font-semibold [&_.ProseMirror_em]:italic [&_.ProseMirror_u]:underline [&_.ProseMirror_s]:line-through [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:bg-slate-100 [&_.ProseMirror_code]:px-1 [&_.ProseMirror_code]:font-mono [&_.ProseMirror_a]:underline [&_.ProseMirror_a]:text-blue-600',
          block.text_color ? 'text-inherit' : 'text-slate-900',
        )}
      />
      <BlockToolbar editor={editor} />
    </>
  )
}

export default HeadingBlock
