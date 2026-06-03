/**
 * Formatea un timestamp ISO a MM/DD HH:mm
 * Considera timezone de Costa Rica (UTC-6)
 */
export function formatTimestamp(ts: string | null | undefined): string {
  if (!ts) return '—'
  const d = new Date(ts)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${mm}/${dd} ${hh}:${min}`
}

/**
 * Calcula y formatea el revenue por milla
 */
export function formatDollarPerMile(rate: number | null, miles: number | null | undefined): string {
  if (!rate || !miles || miles === 0) return '—'
  return `$${(rate / miles).toFixed(2)}`
}

/**
 * Formatea un número como moneda USD
 */
export function formatUSD(amount: number | null | undefined): string {
  if (amount == null) return '—'
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Convierte un timestamp a formato datetime-local para input HTML
 */
export function toDatetimeLocal(ts: string | null): string {
  if (!ts) return ''
  const d = new Date(ts)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}
