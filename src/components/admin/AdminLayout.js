import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { BookOpen, FolderOpen, LayoutDashboard, Menu, Tag, X } from 'lucide-react'
import { isAdmin } from '../../lib/auth'
import clsx from 'clsx'
import ModeToggleButton from '../ui/ModeToggleButton'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/manuals', label: 'Manuals', icon: BookOpen },
  { to: '/admin/guide-types', label: 'Guide Types', icon: Tag },
  { to: '/admin/categories', label: 'Categories', icon: FolderOpen },
]

function NavList({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-0.5 p-3">
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
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
  )
}

function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!isAdmin()) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-600">Access denied.</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="border-b border-slate-200 px-5 py-4">
          <Link to="/" className="text-sm font-semibold text-slate-900">
            MedCare
          </Link>
          <p className="text-xs text-slate-500">Admin</p>
        </div>
        <NavList />
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

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <Link to="/" className="text-sm font-semibold text-slate-900">
          MedCare <span className="font-normal text-slate-400">Admin</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
        >
          <Menu className="size-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">MedCare</p>
                <p className="text-xs text-slate-500">Admin</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="size-4" />
              </button>
            </div>
            <NavList onNavigate={() => setMobileOpen(false)} />
            <div className="mt-auto space-y-2 border-t border-slate-200 p-3">
              <ModeToggleButton />
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              >
                ← Back to site
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
