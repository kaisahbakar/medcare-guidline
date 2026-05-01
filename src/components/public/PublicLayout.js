import { ChevronLeft, Home } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import ModeToggleButton from '../ui/ModeToggleButton'

const navItems = [
  { to: '/', label: 'Landing', icon: Home, end: true },
]

function PublicLayout() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto grid max-w-7xl grid-cols-[220px_1fr] gap-6 px-4 py-6">
        <aside className="sticky top-6 h-fit rounded-xl border border-slate-200 bg-white p-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
          >
            <ChevronLeft className="size-4" />
            Back
          </button>

          <nav className="space-y-1">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={label}
                to={to}
                end={end}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition',
                    isActive
                      ? 'bg-slate-100 font-medium text-slate-900'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  )
                }
              >
                <Icon className="size-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-4 border-t border-slate-200 pt-3">
            <ModeToggleButton />
          </div>
        </aside>

        <div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default PublicLayout
