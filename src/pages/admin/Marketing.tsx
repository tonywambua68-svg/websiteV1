import { FormEvent, useEffect, useMemo, useState } from 'react'
import AdminLayout from './AdminLayout'
import { getSupabase } from '@/lib/supabase'
import { useProductStore } from '@/store/productStore'
import { formatKES } from '@/lib/commerce'
import {
  TrendingUp,
  TrendingDown,
  Megaphone,
  Zap,
  Ticket,
  Plus,
  Trash2,
  RefreshCw,
  DollarSign,
  ShoppingCart,
  Package,
} from 'lucide-react'

type Tab = 'overview' | 'campaigns' | 'flash' | 'coupons'

const TABS: Array<{ id: Tab; label: string; icon: any }> = [
  { id: 'overview', label: 'Selling Overview', icon: DollarSign },
  { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
  { id: 'flash', label: 'Flash Sales', icon: Zap },
  { id: 'coupons', label: 'Vouchers & Coupons', icon: Ticket },
]

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

export default function Marketing() {
  const supabase = getSupabase()
  const { products, allProducts, fetchProducts } = useProductStore()
  const [tab, setTab] = useState<Tab>('overview')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [reload, setReload] = useState(0)

  const [campaigns, setCampaigns] = useState<any[]>([])
  const [flash, setFlash] = useState<any[]>([])
  const [coupons, setCoupons] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [costs, setCosts] = useState<any[]>([])
  const [missing, setMissing] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    if (!supabase) return
    let active = true
    ;(async () => {
      const yesterday = startOfDay(new Date(Date.now() - 86400000))
      const [c, f, cp, o] = await Promise.all([
        supabase.from('campaigns').select('*').order('sort_order').order('created_at', { ascending: false }),
        supabase.from('flash_sales').select('*').order('created_at', { ascending: false }),
        supabase.from('coupons').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('id,status,total,created_at').gte('created_at', yesterday.toISOString()).order('created_at', { ascending: false }),
      ])
      if (!active) return
      if (c.error && /campaigns/.test(c.error.message)) setMissing('campaigns table missing — apply migration 20261127000002')
      if (f.error && /flash_sales/.test(f.error.message)) setMissing('flash_sales table missing — apply migration 20261127000002')
      setCampaigns(c.data || [])
      setFlash(f.data || [])
      setCoupons(cp.data || [])
      setOrders(o.data || [])

      const orderIds = (o.data || []).map((x: any) => x.id)
      if (orderIds.length) {
        const its = await supabase.from('order_items').select('order_id,product_id,quantity,line_total').in('order_id', orderIds)
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
    })()
    return () => {
      active = false
    }
  }, [supabase, reload])

  const productMap = useMemo(() => {
    const m = new Map<string, any>()
    allProducts.forEach((p) => m.set(p.id, p))
    products.forEach((p) => m.set(p.id, p))
    return m
  }, [allProducts, products])

  const stats = useMemo(() => {
    const todayKey = startOfDay(new Date()).getTime()
    const valid = orders.filter((o) => !['cancelled', 'refunded'].includes(o.status))
    const sum = (list: any[]) => list.reduce((a, b) => a + (Number(b.total) || 0), 0)
    const today = valid.filter((o) => startOfDay(new Date(o.created_at)).getTime() === todayKey)
    const yesterday = valid.filter((o) => startOfDay(new Date(o.created_at)).getTime() === todayKey - 86400000)
    const orderMap = new Map(orders.map((o) => [o.id, o]))
    const unitsFor = (list: any[]) => {
      const ids = new Set(list.map((o) => o.id))
      return items.filter((it) => ids.has(it.order_id)).reduce((a, b) => a + (Number(b.quantity) || 0), 0)
    }
    const costFor = (list: any[]) => {
      const ids = new Set(list.map((o) => o.id))
      const itemIds = new Set(items.filter((it) => ids.has(it.order_id)).map((it) => it.id))
      return costs.filter((c) => itemIds.has(c.order_item_id)).reduce((a, b) => a + (Number(b.purchase_cost) || 0), 0)
    }
    const revToday = sum(today)
    const revYest = sum(yesterday)
    const profitToday = revToday - costFor(today)
    const profitYest = revYest - costFor(yesterday)
    return {
      revenue: revToday,
      orders: today.length,
      units: unitsFor(today),
      profit: profitToday,
      revDelta: pct(revToday, revYest),
      ordersDelta: pct(today.length, yesterday.length),
      unitsDelta: pct(unitsFor(today), unitsFor(yesterday)),
      profitDelta: pct(profitToday, profitYest),
      orderMap,
    }
  }, [orders, items, costs])

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setMsg(null)
    try {
      await fn()
      setReload((n) => n + 1)
    } catch (e: any) {
      setMsg(e?.message || 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const createCampaign = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    run(async () => {
      const r = await supabase!.from('campaigns').insert({
        name: String(fd.get('name')).trim(),
        description: String(fd.get('description') || '').trim() || null,
        href: String(fd.get('href') || '/shop?offers=1').trim(),
        starts_at: new Date(String(fd.get('starts_at'))).toISOString(),
        ends_at: fd.get('ends_at') ? new Date(String(fd.get('ends_at'))).toISOString() : null,
        is_active: true,
      })
      if (r.error) throw r.error
      setMsg('Campaign created.')
    })
  }

  const createFlash = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    run(async () => {
      const r = await supabase!.from('flash_sales').insert({
        product_id: String(fd.get('product_id')),
        promo_price: Number(fd.get('promo_price')),
        starts_at: new Date(String(fd.get('starts_at'))).toISOString(),
        ends_at: new Date(String(fd.get('ends_at'))).toISOString(),
        stock_limit: fd.get('stock_limit') ? Number(fd.get('stock_limit')) : null,
        is_active: true,
      })
      if (r.error) throw r.error
      setMsg('Flash sale created.')
    })
  }

  const createCoupon = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    run(async () => {
      const r = await supabase!.from('coupons').insert({
        code: String(fd.get('code')).trim().toUpperCase(),
        discount_type: String(fd.get('discount_type')),
        amount: Number(fd.get('amount')),
        min_order: fd.get('min_order') ? Number(fd.get('min_order')) : null,
        usage_limit: fd.get('usage_limit') ? Number(fd.get('usage_limit')) : null,
        ends_at: fd.get('ends_at') ? new Date(String(fd.get('ends_at'))).toISOString() : null,
        is_active: true,
      })
      if (r.error) throw r.error
      setMsg('Coupon created.')
    })
  }

  const toggle = (table: string, id: string, value: boolean) =>
    run(async () => {
      const r = await supabase!.from(table).update({ is_active: value }).eq('id', id)
      if (r.error) throw r.error
    })

  const remove = (table: string, id: string) =>
    run(async () => {
      const r = await supabase!.from(table).delete().eq('id', id)
      if (r.error) throw r.error
    })

  const productOptions = allProducts.length ? allProducts : products

  return (
    <AdminLayout title="Marketing & Promotions" subtitle="Campaigns, flash sales, vouchers and selling performance">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${
                  tab === t.id ? 'bg-primary text-white shadow-xs' : 'bg-card border border-line text-muted hover:text-ink'
                }`}
              >
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            )
          })}
        </div>
        <button type="button" onClick={() => setReload((n) => n + 1)} className="btn btn-outline !h-9 text-xs font-bold">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {missing && (
        <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs font-semibold text-warning">
          {missing}. The other modules still work.
        </div>
      )}
      {msg && <div className="mb-4 rounded-lg border border-line bg-card p-3 text-xs font-semibold text-ink">{msg}</div>}

      {tab === 'overview' && (
        <div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Revenue (today)" value={formatKES(stats.revenue)} delta={stats.revDelta} icon={DollarSign} />
            <StatCard label="Orders (today)" value={String(stats.orders)} delta={stats.ordersDelta} icon={ShoppingCart} />
            <StatCard label="Units sold (today)" value={String(stats.units)} delta={stats.unitsDelta} icon={Package} />
            <StatCard label="Gross profit (today)" value={formatKES(stats.profit)} delta={stats.profitDelta} icon={TrendingUp} />
          </div>
          <p className="mt-3 text-[11px] text-muted">
            Comparing today vs yesterday. Profit = order revenue − recorded supplier/owned cost. Figures use real order records only.
          </p>
        </div>
      )}

      {tab === 'campaigns' && (
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="space-y-2">
            {campaigns.length === 0 && <Empty text="No campaigns yet. Create one on the right." />}
            {campaigns.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-card p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">{c.name}</p>
                  <p className="text-[11px] text-muted">
                    {c.starts_at?.slice(0, 10)} → {c.ends_at ? c.ends_at.slice(0, 10) : 'ongoing'} · {c.is_active ? 'Active' : 'Paused'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button type="button" onClick={() => toggle('campaigns', c.id, !c.is_active)} className="btn btn-outline !h-8 text-[11px] font-bold">
                    {c.is_active ? 'Pause' : 'Activate'}
                  </button>
                  <button type="button" onClick={() => remove('campaigns', c.id)} className="rounded p-1.5 text-muted hover:text-error">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={createCampaign} className="h-fit rounded-xl border border-line bg-card p-4 space-y-2">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2"><Megaphone className="h-4 w-4 text-primary" /> New campaign</h3>
            <input name="name" required placeholder="Campaign name" className="input w-full text-xs" />
            <input name="description" placeholder="Short description" className="input w-full text-xs" />
            <input name="href" placeholder="Link (e.g. /shop?offers=1)" className="input w-full text-xs" defaultValue="/shop?offers=1" />
            <label className="text-[11px] font-bold text-muted">Starts</label>
            <input name="starts_at" type="datetime-local" required className="input w-full text-xs" />
            <label className="text-[11px] font-bold text-muted">Ends (optional)</label>
            <input name="ends_at" type="datetime-local" className="input w-full text-xs" />
            <button disabled={busy} className="btn btn-primary w-full !h-10 text-xs font-bold"><Plus className="h-4 w-4" /> Create campaign</button>
          </form>
        </div>
      )}

      {tab === 'flash' && (
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="space-y-2">
            {flash.length === 0 && <Empty text="No flash sales yet. Create one on the right." />}
            {flash.map((f) => {
              const p = productMap.get(f.product_id)
              return (
                <div key={f.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-card p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink">{p?.name || 'Product'}</p>
                    <p className="text-[11px] text-muted">
                      {formatKES(f.promo_price)} · ends {f.ends_at?.slice(0, 16).replace('T', ' ')} · {f.is_active ? 'Active' : 'Off'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button type="button" onClick={() => toggle('flash_sales', f.id, !f.is_active)} className="btn btn-outline !h-8 text-[11px] font-bold">
                      {f.is_active ? 'Stop' : 'Start'}
                    </button>
                    <button type="button" onClick={() => remove('flash_sales', f.id)} className="rounded p-1.5 text-muted hover:text-error">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          <form onSubmit={createFlash} className="h-fit rounded-xl border border-line bg-card p-4 space-y-2">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> New flash sale</h3>
            <select name="product_id" required className="input w-full text-xs">
              <option value="">Select product…</option>
              {productOptions.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <input name="promo_price" type="number" min="1" step="0.01" required placeholder="Promo price (KSh)" className="input w-full text-xs" />
            <input name="stock_limit" type="number" min="1" placeholder="Stock limit (optional)" className="input w-full text-xs" />
            <label className="text-[11px] font-bold text-muted">Starts</label>
            <input name="starts_at" type="datetime-local" required className="input w-full text-xs" />
            <label className="text-[11px] font-bold text-muted">Ends</label>
            <input name="ends_at" type="datetime-local" required className="input w-full text-xs" />
            <button disabled={busy} className="btn btn-primary w-full !h-10 text-xs font-bold"><Plus className="h-4 w-4" /> Create flash sale</button>
          </form>
        </div>
      )}

      {tab === 'coupons' && (
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="space-y-2">
            {coupons.length === 0 && <Empty text="No coupons yet. Create one on the right." />}
            {coupons.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-card p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink font-mono">{c.code}</p>
                  <p className="text-[11px] text-muted">
                    {c.discount_type === 'percent' ? `${c.amount}% off` : `${formatKES(c.amount)} off`} · used {c.used_count}/{c.usage_limit ?? '∞'} · {c.is_active ? 'Active' : 'Off'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button type="button" onClick={() => toggle('coupons', c.id, !c.is_active)} className="btn btn-outline !h-8 text-[11px] font-bold">
                    {c.is_active ? 'Disable' : 'Enable'}
                  </button>
                  <button type="button" onClick={() => remove('coupons', c.id)} className="rounded p-1.5 text-muted hover:text-error">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={createCoupon} className="h-fit rounded-xl border border-line bg-card p-4 space-y-2">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2"><Ticket className="h-4 w-4 text-primary" /> New coupon</h3>
            <input name="code" required placeholder="CODE e.g. BACK2SCHOOL" className="input w-full text-xs font-mono uppercase" />
            <select name="discount_type" className="input w-full text-xs">
              <option value="percent">Percentage (%)</option>
              <option value="fixed">Fixed amount (KSh)</option>
            </select>
            <input name="amount" type="number" min="1" step="0.01" required placeholder="Value" className="input w-full text-xs" />
            <input name="min_order" type="number" min="0" placeholder="Min order (optional)" className="input w-full text-xs" />
            <input name="usage_limit" type="number" min="1" placeholder="Usage limit (optional)" className="input w-full text-xs" />
            <input name="ends_at" type="datetime-local" placeholder="Expiry (optional)" className="input w-full text-xs" />
            <button disabled={busy} className="btn btn-primary w-full !h-10 text-xs font-bold"><Plus className="h-4 w-4" /> Create coupon</button>
          </form>
        </div>
      )}
    </AdminLayout>
  )
}

function pct(now: number, prev: number): number {
  if (!prev) return now > 0 ? 100 : 0
  return Math.round(((now - prev) / prev) * 100)
}

function StatCard({ label, value, delta, icon: Icon }: { label: string; value: string; delta: number; icon: any }) {
  const up = delta >= 0
  return (
    <div className="rounded-xl border border-line bg-card p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted">{label}</span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-2 font-display text-xl font-extrabold text-ink">{value}</p>
      <p className={`mt-1 inline-flex items-center gap-1 text-[11px] font-bold ${up ? 'text-success' : 'text-error'}`}>
        {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
        {up ? '▲' : '▼'} {Math.abs(delta)}% vs yesterday
      </p>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-line bg-card p-6 text-center text-xs text-muted">{text}</div>
}