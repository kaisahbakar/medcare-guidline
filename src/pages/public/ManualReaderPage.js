import { useParams, useNavigate, Link } from 'react-router-dom'
import ManualReader from '../../components/reader/ManualReader'
import ReaderSidebar from '../../components/reader/ReaderSidebar'
import { useManual } from '../../lib/queries/useManuals'
import { TextSkeleton } from '../../components/ui/Skeleton'
import { ArrowLeft, RefreshCw } from 'lucide-react'

function ManualReaderPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const manualQuery = useManual(id)

  if (manualQuery.isLoading) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 animate-fade-in">
        <div className="flex flex-col gap-8 md:flex-row">
          {/* Sidebar skeleton */}
          <div className="w-full shrink-0 md:w-56">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 h-3 w-16 animate-pulse rounded bg-slate-200" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-8 animate-pulse rounded-lg bg-slate-100" />
                ))}
              </div>
            </div>
          </div>
          {/* Content skeleton */}
          <div className="flex-1 rounded-xl border border-slate-200 bg-white p-8">
            <div className="mb-4 h-8 w-2/3 animate-pulse rounded-lg bg-slate-200" />
            <div className="mb-8 h-4 w-1/2 animate-pulse rounded bg-slate-100" />
            <TextSkeleton lines={6} />
          </div>
        </div>
      </main>
    )
  }

  if (manualQuery.isError || !manualQuery.data) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 animate-fade-in">
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          <p className="font-medium">Failed to load manual</p>
          <p className="mt-0.5 text-red-600">
            {manualQuery.error?.message || 'Manual not found'}
          </p>
          <button
            onClick={() => manualQuery.refetch()}
            className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-700 underline hover:text-red-900"
          >
            <RefreshCw className="size-3" />
            Try again
          </button>
        </div>
      </main>
    )
  }

  const categoryId = manualQuery.data.category_id

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 animate-fade-in">
      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800"
        >
          <ArrowLeft className="size-4 shrink-0" />
          Back
        </button>
        {categoryId != null && categoryId !== '' && (
          <Link
            to={`/category/${categoryId}`}
            className="text-sm font-medium text-slate-500 transition hover:text-slate-800"
          >
            Category
          </Link>
        )}
        <Link
          to="/"
          className="text-sm font-medium text-slate-500 transition hover:text-slate-800"
        >
          Home
        </Link>
      </div>
      <div className="flex flex-col gap-6 md:flex-row md:gap-8">
        <ReaderSidebar
          categoryId={manualQuery.data.category_id}
          manualId={id}
        />
        <div className="min-w-0 flex-1">
          <ManualReader manualId={id} />
        </div>
      </div>
    </main>
  )
}

export default ManualReaderPage
