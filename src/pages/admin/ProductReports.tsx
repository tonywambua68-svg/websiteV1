import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import { getSupabase } from '@/lib/supabase'
import { Flag, RefreshCw } from 'lucide-react'

type Status = 'open' | 'investigating' | 'resolved'
interface Report {
  id: string
  product_id: string
  reason: string
  details: string | null
  name: string | null
  contact: string | null
  status: Status
  created_at: string
  products: { name: string; slug: string } | null
}

const REASON_LABEL: Record<string, string> = {
  spec: 'Incorrect specifications',
  image: 'Incorrect images',
  price: 'Incorrect price',
  condition: 'Incorrect condition',
  availability: 'Incorrect availability',
  other: 'Other',
}
const FILTERS: Array<{ key: 'all' | Status; label: string }> = [
  { key: 'open', label: 'Open' },
  { key: 'investigating', label: 'Investigating' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'all', label: 'All' },
]
const STATUS_STYLE: Record<Status, string> = {
  open: 'bg-amber-100 text-amber-700',
  investigating: 'bg-blue-100 text-primary',
  resolved: 'bg-emerald/10 text-emerald',
}

export default function AdminProductReports() {
  const [reports, setReports] = useState<Report[]>([])
  const [filter, setFilter] = useState<'all' | Status>('open')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setMessage(null)
    const supabase = getSupabase()
    if (!supabase) { setMessage('Database not configured.'); setLoading(false); return }
    const { data, error } = await supabase
      .from('product_reports')
      .select('id, product_id, reason, details, name, contact, status, created_at, products(name, slug)')
      .order('created_at', { ascending: false })
    if (error) setMessage(`Could not load reports: ${error.message}`)
    else setReports((data ?? []) as unknown as Report[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const setStatus = async (id: string, status: Status) => {
    setBusy(id)
    const supabase = getSupabase()
    if (!supabase) return
    const { error } = await supabase.from('product_reports').update({ status }).eq('id', id)
    if (error) setMessage(`Could not update: ${error.message}`)
    else setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
    setBusy(null)
  }

  const counts = useMemo(() => {
    const c = { open: 0, investigating: 0, resolved: 0, all: reports.length }
    for (const r of reports) c[r.status] += 1
    return c
  }, [reports])
  const visible = filter === 'all' ? reports : reports.filter((r) => r.status === filter)

  return (
    <AdminLayout
      title="Product Reports"
      subtitle="Customer reports of incorrect product information"
      actions={<button type="button" onClick={load} className="btn btn-outline !h-9 text-xs font-bold px-3"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>}
    >
      <div className="space-y-4">
        {message && <div className="rounded-lg border border-line bg-card px-4 py-3 text-sm text-ink">{message}</div>}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" onClick={() => setFilter(f.key)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${filter === f.key ? 'bg-emerald text-white shadow-xs' : 'bg-card text-muted border border-line hover:text-ink'}`}>
              {f.label}<span className={`rounded px-1.5 text-[10px] ${filter === f.key ? 'bg-white/20' : 'bg-mist'}`}>{counts[f.key]}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-xl border border-line bg-card p-10 text-center text-sm text-muted">Loading…</div>
        ) : visible.length === 0 ? (
          <div className="rounded-xl border border-line bg-card p-12 text-center">
            <Flag className="mx-auto h-8 w-8 text-line" />
            <p className="mt-3 text-sm font-bold text-ink">No {filter === 'all' ? '' : filter} reports</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {visible.map((r) => (
              <li key={r.id} className="rounded-xl border border-line bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-mist px-2 py-0.5 text-[10px] font-bold uppercase text-muted">{REASON_LABEL[r.reason] || r.reason}</span>
                      <span className={`rounded px-2 py-0.5 text-[10px] font-extrabold uppercase ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                      <span className="text-[11px] text-muted">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    {r.details && <p className="mt-2 text-sm text-ink">{r.details}</p>}
                    <p className="mt-2 text-xs text-muted">
                      {r.products ? <Link to={`/product/${r.products.slug}`} target="_blank" className="font-bold text-emerald hover:underline">{r.products.name}</Link> : 'Unknown product'}
                      {r.name ? ` · by ${r.name}` : ''}{r.contact ? ` (${r.contact})` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    {r.status !== 'investigating' && <button type="button" disabled={busy === r.id} onClick={() => setStatus(r.id, 'investigating')} className="btn btn-outline !h-8 px-2 text-[11px] font-bold disabled:opacity-50">Investigate</button>}
                    {r.status !== 'resolved' && <button type="button" disabled={busy === r.id} onClick={() => setStatus(r.id, 'resolved')} className="btn btn-outline !h-8 px-2 text-[11px] font-bold disabled:opacity-50">Resolve</button>}
                    {r.status !== 'open' && <button type="button" disabled={busy === r.id} onClick={() => setStatus(r.id, 'open')} className="btn btn-outline !h-8 px-2 text-[11px] font-bold disabled:opacity-50">Reopen</button>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminLayout>
  )
}