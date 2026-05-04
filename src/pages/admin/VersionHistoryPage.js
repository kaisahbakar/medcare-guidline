import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Eye, RotateCcw, X } from 'lucide-react'
import { toast } from 'sonner'
import { useManVersions, useManVersionSnapshot, useRestoreVersion } from '../../lib/queries/useManualVersions'
import { Button } from '../../components/ui/Button'
import ReaderBlock from '../../components/reader/ReaderBlock'
import {
  gridTemplateColumnsFromFractions,
  normalizeColumnFractions,
} from '../../utils/columnWidths'

// ── Snapshot preview modal ────────────────────────────────────────────────────

function SnapshotPreviewModal({ versionId, versionNumber, onClose }) {
  const { data: version, isError, error, fetchStatus, isFetched } =
    useManVersionSnapshot(versionId)
  const snapshotLoading = fetchStatus === 'fetching' && !isFetched

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="relative w-full max-w-4xl rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            Preview — v{versionNumber}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          {snapshotLoading && (
            <p className="text-sm text-slate-400">Loading snapshot…</p>
          )}
          {isError && (
            <p className="text-sm text-red-500">
              Failed to load snapshot.{error?.message ? ` ${error.message}` : ''}
            </p>
          )}
          {version?.content_snapshot && (
            <SnapshotRenderer snapshot={version.content_snapshot} />
          )}
          {version && !version.content_snapshot && (
            <p className="text-sm text-slate-400">
              This version was created before snapshot storage was added.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function SnapshotRenderer({ snapshot }) {
  if (!snapshot?.rows?.length) {
    return <p className="text-sm text-slate-400">This version has no content.</p>
  }

  return (
    <div className="space-y-8">
      {snapshot.rows.map((row, rowIdx) => (
        <section
          key={rowIdx}
          className="grid gap-6"
          style={{
            gridTemplateColumns: gridTemplateColumnsFromFractions(
              normalizeColumnFractions(row.column_width_fr, row.column_count),
            ),
          }}
        >
          {row.columns.map((col) => (
            <div key={col.column_index} className="space-y-4">
              {col.blocks.map((block, blockIdx) => (
                <ReaderBlock key={blockIdx} block={block} />
              ))}
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}

// ── Restore confirmation modal ────────────────────────────────────────────────

function RestoreConfirmModal({ versionNumber, onConfirm, onCancel, isPending }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-base font-semibold text-slate-900">Restore v{versionNumber}?</h2>
        <p className="mt-2 text-sm text-slate-600">
          This will replace the current draft with v{versionNumber}. You can republish
          afterwards to make it live. This action cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button size="sm" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Restoring…' : 'Restore'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Version History Page ──────────────────────────────────────────────────────

function VersionHistoryPage() {
  const { id: manualId } = useParams()
  const navigate = useNavigate()
  const { data: versions, isError, error, fetchStatus, isFetched } = useManVersions(manualId)
  const listLoading = Boolean(manualId) && fetchStatus === 'fetching' && !isFetched
  const restoreVersion = useRestoreVersion(manualId)

  const [previewVersionId, setPreviewVersionId] = useState(null)
  const [previewVersionNumber, setPreviewVersionNumber] = useState(null)
  const [restoreTarget, setRestoreTarget] = useState(null) // { id, version_number }

  function openPreview(version) {
    setPreviewVersionId(version.id)
    setPreviewVersionNumber(version.version_number)
  }

  function openRestore(version) {
    setRestoreTarget(version)
  }

  function handleRestore() {
    if (!restoreTarget) return
    restoreVersion.mutate(
      { versionId: restoreTarget.id },
      {
        onSuccess: () => {
          toast.success(`Restored v${restoreTarget.version_number}. Draft ready to edit.`)
          navigate(`/admin/manuals/${manualId}/edit`)
        },
        onError: (err) => {
          toast.error(`Restore failed: ${err.message}`)
        },
      },
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-6 py-3">
          <Link
            to={`/admin/manuals/${manualId}/edit`}
            className="flex shrink-0 items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="size-3.5" />
            Back to Editor
          </Link>
          <h1 className="text-base font-semibold text-slate-900">Version History</h1>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-6 py-8">
        {!manualId && (
          <p className="text-sm text-amber-700">Missing manual id in the URL.</p>
        )}
        {listLoading && (
          <p className="text-sm text-slate-400">Loading versions…</p>
        )}
        {isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <p className="font-medium">Could not load version history</p>
            {error?.message ? (
              <p className="mt-1 text-red-700">{error.message}</p>
            ) : (
              <p className="mt-1 text-red-700">Check the browser network tab and Supabase logs.</p>
            )}
            <p className="mt-2 text-xs text-red-600/90">
              Common causes: missing <code className="rounded bg-red-100 px-1">manual_version</code>{' '}
              table, RLS blocking reads, or invalid env keys.
            </p>
          </div>
        )}
        {versions && versions.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
            <p className="text-sm text-slate-400">No versions published yet.</p>
          </div>
        )}
        {versions && versions.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {versions.map((version, idx) => (
              <VersionRow
                key={version.id}
                version={version}
                isLast={idx === versions.length - 1}
                onPreview={() => openPreview(version)}
                onRestore={() => openRestore(version)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {previewVersionId && (
        <SnapshotPreviewModal
          versionId={previewVersionId}
          versionNumber={previewVersionNumber}
          onClose={() => {
            setPreviewVersionId(null)
            setPreviewVersionNumber(null)
          }}
        />
      )}
      {restoreTarget && (
        <RestoreConfirmModal
          versionNumber={restoreTarget.version_number}
          onConfirm={handleRestore}
          onCancel={() => setRestoreTarget(null)}
          isPending={restoreVersion.isPending}
        />
      )}
    </div>
  )
}

function VersionRow({ version, isLast, onPreview, onRestore }) {
  const formatted = version.updated_at
    ? new Date(version.updated_at).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null

  return (
    <div
      className={`flex items-center justify-between px-5 py-4 ${
        !isLast ? 'border-b border-slate-100' : ''
      }`}
    >
      <span className="text-sm font-medium text-slate-800">
        v{version.version_number}
        {formatted ? (
          <span className="ml-2 font-normal text-slate-500">· Updated {formatted}</span>
        ) : (
          <span className="ml-2 font-normal text-slate-500">· No date</span>
        )}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={onPreview}>
          <Eye className="size-3.5" />
          Preview
        </Button>
        <Button variant="secondary" size="sm" onClick={onRestore}>
          <RotateCcw className="size-3.5" />
          Restore
        </Button>
      </div>
    </div>
  )
}

export default VersionHistoryPage
