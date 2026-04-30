import { ChevronRight } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useCategory } from '../../lib/queries/useCategories'
import { usePublishedManualsByCategory } from '../../lib/queries/useManuals'

function CategoryPage() {
  const { id } = useParams()
  const categoryQuery = useCategory(id)
  const manualsQuery = usePublishedManualsByCategory(id)

  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 px-6 py-12">
      <header className="space-y-3">
        <p className="text-sm text-slate-500">Category</p>
        <h1 className="text-3xl font-bold text-slate-900">
          {categoryQuery.data?.name || 'Category'}
        </h1>
        <p className="text-slate-600">Select a published manual to open the reader.</p>
      </header>

      {categoryQuery.isLoading || manualsQuery.isLoading ? (
        <p className="text-slate-600">Loading manuals...</p>
      ) : null}

      {categoryQuery.isError || manualsQuery.isError ? (
        <p className="text-slate-600">
          Failed to load data:{' '}
          {categoryQuery.error?.message || manualsQuery.error?.message || 'Unknown error'}
        </p>
      ) : null}

      {!categoryQuery.isLoading &&
      !manualsQuery.isLoading &&
      !categoryQuery.isError &&
      !manualsQuery.isError &&
      (manualsQuery.data?.length ?? 0) === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">
          No manual exists yet in this category.
        </div>
      ) : null}

      <section className="space-y-3">
        {manualsQuery.data?.map((manual) => (
          <Link
            key={manual.id}
            to={`/manual/${manual.id}`}
            className="group flex items-center justify-between rounded-lg border border-slate-200 bg-white px-5 py-4 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <div>
              <p className="font-medium text-slate-900">{manual.title}</p>
              <p className="text-sm text-slate-600">{manual.summary || '-'}</p>
            </div>
            <ChevronRight className="size-4 text-slate-500 transition group-hover:translate-x-0.5" />
          </Link>
        ))}
      </section>
    </main>
  )
}

export default CategoryPage
