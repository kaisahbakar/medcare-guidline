import { ArrowRightLeft } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

function ModeToggleButton() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  return (
    <Link
      to={isAdminRoute ? '/' : '/admin'}
      className="fixed right-4 top-4 z-50 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
    >
      <ArrowRightLeft className="size-4" />
      {isAdminRoute ? 'Switch to User' : 'Switch to Admin'}
    </Link>
  )
}

export default ModeToggleButton
