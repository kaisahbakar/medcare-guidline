import { NavLink } from 'react-router-dom'
import { usePublishedManualsByCategory } from '../../lib/queries/useManuals'

function ReaderSidebar({ categoryId, manualId }) {
  const { data, isLoading, isError, error } = usePublishedManualsByCategory(categoryId)

  if (isLoading) {
    return <p className="text-sm text-slate-600">Loading manuals...</p>
  }

  if (isError) {
    return (
      <p className="text-sm text-slate-600">
        Failed to load manuals: {error?.message || 'Unknown error'}
      </p>
    )
  }

  return (
    <aside className="sticky top-6 h-fit rounded-lg border border-slate-200 bg-white p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Manuals
      </p>
      <nav className="flex flex-col gap-1">
        {(data?.length ?? 0) === 0 ? (
          <p className="px-1 py-2 text-sm text-slate-600">No manual exists yet.</p>
        ) : null}
        {data?.map((manual) => (
          <NavLink
            key={manual.id}
            to={`/manual/${manual.id}`}
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-sm transition ${
                isActive || manual.id === manualId
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`
            }
          >
            {manual.title}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default ReaderSidebar
