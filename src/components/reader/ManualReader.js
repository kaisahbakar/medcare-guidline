import { useManualContent } from '../../lib/queries/useManualEditor'
import ReaderBlock from './ReaderBlock'

function ManualReader({ manualId }) {
  const { data, isLoading, isError, error } = useManualContent(manualId)

  if (isLoading) {
    return <p className="text-slate-600">Loading manual...</p>
  }

  if (isError) {
    return (
      <p className="text-slate-600">
        Failed to load manual: {error?.message || 'Unknown error'}
      </p>
    )
  }

  if (!data?.manual) {
    return <p className="text-slate-600">Manual not found.</p>
  }

  return (
    <article className="mx-auto w-full max-w-4xl space-y-8 rounded-lg bg-white p-8">
      <header className="space-y-3 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold text-slate-900">{data.manual.title}</h1>
        {data.manual.summary ? (
          <p className="text-lg text-slate-600">{data.manual.summary}</p>
        ) : null}
      </header>

      {data.rows.length === 0 ? (
        <p className="text-slate-600">This manual does not have content yet.</p>
      ) : (
        data.rows.map((row) => (
          <section
            key={row.id}
            className="grid gap-6"
            style={{
              gridTemplateColumns: `repeat(${row.column_count}, minmax(0, 1fr))`,
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
