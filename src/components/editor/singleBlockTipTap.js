import { Extension } from '@tiptap/core'
import Heading from '@tiptap/extension-heading'
import Paragraph from '@tiptap/extension-paragraph'

/**
 * Paragraph where Enter inserts a line break instead of a new block (second <p>).
 * Lists keep the default StarterKit paragraph so Enter still splits list items.
 */
export const SingleBlockParagraph = Paragraph.extend({
  addKeyboardShortcuts() {
    return {
      Enter: () => this.editor.commands.setHardBreak(),
    }
  },
})

/**
 * Heading with the same Enter → line break behaviour (no automatic paragraph below).
 */
export const SingleBlockHeading = Heading.extend({
  addKeyboardShortcuts() {
    return {
      Enter: () => this.editor.commands.setHardBreak(),
    }
  },
})

/**
 * Legacy blocks often store several top-level `paragraph` nodes (old Enter = new paragraph).
 * Collapse them into one paragraph with hard breaks so the block looks and edits as a single unit.
 */
export function mergeDocTopLevelParagraphsToOne(docJson) {
  if (!docJson || docJson.type !== 'doc' || !Array.isArray(docJson.content)) {
    return docJson
  }
  const { content } = docJson
  if (content.length <= 1) return docJson
  if (!content.every((n) => n?.type === 'paragraph')) return docJson

  const mergedContent = []
  for (let i = 0; i < content.length; i++) {
    const inner = content[i].content ?? []
    if (i > 0) mergedContent.push({ type: 'hardBreak' })
    mergedContent.push(...inner)
  }
  return { type: 'doc', content: [{ type: 'paragraph', content: mergedContent }] }
}

/** `content_json` from API, or fallback doc; applies paragraph merge for paragraph-style blocks. */
export function initialSingleParagraphDoc(contentJson, fallback) {
  const raw = contentJson?.type === 'doc' ? contentJson : fallback
  return mergeDocTopLevelParagraphsToOne(raw)
}

function isSingleTrulyEmptyTopBlock(doc) {
  if (doc.childCount !== 1) return false
  const first = doc.firstChild
  return first.content.size === 0
}

/**
 * Backspace/Delete at the start of a block deletes the whole manual block when it has
 * no text and no hard breaks (still one visual line).
 */
export function createBlockEmptyDeleteExtension(getOnDelete) {
  return Extension.create({
    name: 'blockEmptyDelete',
    /** Run before default Backspace/Delete so empty blocks can remove the whole manual block */
    priority: 10000,
    addKeyboardShortcuts() {
      const run = () => {
        const editor = this.editor
        const { state } = editor
        const { selection } = state
        if (!selection.empty) return false
        const doc = state.doc
        if (!isSingleTrulyEmptyTopBlock(doc)) return false
        const $from = selection.$from
        // Caret can be at start or “end” of an empty textblock (e.g. macOS); pos === 1 was too strict.
        if ($from.depth < 1 || $from.index(0) !== 0) return false
        const onDelete = getOnDelete()
        if (!onDelete) return false
        onDelete()
        return true
      }
      return {
        Backspace: run,
        Delete: run,
      }
    },
  })
}
