import { ArrowRightLeft } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

function ModeToggleButton() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  return (
    <Link
      to={isAdminRoute ? '/' : '/admin'}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
    >
      <ArrowRightLeft className="size-4" />
      {isAdminRoute ? 'Switch to User' : 'Switch to Admin'}
    </Link>
  )
}

export default ModeToggleButton
