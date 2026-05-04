import { ChevronRight, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useGuideTypes } from '../../lib/queries/useGuideTypes'
import { useAllCategories } from '../../lib/queries/useCategories'
import { CardSkeleton } from '../../components/ui/Skeleton'

function LandingPage() {
  const { data, isLoading, isError, error, refetch } = useGuideTypes()
  const allCategoriesQuery = useAllCategories()

  function getCategoryCount(guideTypeId) {
    if (!Array.isArray(allCategoriesQuery.data)) return 0
    return allCategoriesQuery.data.filter((c) => c.guide_type_id === guideTypeId).length
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-10 px-4 py-12 sm:px-6 animate-fade-in">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          MedCare User Manuals
        </h1>
        <p className="text-base text-slate-500">
          Browse guides by role to find the information you need.
        </p>
      </header>

      {/* Error */}
      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          <p className="font-medium">Failed to load guide types</p>
          <p className="mt-0.5 text-red-600">{error?.message || 'Unknown error'}</p>
          <button
            onClick={() => refetch()}
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
      {!isLoading && !isError && (!data || data.length === 0) && (
        <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-slate-100">
            <svg className="size-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-sm text-slate-500">No guide types available yet.</p>
        </div>
      )}

      {/* Cards */}
      {!isLoading && !isError && data && data.length > 0 && (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((guideType) => (
            <Link
              key={guideType.id}
              to={`/guide-type/${guideType.id}`}
              className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex flex-1 items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <h2 className="text-base font-semibold text-slate-900 group-hover:text-slate-700">
                    {guideType.name}
                  </h2>
                  {guideType.description && (
                    <p className="text-sm leading-relaxed text-slate-500">
                      {guideType.description}
                    </p>
                  )}
                </div>
                <ChevronRight className="mt-0.5 size-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-600" />
              </div>
              <p className="mt-4 text-xs font-medium text-slate-400">
                {getCategoryCount(guideType.id)} categories
              </p>
            </Link>
          ))}
        </section>
      )}
    </main>
  )
}

export default LandingPage
