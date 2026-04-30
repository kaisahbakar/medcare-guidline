import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

function ManualEditorPage() {
  const { id } = useParams()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <p className="text-lg font-semibold text-slate-700">Editor coming soon — Phase 4</p>
      <p className="text-sm text-slate-400">Manual ID: {id}</p>
      <Link
        to="/admin/manuals"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="size-3.5" />
        Back to manuals
      </Link>
    </div>
  )
}

export default ManualEditorPage
