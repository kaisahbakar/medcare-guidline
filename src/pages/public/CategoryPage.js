import { MdMenuBook, MdChevronRight } from 'react-icons/md'
import { Link, useParams } from 'react-router-dom'
import { useCategory } from '../../lib/queries/useCategories'
import { usePublishedManualsByCategory } from '../../lib/queries/useManuals'
import { ListItemSkeleton } from '../../components/ui/Skeleton'
import ErrorCard from '../../components/ui/ErrorCard'
import EmptyState from '../../components/ui/EmptyState'

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
        <ErrorCard
          title="Failed to load manuals"
          message={error?.message}
          onRetry={() => { categoryQuery.refetch(); manualsQuery.refetch() }}
        />
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
        <EmptyState
          icon={MdMenuBook}
          title="No published manuals yet"
          message="Check back soon or try another category."
        />
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
              <MdChevronRight className="ml-4 size-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-600" />
            </Link>
          ))}
        </section>
      )}
    </main>
  )
}

export default CategoryPage
