import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useGuideTypes } from '../../lib/queries/useGuideTypes'
import { useAllCategories } from '../../lib/queries/useCategories'

function LandingPage() {
  const { data, isLoading, isError, error } = useGuideTypes()
  const allCategoriesQuery = useAllCategories()
  const hasGuideTypes = Array.isArray(data) && data.length > 0

  function getCategoryCountForGuideType(guideTypeId) {
    if (!Array.isArray(allCategoriesQuery.data)) return 0

    return allCategoriesQuery.data.filter((category) => {
      return category.guide_type_id === guideTypeId
    }).length
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 px-6 py-12">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold text-slate-900">MedCare User Manuals</h1>
        <p className="text-slate-600">Choose a guide type to browse available manuals.</p>
      </header>

      {isLoading ? <p className="text-slate-600">Loading guide types...</p> : null}
      {isError ? (
        <p className="text-slate-600">
          Failed to load guide types: {error?.message || 'Unknown error'}
        </p>
      ) : null}

      {!isLoading && !isError && !hasGuideTypes ? (
        <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">
          No guide types are visible to the current client. If data exists in Supabase,
          check Row Level Security policies for anon/public read access on
          <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5">user_guide_type</code>.
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {data?.map((guideType) => (
          <Link
            key={guideType.id}
            to={`/guide-type/${guideType.id}`}
            className="group rounded-lg border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-slate-900">{guideType.name}</h2>
                <p className="text-sm text-slate-600">{guideType.description || '-'}</p>
                <p className="text-xs font-medium text-slate-500">
                  {getCategoryCountForGuideType(guideType.id)} categories
                </p>
              </div>
              <ChevronRight className="mt-1 size-4 text-slate-500 transition group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </section>
    </main>
  )
}

export default LandingPage
