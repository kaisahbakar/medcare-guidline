import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { MdMenuBook, MdExpandMore } from 'react-icons/md'
import { usePublishedManualsByCategory } from '../../lib/queries/useManuals'

function ReaderSidebar({ categoryId }) {
  const { data, isLoading } = usePublishedManualsByCategory(categoryId)
  const [mobileOpen, setMobileOpen] = useState(false)

  const nav = (
    <nav className="flex flex-col gap-1">
      {isLoading &&
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 animate-pulse rounded-lg bg-slate-100" />
        ))}
      {!isLoading && (data?.length ?? 0) === 0 && (
        <p className="px-1 py-2 text-sm text-slate-400">No manuals in this category.</p>
      )}
      {!isLoading &&
        data?.map((manual) => (
          <NavLink
            key={manual.id}
            to={`/manual/${manual.id}`}
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm transition duration-150 ${
                isActive
                  ? 'bg-slate-900 font-medium text-white'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            {manual.title}
          </NavLink>
        ))}
    </nav>
  )

  return (
    <>
      {/* Mobile: dropdown */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
        >
          <span className="flex items-center gap-2">
            <MdMenuBook className="size-4 text-slate-400" />
            Other manuals in this category
          </span>
          <MdExpandMore
            className={`size-4 text-slate-400 transition-transform ${mobileOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {mobileOpen && (
          <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3">
            {nav}
          </div>
        )}
      </div>

      {/* Desktop: sticky sidebar */}
      <aside className="hidden w-56 shrink-0 md:block">
        <div className="sticky top-20 rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            In this category
          </p>
          {nav}
        </div>
      </aside>
    </>
  )
}

export default ReaderSidebar
