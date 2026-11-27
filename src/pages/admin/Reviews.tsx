import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import { getSupabase } from '@/lib/supabase'
import { Star, CheckCircle2, XCircle, Clock, MessageSquare, RefreshCw } from 'lucide-react'

type ReviewStatus = 'pending' | 'published' | 'rejected'

interface ReviewRow {
  id: string
  product_id: string
  rating: number
  body: string
  status: ReviewStatus
  created_at: string
  products: { name: string; slug: string } | null
  profiles: { full_name: string | null } | null
}

const FILTERS: Array<{ key: 'all' | ReviewStatus; label: string }> = [
  { key: 'pending', label: 'Pending' },
  { key: 'published', label: 'Published' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
]

const STATUS_STYLES: Record<ReviewStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  published: 'bg-emerald/10 text-emerald',
  rejected: 'bg-red-100 text-red-700',
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-line'}`}
        />
      ))}
    </span>
  )
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [filter, setFilter] = useState<'all' | ReviewStatus>('pending')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setMessage(null)
    const supabase = getSupabase()
    if (!supabase) {
      setReviews([])
      setMessage('Reviews cannot be loaded because the store database is not configured.')
      setLoading(false)
      return
    }
    const { data, error } = await supabase
      .from('product_reviews')
      .select('id, product_id, rating, body, status, created_at, products(name, slug), profiles(full_name)')
      .order('created_at', { ascending: false })
    if (error) {
      setReviews([])
      setMessage(`Could not load reviews: ${error.message}`)
    } else {
      setReviews((data ?? []) as unknown as ReviewRow[])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const setStatus = async (id: string, status: ReviewStatus) => {
    setBusyId(id)
    setMessage(null)
    const supabase = getSupabase()
    if (!supabase) {
      setMessage('Database not configured.')
      setBusyId(null)
      return
    }
    const { error } = await supabase.from('product_reviews').update({ status }).eq('id', id)
    if (error) {
      setMessage(`Could not update review: ${error.message}`)
    } else {
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
    }
    setBusyId(null)
  }

  const counts = useMemo(() => {
    const base = { pending: 0, published: 0, rejected: 0, all: reviews.length }
    for (const r of reviews) base[r.status] += 1
    return base
  }, [reviews])

  const visible = useMemo(
    () => (filter === 'all' ? reviews : reviews.filter((r) => r.status === filter)),
    [reviews, filter],
  )

  return (
    <AdminLayout
      title="Review Moderation"
      subtitle="Approve genuine customer reviews before they appear on the storefront"
      actions={
        <button
          type="button"
          onClick={load}
          className="btn btn-outline !h-9 text-xs font-bold px-3"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      }
    >
      <div className="space-y-4">
        {message && (
          <div className="rounded-lg border border-line bg-card px-4 py-3 text-sm text-ink">{message}</div>
        )}

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                filter === f.key ? 'bg-emerald text-white shadow-xs' : 'bg-card text-muted border border-line hover:text-ink'
              }`}
            >
              {f.label}
              <span className={`rounded px-1.5 text-[10px] ${filter === f.key ? 'bg-white/20' : 'bg-mist'}`}>
                {counts[f.key]}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-xl border border-line bg-card p-10 text-center text-sm text-muted">Loading reviews…</div>
        ) : visible.length === 0 ? (
          <div className="rounded-xl border border-line bg-card p-12 text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-line" />
            <p className="mt-3 text-sm font-bold text-ink">No {filter === 'all' ? '' : filter} reviews</p>
            <p className="text-xs text-muted">Reviews submitted by customers will appear here for moderation.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {visible.map((r) => (
              <li key={r.id} className="rounded-xl border border-line bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Stars rating={r.rating} />
                      <span className={`rounded px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${STATUS_STYLES[r.status]}`}>
                        {r.status}
                      </span>
                      <span className="text-[11px] text-muted">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-ink">{r.body}</p>
                    <p className="mt-2 text-xs text-muted">
                      {r.profiles?.full_name || 'Customer'}
                      {r.products && (
                        <>
                          {' on '}
                          <Link
                            to={`/product/${r.products.slug}`}
                            target="_blank"
                            className="font-bold text-emerald hover:underline"
                          >
                            {r.products.name}
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {r.status !== 'published' && (
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => setStatus(r.id, 'published')}
                        className="btn btn-outline !h-8 text-[11px] font-bold px-2.5 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald" /> Publish
                      </button>
                    )}
                    {r.status !== 'rejected' && (
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => setStatus(r.id, 'rejected')}
                        className="btn btn-outline !h-8 text-[11px] font-bold px-2.5 disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5 text-red-600" /> Reject
                      </button>
                    )}
                    {r.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                        <Clock className="h-3.5 w-3.5" /> Hidden
                      </span>
                    )}
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