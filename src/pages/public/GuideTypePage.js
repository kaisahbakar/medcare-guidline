import { ChevronRight, FolderOpen, RefreshCw } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useCategoriesByGuideType } from '../../lib/queries/useCategories'
import { useGuideType } from '../../lib/queries/useGuideTypes'
import { useAllManuals } from '../../lib/queries/useManuals'
import { CardSkeleton } from '../../components/ui/Skeleton'

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
    // category_id may be int4 in DB; categoryId from the row object may differ in type
    // eslint-disable-next-line eqeqeq
    return allManualsQuery.data.filter(
      (m) => m.category_id == categoryId && m.status === 'published',
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
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          <p className="font-medium">Failed to load categories</p>
          <p className="mt-0.5 text-red-600">{error?.message || 'Unknown error'}</p>
          <button
            onClick={() => {
              guideTypeQuery.refetch()
              categoriesQuery.refetch()
            }}
            className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-700 underline hover:text-red-900"
          >
            <RefreshCw className="size-3" />
            Try again
          </button>
        </div>
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
        <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-slate-100">
            <FolderOpen className="size-6 text-slate-400" />
          </div>
          <p className="text-sm text-slate-500">No categories in this guide type yet.</p>
        </div>
      )}

      {/* Cards */}
      {!isLoading && !isError && (categoriesQuery.data?.length ?? 0) > 0 && (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categoriesQuery.data.map((category) => (
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
                {getPublishedManualCount(category.id)} published manual
                {getPublishedManualCount(category.id) !== 1 ? 's' : ''}
              </p>
            </Link>
          ))}
        </section>
      )}
    </main>
  )
}

export default GuideTypePage
