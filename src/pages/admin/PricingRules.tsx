import { useEffect, useState } from 'react'
import AdminLayout from './AdminLayout'
import { Percent, Plus, Save, Trash2, Info } from 'lucide-react'
import { loadMarkupTiers, saveMarkupTier, deleteMarkupTier } from '@/lib/productImports'

interface TierRow {
  id?: string
  min_price: number
  max_price: number | null
  markup_pct: number
  label: string
  is_active: boolean
}

const emptyRow: TierRow = { min_price: 0, max_price: null, markup_pct: 20, label: '', is_active: true }

export default function AdminPricingRules() {
  const [tiers, setTiers] = useState<TierRow[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const rows = await loadMarkupTiers()
      setTiers(
        rows.map((r) => ({
          id: r.id,
          min_price: Number(r.min_price),
          max_price: r.max_price == null ? null : Number(r.max_price),
          markup_pct: Number(r.markup_pct),
          label: r.label ?? '',
          is_active: r.is_active !== false,
        })),
      )
    } catch (err: any) {
      setMessage(err.message || 'Could not load markup tiers. Apply the product import migration first.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const updateRow = (index: number, patch: Partial<TierRow>) => {
    setTiers((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  const handleSave = async (row: TierRow) => {
    setLoading(true)
    try {
      await saveMarkupTier({
        id: row.id,
        min_price: Number(row.min_price) || 0,
        max_price: row.max_price == null || String(row.max_price) === '' ? null : Number(row.max_price),
        markup_pct: Number(row.markup_pct) || 0,
        label: row.label || null,
        is_active: row.is_active,
      })
      setMessage('Markup rule saved.')
      await load()
    } catch (err: any) {
      setMessage(err.message || 'Could not save markup rule.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (row: TierRow) => {
    if (!row.id) {
      setTiers((prev) => prev.filter((r) => r !== row))
      return
    }
    if (!window.confirm('Delete this markup rule?')) return
    try {
      await deleteMarkupTier(row.id)
      setMessage('Markup rule deleted.')
      await load()
    } catch (err: any) {
      setMessage(err.message || 'Could not delete markup rule.')
    }
  }

  return (
    <AdminLayout
      title="Profit & Pricing Rules"
      subtitle="Configurable tiered markup applied to total acquisition cost"
      actions={
        <button
          type="button"
          onClick={() => setTiers((prev) => [...prev, { ...emptyRow }])}
          className="btn btn-emerald !h-9 text-xs font-bold shadow-xs"
        >
          <Plus className="h-4 w-4" /> Add Tier
        </button>
      }
    >
      {message && (
        <div className="mb-4 rounded-lg border border-teal/30 bg-mint/50 p-3 text-xs font-bold text-tealdeep flex items-center justify-between">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage(null)} className="text-muted hover:text-ink">
            ✕
          </button>
        </div>
      )}

      <div className="mb-4 flex items-start gap-2 rounded-xl border border-line bg-mist p-4 text-xs text-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
        <p>
          The tier whose range contains the <strong>total acquisition cost</strong> is used to compute the suggested
          selling price. A minimum gross margin protects against low-margin approvals. Competitor prices are shown for
          reference only and are never treated as our cost.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-card shadow-xs">
        <div className="flex items-center gap-2 border-b border-line bg-mist px-5 py-3">
          <Percent className="h-4 w-4 text-tealdeep" />
          <h2 className="font-display text-sm font-bold text-ink">Markup Tiers</h2>
        </div>

        <div className="divide-y divide-line">
          {tiers.map((row, index) => (
            <div key={row.id ?? `new-${index}`} className="grid gap-3 p-4 sm:grid-cols-[1fr_1fr_1fr_1.4fr_auto_auto] sm:items-end">
              <label className="block text-[10px] font-bold uppercase text-muted">
                Min (KSh)
                <input
                  type="number"
                  value={row.min_price}
                  onChange={(e) => updateRow(index, { min_price: Number(e.target.value) })}
                  className="input mt-1 w-full text-xs font-bold"
                />
              </label>
              <label className="block text-[10px] font-bold uppercase text-muted">
                Max (KSh)
                <input
                  type="number"
                  value={row.max_price ?? ''}
                  placeholder="no limit"
                  onChange={(e) => updateRow(index, { max_price: e.target.value === '' ? null : Number(e.target.value) })}
                  className="input mt-1 w-full text-xs"
                />
              </label>
              <label className="block text-[10px] font-bold uppercase text-muted">
                Markup %
                <input
                  type="number"
                  value={row.markup_pct}
                  onChange={(e) => updateRow(index, { markup_pct: Number(e.target.value) })}
                  className="input mt-1 w-full text-xs font-bold text-teal"
                />
              </label>
              <label className="block text-[10px] font-bold uppercase text-muted">
                Label
                <input
                  type="text"
                  value={row.label}
                  placeholder="e.g. KSh 0 – 2,000"
                  onChange={(e) => updateRow(index, { label: e.target.value })}
                  className="input mt-1 w-full text-xs"
                />
              </label>
              <label className="flex items-center gap-2 pb-2 text-[11px] font-bold text-muted">
                <input
                  type="checkbox"
                  checked={row.is_active}
                  onChange={(e) => updateRow(index, { is_active: e.target.checked })}
                  className="rounded border-input bg-background text-emerald focus:ring-emerald"
                />
                Active
              </label>
              <div className="flex items-center gap-1 pb-1">
                <button
                  type="button"
                  onClick={() => handleSave(row)}
                  disabled={loading}
                  className="btn btn-emerald !h-9 px-3 text-[11px] font-bold"
                >
                  <Save className="h-3.5 w-3.5" /> Save
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(row)}
                  className="rounded p-2 text-muted hover:text-error"
                  aria-label="Delete tier"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {tiers.length === 0 && !loading && (
            <div className="p-8 text-center text-xs text-muted">
              No markup tiers configured. Add a tier to enable pricing calculations.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
