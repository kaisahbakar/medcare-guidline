import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MdSearch, MdSettings } from 'react-icons/md'
import { isAdmin } from '../../lib/auth'

function PublicHeader() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center px-4 py-3 sm:px-6">
        {/* Brand */}
        <Link
          to="/"
          className="shrink-0 text-base font-bold tracking-tight text-slate-900 hover:text-blue-600"
        >
          MedCare
        </Link>

        {/* Left spacer */}
        <div className="flex-1" />

        {/* Search — centered, ~55% width */}
        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-[55%] items-center gap-2"
        >
          <div className="relative flex-1">
            <MdSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search manuals…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button
            type="submit"
            className="hidden rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 sm:block"
          >
            Search
          </button>
        </form>

        {/* Right spacer */}
        <div className="flex-1" />

        {/* Admin icon */}
        <div className="shrink-0">
          {isAdmin() && (
            <Link
              to="/admin"
              title="Admin"
              className="flex items-center justify-center rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-blue-600"
            >
              <MdSettings className="size-5" />
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

export default PublicHeader
