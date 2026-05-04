import { Link } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'

function NotFoundPage() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-6 text-center animate-fade-in">
      <div className="flex size-16 items-center justify-center rounded-full bg-slate-100">
        <FileQuestion className="size-8 text-slate-400" />
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">404</p>
        <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
        <p className="text-sm text-slate-500">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <Link
        to="/"
        className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
      >
        Back to home
      </Link>
    </main>
  )
}

export default NotFoundPage
