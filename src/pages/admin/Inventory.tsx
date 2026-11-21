import { FormEvent, useEffect, useState } from 'react'
import AdminLayout from './AdminLayout'
import { getSupabase } from '@/lib/supabase'
import { useProductStore } from '@/store/productStore'
import { formatNairobi } from '@/lib/commerce'
import { Boxes, PlusCircle, ArrowUpDown, AlertTriangle, ShieldCheck, History } from 'lucide-react'

export default function AdminInventory() {
  const { allProducts } = useProductStore()
  const [balances, setBalances] = useState<any[]>([])
  const [movements, setMovements] = useState<any[]>([])
  const [selectedProductId, setSelectedProductId] = useState(allProducts[0]?.id || '')
  const [adjustBucket, setAdjustBucket] = useState<'owned' | 'supplier'>('owned')
  const [adjustType, setAdjustType] = useState('restock')
  const [adjustQty, setAdjustQty] = useState('1')
  const [adjustNotes, setAdjustNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const loadInventory = async () => {
    const supabase = getSupabase()
    if (!supabase) {
      setBalances([])
      setMessage('Inventory cannot be loaded because the store database is not configured.')
      return
    }

    try {
      const [balRes, movRes] = await Promise.all([
        supabase.from('catalogue_products').select('id, name, owned_available, supplier_available'),
        supabase.from('stock_movements').select('*').order('created_at', { ascending: false }).limit(20),
      ])

      if (balRes.error) throw balRes.error
      if (movRes.error) throw movRes.error
      setBalances((balRes.data ?? []).map((r: any) => ({
            product_id: r.id,
            name: r.name,
            owned_available: Number(r.owned_available || 0),
            supplier_available: Number(r.supplier_available || 0),
            reserved: 0,
          })))
      setMovements(movRes.data ?? [])
    } catch (error: any) {
      setBalances([])
      setMovements([])
      setMessage(`Could not load inventory: ${error.message}`)
    }
  }

  useEffect(() => {
    loadInventory()
  }, [allProducts])

  const handleAdjust = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedProductId || !adjustQty) return

    setLoading(true)
    const qty = Number(adjustQty)
    const supabase = getSupabase()

    if (supabase) {
      try {
        const { error } = await supabase.rpc('adjust_stock_balance', {
          p_product_id: selectedProductId,
          p_bucket: adjustBucket,
          p_quantity: qty,
          p_movement_type: adjustType,
          p_notes: adjustNotes || 'Admin manual inventory adjustment',
        })

        if (error) {
          setMessage(`Error: ${error.message}`)
        } else {
          setMessage('Stock movement recorded and balances updated!')
          setAdjustNotes('')
          loadInventory()
        }
      } catch (err: any) {
        setMessage(`Error: ${err.message}`)
      }
    } else setMessage('Stock was not changed because the store database is not configured.')
    setLoading(false)
  }

  return (
    <AdminLayout
      title="Hardware Stock & Inventory Management"
      subtitle="Track physically owned warehouse units vs verified supplier-backed stock"
    >
      {message && (
        <div className="mb-4 rounded-lg border border-teal/30 bg-mint/50 p-3 text-xs font-bold text-tealdeep">
          {message}
        </div>
      )}

      {/* Stock Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
          <span className="text-xs font-extrabold uppercase text-muted">Physically Owned Stock</span>
          <p className="mt-2 font-display text-2xl font-bold text-ink">
            {balances.reduce((s, b) => s + b.owned_available, 0)} units
          </p>
          <p className="mt-1 text-[11px] text-muted">Held at Oremitech premises in Nairobi</p>
        </div>

        <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
          <span className="text-xs font-extrabold uppercase text-muted">Verified Supplier Stock</span>
          <p className="mt-2 font-display text-2xl font-bold text-teal">
            {balances.reduce((s, b) => s + b.supplier_available, 0)} units
          </p>
          <p className="mt-1 text-[11px] text-muted">Requires physical confirmation before dispatch</p>
        </div>

        <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
          <span className="text-xs font-extrabold uppercase text-warning">Low Stock Alert</span>
          <p className="mt-2 font-display text-2xl font-bold text-warning">
            {balances.filter((b) => b.owned_available <= 2).length} models
          </p>
          <p className="mt-1 text-[11px] text-muted">2 units or fewer remaining in warehouse</p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Balances Table */}
        <div className="overflow-hidden rounded-xl border border-line bg-card shadow-xs">
          <div className="border-b border-line bg-mist px-5 py-3">
            <h2 className="font-display text-sm font-bold text-ink">Stock Levels by Hardware Model</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line text-[11px] font-extrabold uppercase text-muted">
                <tr>
                  <th className="px-5 py-3">Product Name</th>
                  <th className="px-4 py-3">Owned Stock</th>
                  <th className="px-4 py-3">Supplier Stock</th>
                  <th className="px-4 py-3">Total Available</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {balances.map((b) => {
                  const total = b.owned_available + b.supplier_available
                  const isLow = b.owned_available <= 2
                  return (
                    <tr key={b.product_id} className="hover:bg-mist/40">
                      <td className="px-5 py-3 font-bold text-ink max-w-xs truncate">{b.name}</td>
                      <td className="px-4 py-3 font-extrabold text-ink">{b.owned_available}</td>
                      <td className="px-4 py-3 text-teal font-semibold">+{b.supplier_available}</td>
                      <td className="px-4 py-3 font-mono font-bold text-ink">{total}</td>
                      <td className="px-4 py-3">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 rounded bg-amber/15 px-2 py-0.5 text-[10px] font-extrabold text-amberdeep">
                            <AlertTriangle className="h-3 w-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="rounded bg-mint px-2 py-0.5 text-[10px] font-extrabold text-tealdeep">
                            Healthy
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock Adjustment Form */}
        <div className="h-fit rounded-xl border border-line bg-card p-6 shadow-xs">
          <h2 className="font-display text-sm font-bold text-ink flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-teal" /> Record Stock Movement
          </h2>

          <form onSubmit={handleAdjust} className="mt-4 space-y-4 text-xs">
            <div>
              <label className="block font-bold text-muted">Select Product *</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="input mt-1.5 w-full text-xs font-semibold"
              >
                {balances.map((b) => (
                  <option key={b.product_id} value={b.product_id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-muted">Inventory Bucket *</label>
              <select
                value={adjustBucket}
                onChange={(e) => setAdjustBucket(e.target.value as any)}
                className="input mt-1.5 w-full text-xs font-semibold"
              >
                <option value="owned">Oremitech Owned Stock (Physical Warehouse)</option>
                <option value="supplier">Supplier Verified Stock</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-muted">Movement Type</label>
              <select
                value={adjustType}
                onChange={(e) => setAdjustType(e.target.value)}
                className="input mt-1.5 w-full text-xs font-semibold"
              >
                <option value="restock">Restocking / Received Shipment (+)</option>
                <option value="inventory_count">Cycle Count Adjustment (+/-)</option>
                <option value="damaged">Damage / Defect Removal (-)</option>
                <option value="return">Customer Return Restock (+)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-muted">Quantity (e.g. +5 or -2) *</label>
              <input
                type="number"
                required
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                placeholder="5"
                className="input mt-1.5 w-full text-xs font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-muted">Reason / Purchase Reference</label>
              <input
                type="text"
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
                placeholder="e.g. Invoice #2026-88 or tested functional"
                className="input mt-1.5 w-full text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-emerald w-full !h-10 text-xs font-bold shadow-xs disabled:opacity-50"
            >
              Post Stock Movement
            </button>
          </form>
        </div>
      </div>

      {/* Movement Audit Trail */}
      {movements.length > 0 && (
        <div className="mt-8 overflow-hidden rounded-xl border border-line bg-card shadow-xs">
          <div className="border-b border-line bg-mist px-5 py-3 flex items-center gap-2">
            <History className="h-4 w-4 text-teal" />
            <h2 className="font-display text-sm font-bold text-ink">Recent Stock Movements Audit Trail</h2>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line text-[11px] font-extrabold uppercase text-muted">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-4 py-3">Movement Type</th>
                <th className="px-4 py-3">Bucket</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {movements.map((m) => (
                <tr key={m.id} className="hover:bg-mist/30">
                  <td className="px-5 py-3 text-muted">{formatNairobi(m.created_at)}</td>
                  <td className="px-4 py-3 font-bold uppercase text-ink text-[11px]">{m.movement_type}</td>
                  <td className="px-4 py-3 uppercase text-[10px] font-extrabold text-teal">{m.bucket}</td>
                  <td className={`px-4 py-3 font-mono font-bold ${m.quantity > 0 ? 'text-teal' : 'text-error'}`}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </td>
                  <td className="px-4 py-3 text-muted max-w-sm truncate">{m.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}

