import { useManualContent } from '../../lib/queries/useManualEditor'
import ReaderBlock from './ReaderBlock'
import {
  gridTemplateColumnsFromFractions,
  normalizeColumnFractions,
} from '../../utils/columnWidths'

function ManualReader({ manualId }) {
  const { data, isLoading, isError, error } = useManualContent(manualId)

  if (isLoading) {
    return (
      <article className="w-full space-y-6 rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="space-y-3 border-b border-slate-100 pb-6">
          <div className="h-8 w-2/3 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`h-4 animate-pulse rounded bg-slate-100 ${i === 4 ? 'w-3/5' : 'w-full'}`}
            />
          ))}
        </div>
      </article>
    )
  }

  if (isError) {
    return (
      <article className="w-full rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        <p className="font-medium">Failed to load manual content</p>
        <p className="mt-0.5 text-red-600">{error?.message || 'Unknown error'}</p>
      </article>
    )
  }

  if (!data?.manual) {
    return (
      <article className="w-full rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Manual not found.
      </article>
    )
  }

  return (
    <article className="w-full space-y-8 rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
      <header className="space-y-2 border-b border-slate-100 pb-6">
        <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
          {data.manual.title}
        </h1>
        {data.manual.summary && (
          <p className="text-base leading-7 text-slate-500">{data.manual.summary}</p>
        )}
      </header>

      {data.rows.length === 0 ? (
        <p className="text-sm text-slate-400">This manual has no content yet.</p>
      ) : (
        data.rows.map((row) => (
          <section
            key={row.id}
            className="grid gap-6"
            style={{
              gridTemplateColumns: gridTemplateColumnsFromFractions(
                normalizeColumnFractions(row.column_width_fr, row.column_count),
              ),
            }}
          >
            {row.columns.map((column) => (
              <div key={`${row.id}-${column.index}`} className="space-y-4">
                {column.blocks.map((block) => (
                  <ReaderBlock key={block.id} block={block} />
                ))}
              </div>
            ))}
          </section>
        ))
      )}
    </article>
  )
}

export default ManualReader
