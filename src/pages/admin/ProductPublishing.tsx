import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import { fetchImports, bulkPublish, fetchProductSlugs, type ProductImportRow, type BulkPublishResult } from '@/lib/productImports'
import { formatKES } from '@/lib/commerce'
import { Loader2, Rocket, AlertTriangle, CheckCircle2, XCircle, RefreshCw, ExternalLink, Info } from 'lucide-react'

export default function AdminProductPublishing() {
  const [imports, setImports] = useState<ProductImportRow[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [results, setResults] = useState<BulkPublishResult[]>([])
  const [slugById, setSlugById] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchImports()
      setImports(rows)
      const publishedIds = rows.filter((r) => r.linked_product_id).map((r) => r.linked_product_id as string)
      if (publishedIds.length > 0) {
        fetchProductSlugs(publishedIds).then(setSlugById).catch(() => setSlugById({}))
      }
    } catch (err: any) {
      setError(err.message || 'Could not load imports.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const approved = useMemo(() => imports.filter((r) => r.status === 'approved'), [imports])
  const published = useMemo(() => imports.filter((r) => r.status === 'published'), [imports])
  const selectedRows = approved.filter((r) => selected[r.id])

  const toggleAll = () => {
    if (selectedRows.length === approved.length && approved.length > 0) {
      setSelected({})
      return
    }
    const next: Record<string, boolean> = {}
    for (const row of approved) next[row.id] = true
    setSelected(next)
  }

  const handlePublish = async () => {
    if (selectedRows.length === 0) {
      setError('Select at least one approved product to publish.')
      return
    }
    setBusy(true)
    setError(null)
    setResults([])
    try {
      const report = await bulkPublish(selectedRows.map((r) => ({ id: r.id, title: r.title })))
      setResults(report)
      setSelected({})
      const newIds = report.filter((r) => r.ok && r.productId).map((r) => r.productId as string)
      if (newIds.length > 0) {
        const slugs = await fetchProductSlugs(newIds).catch(() => ({}))
        setSlugById((prev) => ({ ...prev, ...slugs }))
      }
      await load()
    } catch (err: any) {
      setError(err.message || 'Publishing failed.')
    } finally {
      setBusy(false)
    }
  }

  const successCount = results.filter((r) => r.ok).length
  const failureCount = results.filter((r) => !r.ok).length

  return (
    <AdminLayout
      title="Bulk Publishing"
      subtitle="Publish approved products to the live catalogue (owner only)"
      actions={
        <button type="button" onClick={load} disabled={busy} className="btn btn-outline !h-9 text-xs font-bold disabled:opacity-50">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      }
    >
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-error/30 bg-error/10 p-3 text-xs font-bold text-error">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="mb-5 rounded-xl border border-line bg-card p-4 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-extrabold text-ink">
            <CheckCircle2 className="h-4 w-4 text-teal" /> Publish report
          </div>
          <p className="mt-1 text-[11px] text-muted">
            {successCount} published · {failureCount} failed
          </p>
          <ul className="mt-3 space-y-1.5">
            {results.map((result) => (
              <li key={result.importId} className="flex items-start gap-2 text-xs">
                {result.ok ? (
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-tealdeep" />
                ) : (
                  <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-error" />
                )}
                <span className={`font-bold ${result.ok ? 'text-ink' : 'text-error'}`}>{result.title}</span>
                <span className="text-muted">— {result.message}</span>
                {result.ok && result.productId && slugById[result.productId] && (
                  <Link to={`/product/${slugById[result.productId]}`} className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-teal hover:underline">
                    View <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-card p-4 shadow-xs">
        <div className="text-xs text-muted">
          <span className="font-extrabold text-ink">{approved.length}</span> approved ·{' '}
          <span className="font-extrabold text-ink">{selectedRows.length}</span> selected
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={toggleAll} disabled={approved.length === 0 || busy} className="btn btn-outline !h-9 text-xs font-bold disabled:opacity-40">
            {selectedRows.length === approved.length && approved.length > 0 ? 'Clear selection' : 'Select all'}
          </button>
          <button type="button" onClick={handlePublish} disabled={busy || selectedRows.length === 0} className="btn btn-emerald !h-9 text-xs font-bold shadow-xs disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />} Publish selected
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm font-bold text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading approved products…
        </div>
      ) : approved.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-card p-8 text-center text-xs text-muted">
          No approved products awaiting publishing. Approve imports from the review dashboard first.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-card shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-mist text-[10px] font-extrabold uppercase text-muted">
              <tr>
                <th className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={approved.length > 0 && selectedRows.length === approved.length}
                    onChange={toggleAll}
                    className="h-4 w-4"
                  />
                </th>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">Supplier</th>
                <th className="px-3 py-2">Selling price</th>
                <th className="px-3 py-2">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {approved.map((row) => (
                <tr key={row.id} className="hover:bg-mist/60">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={Boolean(selected[row.id])}
                      onChange={(e) => setSelected((prev) => ({ ...prev, [row.id]: e.target.checked }))}
                      className="h-4 w-4"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <p className="font-bold text-ink">{row.title}</p>
                    <p className="text-[11px] text-muted">
                      {row.brand_name || 'No brand'} · {row.category_slug.replace(/-/g, ' ')}
                    </p>
                  </td>
                  <td className="px-3 py-2 text-muted">{row.supplier_name || '—'}</td>
                  <td className="px-3 py-2 font-bold text-teal">
                    {row.approved_selling_price != null ? formatKES(row.approved_selling_price) : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <Link to={`/admin/product-review/${row.id}`} className="text-[11px] font-bold text-teal hover:underline">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {published.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-sm font-extrabold text-ink">Recently published</p>
          <div className="overflow-hidden rounded-xl border border-line bg-card shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-mist text-[10px] font-extrabold uppercase text-muted">
                <tr>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2">Selling price</th>
                  <th className="px-3 py-2">Live</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {published.slice(0, 10).map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-2 font-bold text-ink">{row.title}</td>
                    <td className="px-3 py-2 text-muted">
                      {row.approved_selling_price != null ? formatKES(row.approved_selling_price) : '—'}
                    </td>
                    <td className="px-3 py-2">
                      {row.linked_product_id && slugById[row.linked_product_id] ? (
                        <Link to={`/product/${slugById[row.linked_product_id]}`} className="inline-flex items-center gap-1 text-[11px] font-bold text-teal hover:underline">
                          View <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : (
                        <span className="text-[11px] text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6 flex items-start gap-2 rounded-xl border border-line bg-mist p-4 text-[11px] text-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
        <p>
          Publishing writes each approved import into the live products table with its approved price, images and
          acquisition cost. Publishing is idempotent and restricted to the owner role.
        </p>
      </div>
    </AdminLayout>
  )
}
