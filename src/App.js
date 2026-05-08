import { Toaster } from 'sonner'
import AppRoutes from './routes/AppRoutes.js'
import ErrorBoundary from './components/ErrorBoundary.js'

function App() {
  return (
    <ErrorBoundary>
      <AppRoutes />
      <Toaster position="bottom-right" richColors />
    </ErrorBoundary>
  )
}

export default App
