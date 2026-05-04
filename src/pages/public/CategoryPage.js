import { BookOpen, ChevronRight, RefreshCw } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useCategory } from '../../lib/queries/useCategories'
import { usePublishedManualsByCategory } from '../../lib/queries/useManuals'
import { ListItemSkeleton } from '../../components/ui/Skeleton'

function CategoryPage() {
  const { id } = useParams()
  const categoryQuery = useCategory(id)
  const manualsQuery = usePublishedManualsByCategory(id)

  const isLoading = categoryQuery.isLoading || manualsQuery.isLoading
  const isError = categoryQuery.isError || manualsQuery.isError
  const error = categoryQuery.error || manualsQuery.error

  return (
    <main className="mx-auto w-full max-w-3xl space-y-10 px-4 py-12 sm:px-6 animate-fade-in">
      <header className="space-y-1.5">
        <Link
          to={-1}
          className="text-xs font-medium text-slate-400 hover:text-slate-600"
        >
          ← Back
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {categoryQuery.data?.name ?? (isLoading ? '' : 'Category')}
        </h1>
        <p className="text-base text-slate-500">
          Select a manual to start reading.
        </p>
      </header>

      {/* Error */}
      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          <p className="font-medium">Failed to load manuals</p>
          <p className="mt-0.5 text-red-600">{error?.message || 'Unknown error'}</p>
          <button
            onClick={() => { categoryQuery.refetch(); manualsQuery.refetch() }}
            className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-700 underline hover:text-red-900"
          >
            <RefreshCw className="size-3" />
            Try again
          </button>
        </div>
      )}

      {/* Skeletons */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ListItemSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && (manualsQuery.data?.length ?? 0) === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-slate-100">
            <BookOpen className="size-6 text-slate-400" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-700">No published manuals yet</p>
            <p className="text-sm text-slate-400">Check back soon or try another category.</p>
          </div>
        </div>
      )}

      {/* List */}
      {!isLoading && !isError && (manualsQuery.data?.length ?? 0) > 0 && (
        <section className="space-y-3">
          {manualsQuery.data.map((manual) => (
            <Link
              key={manual.id}
              to={`/manual/${manual.id}`}
              className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition duration-200 hover:border-slate-300 hover:shadow-md"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 group-hover:text-slate-700">
                  {manual.title}
                </p>
                {manual.summary && (
                  <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-slate-500">
                    {manual.summary}
                  </p>
                )}
              </div>
              <ChevronRight className="ml-4 size-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-600" />
            </Link>
          ))}
        </section>
      )}
    </main>
  )
}

export default CategoryPage
