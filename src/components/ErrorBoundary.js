import { Component } from 'react'
import { MdRefresh } from 'react-icons/md'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-slate-50 px-6 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="size-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-semibold text-slate-900">Something went wrong</h1>
            <p className="max-w-sm text-sm text-slate-500">
              An unexpected error occurred. Refreshing the page usually fixes this.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            <MdRefresh className="size-4" />
            Refresh page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
