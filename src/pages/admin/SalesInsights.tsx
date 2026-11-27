import { useEffect, useMemo, useState } from 'react'
import AdminLayout from './AdminLayout'
import { getSupabase } from '@/lib/supabase'
import { useProductStore } from '@/store/productStore'
import { formatKES } from '@/lib/commerce'
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Wallet } from 'lucide-react'

type DayPoint = { key: string; label: string; revenue: number; orders: number; units: number; profit: number }

const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export default function SalesInsights() {
  const supabase = getSupabase()
  const { allProducts, fetchProducts } = useProductStore()
  const [orders, setOrders] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [costs, setCosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    if (!supabase) return
    let active = true
    ;(async () => {
      setLoading(true)
      const since = new Date(Date.now() - 29 * 86400000)
      const o = await supabase.from('orders').select('id,status,total,created_at').gte('created_at', since.toISOString()).order('created_at', { ascending: false })
      if (!active) return
      if (o.error) setError(o.error.message)
      setOrders(o.data || [])
      const ids = (o.data || []).map((x: any) => x.id)
      if (ids.length) {
        const its = await supabase.from('order_items').select('id,order_id,product_id,quantity,line_total').in('order_id', ids)
        setItems(its.data || [])
        const itemIds = (its.data || []).map((x: any) => x.id)
        if (itemIds.length) {
          const cs = await supabase.from('order_item_costs').select('order_item_id,purchase_cost').in('order_item_id', itemIds)
          setCosts(cs.data || [])
        } else setCosts([])
      } else {
        setItems([])
        setCosts([])
      }
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [supabase])

  const productName = useMemo(() => {
    const m = new Map<string, string>()
    allProducts.forEach((p) => m.set(p.id, p.name))
    return m
  }, [allProducts])

  const data = useMemo(() => {
    const valid = orders.filter((o) => !['cancelled', 'refunded'].includes(o.status))
    const orderMap = new Map(valid.map((o) => [o.id, o]))
    const costByItem = new Map(costs.map((c) => [c.order_item_id, Number(c.purchase_cost) || 0]))

    // Build last 14 days
    const days: DayPoint[] = []
    const byKey = new Map<string, DayPoint>()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      const key = dayKey(d)
      const p: DayPoint = { key, label: d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }), revenue: 0, orders: 0, units: 0, profit: 0 }
      days.push(p)
      byKey.set(key, p)
    }

    const prodUnits = new Map<string, number>()
    const prodRev = new Map<string, number>()
    const costByOrder = new Map<string, number>()

    valid.forEach((o) => {
      const p = byKey.get(dayKey(new Date(o.created_at)))
      if (!p) return
      p.revenue += Number(o.total) || 0
      p.orders += 1
    })
    items.forEach((it) => {
      const o = orderMap.get(it.order_id)
      if (!o) return
      const p = byKey.get(dayKey(new Date(o.created_at)))
      const qty = Number(it.quantity) || 0
      const line = Number(it.line_total) || 0
      if (p) p.units += qty
      prodUnits.set(it.product_id, (prodUnits.get(it.product_id) || 0) + qty)
      prodRev.set(it.product_id, (prodRev.get(it.product_id) || 0) + line)
      costByOrder.set(it.order_id, (costByOrder.get(it.order_id) || 0) + (costByItem.get(it.id) || 0))
    })
    valid.forEach((o) => {
      const p = byKey.get(dayKey(new Date(o.created_at)))
      if (p) p.profit += (Number(o.total) || 0) - (costByOrder.get(o.id) || 0)
    })

    const today = days[days.length - 1]
    const yest = days[days.length - 2]
    const topProducts = [...prodUnits.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, units]) => ({ id, name: productName.get(id) || 'Product', units, revenue: prodRev.get(id) || 0 }))

    return { days, today, yest, topProducts }
  }, [orders, items, costs, productName])

  const maxRev = Math.max(1, ...data.days.map((d) => d.revenue))

  return (
    <AdminLayout title="Sales Insights" subtitle="Live selling performance · last 14 days">
      {error && <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs font-semibold text-warning">{error}</div>}

      {/* KPI cards with trend arrows */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Total sales (today)" value={formatKES(data.today.revenue)} series={data.days.map((d) => d.revenue)} delta={pct(data.today.revenue, data.yest.revenue)} icon={DollarSign} />
        <Kpi label="Orders (today)" value={String(data.today.orders)} series={data.days.map((d) => d.orders)} delta={pct(data.today.orders, data.yest.orders)} icon={ShoppingCart} />
        <Kpi label="Units sold (today)" value={String(data.today.units)} series={data.days.map((d) => d.units)} delta={pct(data.today.units, data.yest.units)} icon={Package} />
        <Kpi label="Gross profit (today)" value={formatKES(data.today.profit)} series={data.days.map((d) => d.profit)} delta={pct(data.today.profit, data.yest.profit)} icon={Wallet} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
        {/* Sales trend chart */}
        <div className="rounded-xl border border-line bg-card p-4 shadow-xs">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-ink">Sales over time</h2>
            <span className="text-[11px] text-muted">Revenue · last 14 days</span>
          </div>
          {loading ? (
            <p className="py-10 text-center text-xs text-muted">Loading…</p>
          ) : (
            <div className="flex h-48 items-end gap-1.5">
              {data.days.map((d) => (
                <div key={d.key} className="group flex flex-1 flex-col items-center justify-end gap-1">
                  <div className="relative w-full" style={{ height: '100%' }}>
                    <div
                      className="absolute bottom-0 w-full rounded-t bg-primary/80 transition-all group-hover:bg-primary"
                      style={{ height: `${Math.max(2, (d.revenue / maxRev) * 100)}%` }}
                      title={`${d.label}: ${formatKES(d.revenue)}`}
                    />
                  </div>
                  <span className="text-[9px] text-muted">{d.label.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top products */}
        <div className="rounded-xl border border-line bg-card p-4 shadow-xs">
          <h2 className="mb-3 font-display text-sm font-bold text-ink">Top products (14 days)</h2>
          {data.topProducts.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted">No sales yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.topProducts.map((p, i) => (
                <li key={p.id} className="flex items-center gap-2 text-xs">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mist font-bold text-muted">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate font-semibold text-ink">{p.name}</span>
                  <span className="shrink-0 font-bold text-ink">{p.units}×</span>
                  <span className="w-20 shrink-0 text-right text-muted">{formatKES(p.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <p className="mt-3 text-[11px] text-muted">Figures use real order records only. Profit = revenue − recorded item cost.</p>
    </AdminLayout>
  )
}

function pct(now: number, prev: number): number {
  if (!prev) return now > 0 ? 100 : 0
  return Math.round(((now - prev) / prev) * 100)
}

function Kpi({ label, value, series, delta, icon: Icon }: { label: string; value: string; series: number[]; delta: number; icon: any }) {
  const up = delta >= 0
  const max = Math.max(1, ...series)
  const pts = series.map((v, i) => `${(i / (series.length - 1)) * 100},${28 - (v / max) * 26}`).join(' ')
  return (
    <div className="rounded-xl border border-line bg-card p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted">{label}</span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-2 font-display text-xl font-extrabold text-ink">{value}</p>
      <div className="mt-1 flex items-center justify-between">
        <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${up ? 'text-success' : 'text-error'}`}>
          {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {up ? '▲' : '▼'} {Math.abs(delta)}%
        </span>
        <svg width="100" height="30" viewBox="0 0 100 30" className="shrink-0">
          <polyline points={pts} fill="none" stroke={up ? '#16A34A' : '#DC2626'} strokeWidth="2" />
        </svg>
      </div>
    </div>
  )
}