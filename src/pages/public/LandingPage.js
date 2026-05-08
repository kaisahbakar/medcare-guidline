import { MdMenuBook, MdChevronRight } from 'react-icons/md'
import { Link } from 'react-router-dom'
import { useGuideTypes } from '../../lib/queries/useGuideTypes'
import { useAllCategories } from '../../lib/queries/useCategories'
import { CardSkeleton } from '../../components/ui/Skeleton'
import ErrorCard from '../../components/ui/ErrorCard'
import EmptyState from '../../components/ui/EmptyState'

function LandingPage() {
  const { data, isLoading, isError, error, refetch } = useGuideTypes()
  const allCategoriesQuery = useAllCategories()

  function getCategoryCount(guideTypeId) {
    if (!Array.isArray(allCategoriesQuery.data)) return 0
    return allCategoriesQuery.data.filter((c) => String(c.guide_type_id) === String(guideTypeId)).length
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
        <ErrorCard
          title="Failed to load guide types"
          message={error?.message}
          onRetry={refetch}
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
      {!isLoading && !isError && (!data || data.length === 0) && (
        <EmptyState icon={MdMenuBook} message="No guide types available yet." />
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
                <MdChevronRight className="mt-0.5 size-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-600" />
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
