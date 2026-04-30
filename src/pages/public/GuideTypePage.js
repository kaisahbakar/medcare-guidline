import { ChevronRight } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useCategoriesByGuideType } from '../../lib/queries/useCategories'
import { useGuideType } from '../../lib/queries/useGuideTypes'
import { useAllManuals } from '../../lib/queries/useManuals'

function GuideTypePage() {
  const { id } = useParams()
  const guideTypeQuery = useGuideType(id)
  const categoriesQuery = useCategoriesByGuideType(id)
  const allManualsQuery = useAllManuals()

  function getPublishedManualCount(categoryId) {
    if (!Array.isArray(allManualsQuery.data)) return 0

    return allManualsQuery.data.filter(
      (manual) => manual.category_id === categoryId && manual.status === 'published',
    ).length
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 px-6 py-12">
      <header className="space-y-3">
        <p className="text-sm text-slate-500">Guide Type</p>
        <h1 className="text-3xl font-bold text-slate-900">
          {guideTypeQuery.data?.name || 'Guide Type'}
        </h1>
        <p className="text-slate-600">
          {guideTypeQuery.data?.description || 'Select a category to continue.'}
        </p>
      </header>

      {guideTypeQuery.isLoading || categoriesQuery.isLoading ? (
        <p className="text-slate-600">Loading categories...</p>
      ) : null}

      {guideTypeQuery.isError || categoriesQuery.isError ? (
        <p className="text-slate-600">
          Failed to load data:{' '}
          {guideTypeQuery.error?.message ||
            categoriesQuery.error?.message ||
            'Unknown error'}
        </p>
      ) : null}

      {!guideTypeQuery.isLoading &&
      !categoriesQuery.isLoading &&
      !guideTypeQuery.isError &&
      !categoriesQuery.isError &&
      (categoriesQuery.data?.length ?? 0) === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">
          No category exists yet for this guide type.
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {categoriesQuery.data?.map((category) => (
          <Link
            key={category.id}
            to={`/category/${category.id}`}
            className="group rounded-lg border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-slate-900">{category.name}</h2>
                <p className="text-sm text-slate-600">{category.description || '-'}</p>
                <p className="text-xs font-medium text-slate-500">
                  {getPublishedManualCount(category.id)} published manuals
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

export default GuideTypePage
