import { ChevronRight, FolderOpen } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useCategoriesByGuideType } from '../../lib/queries/useCategories'
import { useGuideType } from '../../lib/queries/useGuideTypes'
import { useAllManuals } from '../../lib/queries/useManuals'
import { CardSkeleton } from '../../components/ui/Skeleton'
import ErrorCard from '../../components/ui/ErrorCard'
import EmptyState from '../../components/ui/EmptyState'

function GuideTypePage() {
  const { id } = useParams()
  const guideTypeQuery = useGuideType(id)
  const categoriesQuery = useCategoriesByGuideType(id)
  const allManualsQuery = useAllManuals()

  const isLoading = guideTypeQuery.isLoading || categoriesQuery.isLoading
  const isError = guideTypeQuery.isError || categoriesQuery.isError
  const error = guideTypeQuery.error || categoriesQuery.error

  function getPublishedManualCount(categoryId) {
    if (!Array.isArray(allManualsQuery.data)) return 0
    return allManualsQuery.data.filter(
      (m) => String(m.category_id) === String(categoryId) && m.status === 'published',
    ).length
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-10 px-4 py-12 sm:px-6 animate-fade-in">
      <header className="space-y-1.5">
        <Link
          to="/"
          className="text-xs font-medium text-slate-400 hover:text-slate-600"
        >
          ← All guide types
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {guideTypeQuery.data?.name ?? (isLoading ? '' : 'Guide Type')}
        </h1>
        {guideTypeQuery.data?.description && (
          <p className="text-base text-slate-500">{guideTypeQuery.data.description}</p>
        )}
      </header>

      {/* Error */}
      {isError && (
        <ErrorCard
          title="Failed to load categories"
          message={error?.message}
          onRetry={() => { guideTypeQuery.refetch(); categoriesQuery.refetch() }}
        />
      )}

      {/* Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && (categoriesQuery.data?.length ?? 0) === 0 && (
        <EmptyState icon={FolderOpen} message="No categories in this guide type yet." />
      )}

      {/* Cards */}
      {!isLoading && !isError && (categoriesQuery.data?.length ?? 0) > 0 && (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categoriesQuery.data.map((category) => {
            const count = getPublishedManualCount(category.id)
            return (
              <Link
                key={category.id}
                to={`/category/${category.id}`}
                className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex flex-1 items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <h2 className="text-base font-semibold text-slate-900 group-hover:text-slate-700">
                      {category.name}
                    </h2>
                    {category.description && (
                      <p className="text-sm leading-relaxed text-slate-500">
                        {category.description}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="mt-0.5 size-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-600" />
                </div>
                <p className="mt-4 text-xs font-medium text-slate-400">
                  {count} published manual{count !== 1 ? 's' : ''}
                </p>
              </Link>
            )
          })}
        </section>
      )}
    </main>
  )
}

export default GuideTypePage
