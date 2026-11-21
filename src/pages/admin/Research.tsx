import { FormEvent, useEffect, useState } from 'react'
import AdminLayout from './AdminLayout'
import { getSupabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { formatKES, formatNairobi } from '@/lib/commerce'
import {
  Compass,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Plus,
  ExternalLink,
  AlertTriangle,
  ArrowRight,
  XCircle,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  discovered: { label: 'Discovered', color: 'bg-mist text-muted' },
  needs_physical_verification: { label: 'Needs Physical Verification', color: 'bg-amber/15 text-amberdeep' },
  verified: { label: 'Verified', color: 'bg-teal/15 text-tealdeep' },
  draft: { label: 'Draft Product Created', color: 'bg-line text-muted' },
  approved: { label: 'Approved', color: 'bg-teal text-tealdeep' },
  published: { label: 'Published', color: 'bg-mint text-tealdeep' },
  rejected: { label: 'Rejected', color: 'bg-error/15 text-error' },
  unavailable: { label: 'Unavailable', color: 'bg-line text-muted' },
  expired: { label: 'Expired', color: 'bg-line text-muted' },
} as const

export default function AdminResearch() {
  const { user } = useAuthStore()
  const isOwner = user?.role === 'owner'
  const canManageResearch = user?.role === 'owner' || user?.role === 'manager' || user?.role === 'product_researcher'

  const [listings, setListings] = useState<any[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    source: '',
    original_url: '',
    advertised_price: '',
    cpu: '',
    ram: '',
    storage: '',
    notes: '',
  })

  const [verifyModal, setVerifyModal] = useState<any | null>(null)
  const [verifyData, setVerifyData] = useState({
    actual_price: '',
    condition: 'used_excellent',
    battery_health: '94%',
    notes: 'Tested ports, screen has no dead pixels, charger functional.',
  })

  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const loadListings = async () => {
    const supabase = getSupabase()
    if (!supabase) {
      setListings([])
      setMessage('Research listings cannot be loaded because the store database is not configured.')
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase.from('research_listings').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setListings(data ?? [])
    } catch (err: any) {
      setMessage(`Error loading research: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadListings()
  }, [])

  const handleAddDiscovery = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return

    setLoading(true)
    const supabase = getSupabase()
    const record = {
      title: form.title.trim(),
      source_name: form.source.trim(),
      source_url: form.original_url.trim() || null,
      advertised_price: Number(form.advertised_price) || null,
      advertised_specs: { cpu: form.cpu, ram: form.ram, storage: form.storage },
      status: 'discovered' as const,
      notes: form.notes,
    }

    if (supabase) {
      const { error } = await supabase.from('research_listings').insert(record)
      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setMessage('New research listing discovered and queued for verification.')
        setFormOpen(false)
        setForm({ title: '', source: '', original_url: '', advertised_price: '', cpu: '', ram: '', storage: '', notes: '' })
        loadListings()
      }
    } else setMessage('The listing was not saved because the store database is not configured.')
    setLoading(false)
  }

  const handleTransitionStatus = async (id: string, nextStatus: string) => {
    if (!canManageResearch) return
    const supabase = getSupabase()
    if (supabase) {
      try {
        const { error } = await supabase.from('research_listings').update({ status: nextStatus }).eq('id', id)
        if (error) throw error
        setMessage(`Listing moved to ${nextStatus.replace(/_/g, ' ')}.`)
        loadListings()
      } catch (err: any) {
        setMessage(`Error: ${err.message}`)
      }
    } else setMessage('The listing status was not changed because the store database is not configured.')
  }

  const handleRecordVerification = async (e: FormEvent) => {
    e.preventDefault()
    if (!verifyModal) return

    setLoading(true)
    const supabase = getSupabase()
    if (supabase) {
      const { error } = await supabase.from('research_listings').update({
        status: 'verified' as const,
        verified_at: new Date().toISOString(),
      }).eq('id', verifyModal.id)
      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setMessage('Physical verification recorded. Listing is now VERIFIED and ready for draft creation.')
        loadListings()
      }
    } else setMessage('Physical verification was not recorded because the store database is not configured.')
    if (supabase) setVerifyModal(null)
    setLoading(false)
  }

  const handlePromoteToDraft = async (listing: any) => {
    if (!canManageResearch) return
    const supabase = getSupabase()
    if (!supabase) return
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('promote_listing_to_draft', { p_listing_id: listing.id })
      if (error) throw error
      setMessage(`"${listing.title}" promoted to Draft product. An Owner must now approve and publish it.`)
      loadListings()
    } catch (err: any) {
      setMessage(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const statusLabel = (status: string) => {
    const info = STATUS_LABELS[status]
    return info ? (
      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${info.color}`}>{info.label}</span>
    ) : (
      <span className="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-mist text-muted">{status}</span>
    )
  }

  return (
    <AdminLayout
      title="Product Research & Physical Verification"
      subtitle="Strict verification pipeline: DISCOVERED → NEEDS VERIFICATION → VERIFIED → DRAFT → APPROVED → PUBLISHED"
      actions={
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="btn btn-emerald !h-9 text-xs font-bold shadow-xs"
        >
          <Plus className="h-4 w-4" /> Log Discovered Listing
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

      {/* Discovery Form Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-line bg-card p-6 shadow-xl">
            <h3 className="font-display text-base font-bold text-ink">Record Discovered Supplier Laptop</h3>
            <p className="mt-1 text-xs text-muted">
              Record publicly available supplier deals. This will NEVER be published until physically verified and approved by the owner.
            </p>

            <form onSubmit={handleAddDiscovery} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-muted">Hardware Title / Model *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Dell Latitude 7420 Core i7 16GB"
                  className="input mt-1.5 w-full text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-muted">Supplier / Shop Name</label>
                  <input
                    type="text"
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                    placeholder="e.g. Nairobi CBD Shop #14"
                    className="input mt-1.5 w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-muted">Advertised Price (KSh)</label>
                  <input
                    type="number"
                    value={form.advertised_price}
                    onChange={(e) => setForm({ ...form, advertised_price: e.target.value })}
                    placeholder="58000"
                    className="input mt-1.5 w-full text-xs font-bold text-teal"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-muted">Listing / Catalog URL</label>
                <input
                  type="url"
                  value={form.original_url}
                  onChange={(e) => setForm({ ...form, original_url: e.target.value })}
                  placeholder="https://..."
                  className="input mt-1.5 w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="CPU (e.g. i7-1185G7)"
                  value={form.cpu}
                  onChange={(e) => setForm({ ...form, cpu: e.target.value })}
                  className="input text-xs"
                />
                <input
                  type="text"
                  placeholder="RAM (e.g. 16GB)"
                  value={form.ram}
                  onChange={(e) => setForm({ ...form, ram: e.target.value })}
                  className="input text-xs"
                />
                <input
                  type="text"
                  placeholder="Storage (e.g. 512GB)"
                  value={form.storage}
                  onChange={(e) => setForm({ ...form, storage: e.target.value })}
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-muted">Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Observations about this listing..."
                  className="input mt-1.5 w-full py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-line pt-4">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="btn btn-outline !h-9 text-xs font-bold"
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn btn-emerald !h-9 text-xs font-bold shadow-xs">
                  Save Discovery Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Physical Verification Modal */}
      {verifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-line bg-card p-6 shadow-xl">
            <h3 className="font-display text-base font-bold text-ink">
              Submit Physical Verification: {verifyModal.title}
            </h3>
            <p className="mt-1 text-xs text-muted">
              Inspect the physical hardware in person before confirming supplier inventory.
            </p>

            <form onSubmit={handleRecordVerification} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-muted">Actual Negotiated / Verified Price (KSh)</label>
                <input
                  type="number"
                  value={verifyData.actual_price}
                  onChange={(e) => setVerifyData({ ...verifyData, actual_price: e.target.value })}
                  placeholder={String(verifyModal.advertised_price)}
                  className="input mt-1.5 w-full text-xs font-bold text-teal"
                />
              </div>

              <div>
                <label className="block font-bold text-muted">Physical Cosmetic Condition</label>
                <select
                  value={verifyData.condition}
                  onChange={(e) => setVerifyData({ ...verifyData, condition: e.target.value })}
                  className="input mt-1.5 w-full text-xs font-semibold"
                >
                  <option value="new">Brand New Sealed</option>
                  <option value="used_excellent">Grade A+ Pristine (No scratches)</option>
                  <option value="used_good">Grade A (Minor cosmetic wear)</option>
                  <option value="refurbished">Refurbished</option>
                  <option value="open_box">Open Box Ex-Demo</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-muted">Battery Health Check</label>
                <input
                  type="text"
                  value={verifyData.battery_health}
                  onChange={(e) => setVerifyData({ ...verifyData, battery_health: e.target.value })}
                  placeholder="e.g. 92% health, 32 cycles"
                  className="input mt-1.5 w-full text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-muted">Diagnostic Notes (Display, Ports, Keyboard, Charger)</label>
                <textarea
                  rows={3}
                  value={verifyData.notes}
                  onChange={(e) => setVerifyData({ ...verifyData, notes: e.target.value })}
                  className="input mt-1.5 w-full py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-line pt-4">
                <button
                  type="button"
                  onClick={() => setVerifyModal(null)}
                  className="btn btn-outline !h-9 text-xs font-bold"
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn btn-emerald !h-9 text-xs font-bold shadow-xs">
                  Record Verification Complete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Listings Table */}
      <div className="overflow-hidden rounded-xl border border-line bg-card shadow-xs">
        <div className="border-b border-line bg-mist px-5 py-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-bold text-ink">
            Research & Verification Pipeline ({listings.length})
          </h2>
          <span className="text-[11px] text-muted">Scraped data is never auto-published</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line text-[11px] font-extrabold uppercase text-muted">
              <tr>
                <th className="px-5 py-3">Product / Source</th>
                <th className="px-4 py-3">Advertised Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Discovered Date</th>
                <th className="px-4 py-3 text-right">Workflow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted font-semibold">
                    Loading research listings…
                  </td>
                </tr>
              ) : listings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted">
                    No research listings yet.
                  </td>
                </tr>
              ) : (
                listings.map((item) => {
                  const status = item.status || 'discovered'
                  return (
                    <tr key={item.id} className="hover:bg-mist/30">
                      <td className="px-5 py-3">
                        <p className="font-bold text-ink">{item.title}</p>
                        <p className="text-[11px] text-muted">{item.source_name || 'Public Market Scan'}</p>
                        {item.source_url && (
                          <a
                            href={item.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-teal hover:underline"
                          >
                            View source →
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3 font-extrabold text-teal">
                        {item.advertised_price != null ? formatKES(item.advertised_price) : '—'}
                      </td>
                      <td className="px-4 py-3">{statusLabel(status)}</td>
                      <td className="px-4 py-3 text-muted">{formatNairobi(item.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {status === 'discovered' && canManageResearch && (
                            <button
                              type="button"
                              onClick={() => handleTransitionStatus(item.id, 'needs_physical_verification')}
                              className="btn btn-emerald !h-7 px-2 text-[10px] font-bold"
                            >
                              Send to Physical Test
                            </button>
                          )}
                          {status === 'needs_physical_verification' && (
                            <button
                              type="button"
                              onClick={() => {
                                setVerifyModal(item)
                                setVerifyData((prev) => ({ ...prev, actual_price: String(item.advertised_price || 0) }))
                              }}
                              className="btn btn-emerald !h-7 px-2 text-[10px] font-bold"
                            >
                              Verify Physically
                            </button>
                          )}
                          {status === 'verified' && isOwner && (
                            <button
                              type="button"
                              onClick={() => handleTransitionStatus(item.id, 'approved')}
                              className="btn btn-emerald !h-7 px-2 text-[10px] font-bold"
                            >
                              Owner Approve Listing
                            </button>
                          )}
                          {status === 'verified' && canManageResearch && !isOwner && (
                            <button
                              type="button"
                              onClick={() => handlePromoteToDraft(item)}
                              className="btn btn-emerald !h-7 px-2 text-[10px] font-bold"
                            >
                              Promote to Draft
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleTransitionStatus(item.id, 'rejected')}
                            className="rounded p-1 text-muted hover:text-error"
                            title="Reject listing"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-line bg-mist p-4 text-[11px] text-muted">
        <div className="flex items-center gap-2 font-bold text-ink mb-2">
          <Compass className="h-4 w-4 text-teal" />
          <span>Workflow Rules:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Scraped listings start as <strong>Discovered</strong> — never visible to customers.</li>
          <li>Move to <strong>Needs Physical Verification</strong> after a hands-on inspection.</li>
          <li>Record <strong>Verified</strong> after confirming price, specs, and condition.</li>
          <li>Only Owner/Manager/Researcher can <strong>Promote to Draft</strong>, which creates a product record.</li>
          <li>Only the <strong>Owner</strong> can Approve and Publish products to the storefront.</li>
          <li>No scraped product is ever auto-published — every step requires manual review.</li>
        </ul>
      </div>
    </AdminLayout>
  )
}

