import { Link, NavLink, Outlet } from 'react-router-dom'
import { BookOpen, FolderOpen, LayoutDashboard, Tag } from 'lucide-react'
import { isAdmin } from '../../lib/auth'
import clsx from 'clsx'
import ModeToggleButton from '../ui/ModeToggleButton'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/manuals', label: 'Manuals', icon: BookOpen },
  { to: '/admin/guide-types', label: 'Guide Types', icon: Tag },
  { to: '/admin/categories', label: 'Categories', icon: FolderOpen },
]

function AdminLayout() {
  if (!isAdmin()) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-600">Access denied.</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <Link to="/" className="text-sm font-semibold text-slate-900">
            MedCare
          </Link>
          <p className="text-xs text-slate-500">Admin</p>
        </div>

        <nav className="flex flex-col gap-0.5 p-3">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition',
                  isActive
                    ? 'bg-slate-100 font-medium text-slate-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                )
              }
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-2 border-t border-slate-200 p-3">
          <ModeToggleButton />
          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          >
            ← Back to site
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
