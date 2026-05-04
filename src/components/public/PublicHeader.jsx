import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ShieldCheck } from 'lucide-react'
import { isAdmin } from '../../lib/auth'

function PublicHeader() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  function handleSubmit(e) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 sm:px-6">
        {/* Brand */}
        <Link
          to="/"
          className="shrink-0 text-base font-bold tracking-tight text-slate-900 hover:text-slate-700"
        >
          MedCare
        </Link>

        {/* Search */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search manuals…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <button
            type="submit"
            className="hidden rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 sm:block"
          >
            Search
          </button>
        </form>

        {/* Right side */}
        <div className="flex shrink-0 items-center gap-2">
          {isAdmin() && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <ShieldCheck className="size-3.5" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

export default PublicHeader
