import { useEffect, useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import { getSupabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { formatKES, slugify } from '@/lib/commerce'
import { Plus, Search, Edit, Trash2, Eye, CheckCircle2, AlertCircle, ShieldCheck, RefreshCw, Upload, FileText, XCircle } from 'lucide-react'
import { downloadCsv } from '@/lib/csv'

const PLACEHOLDER = '/images/products/laptop-placeholder.svg'

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: 'bg-mist text-muted' },
  { value: 'pending_approval', label: 'Pending Approval', color: 'bg-amber/15 text-amberdeep' },
  { value: 'approved', label: 'Approved', color: 'bg-teal/15 text-tealdeep' },
  { value: 'published', label: 'Published', color: 'bg-mint text-tealdeep' },
  { value: 'rejected', label: 'Rejected', color: 'bg-error/15 text-error' },
  { value: 'archived', label: 'Archived', color: 'bg-line text-muted' },
] as const

type ProductRow = {
  id: string
  slug: string
  name: string
  model: string | null
  description: string
  category_id: string
  brand_id: string | null
  selling_price: number
  comparison_price: number | null
  laptop_condition: string
  publication_status: string
  featured: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
  category_name: string | null
  brand_name: string | null
  owned_available: number
  supplier_available: number
  image_url: string | null
}

export default function AdminProducts() {
  const { user, logout } = useAuthStore()
  const isOwner = user?.role === 'owner'
  const navigate = useNavigate()
  const [products, setProducts] = useState<ProductRow[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
const [bulkModal, setBulkModal] = useState(false)
const [bulkField, setBulkField] = useState<'price' | 'category' | 'brand' | 'availability' | 'status' | 'archive'>('price')
const [bulkValue, setBulkValue] = useState('')
const [csvModal, setCsvModal] = useState(false)
const [csvFile, setCsvFile] = useState<File | null>(null)
const [csvPreview, setCsvPreview] = useState<Array<Record<string, string>>>([])
const [csvErrors, setCsvErrors] = useState<string[]>([])
const [csvImporting, setCsvImporting] = useState(false)

  const loadProducts = async () => {
    const supabase = getSupabase()
    if (!supabase) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, slug, name, model, description, category_id, brand_id,
          selling_price, comparison_price, laptop_condition, publication_status,
          featured, created_at, updated_at, deleted_at,
          categories(name),
          brands(name),
          inventory_balances(owned_qty, supplier_qty, reserved_qty),
          product_images(url, is_primary, sort_order)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) {
        setProducts(
          (data as any[]).map((p) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            model: p.model,
            description: p.description,
            category_id: p.category_id,
            brand_id: p.brand_id,
            selling_price: Number(p.selling_price),
            comparison_price: p.comparison_price ? Number(p.comparison_price) : null,
            laptop_condition: p.laptop_condition,
            publication_status: p.publication_status,
            featured: p.featured,
            created_at: p.created_at,
            updated_at: p.updated_at,
            deleted_at: p.deleted_at,
            category_name: p.categories?.name || null,
            brand_name: p.brands?.name || null,
            owned_available: Math.max(0, (p.inventory_balances?.[0]?.owned_qty || 0) - (p.inventory_balances?.[0]?.reserved_qty || 0)),
            supplier_available: Math.max(0, (p.inventory_balances?.[0]?.supplier_qty || 0) - (p.inventory_balances?.[0]?.supplier_reserved_qty || 0)),
            image_url:
              p.product_images
                ?.filter((img: any) => img.is_primary)
                .sort((a: any, b: any) => a.sort_order - b.sort_order)[0]?.url ||
              p.product_images?.[0]?.url ||
              null,
          }))
        )
      }
    } catch (err: any) {
      setMessage(`Error loading products: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === products.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(products.map((p) => p.id)))
    }
  }

  const filtered = products.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand_name && p.brand_name.toLowerCase().includes(search.toLowerCase())) ||
      (p.category_name && p.category_name.toLowerCase().includes(search.toLowerCase()))
    const matchStatus = statusFilter === 'all' || p.publication_status === statusFilter
    const notArchived = statusFilter !== 'archived_only'
    return matchSearch && matchStatus && (p.publication_status !== 'archived' || statusFilter === 'archived')
  })

  const handleArchive = async (id: string, name: string) => {
    if (!window.confirm(`Archive "${name}"? This hides it from the storefront.`)) return
    const supabase = getSupabase()
    if (!supabase) return
    try {
      const { error } = await supabase.from('products').update({ deleted_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
      setMessage(`"${name}" archived.`)
      loadProducts()
    } catch (err: any) {
      setMessage(`Error: ${err.message}`)
    }
  }

  const handlePublish = async (id: string, name: string) => {
    const supabase = getSupabase()
    if (!supabase) return
    try {
      const { error } = await supabase.rpc('decide_product', { p_id: id, p_decision: 'published', p_note: 'Published from admin panel' })
      if (error) throw error
      setMessage(`"${name}" published.`)
      loadProducts()
    } catch (err: any) {
      setMessage(`Error: ${err.message}`)
    }
  }

  const handleApprove = async (id: string, name: string) => {
    const supabase = getSupabase()
    if (!supabase) return
    try {
      const { error } = await supabase.rpc('decide_product', { p_id: id, p_decision: 'approved', p_note: 'Approved from admin panel' })
      if (error) throw error
      setMessage(`"${name}" approved.`)
      loadProducts()
    } catch (err: any) {
      setMessage(`Error: ${err.message}`)
    }
  }

  const handleBulkSave = async (e: FormEvent) => {
    e.preventDefault()
    if (selected.size === 0) return
    const supabase = getSupabase()
    if (!supabase) return
    setLoading(true)
    const ids = Array.from(selected)
    try {
      let update: Record<string, unknown> = {}
      if (bulkField === 'price') {
        const price = Number(bulkValue)
        if (!Number.isFinite(price) || price < 0) throw new Error('Invalid price')
        update = { selling_price: price }
      } else if (bulkField === 'status') {
        update = { publication_status: bulkValue }
      } else if (bulkField === 'archive') {
        update = { deleted_at: new Date().toISOString() }
      }
      // Category and brand bulk updates would need lookups; keep simple for safety
      const { error } = await supabase.from('products').update(update).in('id', ids)
      if (error) throw error
      setMessage(`Bulk update applied to ${ids.length} product(s).`)
      setSelected(new Set())
      setBulkModal(false)
      loadProducts()
    } catch (err: any) {
      setMessage(`Bulk update error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const exportCsv = () => {
    const rows = filtered.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      model: p.model || '',
      category: p.category_name || '',
      brand: p.brand_name || '',
      selling_price: p.selling_price,
      comparison_price: p.comparison_price || '',
      condition: p.laptop_condition,
      publication_status: p.publication_status,
      owned_available: p.owned_available,
      supplier_available: p.supplier_available,
      image_url: p.image_url || '',
    }))
    downloadCsv(`OREMITECH_products_${new Date().toISOString().slice(0, 10)}.csv`, rows)
    setMessage('Product CSV exported.')
  }

  const downloadSampleCsv = () => {
    const sampleRows = [
      {
        name: 'HP EliteBook 840 G8',
        slug: 'hp-elitebook-840-g8',
        category: 'Laptops',
        brand: 'HP',
        selling_price: '85000',
        comparison_price: '95000',
        condition: 'refurbished',
        description: 'Core i7 11th Gen, 16GB RAM, 512GB SSD, 14-inch FHD, Windows 11 Pro',
      },
      {
        name: 'Dell Latitude 5430',
        slug: 'dell-latitude-5430',
        category: 'Business Laptops',
        brand: 'Dell',
        selling_price: '72000',
        comparison_price: '',
        condition: 'used_excellent',
        description: 'Core i5 12th Gen, 8GB RAM, 256GB SSD, 14-inch FHD, Windows 10 Pro',
      },
      {
        name: 'Apple MacBook Pro M1',
        slug: 'apple-macbook-pro-m1',
        category: 'Laptops',
        brand: 'Apple',
        selling_price: '110000',
        comparison_price: '135000',
        condition: 'open_box',
        description: 'Apple M1 chip, 8GB RAM, 256GB SSD, 13.3-inch Retina, macOS',
      },
    ]
    downloadCsv('OREMITECH_sample_products_template.csv', sampleRows)
    setMessage('Sample CSV template downloaded. Use it as a format reference for bulk import.')
  }

  const parseCsv = (text: string): Array<Record<string, string>> => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''))
    return lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim().replace(/"/g, ''))
      const row: Record<string, string> = {}
      headers.forEach((h, i) => {
        row[h] = values[i] || ''
      })
      return row
    })
  }

  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const parsed = parseCsv(text)
      setCsvPreview(parsed)
      // Validate
      const errors: string[] = []
      parsed.forEach((row, idx) => {
        if (!row.name) errors.push(`Row ${idx + 2}: Missing product name`)
        if (!row.selling_price || isNaN(Number(row.selling_price))) errors.push(`Row ${idx + 2}: Invalid selling price`)
        if (!row.category) errors.push(`Row ${idx + 2}: Missing category`)
      })
      setCsvErrors(errors)
    }
    reader.readAsText(file)
  }

  const handleCsvImport = async () => {
    if (!csvFile || csvPreview.length === 0 || csvErrors.length > 0) return
    const supabase = getSupabase()
    if (!supabase) return
    setCsvImporting(true)
    try {
      // Fetch categories and brands for lookups
      const [catRes, brandRes] = await Promise.all([
        supabase.from('categories').select('id, name, slug'),
        supabase.from('brands').select('id, name, slug'),
      ])
      const categories = catRes.data ?? []
      const brands = brandRes.data ?? []

      const successes: string[] = []
      const failures: string[] = []

      for (const row of csvPreview) {
        const catName = row.category || row.Category || ''
        const brandName = row.brand || row.Brand || ''
        const cat = categories.find((c) => c.name.toLowerCase() === catName.toLowerCase() || c.slug === catName.toLowerCase())
        const brand = brands.find((b) => b.name.toLowerCase() === brandName.toLowerCase() || b.slug === brandName.toLowerCase())
        if (!cat) {
          failures.push(`${row.name || 'unknown'}: Category "${catName}" not found`)
          continue
        }
        const slug = row.slug || row.Slug || slugify(row.name || '')
        const sellingPrice = Number(row.selling_price || row['Selling Price'] || 0)
        const { error } = await supabase.from('products').insert({
          slug,
          name: row.name || row.Name || '',
          description: row.description || row.Description || '',
          category_id: cat.id,
          brand_id: brand?.id || null,
          selling_price: Number.isFinite(sellingPrice) ? sellingPrice : 0,
          laptop_condition: row.condition || row.Condition || 'unspecified',
          publication_status: 'draft',
        })
        if (error) {
          failures.push(`${row.name || 'unknown'}: ${error.message}`)
        } else {
          successes.push(row.name || 'unknown')
        }
      }

      setCsvImporting(false)
      setCsvModal(false)
      setCsvFile(null)
      setCsvPreview([])
      setCsvErrors([])
      loadProducts()
      setMessage(`Imported ${successes.length} product(s)${failures.length > 0 ? `, ${failures.length} failed` : ''}.`)
      if (failures.length > 0) {
        console.warn('CSV import failures:', failures)
      }
    } catch (err: any) {
      setCsvImporting(false)
      setMessage(`CSV import error: ${err.message}`)
    }
  }

  const statusLabel = (status: string) => {
    const opt = STATUS_OPTIONS.find((o) => o.value === status)
    return opt ? <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${opt.color}`}>{opt.label}</span> : <span className="text-[10px] text-muted">{status}</span>
  }

  return (
    <AdminLayout
      title="Product Catalogue Management"
      subtitle="Create, edit, approve, publish, and archive products. Staff roles per RLS policy."
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setCsvFile(null); setCsvPreview([]); setCsvErrors([]); setCsvModal(true) }}
            className="btn btn-emerald !h-9 gap-1.5 text-xs font-bold"
          >
            <Upload className="h-3.5 w-3.5" /> Import CSV
          </button>
          <button
            type="button"
            onClick={downloadSampleCsv}
            className="btn btn-emerald !h-9 gap-1.5 text-xs font-bold"
          >
            <FileText className="h-3.5 w-3.5" /> Download Template
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="btn btn-emerald !h-9 gap-1.5 text-xs font-bold"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Export CSV
          </button>
          <Link to="/admin/products/new" className="btn btn-emerald !h-9 text-xs font-bold shadow-xs">
            <Plus className="h-4 w-4" /> Add Product
          </Link>
        </div>
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

      {/* Bulk selection bar */}
      {selected.size > 0 && (
        <div className="mb-4 rounded-xl border border-teal/30 bg-mint/50 p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-tealdeep">
            <span>{selected.size} product(s) selected</span>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-muted hover:text-ink"
            >
              Clear selection
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setBulkField('price')
                setBulkValue('')
                setBulkModal(true)
              }}
              className="btn btn-emerald !h-8 text-[10px] font-bold"
            >
              Bulk Price
            </button>
            <button
              type="button"
              onClick={() => {
                setBulkField('status')
                setBulkValue('')
                setBulkModal(true)
              }}
              className="btn btn-emerald !h-8 text-[10px] font-bold"
            >
              Bulk Status
            </button>
            <button
              type="button"
              onClick={() => {
                setBulkField('archive')
                setBulkModal(true)
              }}
              className="btn btn-emerald !h-8 text-[10px] font-bold"
            >
              Archive Selected
            </button>
          </div>
        </div>
      )}

      {/* Bulk edit modal */}
      {bulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-line bg-card p-6 shadow-xl">
            <h3 className="font-display text-base font-bold text-ink">Bulk Update {selected.size} Product(s)</h3>
            <form onSubmit={handleBulkSave} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-muted">Field to Update *</label>
                <select
                  value={bulkField}
                  onChange={(e) => setBulkField(e.target.value as any)}
                  className="input mt-1.5 w-full text-xs font-semibold"
                >
                  <option value="price">Selling Price (KES)</option>
                  <option value="status">Publication Status</option>
                  <option value="archive">Archive (soft-delete)</option>
                </select>
              </div>
              {bulkField === 'price' && (
                <div>
                  <label className="block font-bold text-muted">New Selling Price (KES) *</label>
                  <input
                    type="number"
                    required
                    value={bulkValue}
                    onChange={(e) => setBulkValue(e.target.value)}
                    placeholder="85000"
                    className="input mt-1.5 w-full text-xs font-bold text-teal"
                  />
                </div>
              )}
              {bulkField === 'status' && (
                <div>
                  <label className="block font-bold text-muted">New Publication Status *</label>
                  <select
                    value={bulkValue}
                    onChange={(e) => setBulkValue(e.target.value)}
                    className="input mt-1.5 w-full text-xs font-semibold"
                  >
                    <option value="draft">Draft</option>
                    <option value="pending_approval">Pending Approval</option>
                    <option value="approved">Approved</option>
                    <option value="published">Published</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              )}
              <div className="border-t border-line pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBulkModal(false)}
                  className="btn btn-outline !h-9 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || (bulkField === 'price' && !bulkValue) || (bulkField === 'status' && !bulkValue)}
                  className="btn btn-emerald !h-9 text-xs font-bold shadow-xs"
                >
                  {loading ? 'Applying…' : 'Apply to Selected'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-card p-4 shadow-xs mb-6">
        <div className="relative flex-1 sm:max-w-xs">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, slug, brand, or category…"
            className="input !h-9 w-full pr-8 text-xs"
          />
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-muted">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="input !h-9 text-xs font-semibold"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="published">Published</option>
            <option value="rejected">Rejected</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-xl border border-line bg-card shadow-xs">
        <div className="border-b border-line bg-mist px-5 py-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-bold text-ink">Products ({filtered.length})</h2>
          <span className="text-[11px] text-muted">UUID-based identifiers · slugs for public URLs</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line text-[11px] font-extrabold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 text-center">
                  {selected.size > 0 ? (
                    <input
                      type="checkbox"
                      checked={selected.size === products.length && products.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded text-teal"
                    />
                  ) : null}
                </th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Brand & Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted font-semibold">
                    Loading products…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted">
                    No products matched your search.
                  </td>
                </tr>
              ) : (
                filtered.map((product) => {
                  const isSelected = selected.has(product.id)
                  return (
                    <tr key={product.id} className="hover:bg-mist/50">
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(product.id)}
                          className="h-4 w-4 rounded text-teal"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image_url || PLACEHOLDER}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-lg border border-line bg-mist object-contain p-1"
                            onError={(e) => {
                              e.currentTarget.src = PLACEHOLDER
                            }}
                          />
                          <div className="min-w-0 max-w-xs">
                            <p className="truncate font-bold text-ink">{product.name}</p>
                            <p className="text-[11px] text-muted">Slug: {product.slug}</p>
                            {product.model && <p className="text-[10px] text-muted">Model: {product.model}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-ink">{product.brand_name || 'Generic'}</p>
                        <p className="text-[11px] text-muted">{product.category_name || 'Uncategorized'}</p>
                      </td>
                      <td className="px-4 py-3 font-extrabold text-ink">{formatKES(product.selling_price)}</td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-ink">{product.owned_available} owned</span>
                        {product.supplier_available > 0 && (
                          <span className="block text-[10px] text-teal">+{product.supplier_available} supplier</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{statusLabel(product.publication_status)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/product/${product.slug}`}
                            target="_blank"
                            className="rounded p-1 text-muted hover:text-teal"
                            title="View on site"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/admin/products/edit/${product.id}`}
                            className="rounded p-1 text-muted hover:text-ink"
                            title="Edit product"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          {product.publication_status === 'approved' && isOwner && (
                            <button
                              type="button"
                              onClick={() => handlePublish(product.id, product.name)}
                              className="rounded p-1 text-tealdeep hover:bg-mint/50"
                              title="Publish"
                            >
                              <ShieldCheck className="h-4 w-4" />
                            </button>
                          )}
                          {product.publication_status === 'pending_approval' && isOwner && (
                            <button
                              type="button"
                              onClick={() => handleApprove(product.id, product.name)}
                              className="rounded p-1 text-teal hover:bg-mint/50"
                              title="Approve"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleArchive(product.id, product.name)}
                            className="rounded p-1 text-muted hover:text-error"
                            title="Archive product"
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* CSV Import Modal */}
      {csvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-line bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-base font-bold text-ink">Import Products from CSV</h3>
              <button
                type="button"
                onClick={() => setCsvModal(false)}
                className="rounded-lg p-1 text-muted hover:text-ink"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-muted mb-4">
              CSV columns: name, slug, category, brand, selling_price, condition, description. New products are created as Draft.
            </p>
            <div>
              <label className="block font-bold text-muted mb-1">Select CSV File</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvFile}
                className="block w-full text-xs text-muted file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-teal file:text-tealdeep hover:file:bg-tealdeep"
              />
            </div>
            {csvFile && (
              <div className="mt-4">
                <p className="text-xs font-bold text-ink mb-1">Preview ({csvPreview.length} rows)</p>
                {csvErrors.length > 0 && (
                  <div className="rounded bg-error/10 border border-error/20 p-2 text-xs text-error mb-2">
                    {csvErrors.slice(0, 5).map((e, i) => (
                      <div key={i}>{e}</div>
                    ))}
                    {csvErrors.length > 5 && <div className="text-[10px]">…and {csvErrors.length - 5} more</div>}
                  </div>
                )}
                <div className="overflow-x-auto max-h-48 overflow-y-auto border border-line rounded mb-3">
                  <table className="w-full text-left text-[10px]">
                    <thead className="bg-mist">
                      <tr>
                        {Object.keys(csvPreview[0] || {}).map((h) => (
                          <th key={h} className="px-2 py-1 font-bold text-muted">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.slice(0, 10).map((row, i) => (
                        <tr key={i} className="border-b border-line/50">
                          {Object.values(row).map((v, j) => (
                            <td key={j} className="px-2 py-1 truncate max-w-xs">{v}</td>
                          ))}
                        </tr>
                      ))}
                      {csvPreview.length > 10 && (
                        <tr>
                          <td colSpan={Object.keys(csvPreview[0] || {}).length} className="px-2 py-1 text-[10px] text-muted">
                            …and {csvPreview.length - 10} more rows
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCsvModal(false)}
                  className="btn btn-outline !h-9 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCsvImport}
                  disabled={csvImporting || csvErrors.length > 0}
                  className="btn btn-emerald !h-9 text-xs font-bold shadow-xs"
                >
                    {csvImporting ? 'Importing…' : 'Import Products'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

