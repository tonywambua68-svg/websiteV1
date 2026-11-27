import { FormEvent, useEffect, useMemo, useState } from 'react'
import AdminLayout from './AdminLayout'
import { getSupabase } from '@/lib/supabase'
import { formatKES } from '@/lib/commerce'
import {
  Plus,
  Save,
  Trash2,
  Eye,
  Pencil,
  ArrowUp,
  ArrowDown,
  Search,
  X,
  LayoutGrid,
  GalleryHorizontalEnd,
  Image as ImageIcon,
} from 'lucide-react'

type Layout = 'carousel' | 'grid' | 'banner'

interface Section {
  id: string
  title: string
  subtitle: string | null
  layout: Layout
  product_ids: string[]
  banner_image: string | null
  banner_link: string | null
  cta_text: string | null
  position: number
  is_visible: boolean
  starts_at: string | null
  ends_at: string | null
}

interface ProductLite {
  id: string
  name: string
  slug: string
  selling_price: number
  image_url: string | null
}

const PLACEHOLDER = '/images/products/laptop-placeholder.svg'

const EMPTY_FORM = {
  title: '',
  subtitle: '',
  layout: 'carousel' as Layout,
  product_ids: [] as string[],
  banner_image: '',
  banner_link: '',
  cta_text: '',
  position: '100',
  is_visible: true,
  starts_at: '',
  ends_at: '',
}

function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16)
}

export default function AdminHomepageSections() {
  const [sections, setSections] = useState<Section[]>([])
  const [products, setProducts] = useState<ProductLite[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [search, setSearch] = useState('')
  const [preview, setPreview] = useState<Section | null>(null)

  const load = async () => {
    setLoading(true)
    setMessage(null)
    const supabase = getSupabase()
    if (!supabase) {
      setMessage('Database not configured.')
      setLoading(false)
      return
    }
    const [secRes, prodRes] = await Promise.all([
      supabase.from('homepage_sections').select('*').order('position', { ascending: true }),
      supabase
        .from('products')
        .select('id, name, slug, selling_price, image_url')
        .order('name')
        .limit(500),
    ])
    if (secRes.error) setMessage(`Could not load sections: ${secRes.error.message}`)
    else setSections((secRes.data ?? []) as Section[])
    if (prodRes.error) setMessage(`Could not load products: ${prodRes.error.message}`)
    else setProducts((prodRes.data ?? []) as ProductLite[])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const productMap = useMemo(() => {
    const m = new Map<string, ProductLite>()
    for (const p of products) m.set(p.id, p)
    return m
  }, [products])

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => p.name.toLowerCase().includes(q))
  }, [products, search])

  const resetForm = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setSearch('')
  }

  const edit = (s: Section) => {
    setEditingId(s.id)
    setForm({
      title: s.title,
      subtitle: s.subtitle ?? '',
      layout: s.layout,
      product_ids: s.product_ids ?? [],
      banner_image: s.banner_image ?? '',
      banner_link: s.banner_link ?? '',
      cta_text: s.cta_text ?? '',
      position: String(s.position),
      is_visible: s.is_visible,
      starts_at: toLocalInput(s.starts_at),
      ends_at: toLocalInput(s.ends_at),
    })
    setSearch('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleProduct = (id: string) => {
    setForm((prev) => ({
      ...prev,
      product_ids: prev.product_ids.includes(id)
        ? prev.product_ids.filter((x) => x !== id)
        : [...prev.product_ids, id],
    }))
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      setMessage('A section title is required.')
      return
    }
    setSaving(true)
    setMessage(null)
    const supabase = getSupabase()
    if (!supabase) {
      setMessage('Database not configured.')
      setSaving(false)
      return
    }
    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      layout: form.layout,
      product_ids: form.product_ids,
      banner_image: form.banner_image.trim() || null,
      banner_link: form.banner_link.trim() || null,
      cta_text: form.cta_text.trim() || null,
      position: Number(form.position) || 100,
      is_visible: form.is_visible,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      updated_at: new Date().toISOString(),
    }
    const { error } = editingId
      ? await supabase.from('homepage_sections').update(payload).eq('id', editingId)
      : await supabase.from('homepage_sections').insert(payload)
    if (error) setMessage(`Could not save: ${error.message}`)
    else {
      setMessage(editingId ? 'Section updated.' : 'Section created.')
      resetForm()
      await load()
    }
    setSaving(false)
  }

  const remove = async (id: string) => {
    if (!window.confirm('Delete this homepage section? This cannot be undone.')) return
    const supabase = getSupabase()
    if (!supabase) return
    const { error } = await supabase.from('homepage_sections').delete().eq('id', id)
    if (error) setMessage(`Could not delete: ${error.message}`)
    else {
      setMessage('Section deleted.')
      if (editingId === id) resetForm()
      await load()
    }
  }

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= sections.length) return
    const a = sections[index]
    const b = sections[target]
    const supabase = getSupabase()
    if (!supabase) return
    // Swap positions; fall back to index-based positions if equal.
    const aPos = a.position
    const bPos = b.position === a.position ? a.position + dir : b.position
    await Promise.all([
      supabase.from('homepage_sections').update({ position: bPos }).eq('id', a.id),
      supabase.from('homepage_sections').update({ position: aPos }).eq('id', b.id),
    ])
    await load()
  }

  const buildPreviewSection = (): Section => ({
    id: editingId ?? 'preview',
    title: form.title || 'Section Title',
    subtitle: form.subtitle || null,
    layout: form.layout,
    product_ids: form.product_ids,
    banner_image: form.banner_image || null,
    banner_link: form.banner_link || null,
    cta_text: form.cta_text || null,
    position: Number(form.position) || 100,
    is_visible: form.is_visible,
    starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
    ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
  })

  const LAYOUT_OPTIONS: Array<{ value: Layout; label: string; icon: any }> = [
    { value: 'carousel', label: 'Carousel', icon: GalleryHorizontalEnd },
    { value: 'grid', label: 'Grid', icon: LayoutGrid },
    { value: 'banner', label: 'Banner', icon: ImageIcon },
  ]

  return (
    <AdminLayout
      title="Homepage Sections"
      subtitle="Control the customer-facing homepage without editing code"
      actions={
        <button type="button" onClick={load} className="btn btn-outline !h-9 text-xs font-bold px-3">
          Refresh
        </button>
      }
    >
      <div className="space-y-5">
        {message && (
          <div className="rounded-lg border border-line bg-card px-4 py-3 text-sm text-ink">{message}</div>
        )}

        {/* EDITOR */}
        <form onSubmit={save} className="rounded-xl border border-line bg-card p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-ink">
              {editingId ? 'Edit Section' : 'New Section'}
            </h2>
            {editingId && (
              <button type="button" onClick={resetForm} className="text-xs font-bold text-muted hover:text-ink">
                Cancel edit
              </button>
            )}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Heading *</span>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                maxLength={120}
                className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                placeholder="e.g. Student Laptop Deals"
              />
            </label>

            <label className="sm:col-span-2">
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Description</span>
              <input
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                maxLength={300}
                className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                placeholder="Optional supporting line"
              />
            </label>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Layout</span>
              <div className="mt-1 flex gap-2">
                {LAYOUT_OPTIONS.map((opt) => {
                  const Icon = opt.icon
                  const active = form.layout === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm({ ...form, layout: opt.value })}
                      className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-bold transition ${
                        active ? 'border-emerald bg-emerald text-white' : 'border-line bg-white text-muted hover:text-ink'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" /> {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <label>
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Position (order)</span>
              <input
                type="number"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              />
            </label>

            <label>
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Banner image URL</span>
              <input
                value={form.banner_image}
                onChange={(e) => setForm({ ...form, banner_image: e.target.value })}
                className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                placeholder="https://… (optional)"
              />
            </label>

            <label>
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted">CTA button link</span>
              <input
                value={form.banner_link}
                onChange={(e) => setForm({ ...form, banner_link: e.target.value })}
                className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                placeholder="/shop?category=laptops"
              />
            </label>

            <label>
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted">CTA button text</span>
              <input
                value={form.cta_text}
                onChange={(e) => setForm({ ...form, cta_text: e.target.value })}
                className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                placeholder="Shop now"
              />
            </label>

            <label>
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Starts (optional)</span>
              <input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              />
            </label>

            <label>
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Ends (optional)</span>
              <input
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              />
            </label>
          </div>

          {/* Product selector */}
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted">
                Products ({form.product_ids.length} selected)
              </span>
              {form.product_ids.length > 0 && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, product_ids: [] })}
                  className="text-[11px] font-bold text-muted hover:text-ink"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-line bg-white py-2 pl-9 pr-3 text-sm text-ink outline-none focus:border-primary"
                placeholder="Search products by name"
              />
            </div>
            <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-line">
              {filteredProducts.length === 0 ? (
                <p className="p-3 text-xs text-muted">No products found.</p>
              ) : (
                filteredProducts.map((p) => {
                  const checked = form.product_ids.includes(p.id)
                  return (
                    <label
                      key={p.id}
                      className={`flex cursor-pointer items-center gap-3 border-b border-line px-3 py-2 last:border-b-0 ${
                        checked ? 'bg-emerald/5' : 'hover:bg-mist'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleProduct(p.id)}
                        className="h-4 w-4 accent-emerald"
                      />
                      <img src={p.image_url || PLACEHOLDER} alt="" className="h-9 w-9 rounded object-contain" />
                      <span className="min-w-0 flex-1 truncate text-xs text-ink">{p.name}</span>
                      <span className="shrink-0 text-xs font-bold text-ink">{formatKES(p.selling_price)}</span>
                    </label>
                  )
                })
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-xs font-bold text-ink">
              <input
                type="checkbox"
                checked={form.is_visible}
                onChange={(e) => setForm({ ...form, is_visible: e.target.checked })}
                className="h-4 w-4 accent-emerald"
              />
              Visible on homepage
            </label>
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={() => setPreview(buildPreviewSection())}
                className="btn btn-outline !h-9 text-xs font-bold px-3"
              >
                <Eye className="h-3.5 w-3.5" /> Preview
              </button>
              <button type="submit" disabled={saving} className="btn btn-primary !h-9 text-xs font-bold px-4 disabled:opacity-50">
                <Save className="h-3.5 w-3.5" /> {editingId ? 'Save changes' : 'Create section'}
              </button>
            </div>
          </div>
        </form>

        {/* LIST */}
        <div className="rounded-xl border border-line bg-card">
          <div className="border-b border-line px-4 py-3">
            <h2 className="font-display text-sm font-bold text-ink">Live Sections ({sections.length})</h2>
          </div>
          {loading ? (
            <p className="p-6 text-center text-sm text-muted">Loading…</p>
          ) : sections.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">
              No sections yet. Create one above to customise the homepage.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {sections.map((s, i) => (
                <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className="text-muted hover:text-ink disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === sections.length - 1}
                      className="text-muted hover:text-ink disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-bold text-ink">{s.title}</p>
                      <span className="rounded bg-mist px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted">
                        {s.layout}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase ${
                          s.is_visible ? 'bg-emerald/10 text-emerald' : 'bg-mist text-muted'
                        }`}
                      >
                        {s.is_visible ? 'Visible' : 'Hidden'}
                      </span>
                      {(s.starts_at || s.ends_at) && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                          Scheduled
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted">
                      {s.product_ids.length} products · position {s.position}
                    </p>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreview(s)}
                      className="btn btn-outline !h-8 px-2 text-[11px] font-bold"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => edit(s)}
                      className="btn btn-outline !h-8 px-2 text-[11px] font-bold"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(s.id)}
                      className="btn btn-outline !h-8 px-2 text-[11px] font-bold text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {preview && (
        <PreviewModal section={preview} productMap={productMap} onClose={() => setPreview(null)} />
      )}
    </AdminLayout>
  )
}

function PreviewModal({
  section,
  productMap,
  onClose,
}: {
  section: Section
  productMap: Map<string, ProductLite>
  onClose: () => void
}) {
  const items = section.product_ids.map((id) => productMap.get(id)).filter(Boolean) as ProductLite[]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-page p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Preview</p>
          <button type="button" onClick={onClose} className="text-muted hover:text-ink" aria-label="Close preview">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-line bg-white">
          {section.banner_image && (
            <img src={section.banner_image} alt="" className="h-32 w-full object-cover" />
          )}
          <div className="p-4">
            <h3 className="font-display text-lg font-bold text-ink">{section.title}</h3>
            {section.subtitle && <p className="text-xs text-muted">{section.subtitle}</p>}
            {section.cta_text && (
              <span className="btn btn-primary mt-2 !h-8 text-[11px] font-bold">{section.cta_text}</span>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <p className="mt-4 text-center text-xs text-muted">No products selected for this section.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((p) => (
              <div key={p.id} className="overflow-hidden rounded-xl border border-line bg-white">
                <div className="aspect-square border-b border-line p-2">
                  <img src={p.image_url || PLACEHOLDER} alt={p.name} className="h-full w-full object-contain" />
                </div>
                <div className="p-2">
                  <p className="line-clamp-2 min-h-[2.4em] text-xs font-semibold text-ink">{p.name}</p>
                  <p className="text-sm font-extrabold text-ink">{formatKES(p.selling_price)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}