const storageKey = (manualId) => `medcare:column_width_fr:${manualId}`

export function getColumnWidthFrMap(manualId) {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(storageKey(manualId))
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

export function setColumnWidthFrLocal(manualId, rowId, fractions) {
  if (typeof localStorage === 'undefined') return
  const map = getColumnWidthFrMap(manualId)
  map[String(rowId)] = fractions
  localStorage.setItem(storageKey(manualId), JSON.stringify(map))
}

export function removeColumnWidthFrLocal(manualId, rowId) {
  if (typeof localStorage === 'undefined') return
  const map = getColumnWidthFrMap(manualId)
  delete map[String(rowId)]
  localStorage.setItem(storageKey(manualId), JSON.stringify(map))
}

/** PostgREST / Supabase when a column is not in the schema cache */
export function isMissingColumnError(error) {
  const code = error?.code
  const msg = String(error?.message || '')
  return (
    code === 'PGRST204' ||
    code === '42703' ||
    /column_width_fr/i.test(msg) ||
    /schema cache/i.test(msg) ||
    /Could not find the .* column/i.test(msg)
  )
}
