import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Search } from 'lucide-react'
import { useManualSearch } from '../../lib/queries/useManualSearch'
import { ListItemSkeleton } from '../../components/ui/Skeleton'
import ErrorCard from '../../components/ui/ErrorCard'
import EmptyState from '../../components/ui/EmptyState'

// Wrap matches in <mark> without dangerouslySetInnerHTML
function Highlight({ text, query }) {
  if (!text || !query) return <>{text}</>
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = text.split(regex)
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="rounded-sm bg-yellow-100 px-0.5 text-yellow-900">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  )
}

function SearchResultsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const { data, isLoading, isError, error, refetch } = useManualSearch(q)

  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 px-4 py-10 sm:px-6 animate-fade-in">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800"
          >
            <ArrowLeft className="size-4 shrink-0" />
            Back
          </button>
          <Link
            to="/"
            className="text-sm font-medium text-slate-500 transition hover:text-slate-800"
          >
            Home
          </Link>
        </div>
        <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Search results
        </p>
        <h1 className="text-2xl font-bold text-slate-900">
          {q ? (
            <>
              Results for{' '}
              <span className="text-slate-600">&ldquo;{q}&rdquo;</span>
            </>
          ) : (
            'Search manuals'
          )}
        </h1>
        </div>
      </header>

      {/* No query */}
      {!q && (
        <EmptyState icon={Search} message="Enter a search term in the bar above to find manuals." />
      )}

      {/* Loading */}
      {isLoading && q && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <ListItemSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <ErrorCard title="Search failed" message={error?.message} onRetry={refetch} />
      )}

      {/* Empty */}
      {!isLoading && !isError && q && data?.length === 0 && (
        <EmptyState
          icon={Search}
          title={`No manuals matched "${q}"`}
          message="Try different or fewer keywords."
        >
          <Link
            to="/"
            className="text-sm font-medium text-slate-700 underline hover:text-slate-900"
          >
            Browse all guide types
          </Link>
        </EmptyState>
      )}

      {/* Results */}
      {!isLoading && !isError && data && data.length > 0 && (
        <>
          <p className="text-xs text-slate-400">
            {data.length} result{data.length !== 1 ? 's' : ''}
          </p>
          <section className="space-y-3">
            {data.map((manual) => {
              const guideName = manual.category?.guide_type?.name
              const catName = manual.category?.name
              return (
                <Link
                  key={manual.id}
                  to={`/manual/${manual.id}`}
                  className="group block rounded-xl border border-slate-200 bg-white px-5 py-4 transition hover:border-slate-300 hover:shadow-sm"
                >
                  {(guideName || catName) && (
                    <p className="mb-1 text-xs font-medium text-slate-400">
                      {[guideName, catName].filter(Boolean).join(' › ')}
                    </p>
                  )}
                  <p className="font-semibold text-slate-900 group-hover:text-slate-700">
                    <Highlight text={manual.title} query={q} />
                  </p>
                  {manual.summary && (
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">
                      <Highlight text={manual.summary} query={q} />
                    </p>
                  )}
                </Link>
              )
            })}
          </section>
        </>
      )}
    </main>
  )
}

export default SearchResultsPage
