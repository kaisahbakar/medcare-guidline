import { Toaster } from 'sonner'
import AppRoutes from './routes/AppRoutes.js'
import ErrorBoundary from './components/ErrorBoundary.jsx'

function App() {
  return (
    <ErrorBoundary>
      <AppRoutes />
      <Toaster position="bottom-right" richColors />
    </ErrorBoundary>
  )
}

export default App
