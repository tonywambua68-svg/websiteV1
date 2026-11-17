/** Money, phone, and basket rules shared by the shop. Stock itself is enforced in Postgres. */

export function formatKES(value: number | string | null | undefined): string {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return 'KSh —'
  const hasCents = Math.round(n * 100) % 100 !== 0
  const formatted = n.toLocaleString('en-KE', {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  })
  return `KSh ${formatted}`
}

export function formatNairobi(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-KE', {
    timeZone: 'Africa/Nairobi',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('254') && digits.length >= 12) return digits
  if (digits.startsWith('0') && digits.length === 10) return `254${digits.slice(1)}`
  if (digits.length === 9) return `254${digits}`
  return digits
}

export function isKenyanPhone(raw: string): boolean {
  return /^254\d{9}$/.test(normalizePhone(raw))
}

export function clampQuantity(quantity: number, maxAvailable: number): number {
  if (!Number.isFinite(quantity)) return 1
  const max = Math.max(0, Math.min(10, Math.floor(maxAvailable)))
  if (max < 1) return 0
  return Math.min(max, Math.max(1, Math.floor(quantity)))
}

export function availableUnits(ownedAvailable: number, supplierAvailable: number): number {
  return Math.max(0, ownedAvailable) + Math.max(0, supplierAvailable)
}

export function availabilityLabel(availability: string): string {
  if (availability === 'in_stock') return 'In stock at Oremitech'
  if (availability === 'supplier') return 'Supplier stock — confirmation required'
  return 'Unavailable'
}

export function conditionLabel(value: string | null | undefined): string {
  if (!value || value === 'unspecified') return 'Condition not stated'
  return value.replace(/_/g, ' ')
}

export function specSummary(parts: Array<string | null | undefined>): string {
  return parts.filter((part): part is string => Boolean(part && part.trim())).slice(0, 4).join(' · ')
}

export function lineTotal(unitPrice: number, quantity: number): number {
  return Math.round(unitPrice * quantity * 100) / 100
}

export function sumLines(lines: Array<{ unitPrice: number; quantity: number }>): number {
  return Math.round(lines.reduce((sum, line) => sum + lineTotal(line.unitPrice, line.quantity), 0) * 100) / 100
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function searchPattern(query: string): string | null {
  const cleaned = query.toLowerCase().replace(/[%_,.()]/g, ' ').trim()
  if (!cleaned) return null
  return `%${cleaned.split(/\s+/).join('%')}%`
}

export function whatsappHref(phone: string, text: string): string | null {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 10) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

export function errorText(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message: unknown }).message)
    if (message) return message
  }
  return 'Something went wrong. Please try again.'
}
