import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import { getSupabase } from '@/lib/supabase'
import {
  fetchImport,
  updateImport,
  fetchImportImages,
  addImportImage,
  updateImportImage,
  deleteImportImage,
  fetchAcquisitionCosts,
  replaceAcquisitionCosts,
  loadMarkupTiers,
  approveImport,
  publishImport,
  fetchProductSlugs,
  type ProductImportRow,
  type ImportImage,
  type AcquisitionCostRow,
} from '@/lib/productImports'
import { generateContent, generateSeo, computeCompleteness, slugify, type GeneratedContent, type GeneratedSeo } from '@/lib/productContent'
import { imageRelevanceLabel, relevanceTone } from '@/lib/imageRelevance'
import { computePricing, DEFAULT_MARKUP_TIERS, DEFAULT_MIN_MARGIN_PCT, type MarkupTier } from '@/lib/pricing'
import { formatKES } from '@/lib/commerce'
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Upload,
  Star,
  Trash2,
  ChevronUp,
  ChevronDown,
  Plus,
  RefreshCw,
  Save,
  XCircle,
  Ban,
  Rocket,
  ExternalLink,
  ImageIcon,
  FileText,
  Search,
  Calculator,
  Info,
  Check,
  Undo2,
} from 'lucide-react'

type Tab = 'images' | 'details' | 'content' | 'seo' | 'pricing'

const CATEGORY_OPTIONS = [
  { value: 'laptops', name: 'Laptops' },
  { value: 'desktops', name: 'Desktops & All-in-Ones' },
  { value: 'computer-accessories', name: 'Computer Accessories (Keyboards, Mice, Cables, Chargers)' },
  { value: 'storage', name: 'Storage Devices (NVMe, SSD, HDD)' },
  { value: 'memory', name: 'Memory (RAM Modules)' },
  { value: 'monitors', name: 'Monitors & Displays' },
  { value: 'phones', name: 'Phones, Tablets & Gadgets' },
  { value: 'other', name: 'Other Electronics' },
]

const SPEC_SUGGESTIONS = [
  { key: 'processor_manufacturer', label: 'Processor manufacturer', aliases: ['processor manufacturer', 'cpu brand'] },
  { key: 'processor_model', label: 'Processor model', aliases: ['processor', 'cpu', 'chipset', 'processor model'] },
  { key: 'ram', label: 'RAM', aliases: ['memory', 'ram size'] },
  { key: 'ram_type', label: 'RAM type', aliases: ['memory type'] },
  { key: 'storage_capacity', label: 'Storage capacity', aliases: ['storage', 'ssd', 'hdd', 'drive'] },
  { key: 'storage_type', label: 'Storage type', aliases: ['drive type'] },
  { key: 'screen_size', label: 'Screen size', aliases: ['display', 'screen'] },
  { key: 'screen_resolution', label: 'Screen resolution', aliases: ['resolution'] },
  { key: 'graphics', label: 'Graphics', aliases: ['gpu', 'graphics card'] },
  { key: 'operating_system', label: 'Operating system', aliases: ['os'] },
  { key: 'battery_condition', label: 'Battery condition', aliases: ['battery'] },
  { key: 'weight', label: 'Weight', aliases: [] },
  { key: 'colour', label: 'Colour', aliases: ['color'] },
  { key: 'laptop_condition', label: 'Condition', aliases: ['condition'] },
  { key: 'warranty', label: 'Warranty', aliases: [] },
  { key: 'keyboard_layout', label: 'Keyboard layout', aliases: [] },
]

const AVAILABILITY_OPTIONS = [
  { value: 'supplier', label: 'At supplier (not verified)' },
  { value: 'in_stock', label: 'In stock' },
  { value: 'preorder', label: 'Pre-order' },
  { value: 'out_of_stock', label: 'Out of stock' },
  { value: 'discontinued', label: 'Discontinued' },
]

function normKey(key: string): string {
  return key.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

function canonicalSpecKey(raw: string): string {
  const n = normKey(raw)
  for (const field of SPEC_SUGGESTIONS) {
    if (field.key === n) return field.key
    if (field.aliases.some((a) => normKey(a) === n)) return field.key
  }
  return n || 'other'
}

function specLabel(key: string): string {
  return SPEC_SUGGESTIONS.find((f) => f.key === key)?.label || key.replace(/_/g, ' ')
}

export interface SpecRowItem {
  key: string
  value: string
  status?: 'verified' | 'extracted' | 'inferred' | 'manual'
}

function toSpecObject(rows: Array<SpecRowItem>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const row of rows) {
    const key = canonicalSpecKey(row.key)
    if (key && row.value.trim()) {
      out[key] = row.value.trim()
      if (row.status) {
        out[`_${key}_status`] = row.status
      }
    }
  }
  return out
}

function toSpecRows(specs: Record<string, string>): Array<SpecRowItem> {
  const cleanSpecs = Object.entries(specs || {}).filter(([k]) => !k.startsWith('_'))
  const rows = cleanSpecs.map(([key, value]) => ({
    key: canonicalSpecKey(key),
    value: String(value ?? ''),
    status: (specs[`_${canonicalSpecKey(key)}_status`] as any) || 'extracted',
  }))
  return rows.length > 0 ? rows : [{ key: 'processor_model', value: '', status: 'manual' }]
}

function pricingPayload(p: ReturnType<typeof computePricing>) {
  return {
    supplier_cost_kes: p.supplierCostKes,
    extra_costs_kes: p.extraCostsKes,
    total_acquisition_cost: p.totalAcquisitionCost,
    has_estimated_costs: p.hasEstimatedCosts,
    markup_pct: p.markupPct,
    tier_label: p.tierLabel,
    suggested_selling_price: p.suggestedSellingPrice,
    applied_selling_price: p.appliedSellingPrice,
    is_manual_override: p.isManualOverride,
    gross_profit: p.grossProfit,
    gross_margin_pct: p.grossMarginPct,
  }
}

export default function AdminProductReview() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [row, setRow] = useState<ProductImportRow | null>(null)
  const [images, setImages] = useState<ImportImage[]>([])
  const [costRows, setCostRows] = useState<Array<{ label: string; amount: string; is_estimated: boolean }>>([])
  const [tiers, setTiers] = useState<MarkupTier[]>(DEFAULT_MARKUP_TIERS)
  const [liveSlug, setLiveSlug] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    brand_name: '',
    model: '',
    category_slug: 'laptops',
    description: '',
    supplier_price: '',
    supplier_currency: 'KES',
    fx_rate_to_kes: '1',
    competitor_price: '',
    availability_status: 'supplier',
    availability_verified: false,
  })
  const [specRows, setSpecRows] = useState<Array<SpecRowItem>>([{ key: 'processor_model', value: '', status: 'manual' }])
  const [content, setContent] = useState<GeneratedContent | null>(null)
  const [seo, setSeo] = useState<GeneratedSeo | null>(null)
  const [manualPrice, setManualPrice] = useState('')
  const [overrideReason, setOverrideReason] = useState('')
  const [seoVerified, setSeoVerified] = useState(false)

  const [tab, setTab] = useState<Tab>('images')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [importRow, importImages, costs, markupTiers] = await Promise.all([
        fetchImport(id),
        fetchImportImages(id).catch(() => [] as ImportImage[]),
        fetchAcquisitionCosts(id).catch(() => [] as AcquisitionCostRow[]),
        loadMarkupTiers().catch(() => DEFAULT_MARKUP_TIERS),
      ])
      if (!importRow) {
        setError('This import could not be found.')
        return
      }
      setRow(importRow)
      setImages(importImages)
      setTiers(markupTiers)
      setCostRows(costs.map((c) => ({ label: c.label, amount: String(c.amount), is_estimated: c.is_estimated })))
      setForm({
        title: importRow.title || '',
        brand_name: importRow.brand_name || '',
        model: importRow.model || '',
        category_slug: importRow.category_slug || 'laptops',
        description: importRow.description || '',
        supplier_price: importRow.supplier_price != null ? String(importRow.supplier_price) : '',
        supplier_currency: importRow.supplier_currency || 'KES',
        fx_rate_to_kes: String(importRow.fx_rate_to_kes ?? 1),
        competitor_price: importRow.competitor_price != null ? String(importRow.competitor_price) : '',
        availability_status: importRow.availability_status || 'supplier',
        availability_verified: Boolean(importRow.availability_verified),
      })
      setSpecRows(toSpecRows(importRow.specs))
      setContent(importRow.content && Object.keys(importRow.content).length > 0 ? (importRow.content as unknown as GeneratedContent) : null)
      setSeo(importRow.seo && Object.keys(importRow.seo).length > 0 ? (importRow.seo as unknown as GeneratedSeo) : null)
      setSeoVerified(Boolean(importRow.seo && (importRow.seo as any)._verified))
      setManualPrice(
        importRow.pricing && (importRow.pricing as any).is_manual_override && importRow.pricing?.['applied_selling_price']
          ? String((importRow.pricing as any).applied_selling_price)
          : '',
      )
      setOverrideReason(importRow.price_override_reason || '')
      if (importRow.linked_product_id) {
        fetchProductSlugs([importRow.linked_product_id])
          .then((map) => setLiveSlug(map[importRow.linked_product_id as string] || null))
          .catch(() => setLiveSlug(null))
      } else {
        setLiveSlug(null)
      }
    } catch (err: any) {
      setError(err.message || 'Could not load the import.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const specs = useMemo(() => toSpecObject(specRows), [specRows])

  const pricing = useMemo(
    () =>
      computePricing({
        supplierPrice: Number(form.supplier_price) || 0,
        supplierCurrency: form.supplier_currency,
        fxRateToKes: Number(form.fx_rate_to_kes) || 1,
        costs: costRows
          .filter((c) => c.label.trim() && c.amount !== '')
          .map((c) => ({ label: c.label.trim(), amount: Number(c.amount) || 0, is_estimated: c.is_estimated })),
        competitorPrice: form.competitor_price ? Number(form.competitor_price) : null,
        tiers,
        minMarginPct: DEFAULT_MIN_MARGIN_PCT,
        manualSellingPrice: manualPrice ? Number(manualPrice) : null,
        overrideReason,
      }),
    [form, costRows, tiers, manualPrice, overrideReason],
  )

  const completeness = useMemo(
    () =>
      computeCompleteness({
        title: form.title,
        brand: form.brand_name,
        categorySlug: form.category_slug,
        specs,
        imagesCount: images.filter((i) => i.status !== 'rejected').length,
        supplierPrice: Number(form.supplier_price) || null,
        hasDescription: Boolean(form.description || content?.long_description),
        hasSeo: Boolean(seo?.title && seo?.meta_description),
      }),
    [form, specs, images, content, seo],
  )

  const buildContentInput = () => ({
    name: form.title,
    brand: form.brand_name || null,
    model: form.model || null,
    categorySlug: form.category_slug,
    categoryName: CATEGORY_OPTIONS.find((c) => c.value === form.category_slug)?.name || null,
    specs,
    condition: specs['laptop_condition'] || null,
    warranty: specs['warranty'] || null,
    priceKes: pricing.appliedSellingPrice || null,
  })

  const regenerate = () => {
    const input = buildContentInput()
    const generated = generateContent(input)
    setContent(generated)
    setSeo(generateSeo(input, generated))
    setNotice('Content and SEO regenerated from the current specifications. Review before saving.')
  }

  const persist = async (): Promise<boolean> => {
    if (!id || !row) return false
    setBusy(true)
    setError(null)
    try {
      const nextStatus =
        row.status === 'draft' || row.status === 'extracted' || row.status === 'images_pending' ? 'in_review' : row.status

      await updateImport(id, {
        title: form.title.trim(),
        brand_name: form.brand_name.trim() || null,
        model: form.model.trim() || null,
        category_slug: form.category_slug,
        description: form.description.trim() || null,
        specs,
        supplier_price: form.supplier_price === '' ? null : Number(form.supplier_price),
        supplier_currency: form.supplier_currency,
        fx_rate_to_kes: Number(form.fx_rate_to_kes) || 1,
        competitor_price: form.competitor_price === '' ? null : Number(form.competitor_price),
        availability_status: form.availability_status,
        availability_verified: form.availability_verified,
        content: content as unknown as Record<string, unknown>,
        seo: seo as unknown as Record<string, unknown>,
        pricing: pricingPayload(pricing),
        completeness_score: completeness.score,
        missing_fields: completeness.missing,
        status: nextStatus,
        ...(row.status === 'approved'
          ? {
              approved_selling_price: pricing.appliedSellingPrice,
              price_override_reason: pricing.isManualOverride ? overrideReason || null : null,
            }
          : {}),
      })

      await replaceAcquisitionCosts(
        id,
        costRows
          .filter((c) => c.label.trim() && c.amount !== '')
          .map((c) => ({ label: c.label.trim(), amount: Number(c.amount) || 0, is_estimated: c.is_estimated })),
      )

      await load()
      setNotice('Changes saved.')
      return true
    } catch (err: any) {
      setError(err.message || 'Could not save changes.')
      return false
    } finally {
      setBusy(false)
    }
  }

  const handleApprove = async () => {
    if (!id || !row) return
    if (images.filter((i) => i.status === 'approved').length === 0) {
      setError('Approve at least one image that shows this exact model before approving the product.')
      return
    }
    if (!pricing.canApprove) {
      setError(pricing.warnings[0] || 'Pricing is not ready for approval.')
      return
    }
    const saved = await persist()
    if (!saved) return
    setBusy(true)
    try {
      await approveImport(
        id,
        pricing.appliedSellingPrice,
        pricing.isManualOverride ? overrideReason : null,
        pricingPayload(pricing),
      )
      await load()
      setNotice('Import approved. An owner can now publish it.')
    } catch (err: any) {
      setError(err.message || 'Could not approve the import.')
    } finally {
      setBusy(false)
    }
  }

  const handlePublish = async () => {
    if (!id) return
    setBusy(true)
    setError(null)
    try {
      const productId = await publishImport(id)
      await load()
      setNotice(`Published. Product ID: ${productId}`)
    } catch (err: any) {
      setError(err.message || 'Could not publish. Only the owner can publish products.')
    } finally {
      setBusy(false)
    }
  }

  const setStatus = async (status: 'rejected' | 'archived' | 'in_review') => {
    if (!id) return
    setBusy(true)
    setError(null)
    try {
      await updateImport(id, { status })
      await load()
      setNotice(status === 'rejected' ? 'Import rejected.' : status === 'archived' ? 'Import archived.' : 'Moved back to review.')
    } catch (err: any) {
      setError(err.message || 'Could not update the status.')
    } finally {
      setBusy(false)
    }
  }

  // -------------------------------------------------------------------------
  // Image actions
  // -------------------------------------------------------------------------
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !id) return
    const supabase = getSupabase()
    if (!supabase) {
      setError('The store database is not configured.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop() || 'jpg'
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { data, error: upError } = await supabase.storage.from('product-images').upload(fileName, file, { cacheControl: '3600' })
        if (upError) throw upError
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(data.path)
        await addImportImage(id, { url: urlData.publicUrl, alt: form.title || file.name })
      }
      await load()
      setNotice('Image(s) uploaded.')
    } catch (err: any) {
      setError(err.message || 'Image upload failed.')
    } finally {
      setBusy(false)
    }
  }

  const handleAddImageUrl = async (url: string) => {
    if (!id || !url.trim()) return
    setBusy(true)
    try {
      await addImportImage(id, { url: url.trim(), alt: form.title })
      await load()
      setNotice('Image added.')
    } catch (err: any) {
      setError(err.message || 'Could not add the image.')
    } finally {
      setBusy(false)
    }
  }

  const setPrimary = async (image: ImportImage) => {
    setBusy(true)
    try {
      await Promise.all(images.map((img) => updateImportImage(img.id, { is_primary: img.id === image.id })))
      await load()
    } catch (err: any) {
      setError(err.message || 'Could not set the primary image.')
    } finally {
      setBusy(false)
    }
  }

  const moveImage = async (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= images.length) return
    setBusy(true)
    try {
      const a = images[index]
      const b = images[target]
      await updateImportImage(a.id, { sort_order: b.sort_order })
      await updateImportImage(b.id, { sort_order: a.sort_order })
      await load()
    } catch (err: any) {
      setError(err.message || 'Could not reorder images.')
    } finally {
      setBusy(false)
    }
  }

  const setImageStatus = async (image: ImportImage, status: ImportImage['status']) => {
    setBusy(true)
    try {
      await updateImportImage(image.id, { status })
      await load()
    } catch (err: any) {
      setError(err.message || 'Could not update the image.')
    } finally {
      setBusy(false)
    }
  }

  const removeImage = async (image: ImportImage) => {
    setBusy(true)
    try {
      await deleteImportImage(image.id)
      await load()
    } catch (err: any) {
      setError(err.message || 'Could not remove the image.')
    } finally {
      setBusy(false)
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  if (loading) {
    return (
      <AdminLayout title="Product Review">
        <div className="flex items-center gap-2 text-sm font-bold text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading import…
        </div>
      </AdminLayout>
    )
  }

  if (!row) {
    return (
      <AdminLayout title="Product Review">
        <div className="rounded-xl border border-error/30 bg-error/10 p-4 text-sm font-bold text-error">
          {error || 'Import not found.'}
        </div>
        <Link to="/admin/product-import" className="btn btn-outline mt-4 !h-10 text-xs font-bold">
          <ArrowLeft className="h-4 w-4" /> Back to Import Center
        </Link>
      </AdminLayout>
    )
  }

  const activeImages = images.filter((i) => i.status !== 'rejected')
  const statusTone =
    row.status === 'published'
      ? 'bg-teal/10 text-tealdeep'
      : row.status === 'approved'
        ? 'bg-emerald/10 text-emerald'
        : row.status === 'rejected'
          ? 'bg-error/10 text-error'
          : 'bg-mist text-muted'

  return (
    <AdminLayout
      title="Product Review"
      subtitle={row.title}
      actions={
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/product-import" className="btn btn-outline !h-9 text-xs font-bold">
            <ArrowLeft className="h-4 w-4" /> Import Center
          </Link>
          <button type="button" onClick={persist} disabled={busy} className="btn btn-outline !h-9 text-xs font-bold disabled:opacity-50">
            <Save className="h-4 w-4" /> Save draft
          </button>
        </div>
      }
    >
      {notice && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-teal/30 bg-mint/50 p-3 text-xs font-bold text-tealdeep">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {notice}
        </div>
      )}
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-error/30 bg-error/10 p-3 text-xs font-bold text-error">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-line bg-card p-4 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase ${statusTone}`}>{row.status.replace(/_/g, ' ')}</span>
            {row.source_url && (
              <a href={row.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-teal hover:underline">
                <ExternalLink className="h-3 w-3" /> Source listing
              </a>
            )}
            <span className="text-[11px] text-muted">
              Imported {row.source_type.toUpperCase()} · {new Date(row.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-[10px] font-bold uppercase text-muted">Completeness</p>
              <p className="text-lg font-extrabold text-ink">{completeness.score}%</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-muted">Active images</p>
              <p className="text-lg font-extrabold text-ink">{activeImages.length}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-muted">Proposed price</p>
              <p className="text-lg font-extrabold text-teal">
                {pricing.appliedSellingPrice > 0 ? formatKES(pricing.appliedSellingPrice) : '—'}
              </p>
            </div>
          </div>
          {completeness.missing.length > 0 && (
            <div className="mt-3 rounded-lg border border-amber/40 bg-amber/5 p-2 text-[11px] text-amberdeep">
              <span className="font-bold">Missing: </span>
              {completeness.missing.join(', ')}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-line bg-card p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase text-muted">Workflow actions</p>
          <div className="mt-3 grid gap-2">
            <button type="button" onClick={regenerate} disabled={busy} className="btn btn-outline !h-9 text-xs font-bold disabled:opacity-50">
              <RefreshCw className="h-4 w-4" /> Regenerate content & SEO
            </button>
            {row.status !== 'approved' && row.status !== 'published' && (
              <button type="button" onClick={handleApprove} disabled={busy} className="btn btn-emerald !h-9 text-xs font-bold shadow-xs disabled:opacity-50">
                <CheckCircle2 className="h-4 w-4" /> Approve product
              </button>
            )}
            {row.status === 'approved' && (
              <button type="button" onClick={handlePublish} disabled={busy} className="btn btn-emerald !h-9 text-xs font-bold shadow-xs disabled:opacity-50">
                <Rocket className="h-4 w-4" /> Publish to store
              </button>
            )}
            {row.status === 'published' && liveSlug && (
              <Link to={`/product/${liveSlug}`} className="btn btn-outline !h-9 text-xs font-bold">
                <ExternalLink className="h-4 w-4" /> View live product
              </Link>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setStatus('rejected')} disabled={busy || row.status === 'published'} className="btn btn-outline !h-9 text-xs font-bold text-error disabled:opacity-50">
                <XCircle className="h-4 w-4" /> Reject
              </button>
              <button type="button" onClick={() => setStatus('archived')} disabled={busy || row.status === 'published'} className="btn btn-outline !h-9 text-xs font-bold disabled:opacity-50">
                <Ban className="h-4 w-4" /> Archive
              </button>
            </div>
          </div>
          <p className="mt-3 text-[10px] text-muted">
            Approving records the selling price. Publishing is owner-only and writes the product to the live catalogue.
          </p>
        </div>
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-line bg-card p-1">
        {([
          { id: 'images', label: 'Images', icon: ImageIcon },
          { id: 'details', label: 'Details & specs', icon: FileText },
          { id: 'content', label: 'Content', icon: FileText },
          { id: 'seo', label: 'SEO', icon: Search },
          { id: 'pricing', label: 'Pricing', icon: Calculator },
        ] as const).map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex flex-1 shrink-0 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${
                tab === t.id ? 'bg-emerald text-white' : 'text-muted hover:bg-mist hover:text-ink'
              }`}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          )
        })}
      </div>

      {/* ------------------------------------------------ Images */}
      {tab === 'images' && (
        <div className="space-y-4">
          {(images.length === 0 || images.filter((i) => i.status === 'approved').length < 3) && (
            <div className="flex items-start gap-2 rounded-lg border border-amber/40 bg-amber/5 p-3 text-[11px] font-bold text-amberdeep">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {images.length === 0
                ? 'No images yet. Upload the exact product photo before approving.'
                : images.filter((i) => i.status === 'approved').length === 0
                  ? 'No image is approved yet. Approve only photos that show this exact model — publishing copies approved images only.'
                  : `Only ${images.filter((i) => i.status === 'approved').length} approved image(s). Three or more are recommended.`}
            </div>
          )}

          {row.image_query && (
            <div className="rounded-lg border border-line bg-mist px-3 py-2 text-[11px] text-muted">
              Exact-model image query:{' '}
              <span className="font-bold text-ink">{row.image_query}</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {[
                  ['Google Images', `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(row.image_query)}`],
                  ['Bing Images', `https://www.bing.com/images/search?q=${encodeURIComponent(row.image_query)}`],
                  ['DuckDuckGo', `https://duckduckgo.com/?iax=images&ia=images&q=${encodeURIComponent(row.image_query)}`],
                ].map(([label, href]) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-sky hover:underline"
                  >
                    {label} <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-line bg-card p-4 shadow-xs">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald/90">
                <Upload className="h-4 w-4" /> Upload images
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
              </label>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const input = (e.currentTarget.elements.namedItem('imageUrl') as HTMLInputElement).value
                  handleAddImageUrl(input)
                  e.currentTarget.reset()
                }}
                className="flex flex-1 gap-2"
              >
                <input name="imageUrl" type="url" placeholder="Paste an image URL" className="input flex-1 text-xs" />
                <button type="submit" disabled={busy} className="btn btn-outline !h-9 text-xs font-bold disabled:opacity-50">
                  <Plus className="h-4 w-4" /> Add
                </button>
              </form>
            </div>
          </div>

          {images.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-card p-8 text-center text-xs text-muted">No images yet.</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className={`overflow-hidden rounded-xl border bg-card shadow-xs ${image.status === 'rejected' ? 'border-error/40 opacity-60' : image.is_primary ? 'border-emerald ring-1 ring-emerald' : 'border-line'}`}
                >
                  <div className="relative aspect-[4/3] bg-mist">
                    <img src={image.url} alt={image.alt || ''} loading="lazy" className="h-full w-full object-contain" />
                    {image.is_primary && (
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald px-2 py-0.5 text-[9px] font-extrabold uppercase text-white">
                        <Star className="h-2.5 w-2.5" /> Primary
                      </span>
                    )}
                    <span
                      className={`absolute right-2 top-2 rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase ${
                        image.status === 'approved'
                          ? 'border-emerald/30 bg-emerald/10 text-emerald'
                          : image.status === 'rejected'
                            ? 'border-error/30 bg-error/10 text-error'
                            : 'border-amber/30 bg-amber/10 text-amberdeep'
                      }`}
                    >
                      {image.status === 'approved' ? 'Approved' : image.status === 'rejected' ? 'Rejected' : 'Pending'}
                    </span>
                  </div>
                  <div className="space-y-2 p-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase ${
                          relevanceTone(image.relevance) === 'success'
                            ? 'border-emerald/30 bg-emerald/10 text-emerald'
                            : relevanceTone(image.relevance) === 'info'
                              ? 'border-sky/30 bg-sky/10 text-sky'
                              : relevanceTone(image.relevance) === 'error'
                                ? 'border-error/30 bg-error/10 text-error'
                                : 'border-amber/30 bg-amber/10 text-amberdeep'
                        }`}
                      >
                        {imageRelevanceLabel(image.relevance)}
                      </span>
                      {image.method && (
                        <span className="rounded-full bg-mist px-2 py-0.5 text-[9px] font-bold uppercase text-muted">
                          {image.method}
                        </span>
                      )}
                      {image.width && image.height && (
                        <span className="text-[9px] font-semibold text-muted">
                          {image.width}×{image.height}
                        </span>
                      )}
                    </div>
                    {image.verification_note && (
                      <p className="text-[10px] leading-snug text-muted">{image.verification_note}</p>
                    )}
                    <div className="flex flex-wrap gap-2 text-[10px]">
                      {image.source_domain && <span className="font-bold text-muted">{image.source_domain}</span>}
                      {image.source_url && (
                        <a
                          href={image.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-sky hover:underline"
                        >
                          Source page <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                      <a
                        href={image.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-sky hover:underline"
                      >
                        Original image <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                    <input
                      value={image.alt || ''}
                      onChange={(e) => setImages((prev) => prev.map((i) => (i.id === image.id ? { ...i, alt: e.target.value } : i)))}
                      onBlur={(e) => updateImportImage(image.id, { alt: e.target.value }).catch(() => undefined)}
                      placeholder="Alt text"
                      className="input w-full text-[11px]"
                    />
                    <div className="flex flex-wrap gap-1">
                      <button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0 || busy} className="btn btn-outline !h-7 !px-2 text-[10px] disabled:opacity-40">
                        <ChevronUp className="h-3 w-3" />
                      </button>
                      <button type="button" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1 || busy} className="btn btn-outline !h-7 !px-2 text-[10px] disabled:opacity-40">
                        <ChevronDown className="h-3 w-3" />
                      </button>
                      <button type="button" onClick={() => setPrimary(image)} disabled={busy || image.is_primary || image.status === 'rejected'} className="btn btn-outline !h-7 !px-2 text-[10px] disabled:opacity-40">
                        <Star className="h-3 w-3" /> Primary
                      </button>
                      {image.status !== 'approved' ? (
                        <button
                          type="button"
                          onClick={() => setImageStatus(image, 'approved')}
                          disabled={busy}
                          className="btn btn-emerald !h-7 !px-2 text-[10px] font-bold disabled:opacity-40"
                        >
                          <Check className="h-3 w-3" /> Approve
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setImageStatus(image, 'pending')}
                          disabled={busy}
                          className="btn btn-outline !h-7 !px-2 text-[10px] disabled:opacity-40"
                        >
                          <Undo2 className="h-3 w-3" /> Unapprove
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setImageStatus(image, image.status === 'rejected' ? 'pending' : 'rejected')}
                        disabled={busy}
                        className="btn btn-outline !h-7 !px-2 text-[10px] disabled:opacity-40"
                      >
                        {image.status === 'rejected' ? 'Restore' : 'Reject'}
                      </button>
                      <button type="button" onClick={() => removeImage(image)} disabled={busy} className="btn btn-outline !h-7 !px-2 text-[10px] text-error">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------ Details */}
      {tab === 'details' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-line bg-card p-4 shadow-xs">
            <p className="text-sm font-extrabold text-ink">Product details</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-bold text-muted sm:col-span-2">
                Title
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input mt-1 w-full text-xs font-bold" />
              </label>
              <label className="block text-xs font-bold text-muted">
                Brand
                <input value={form.brand_name} onChange={(e) => setForm({ ...form, brand_name: e.target.value })} className="input mt-1 w-full text-xs" />
              </label>
              <label className="block text-xs font-bold text-muted">
                Model
                <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="input mt-1 w-full text-xs" />
              </label>
              <label className="block text-xs font-bold text-muted">
                Category
                <select value={form.category_slug} onChange={(e) => setForm({ ...form, category_slug: e.target.value })} className="input mt-1 w-full text-xs font-semibold">
                  {CATEGORY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.name}</option>)}
                </select>
              </label>
              <label className="block text-xs font-bold text-muted">
                Availability
                <select value={form.availability_status} onChange={(e) => setForm({ ...form, availability_status: e.target.value })} className="input mt-1 w-full text-xs font-semibold">
                  {AVAILABILITY_OPTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-muted sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.availability_verified}
                  onChange={(e) => setForm({ ...form, availability_verified: e.target.checked })}
                  className="h-4 w-4"
                />
                I have verified availability directly with the supplier
              </label>
              <label className="block text-xs font-bold text-muted sm:col-span-2">
                Internal description / notes
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input mt-1 w-full py-2 text-xs" />
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-sm font-extrabold text-ink">Specifications</p>
              <button
                type="button"
                onClick={() => setSpecRows((prev) => [...prev, { key: 'other', value: '', status: 'manual' }])}
                className="btn btn-outline !h-8 text-[11px] font-bold"
              >
                <Plus className="h-3.5 w-3.5" /> Add spec
              </button>
            </div>
            <p className="mt-1 text-[11px] text-muted">
              Distinguishes extracted vs verified details. Extracted specifications are unverified until explicitly checked by staff.
            </p>
            <div className="mt-3 space-y-2">
              {specRows.map((specRow, index) => (
                <div key={index} className="grid gap-2 sm:grid-cols-[200px_1fr_auto_auto]">
                  <input
                    list="spec-keys"
                    value={specRow.key}
                    onChange={(e) => setSpecRows((prev) => prev.map((r, i) => (i === index ? { ...r, key: e.target.value } : r)))}
                    placeholder="Specification"
                    className="input text-xs font-bold"
                  />
                  <input
                    value={specRow.value}
                    onChange={(e) => setSpecRows((prev) => prev.map((r, i) => (i === index ? { ...r, value: e.target.value } : r)))}
                    placeholder="Value"
                    className="input text-xs"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setSpecRows((prev) =>
                        prev.map((r, i) =>
                          i === index
                            ? { ...r, status: r.status === 'verified' ? 'extracted' : 'verified' }
                            : r,
                        ),
                      )
                    }
                    className={`btn !h-9 !px-2.5 text-xs font-bold ${
                      specRow.status === 'verified'
                        ? 'border-emerald/40 bg-emerald/10 text-emerald'
                        : specRow.status === 'inferred'
                          ? 'border-amber/40 bg-amber/10 text-amberdeep'
                          : 'btn-outline text-muted'
                    }`}
                    title={specRow.status === 'verified' ? 'Verified (Click to unverify)' : 'Click to mark as verified'}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    {specRow.status === 'verified' ? 'Verified' : 'Verify'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpecRows((prev) => prev.filter((_, i) => i !== index))}
                    className="btn btn-outline !h-9 !px-2 text-error"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <datalist id="spec-keys">
              {SPEC_SUGGESTIONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </datalist>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ Content */}
      {tab === 'content' && (
        <div className="space-y-4">
          {!content ? (
            <div className="rounded-xl border border-line bg-card p-6 text-center text-xs text-muted">
              No content generated yet.
              <button type="button" onClick={regenerate} className="btn btn-emerald ml-3 !h-8 text-[11px] font-bold">
                <RefreshCw className="h-3.5 w-3.5" /> Generate now
              </button>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-line bg-card p-4 shadow-xs">
                <p className="text-sm font-extrabold text-ink">Titles & descriptions</p>
                <div className="mt-3 space-y-3">
                  <label className="block text-xs font-bold text-muted">
                    Display title
                    <input value={content.title} onChange={(e) => setContent({ ...content, title: e.target.value })} className="input mt-1 w-full text-xs font-bold" />
                  </label>
                  <label className="block text-xs font-bold text-muted">
                    Short description
                    <textarea rows={2} value={content.short_description} onChange={(e) => setContent({ ...content, short_description: e.target.value })} className="input mt-1 w-full py-2 text-xs" />
                  </label>
                  <label className="block text-xs font-bold text-muted">
                    Long description
                    <textarea rows={6} value={content.long_description} onChange={(e) => setContent({ ...content, long_description: e.target.value })} className="input mt-1 w-full py-2 text-xs" />
                  </label>
                  <label className="block text-xs font-bold text-muted">
                    WhatsApp description
                    <textarea rows={2} value={content.whatsapp_description} onChange={(e) => setContent({ ...content, whatsapp_description: e.target.value })} className="input mt-1 w-full py-2 text-xs" />
                  </label>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-line bg-card p-4 shadow-xs">
                  <p className="text-xs font-extrabold text-ink">Features (one per line)</p>
                  <textarea
                    rows={8}
                    value={(content.features || []).join('\n')}
                    onChange={(e) => setContent({ ...content, features: e.target.value.split('\n') })}
                    className="input mt-2 w-full py-2 text-xs"
                  />
                </div>
                <div className="rounded-xl border border-line bg-card p-4 shadow-xs">
                  <p className="text-xs font-extrabold text-ink">Benefits (one per line)</p>
                  <textarea
                    rows={8}
                    value={(content.benefits || []).join('\n')}
                    onChange={(e) => setContent({ ...content, benefits: e.target.value.split('\n') })}
                    className="input mt-2 w-full py-2 text-xs"
                  />
                </div>
                <div className="rounded-xl border border-line bg-card p-4 shadow-xs">
                  <p className="text-xs font-extrabold text-ink">Use cases (one per line)</p>
                  <textarea
                    rows={8}
                    value={(content.use_cases || []).join('\n')}
                    onChange={(e) => setContent({ ...content, use_cases: e.target.value.split('\n') })}
                    className="input mt-2 w-full py-2 text-xs"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-line bg-card p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-extrabold text-ink">FAQs</p>
                  <button
                    type="button"
                    onClick={() => setContent({ ...content, faqs: [...(content.faqs || []), { question: '', answer: '' }] })}
                    className="btn btn-outline !h-8 text-[11px] font-bold"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add FAQ
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  {(content.faqs || []).map((faq, index) => (
                    <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
                      <input
                        value={faq.question}
                        onChange={(e) => {
                          const faqs = [...(content.faqs || [])]
                          faqs[index] = { ...faqs[index], question: e.target.value }
                          setContent({ ...content, faqs })
                        }}
                        placeholder="Question"
                        className="input text-xs font-bold"
                      />
                      <input
                        value={faq.answer}
                        onChange={(e) => {
                          const faqs = [...(content.faqs || [])]
                          faqs[index] = { ...faqs[index], answer: e.target.value }
                          setContent({ ...content, faqs })
                        }}
                        placeholder="Answer"
                        className="input text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setContent({ ...content, faqs: (content.faqs || []).filter((_, i) => i !== index) })}
                        className="btn btn-outline !h-9 !px-2 text-error"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-line bg-card p-4 shadow-xs">
                <p className="text-xs font-extrabold text-ink">Image alt texts (one per line)</p>
                <textarea
                  rows={3}
                  value={(content.image_alt_texts || []).join('\n')}
                  onChange={(e) => setContent({ ...content, image_alt_texts: e.target.value.split('\n') })}
                  className="input mt-2 w-full py-2 text-xs"
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* ------------------------------------------------ SEO */}
      {tab === 'seo' && (
        <div className="rounded-xl border border-line bg-card p-4 shadow-xs">
          {!seo ? (
            <div className="py-6 text-center text-xs text-muted">
              No SEO generated yet.
              <button type="button" onClick={regenerate} className="btn btn-emerald ml-3 !h-8 text-[11px] font-bold">
                <RefreshCw className="h-3.5 w-3.5" /> Generate now
              </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-bold text-muted sm:col-span-2">
                SEO title ({seo.title.length}/65)
                <input
                  value={seo.title}
                  maxLength={70}
                  onChange={(e) => setSeo({ ...seo, title: e.target.value })}
                  className="input mt-1 w-full text-xs font-bold"
                />
              </label>
              <label className="block text-xs font-bold text-muted sm:col-span-2">
                Meta description ({seo.meta_description.length}/158)
                <textarea
                  rows={2}
                  value={seo.meta_description}
                  maxLength={170}
                  onChange={(e) => setSeo({ ...seo, meta_description: e.target.value })}
                  className="input mt-1 w-full py-2 text-xs"
                />
              </label>
              <label className="block text-xs font-bold text-muted">
                Focus keyword
                <input value={seo.focus_keyword} onChange={(e) => setSeo({ ...seo, focus_keyword: e.target.value })} className="input mt-1 w-full text-xs" />
              </label>
              <label className="block text-xs font-bold text-muted">
                Slug
                <div className="mt-1 flex gap-2">
                  <input value={seo.slug} onChange={(e) => setSeo({ ...seo, slug: e.target.value })} className="input flex-1 text-xs" />
                  <button
                    type="button"
                    onClick={() => setSeo({ ...seo, slug: slugify(form.title) })}
                    className="btn btn-outline !h-9 text-[11px] font-bold"
                  >
                    From title
                  </button>
                </div>
              </label>
              <label className="block text-xs font-bold text-muted sm:col-span-2">
                Secondary keywords
                <input value={seo.secondary_keywords} onChange={(e) => setSeo({ ...seo, secondary_keywords: e.target.value })} className="input mt-1 w-full text-xs" />
              </label>
              <label className="block text-xs font-bold text-muted sm:col-span-2">
                Social title
                <input value={seo.social_title} onChange={(e) => setSeo({ ...seo, social_title: e.target.value })} className="input mt-1 w-full text-xs" />
              </label>
              <label className="block text-xs font-bold text-muted sm:col-span-2">
                Social description
                <textarea rows={2} value={seo.social_description} onChange={(e) => setSeo({ ...seo, social_description: e.target.value })} className="input mt-1 w-full py-2 text-xs" />
              </label>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------ Pricing */}
      {tab === 'pricing' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-line bg-card p-4 shadow-xs">
            <p className="text-sm font-extrabold text-ink">Supplier & market prices</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block text-xs font-bold text-muted">
                Supplier price
                <input type="number" value={form.supplier_price} onChange={(e) => setForm({ ...form, supplier_price: e.target.value })} className="input mt-1 w-full text-xs font-bold text-teal" />
              </label>
              <label className="block text-xs font-bold text-muted">
                Currency
                <input value={form.supplier_currency} onChange={(e) => setForm({ ...form, supplier_currency: e.target.value.toUpperCase() })} className="input mt-1 w-full text-xs font-bold" />
              </label>
              <label className="block text-xs font-bold text-muted">
                FX rate to KES
                <input type="number" step="0.0001" value={form.fx_rate_to_kes} onChange={(e) => setForm({ ...form, fx_rate_to_kes: e.target.value })} className="input mt-1 w-full text-xs font-bold" />
              </label>
              <label className="block text-xs font-bold text-muted">
                Competitor price (KES)
                <input type="number" value={form.competitor_price} onChange={(e) => setForm({ ...form, competitor_price: e.target.value })} className="input mt-1 w-full text-xs" />
              </label>
            </div>
            <p className="mt-2 text-[11px] text-muted">
              Supplier cost in KES: <span className="font-bold text-ink">{formatKES(pricing.supplierCostKes)}</span>
            </p>
          </div>

          <div className="rounded-xl border border-line bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-sm font-extrabold text-ink">Additional acquisition costs</p>
              <button
                type="button"
                onClick={() => setCostRows((prev) => [...prev, { label: '', amount: '', is_estimated: true }])}
                className="btn btn-outline !h-8 text-[11px] font-bold"
              >
                <Plus className="h-3.5 w-3.5" /> Add cost
              </button>
            </div>
            <p className="mt-1 text-[11px] text-muted">Transport, duty, packaging or other landed costs. Leave unconfirmed amounts marked as estimated.</p>
            {costRows.length === 0 ? (
              <p className="mt-3 text-xs text-muted">No extra costs recorded.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {costRows.map((cost, index) => (
                  <div key={index} className="grid gap-2 sm:grid-cols-[1fr_140px_auto_auto]">
                    <input
                      value={cost.label}
                      onChange={(e) => setCostRows((prev) => prev.map((c, i) => (i === index ? { ...c, label: e.target.value } : c)))}
                      placeholder="e.g. Transport from supplier"
                      className="input text-xs"
                    />
                    <input
                      type="number"
                      value={cost.amount}
                      onChange={(e) => setCostRows((prev) => prev.map((c, i) => (i === index ? { ...c, amount: e.target.value } : c)))}
                      placeholder="KES"
                      className="input text-xs font-bold"
                    />
                    <label className="flex items-center gap-1 text-[10px] font-bold text-muted">
                      <input
                        type="checkbox"
                        checked={cost.is_estimated}
                        onChange={(e) => setCostRows((prev) => prev.map((c, i) => (i === index ? { ...c, is_estimated: e.target.checked } : c)))}
                        className="h-3.5 w-3.5"
                      />
                      Est.
                    </label>
                    <button
                      type="button"
                      onClick={() => setCostRows((prev) => prev.filter((_, i) => i !== index))}
                      className="btn btn-outline !h-9 !px-2 text-error"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-line bg-card p-4 shadow-xs">
              <p className="text-sm font-extrabold text-ink">Suggested price</p>
              <dl className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between"><dt className="text-muted">Total acquisition cost</dt><dd className="font-bold text-ink">{formatKES(pricing.totalAcquisitionCost)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Markup tier</dt><dd className="font-bold text-ink">{pricing.tierLabel || '—'} ({pricing.markupPct}%)</dd></div>
                <div className="flex justify-between border-t border-line pt-2"><dt className="text-muted">Suggested selling price</dt><dd className="font-extrabold text-ink">{formatKES(pricing.suggestedSellingPrice)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Applied selling price</dt><dd className="font-extrabold text-teal">{formatKES(pricing.appliedSellingPrice)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Gross profit</dt><dd className="font-bold text-ink">{formatKES(pricing.grossProfit)}</dd></div>
                <div className="flex justify-between">
                  <dt className="text-muted">Gross margin</dt>
                  <dd className={`font-bold ${pricing.meetsMinMargin ? 'text-tealdeep' : 'text-error'}`}>
                    {pricing.grossMarginPct.toFixed(1)}% (min {DEFAULT_MIN_MARGIN_PCT}%)
                  </dd>
                </div>
              </dl>
              {pricing.warnings.length > 0 && (
                <ul className="mt-3 list-disc list-inside space-y-1 text-[11px] text-amberdeep">
                  {pricing.warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-line bg-card p-4 shadow-xs">
              <p className="text-sm font-extrabold text-ink">Manual price override</p>
              <div className="mt-3 space-y-3">
                <label className="block text-xs font-bold text-muted">
                  Selling price (leave blank to use the suggested price)
                  <input
                    type="number"
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value)}
                    placeholder={String(pricing.suggestedSellingPrice || '')}
                    className="input mt-1 w-full text-xs font-bold text-teal"
                  />
                </label>
                {pricing.isManualOverride && (
                  <label className="block text-xs font-bold text-muted">
                    Override reason (required)
                    <textarea
                      rows={2}
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      className="input mt-1 w-full py-2 text-xs"
                      placeholder="Explain why this product is priced away from the rule."
                    />
                  </label>
                )}
                <div className={`flex items-start gap-2 rounded-lg p-2 text-[11px] font-bold ${pricing.canApprove ? 'bg-mint/50 text-tealdeep' : 'bg-amber/5 text-amberdeep'}`}>
                  {pricing.canApprove ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <Info className="mt-0.5 h-4 w-4 shrink-0" />}
                  {pricing.canApprove
                    ? 'Pricing is within policy and ready for approval.'
                    : 'Pricing needs attention before the product can be approved.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4">
        <button type="button" onClick={persist} disabled={busy} className="btn btn-emerald !h-10 text-xs font-bold shadow-xs disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
        </button>
        {row.status !== 'approved' && row.status !== 'published' && (
          <button type="button" onClick={handleApprove} disabled={busy} className="btn btn-outline !h-10 text-xs font-bold disabled:opacity-50">
            <ArrowRight className="h-4 w-4" /> Save & approve
          </button>
        )}
        <button
          type="button"
          onClick={() => navigate('/admin/product-import')}
          className="btn btn-outline !h-10 text-xs font-bold"
        >
          Back to Import Center
        </button>
      </div>
    </AdminLayout>
  )
}
