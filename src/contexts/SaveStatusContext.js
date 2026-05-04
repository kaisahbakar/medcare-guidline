import { createContext, useCallback, useContext, useRef, useState } from 'react'

const SaveStatusContext = createContext(null)

/**
 * Tracks autosave state across all blocks in the open editor.
 *
 * status:
 *   'saved'    — all pending saves have completed
 *   'unsaved'  — user has typed but debounce hasn't fired yet
 *   'saving'   — at least one mutation is in-flight
 */
export function SaveStatusProvider({ children }) {
  const [status, setStatus] = useState('saved')
  const [lastSavedAt, setLastSavedAt] = useState(() => Date.now())

  // Count how many mutations are currently in-flight so concurrent saves
  // don't prematurely set status back to 'saved'.
  const pendingRef = useRef(0)

  const notifyChange = useCallback(() => {
    setStatus('unsaved')
  }, [])

  const notifySaving = useCallback(() => {
    pendingRef.current += 1
    setStatus('saving')
  }, [])

  const notifySaved = useCallback(() => {
    pendingRef.current = Math.max(0, pendingRef.current - 1)
    if (pendingRef.current === 0) {
      setStatus('saved')
      setLastSavedAt(Date.now())
    }
  }, [])

  return (
    <SaveStatusContext.Provider
      value={{ status, lastSavedAt, notifyChange, notifySaving, notifySaved }}
    >
      {children}
    </SaveStatusContext.Provider>
  )
}

export function useSaveStatus() {
  const ctx = useContext(SaveStatusContext)
  if (!ctx) throw new Error('useSaveStatus must be used inside <SaveStatusProvider>')
  return ctx
}
