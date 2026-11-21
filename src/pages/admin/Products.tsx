import { useEffect, useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import { getSupabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { formatKES, slugify } from '@/lib/commerce'
import { Plus, Search, Edit, Trash2, Eye, CheckCircle2, AlertCircle, ShieldCheck, RefreshCw, Upload, FileText, XCircle, Undo2 } from 'lucide-react'
import { downloadCsv } from '@/lib/csv'
import { generateProductSeo } from '@/lib/productSeo'

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
    const selectable = filtered.filter((product) => !product.deleted_at)
    if (selected.size === selectable.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(selectable.map((product) => product.id)))
    }
  }

  const filtered = products.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand_name && p.brand_name.toLowerCase().includes(search.toLowerCase())) ||
      (p.category_name && p.category_name.toLowerCase().includes(search.toLowerCase()))
    const showRemoved = statusFilter === 'removed'
    const matchRemoval = showRemoved ? Boolean(p.deleted_at) : !p.deleted_at
    const matchStatus = statusFilter === 'all' || showRemoved || p.publication_status === statusFilter
    return matchSearch && matchStatus && matchRemoval
  })

  const handleArchive = async (id: string, name: string) => {
    if (!isOwner) {
      setMessage('Only the Owner can remove a product from the storefront.')
      return
    }
    if (!window.confirm(`Remove "${name}" from the storefront? It will stop showing and selling, while existing order history is kept. You can restore it later.`)) return
    const supabase = getSupabase()
    if (!supabase) return
    try {
      const { error } = await supabase.from('products').update({ deleted_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
      setSelected((previous) => { const next = new Set(previous); next.delete(id); return next })
      setMessage(`"${name}" was removed from the storefront. Its order history is preserved.`)
      await loadProducts()
    } catch (err: any) {
      setMessage(`Error: ${err.message}`)
    }
  }

  const handleRestore = async (id: string, name: string) => {
    if (!isOwner) return
    const supabase = getSupabase()
    if (!supabase) return
    try {
      const { error } = await supabase.from('products').update({ deleted_at: null }).eq('id', id)
      if (error) throw error
      setMessage(`"${name}" restored to active products. Review its publication status before making it available for sale.`)
      await loadProducts()
    } catch (error: any) {
      setMessage(`Could not restore product: ${error.message}`)
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
    if (bulkField === 'archive' && !isOwner) {
      setMessage('Only the Owner can remove products from the storefront.')
      return
    }
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
        model: 'EliteBook 840 G8',
        selling_price: '85000',
        comparison_price: '95000',
        condition: 'refurbished',
        description: 'Core i7 11th Gen, 16GB RAM, 512GB SSD, 14-inch FHD, Windows 11 Pro',
        processor_manufacturer: 'Intel',
        processor_model: 'Core i7 11th Gen',
        ram: '16GB',
        ram_type: 'DDR4',
        storage_capacity: '512GB',
        storage_type: 'SSD',
        screen_size: '14-inch FHD',
        operating_system: 'Windows 11 Pro',
        warranty: '6 months',
        initial_stock: '1',
        seo_title: '',
        seo_description: '',
        seo_focus_keyword: '',
        seo_secondary_keywords: '',
        seo_social_title: '',
        seo_social_description: '',
      },
      {
        name: 'Dell Latitude 5430',
        slug: 'dell-latitude-5430',
        category: 'Business Laptops',
        brand: 'Dell',
        model: 'Latitude 5430',
        selling_price: '72000',
        comparison_price: '',
        condition: 'used_excellent',
        description: 'Core i5 12th Gen, 8GB RAM, 256GB SSD, 14-inch FHD, Windows 10 Pro',
        processor_manufacturer: 'Intel',
        processor_model: 'Core i5 12th Gen',
        ram: '8GB',
        ram_type: 'DDR4',
        storage_capacity: '256GB',
        storage_type: 'SSD',
        screen_size: '14-inch FHD',
        operating_system: 'Windows 10 Pro',
        warranty: '3 months',
        initial_stock: '1',
        seo_title: '',
        seo_description: '',
        seo_focus_keyword: '',
        seo_secondary_keywords: '',
        seo_social_title: '',
        seo_social_description: '',
      },
      {
        name: 'Apple MacBook Pro M1',
        slug: 'apple-macbook-pro-m1',
        category: 'Laptops',
        brand: 'Apple',
        model: 'MacBook Pro M1',
        selling_price: '110000',
        comparison_price: '135000',
        condition: 'open_box',
        description: 'Apple M1 chip, 8GB RAM, 256GB SSD, 13.3-inch Retina, macOS',
        processor_manufacturer: 'Apple',
        processor_model: 'M1',
        ram: '8GB',
        ram_type: 'Unified Memory',
        storage_capacity: '256GB',
        storage_type: 'SSD',
        screen_size: '13.3-inch Retina',
        operating_system: 'macOS',
        warranty: '3 months',
        initial_stock: '1',
        seo_title: '',
        seo_description: '',
        seo_focus_keyword: '',
        seo_secondary_keywords: '',
        seo_social_title: '',
        seo_social_description: '',
      },
    ]
    downloadCsv('OREMITECH_sample_products_template.csv', sampleRows)
    setMessage('Sample CSV template downloaded. Use it as a format reference for bulk import.')
  }

  const parseCsv = (text: string): Array<Record<string, string>> => {
    const records: string[][] = []
    let record: string[] = []
    let cell = ''
    let quoted = false
    for (let i = 0; i < text.length; i += 1) {
      const character = text[i]
      if (character === '"') {
        if (quoted && text[i + 1] === '"') {
          cell += '"'
          i += 1
        } else quoted = !quoted
      } else if (character === ',' && !quoted) {
        record.push(cell.trim())
        cell = ''
      } else if ((character === '\n' || character === '\r') && !quoted) {
        if (character === '\r' && text[i + 1] === '\n') i += 1
        record.push(cell.trim())
        if (record.some((value) => value !== '')) records.push(record)
        record = []
        cell = ''
      } else cell += character
    }
    record.push(cell.trim())
    if (record.some((value) => value !== '')) records.push(record)
    if (records.length < 2) return []

    const headers = records[0].map((header) => header.replace(/^\uFEFF/, '').trim().toLowerCase().replace(/[\s-]+/g, '_'))
    return records.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ''])))
  }

  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const parsed = parseCsv(text).map((row) => {
        const seo = generateProductSeo({
          name: row.name || '',
          model: row.model,
          brand: row.brand,
          condition: row.condition,
          processor: row.processor_model,
          ram: row.ram,
          storage: row.storage_capacity,
          category: row.category,
          warranty: row.warranty,
        })
        return {
          ...row,
          slug: row.slug || seo.slug,
          seo_title: row.seo_title || seo.seo_title,
          seo_description: row.seo_description || seo.seo_description,
          seo_focus_keyword: row.seo_focus_keyword || seo.seo_focus_keyword,
          seo_secondary_keywords: row.seo_secondary_keywords || seo.seo_secondary_keywords,
          seo_social_title: row.seo_social_title || seo.seo_social_title,
          seo_social_description: row.seo_social_description || seo.seo_social_description,
        }
      })
      setCsvPreview(parsed)
      setCsvErrors(validateCsvRows(parsed))
    }
    reader.readAsText(file)
  }

  const updateCsvField = (index: number, field: string, value: string) => {
    const next = csvPreview.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row)
    setCsvPreview(next)
    setCsvErrors(validateCsvRows(next))
  }

  const validateCsvRows = (rows: Array<Record<string, string>>) => {
    const errors: string[] = []
    rows.forEach((row, index) => {
      if (!row.name) errors.push(`Row ${index + 2}: Missing product name`)
      if (!row.selling_price || !Number.isFinite(Number(row.selling_price)) || Number(row.selling_price) <= 0) errors.push(`Row ${index + 2}: Enter a valid selling price greater than zero`)
      if (!row.category) errors.push(`Row ${index + 2}: Missing product category`)
      if ((row.seo_title || '').length > 60) errors.push(`Row ${index + 2}: SEO title must be 60 characters or less`)
      if ((row.seo_description || '').length > 160) errors.push(`Row ${index + 2}: SEO description must be 160 characters or less`)
      if (!row.slug?.trim()) errors.push(`Row ${index + 2}: Add a URL slug`)
      if (row.initial_stock && (!Number.isInteger(Number(row.initial_stock)) || Number(row.initial_stock) < 0)) errors.push(`Row ${index + 2}: Initial stock must be a whole number of zero or more`)
      if (row.comparison_price && (!Number.isFinite(Number(row.comparison_price)) || Number(row.comparison_price) <= Number(row.selling_price))) {
        errors.push(`Row ${index + 2}: Comparison price must be greater than the selling price`)
      }
    })
    const slugs = rows.map((row) => row.slug.toLowerCase())
    if (new Set(slugs).size !== slugs.length) errors.push('Two or more products use the same URL slug. Give each product a unique slug.')
    return errors
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
      if (catRes.error) throw catRes.error
      if (brandRes.error) throw brandRes.error
      const categories = catRes.data ?? []
      const brands = brandRes.data ?? []

      const successes: string[] = []
      const failures: string[] = []

      for (const row of csvPreview) {
        const catName = row.category || ''
        const brandName = row.brand || ''
        const cat = categories.find((c) => c.name.toLowerCase() === catName.toLowerCase() || c.slug === catName.toLowerCase())
        const brand = brands.find((b) => b.name.toLowerCase() === brandName.toLowerCase() || b.slug === brandName.toLowerCase())
        if (!cat) {
          failures.push(`${row.name || 'unknown'}: Category "${catName}" not found`)
          continue
        }
        if (brandName && !brand) {
          failures.push(`${row.name}: Brand "${brandName}" was not found. Choose an existing brand or leave the brand blank.`)
          continue
        }
        const slug = row.slug || slugify(row.name || '')
        const sellingPrice = Number(row.selling_price || 0)
        const comparisonPrice = row.comparison_price ? Number(row.comparison_price) : null
        if (comparisonPrice !== null && (!Number.isFinite(comparisonPrice) || comparisonPrice <= sellingPrice)) {
          failures.push(`${row.name}: Comparison price must be greater than the selling price.`)
          continue
        }
        const { data: product, error } = await supabase.from('products').insert({
          slug,
          name: row.name,
          model: row.model || null,
          description: row.description || '',
          category_id: cat.id,
          brand_id: brand?.id || null,
          selling_price: sellingPrice,
          comparison_price: comparisonPrice,
          laptop_condition: row.condition || 'unspecified',
          processor_manufacturer: row.processor_manufacturer || null,
          processor_model: row.processor_model || null,
          ram: row.ram || null,
          ram_type: row.ram_type || null,
          storage_capacity: row.storage_capacity || null,
          storage_type: row.storage_type || null,
          screen_size: row.screen_size || null,
          operating_system: row.operating_system || null,
          warranty: row.warranty || null,
          seo_title: row.seo_title || null,
          seo_description: row.seo_description || null,
          seo_focus_keyword: row.seo_focus_keyword || null,
          seo_secondary_keywords: row.seo_secondary_keywords || null,
          seo_social_title: row.seo_social_title || null,
          seo_social_description: row.seo_social_description || null,
          publication_status: 'draft',
        }).select('id').single()
        if (error) {
          failures.push(`${row.name}: ${error.message}`)
        } else {
          const initialStock = Number(row.initial_stock || 0)
          if (initialStock > 0) {
            const { error: stockError } = await supabase.rpc('adjust_stock', {
              p_product_id: product.id,
              p_bucket: 'owned',
              p_delta: Math.floor(initialStock),
              p_notes: 'Initial stock from product CSV import',
            })
            if (stockError) {
              failures.push(`${row.name}: Product created as a draft, but initial stock was not added: ${stockError.message}`)
              continue
            }
          }
          successes.push(row.name)
        }
      }

      setCsvImporting(false)
      setCsvModal(false)
      setCsvFile(null)
      setCsvPreview([])
      setCsvErrors([])
      loadProducts()
      setMessage(`Imported ${successes.length} product(s) as drafts${failures.length > 0 ? `; ${failures.length} row(s) need attention: ${failures.slice(0, 3).join(' • ')}` : '. Review products, inspection, and publication before they go live.'}`)
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
            {isOwner && <button
              type="button"
              onClick={() => {
                setBulkField('archive')
                setBulkModal(true)
              }}
              className="btn btn-emerald !h-8 text-[10px] font-bold"
            >
              Archive Selected
            </button>}
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
                  {isOwner && <option value="archive">Remove from storefront</option>}
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
            <option value="removed">Removed from storefront</option>
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
                      checked={selected.size === filtered.filter((product) => !product.deleted_at).length && filtered.some((product) => !product.deleted_at)}
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
                        {!product.deleted_at && <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(product.id)}
                          className="h-4 w-4 rounded text-teal"
                        />}
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
                      <td className="px-4 py-3">{product.deleted_at ? <span className="rounded-full bg-line px-2 py-0.5 text-[10px] font-extrabold uppercase text-muted">Removed</span> : statusLabel(product.publication_status)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!product.deleted_at && <Link
                            to={`/product/${product.slug}`}
                            target="_blank"
                            className="rounded p-1 text-muted hover:text-teal"
                            title="View on site"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>}
                          {!product.deleted_at && <Link
                            to={`/admin/products/edit/${product.id}`}
                            className="rounded p-1 text-muted hover:text-ink"
                            title="Edit product"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>}
                          {!product.deleted_at && product.publication_status === 'approved' && isOwner && (
                            <button
                              type="button"
                              onClick={() => handlePublish(product.id, product.name)}
                              className="rounded p-1 text-tealdeep hover:bg-mint/50"
                              title="Publish"
                            >
                              <ShieldCheck className="h-4 w-4" />
                            </button>
                          )}
                          {!product.deleted_at && product.publication_status === 'pending_approval' && isOwner && (
                            <button
                              type="button"
                              onClick={() => handleApprove(product.id, product.name)}
                              className="rounded p-1 text-teal hover:bg-mint/50"
                              title="Approve"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}
                          {product.deleted_at && isOwner ? <button
                            type="button"
                            onClick={() => void handleRestore(product.id, product.name)}
                            className="rounded p-1 text-teal hover:bg-mint/50"
                            title="Restore product"
                          >
                            <Undo2 className="h-4 w-4" />
                          </button> : !product.deleted_at && isOwner && <button
                            type="button"
                            onClick={() => handleArchive(product.id, product.name)}
                            className="rounded p-1 text-muted hover:text-error"
                            title="Archive product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>}
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
          <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-line bg-card p-6 shadow-xl">
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
              Upload many products at once with the downloaded template. SEO suggestions are filled automatically for blanks. Review and edit every product’s title, description, keywords, and social text below before importing. All imported products stay Draft until you inspect and publish them.
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
                <div className="overflow-x-auto max-h-[55vh] overflow-y-auto border border-line rounded mb-3">
                  <table className="w-full text-left text-[10px]">
                    <thead className="bg-mist">
                      <tr>
                        <th className="px-2 py-2 font-bold text-muted">Product</th>
                        <th className="px-2 py-2 font-bold text-muted">Category</th>
                        <th className="px-2 py-2 font-bold text-muted">Price</th>
                        <th className="min-w-64 px-2 py-2 font-bold text-muted">SEO title</th>
                        <th className="min-w-80 px-2 py-2 font-bold text-muted">SEO description</th>
                        <th className="min-w-48 px-2 py-2 font-bold text-muted">Focus keyword</th>
                        <th className="min-w-56 px-2 py-2 font-bold text-muted">Social & extra SEO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.map((row, i) => (
                        <tr key={i} className="border-b border-line/50 align-top">
                          <td className="min-w-48 px-2 py-2 font-bold text-ink">{row.name}<span className="block font-normal text-muted">{row.slug}</span></td>
                          <td className="min-w-32 px-2 py-2">{row.category}</td>
                          <td className="min-w-24 px-2 py-2">{formatKES(Number(row.selling_price) || 0)}</td>
                          <td className="px-2 py-2"><input maxLength={60} aria-label={`SEO title for ${row.name}`} value={row.seo_title || ''} onChange={(event) => updateCsvField(i, 'seo_title', event.target.value)} className="input min-w-64 text-[10px]" /></td>
                          <td className="px-2 py-2"><textarea maxLength={160} rows={3} aria-label={`SEO description for ${row.name}`} value={row.seo_description || ''} onChange={(event) => updateCsvField(i, 'seo_description', event.target.value)} className="input min-w-80 py-1 text-[10px]" /><span className="block text-right text-muted">{(row.seo_description || '').length}/160</span></td>
                          <td className="px-2 py-2"><input aria-label={`Focus keyword for ${row.name}`} value={row.seo_focus_keyword || ''} onChange={(event) => updateCsvField(i, 'seo_focus_keyword', event.target.value)} className="input min-w-48 text-[10px]" /></td>
                          <td className="px-2 py-2">
                            <details>
                              <summary className="cursor-pointer font-bold text-teal">Review all SEO fields</summary>
                              <div className="mt-2 min-w-64 space-y-2">
                                <label className="block font-semibold text-muted">Related keywords<input value={row.seo_secondary_keywords || ''} onChange={(event) => updateCsvField(i, 'seo_secondary_keywords', event.target.value)} className="input mt-1 w-full text-[10px]" /></label>
                                <label className="block font-semibold text-muted">Social title<input maxLength={60} value={row.seo_social_title || ''} onChange={(event) => updateCsvField(i, 'seo_social_title', event.target.value)} className="input mt-1 w-full text-[10px]" /></label>
                                <label className="block font-semibold text-muted">Social description<textarea maxLength={160} rows={3} value={row.seo_social_description || ''} onChange={(event) => updateCsvField(i, 'seo_social_description', event.target.value)} className="input mt-1 w-full py-1 text-[10px]" /></label>
                              </div>
                            </details>
                          </td>
                        </tr>
                      ))}
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

