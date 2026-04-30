import { useParams } from 'react-router-dom'
import ManualReader from '../../components/reader/ManualReader'
import ReaderSidebar from '../../components/reader/ReaderSidebar'
import { useManual } from '../../lib/queries/useManuals'

function ManualReaderPage() {
  const { id } = useParams()
  const manualQuery = useManual(id)

  if (manualQuery.isLoading) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-12">
        <p className="text-slate-600">Loading manual...</p>
      </main>
    )
  }

  if (manualQuery.isError || !manualQuery.data) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-12">
        <p className="text-slate-600">
          Failed to load manual: {manualQuery.error?.message || 'Manual not found'}
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-12">
      <div className="grid grid-cols-[260px_1fr] gap-8">
        <ReaderSidebar categoryId={manualQuery.data.category_id} manualId={id} />
        <ManualReader manualId={id} />
      </div>
    </main>
  )
}

export default ManualReaderPage
