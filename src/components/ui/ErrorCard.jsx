import { RefreshCw } from 'lucide-react'

function ErrorCard({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
      <p className="font-medium">{title}</p>
      {message && (
        <p className="mt-0.5 text-red-600">{message}</p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-700 underline hover:text-red-900"
        >
          <RefreshCw className="size-3" />
          Try again
        </button>
      )}
    </div>
  )
}

export default ErrorCard
