import { generateHTML } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle, Color } from '@tiptap/extension-text-style'
import Link from '@tiptap/extension-link'
import { Info, AlertTriangle, CheckCircle, Lightbulb, AlertCircle } from 'lucide-react'

// ── TipTap JSON → HTML ─────────────────────────────────────────────────────────

const READER_EXTENSIONS = [StarterKit, TextStyle, Color, Link]

function renderTipTapHTML(content_json) {
  if (!content_json || content_json.type !== 'doc') return null
  try {
    return generateHTML(content_json, READER_EXTENSIONS)
  } catch {
    return null
  }
}

// ── Callout icon map ───────────────────────────────────────────────────────────

const CALLOUT_ICONS = { Info, AlertTriangle, CheckCircle, Lightbulb, AlertCircle }

// ── Prose wrapper (TipTap HTML or legacy plain text) ──────────────────────────

const PROSE_CLASSES =
  '[&_p]:leading-7 [&_strong]:font-semibold [&_em]:italic [&_u]:underline [&_s]:line-through [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:font-mono [&_code]:text-sm [&_a]:underline [&_a]:text-blue-600 [&_a]:hover:text-blue-800 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1'

function ProseContent({ html, fallbackText, className = '' }) {
  if (html) {
    return (
      <div
        className={`${PROSE_CLASSES} ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }
  if (fallbackText) return <span className={className}>{fallbackText}</span>
  return null
}

// ── Block renderer ─────────────────────────────────────────────────────────────

function ReaderBlock({ block }) {
  const blockStyle = {
    color: block?.text_color || undefined,
    backgroundColor: block?.background_color || undefined,
  }

  const contentHtml = renderTipTapHTML(block?.content_json)
  // Legacy fallback for blocks that stored { text: '...' } before Phase 5
  const fallbackText = block?.content_json?.text ?? ''

  // Headings ──────────────────────────────────────────────────────────────────

  if (block?.block_type === 'heading_1') {
    return (
      <h1 className="text-3xl font-bold text-slate-900" style={blockStyle}>
        <ProseContent html={contentHtml} fallbackText={fallbackText} />
      </h1>
    )
  }

  if (block?.block_type === 'heading_2') {
    return (
      <h2 className="text-2xl font-semibold text-slate-900" style={blockStyle}>
        <ProseContent html={contentHtml} fallbackText={fallbackText} />
      </h2>
    )
  }

  if (block?.block_type === 'heading_3') {
    return (
      <h3 className="text-xl font-semibold text-slate-900" style={blockStyle}>
        <ProseContent html={contentHtml} fallbackText={fallbackText} />
      </h3>
    )
  }

  // Paragraph ─────────────────────────────────────────────────────────────────

  if (block?.block_type === 'paragraph') {
    return (
      <div className="leading-7 text-slate-700" style={blockStyle}>
        <ProseContent html={contentHtml} fallbackText={fallbackText} />
      </div>
    )
  }

  // Lists ─────────────────────────────────────────────────────────────────────

  if (block?.block_type === 'bulleted_list') {
    if (contentHtml) {
      return (
        <div
          className="text-slate-700 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1"
          style={blockStyle}
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      )
    }
    return (
      <ul className="list-disc space-y-1 pl-6 text-slate-700" style={blockStyle}>
        {fallbackText && <li>{fallbackText}</li>}
      </ul>
    )
  }

  if (block?.block_type === 'numbered_list') {
    if (contentHtml) {
      return (
        <div
          className="text-slate-700 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1"
          style={blockStyle}
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      )
    }
    return (
      <ol className="list-decimal space-y-1 pl-6 text-slate-700" style={blockStyle}>
        {fallbackText && <li>{fallbackText}</li>}
      </ol>
    )
  }

  // Callout ───────────────────────────────────────────────────────────────────

  if (block?.block_type === 'callout') {
    const iconName = block?.metadata_json?.icon ?? 'Info'
    const Icon = CALLOUT_ICONS[iconName] ?? Info

    return (
      <div
        className="rounded-lg border border-blue-200 border-l-4 border-l-blue-500 bg-blue-50 px-4 py-3"
        style={blockStyle}
      >
        <div className="mb-1 flex items-center gap-2">
          <Icon className="size-4 shrink-0 text-blue-600" />
        </div>
        <div className="text-sm text-blue-900">
          <ProseContent html={contentHtml} fallbackText={fallbackText} />
        </div>
      </div>
    )
  }

  // Divider ───────────────────────────────────────────────────────────────────

  if (block?.block_type === 'divider') {
    return <hr className="border-slate-200" />
  }

  // Media ─────────────────────────────────────────────────────────────────────

  if (block?.block_type === 'media') {
    return (
      <div className="space-y-2" style={blockStyle}>
        {block?.file_url && (
          <img
            src={block.file_url}
            alt="Manual media"
            className="max-w-full rounded-lg"
          />
        )}
        {contentHtml && (
          <p className="text-center text-sm text-slate-500">
            <ProseContent html={contentHtml} />
          </p>
        )}
      </div>
    )
  }

  // Generic fallback ──────────────────────────────────────────────────────────

  return (
    <div className="leading-7 text-slate-700" style={blockStyle}>
      <ProseContent html={contentHtml} fallbackText={fallbackText} />
    </div>
  )
}

export default ReaderBlock
