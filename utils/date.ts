// date utils: stable YYYY-MM-DD formatting without external deps
export function formatDateIso(d?: string): string {
  if (!d) return ''
  const m = /^\d{4}-\d{2}-\d{2}/.exec(d)
  if (m) return m[0]
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return ''
  const y = dt.getUTCFullYear()
  const m2 = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const d2 = String(dt.getUTCDate()).padStart(2, '0')
  return `${y}-${m2}-${d2}`
}
