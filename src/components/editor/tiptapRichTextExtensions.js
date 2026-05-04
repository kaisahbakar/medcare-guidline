import { TextStyle, Color, BackgroundColor } from '@tiptap/extension-text-style'

/**
 * Inline text colour + background colour for the current selection (TipTap marks).
 * Use together with StarterKit (bold / italic / underline / etc.).
 */
export const textStyleColorExtensions = [TextStyle, Color, BackgroundColor]
