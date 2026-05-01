import { useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { ImageIcon, Upload, X } from 'lucide-react'
import clsx from 'clsx'
import { supabase } from '../../../lib/supabase'
import { MANUAL_MEDIA_BUCKET } from '../../../lib/storage'

function MediaBlock({ block, onUpdate }) {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  const captionInitial = block.content_json?.type === 'doc'
    ? block.content_json
    : { type: 'doc', content: [{ type: 'paragraph' }] }

  const captionEditor = useEditor({
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
      Placeholder.configure({ placeholder: 'Add a caption…' }),
    ],
    content: captionInitial,
    onBlur: ({ editor }) => {
      onUpdate({ content_json: editor.getJSON() })
    },
  })

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadError(null)

    try {
      if (!supabase) {
        throw new Error('Supabase is not configured.')
      }

      const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from(MANUAL_MEDIA_BUCKET)
        .upload(path, file, { upsert: true })

      if (uploadErr) {
        if (uploadErr.message?.includes('Bucket not found')) {
          throw new Error(
            `Storage bucket "${MANUAL_MEDIA_BUCKET}" does not exist. In Supabase: create a public bucket with that id, or set VITE_SUPABASE_MANUAL_MEDIA_BUCKET in .env. Run supabase/storage-manual-media.sql for a ready-made setup.`,
          )
        }
        throw uploadErr
      }

      const { data: urlData } = supabase.storage
        .from(MANUAL_MEDIA_BUCKET)
        .getPublicUrl(uploadData.path)

      onUpdate({ file_url: urlData.publicUrl })
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
      // Reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleRemoveImage() {
    onUpdate({ file_url: null })
  }

  return (
    <div className="space-y-2">
      {block.file_url ? (
        <div className="group relative">
          <img
            src={block.file_url}
            alt="Manual media"
            className="max-w-full rounded-lg"
          />
          <button
            onClick={handleRemoveImage}
            className="absolute right-2 top-2 hidden rounded-full bg-black/60 p-1 text-white hover:bg-black/80 group-hover:flex"
            title="Remove image"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 py-8 text-slate-400 transition hover:border-slate-400 hover:text-slate-600 disabled:opacity-60"
        >
          {uploading ? (
            <>
              <Upload className="size-5 animate-pulse" />
              <span className="text-sm">Uploading…</span>
            </>
          ) : (
            <>
              <ImageIcon className="size-5" />
              <span className="text-sm">Click to upload image</span>
              <span className="text-xs text-slate-300">PNG, JPG, GIF, WEBP</span>
            </>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {uploadError && (
        <p className="text-xs text-red-500">{uploadError}</p>
      )}

      <EditorContent
        editor={captionEditor}
        className={clsx(
          'text-sm [&_.ProseMirror]:outline-none',
          block.text_color ? 'text-inherit' : 'text-slate-500',
        )}
      />
    </div>
  )
}

export default MediaBlock
