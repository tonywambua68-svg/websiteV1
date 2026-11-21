import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import { getSupabase } from '@/lib/supabase'
import {
  createImport,
  updateImport,
  replaceImportImages,
  loadSuppliers,
  loadMarkupTiers,
  detectDuplicate,
  buildCsvPlan,
  fetchImports,
  type SupplierOption,
  type CsvImportPlan,
  type DuplicateCheck,
  type ProductImportRow,
} from '@/lib/productImports'
import { generateContent, generateSeo, computeCompleteness } from '@/lib/productContent'
import { buildImageQuery, imageRelevanceLabel, relevanceTone } from '@/lib/imageRelevance'
import { computePricing, DEFAULT_MARKUP_TIERS } from '@/lib/pricing'
import { formatKES } from '@/lib/commerce'
import {
  Link2,
  FileSpreadsheet,
  PenLine,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Info,
  Plus,
  Layers,
  Edit3,
  Check,
  X,
  Search,
} from 'lucide-react'

type Tab = 'url' | 'csv' | 'manual'
type UrlMode = 'single' | 'bulk'

export interface ExtractedImageCandidate {
  url: string
  alt?: string | null
  source_url?: string | null
  source_domain?: string | null
  relevance?: 'exact' | 'likely' | 'unverified' | 'rejected'
  method?: string | null
  width?: number | null
  height?: number | null
  verification_note?: string | null
}

interface ExtractedProduct {
  title?: string | null
  brand?: string | null
  model?: string | null
  description?: string | null
  price?: number | null
  currency?: string | null
  fx_rate_to_kes?: number | null
  estimated_kes_cost?: number | null
  provisional_selling_price?: number | null
  final_url?: string
  image_query?: string
  image_candidates?: ExtractedImageCandidate[]
  images?: string[]
  warnings?: string[]
  specs?: Record<string, string>
  specs_provenance?: Record<string, any>
  completeness_score?: number
}

function relevanceBadgeClass(relevance: string | undefined): string {
  switch (relevanceTone(relevance)) {
    case 'success':
      return 'bg-emerald/10 text-emerald border-emerald/30'
    case 'info':
      return 'bg-sky/10 text-sky border-sky/30'
    case 'error':
      return 'bg-error/10 text-error border-error/30'
    default:
      return 'bg-amber/10 text-amberdeep border-amber/30'
  }
}

function imageSearchLinks(query: string) {
  return [
    {
      label: 'Google Images',
      href: `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`,
    },
    {
      label: 'Bing Images',
      href: `https://www.bing.com/images/search?q=${encodeURIComponent(query)}`,
    },
    {
      label: 'DuckDuckGo',
      href: `https://duckduckgo.com/?iax=images&ia=images&q=${encodeURIComponent(query)}`,
    },
  ]
}

const SOURCE_KINDS = [
  { value: 'nairobi_cbd', label: 'Nairobi CBD' },
  { value: 'kenya_other', label: 'Other parts of Kenya' },
  { value: 'china', label: 'China' },
  { value: 'international', label: 'Other international' },
]

export const CATEGORY_OPTIONS = [
  { value: 'laptops', label: 'Laptops', name: 'Laptops' },
  { value: 'desktops', label: 'Desktops & All-in-Ones', name: 'Desktops' },
  { value: 'computer-accessories', label: 'Computer Accessories (Keyboards, Mice, Cables)', name: 'Computer accessories' },
  { value: 'storage', label: 'Storage Devices (SSD, NVMe, HDD)', name: 'Storage devices' },
  { value: 'memory', label: 'Memory (RAM Modules)', name: 'Memory' },
  { value: 'monitors', label: 'Monitors & Displays', name: 'Monitors' },
  { value: 'phones', label: 'Phones, Tablets & Gadgets', name: 'Phones & Gadgets' },
  { value: 'other', label: 'Other Electronics', name: 'Other Electronics' },
]

function categoryName(slug: string): string {
  return CATEGORY_OPTIONS.find((c) => c.value === slug)?.name || 'Product'
}

function guessCategory(title: string): string {
  const t = (title || '').toLowerCase()
  if (/laptop|notebook|macbook|elitebook|thinkpad|latitude|zenbook|yoga|inspiron|vostro/.test(t)) return 'laptops'
  if (/desktop|workstation|all-in-one|aio|tower|optiplex|thinkcentre/.test(t)) return 'desktops'
  if (/ssd|hard disk|hdd|flash|memory card|usb drive|nvme|m\.2/.test(t)) return 'storage'
  if (/\bram\b|memory module|ddr4|ddr5|sodimm/.test(t)) return 'memory'
  if (/monitor|screen|display|24-inch|27-inch|32-inch/.test(t)) return 'monitors'
  if (/phone|smartphone|iphone|galaxy|tablet|ipad/.test(t)) return 'phones'
  if (/mouse|keyboard|charger|cable|bag|adapter|hub|dock|headset|earbuds/.test(t)) return 'computer-accessories'
  return 'laptops'
}

async function deriveBundle(input: {
  title: string
  brand: string | null
  model: string | null
  categorySlug: string
  description: string | null
  specs: Record<string, string>
  supplierPrice: number | null
  supplierCurrency: string
  fxRate: number
  competitorPrice: number | null
  imagesCount: number
}) {
  const tiers = await loadMarkupTiers().catch(() => DEFAULT_MARKUP_TIERS)
  const contentInput = {
    name: input.title,
    brand: input.brand,
    model: input.model,
    categorySlug: input.categorySlug,
    categoryName: categoryName(input.categorySlug),
    specs: input.specs,
    condition: input.specs['laptop_condition'] || input.specs['condition'] || null,
    warranty: input.specs['warranty'] || null,
    priceKes: input.supplierPrice,
  }
  const content = generateContent(contentInput)
  const seo = generateSeo(contentInput, content)
  const completeness = computeCompleteness({
    title: input.title,
    brand: input.brand,
    categorySlug: input.categorySlug,
    specs: input.specs,
    imagesCount: input.imagesCount,
    supplierPrice: input.supplierPrice,
    hasDescription: Boolean(input.description || content.long_description),
    hasSeo: Boolean(seo.title && seo.meta_description),
  })
  const pricing = computePricing({
    supplierPrice: input.supplierPrice ?? 0,
    supplierCurrency: input.supplierCurrency,
    fxRateToKes: input.fxRate,
    costs: [],
    competitorPrice: input.competitorPrice,
    tiers,
  })
  return { content, seo, completeness, pricing }
}

export default function AdminProductImport() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('url')
  const [urlMode, setUrlMode] = useState<UrlMode>('single')
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([])
  const [supplierId, setSupplierId] = useState('')
  const [sourceKind, setSourceKind] = useState('nairobi_cbd')
  const [currency, setCurrency] = useState('KES')
  const [fxRate, setFxRate] = useState('1')
  const [category, setCategory] = useState('laptops')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // URL tab - Single
  const [url, setUrl] = useState('')
  const [duplicate, setDuplicate] = useState<DuplicateCheck | null>(null)
  const [extracted, setExtracted] = useState<ExtractedProduct | null>(null)

  // URL tab - Bulk (up to 100 products)
  const [bulkUrlsText, setBulkUrlsText] = useState('')
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number; currentTitle: string } | null>(null)

  // CSV tab
  const [csvText, setCsvText] = useState('')
  const [plans, setPlans] = useState<CsvImportPlan[]>([])
  const [importedIds, setImportedIds] = useState<Array<{ id: string; title: string }>>([])

  // Queue of imports
  const [queue, setQueue] = useState<ProductImportRow[]>([])
  const [queueFilter, setQueueFilter] = useState('')

  // Quick price editor modal / state
  const [editingRow, setEditingRow] = useState<ProductImportRow | null>(null)
  const [editPriceForm, setEditPriceForm] = useState({
    supplier_price: '',
    supplier_currency: 'KES',
    fx_rate_to_kes: '1',
    selling_price: '',
  })
  const [savingPrice, setSavingPrice] = useState(false)

  // Manual tab
  const [manual, setManual] = useState({
    title: '',
    brand: '',
    model: '',
    price: '',
    processor: '',
    ram: '',
    storage: '',
    display: '',
    description: '',
  })

  const refreshQueue = () => {
    fetchImports()
      .then(setQueue)
      .catch(() => setQueue([]))
  }

  useEffect(() => {
    loadSuppliers()
      .then(setSuppliers)
      .catch(() => setSuppliers([]))
    refreshQueue()
  }, [])

  const selectedSupplier = useMemo(() => suppliers.find((s) => s.id === supplierId) || null, [suppliers, supplierId])

  useEffect(() => {
    if (selectedSupplier) {
      setCurrency(selectedSupplier.currency || 'KES')
      setSourceKind(selectedSupplier.source_kind || 'nairobi_cbd')
    }
  }, [selectedSupplier])

  const supplierPatch = () => ({
    supplier_id: supplierId || null,
    supplier_name: selectedSupplier?.supplier_name ?? null,
    source_kind: sourceKind,
  })

  // -------------------------------------------------------------------------
  // URL Single Scrape
  // -------------------------------------------------------------------------
  const handleUrlFetch = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setExtracted(null)
    setDuplicate(null)
    if (!url.trim()) {
      setError('Paste a supplier product URL first.')
      return
    }
    setBusy(true)
    try {
      const supabase = getSupabase()
      if (!supabase) throw new Error('The store database is not configured.')

      const dup = await detectDuplicate({ sourceUrl: url.trim() }).catch(() => null)
      if (dup) setDuplicate(dup)

      const { data, error: fnError } = await supabase.functions.invoke('fetch-product-url', {
        body: { url: url.trim() },
      })
      if (fnError) throw new Error(fnError.message || 'Could not reach the scraper engine.')
      if (!data?.ok) throw new Error(data?.error || 'Could not extract product information.')

      setExtracted(data as ExtractedProduct)
      if (data.supplier_currency) setCurrency(data.supplier_currency)
      if (data.fx_rate_to_kes) setFxRate(String(data.fx_rate_to_kes))
      if (!data.title) {
        setError('The page loaded, but no product title was found. Review and fill details manually.')
      }
    } catch (err: any) {
      setError(err.message || 'Import failed.')
    } finally {
      setBusy(false)
    }
  }

  const handleUrlCreate = async () => {
    if (!extracted) return
    setBusy(true)
    setError(null)
    try {
      const fx = Number(fxRate) || 1
      const guessed = guessCategory(extracted.title || '')
      const specs = (extracted.specs && typeof extracted.specs === 'object' ? extracted.specs : {}) as Record<string, string>
      const candidates: ExtractedImageCandidate[] =
        Array.isArray(extracted.image_candidates) && extracted.image_candidates.length > 0
          ? extracted.image_candidates
          : (Array.isArray(extracted.images) ? extracted.images : []).map((u) => ({
              url: u,
              relevance: 'unverified' as const,
              source_url: extracted.final_url || url.trim(),
            }))
      const accepted = candidates.filter((c) => c.relevance !== 'rejected')
      const primaryCandidate = candidates.find((c) => c.relevance === 'exact') || candidates.find((c) => c.relevance === 'likely')

      const bundle = await deriveBundle({
        title: extracted.title || url,
        brand: extracted.brand ?? null,
        model: extracted.model ?? null,
        categorySlug: guessed,
        description: extracted.description ?? null,
        specs,
        supplierPrice: extracted.price ?? null,
        supplierCurrency: extracted.currency || currency,
        fxRate: fx,
        competitorPrice: null,
        imagesCount: accepted.length,
      })

      const row = await createImport({
        source_type: 'url',
        source_url: extracted.final_url || url.trim(),
        ...supplierPatch(),
        title: extracted.title || url,
        brand_name: extracted.brand ?? null,
        model: extracted.model ?? null,
        category_slug: guessed,
        description: extracted.description ?? null,
        specs,
        supplier_price: extracted.price ?? null,
        supplier_currency: extracted.currency || currency,
        fx_rate_to_kes: fx,
        extraction_status: 'extracted',
        extraction_notes: Array.isArray(extracted.warnings) ? extracted.warnings.join(' ') : null,
        image_query:
          extracted.image_query ||
          buildImageQuery({ title: extracted.title, brand: extracted.brand, model: extracted.model, categorySlug: guessed }),
      })

      if (candidates.length > 0) {
        await replaceImportImages(
          row.id,
          candidates.map((candidate, index) => ({
            url: candidate.url,
            alt: candidate.alt || `${extracted.title || 'Product'} image ${index + 1}`,
            is_primary: primaryCandidate != null && candidate.url === primaryCandidate.url,
            status: candidate.relevance === 'rejected' ? ('rejected' as const) : ('pending' as const),
            source_url: candidate.source_url || extracted.final_url || url.trim(),
            source_domain: candidate.source_domain || null,
            relevance: candidate.relevance || 'unverified',
            method: candidate.method || null,
            width: candidate.width ?? null,
            height: candidate.height ?? null,
            verification_note: candidate.verification_note ?? null,
          })),
        )
      }

      await updateImport(row.id, {
        content: bundle.content as unknown as Record<string, unknown>,
        seo: bundle.seo as unknown as Record<string, unknown>,
        pricing: bundle.pricing as unknown as Record<string, unknown>,
        completeness_score: bundle.completeness.score,
        missing_fields: bundle.completeness.missing,
        status: accepted.length > 0 ? 'in_review' : 'images_pending',
      })

      navigate(`/admin/product-review/${row.id}`)
    } catch (err: any) {
      setError(err.message || 'Could not create the import.')
    } finally {
      setBusy(false)
    }
  }

  // -------------------------------------------------------------------------
  // URL Bulk Scrape (up to 100 products)
  // -------------------------------------------------------------------------
  const parsedBulkUrls = useMemo(() => {
    return bulkUrlsText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('http://') || l.startsWith('https://'))
      .slice(0, 100)
  }, [bulkUrlsText])

  const handleBulkScrape = async () => {
    if (parsedBulkUrls.length === 0) {
      setError('Please enter at least one valid supplier URL (up to 100 links).')
      return
    }

    setBusy(true)
    setError(null)
    setMessage(null)
    const total = parsedBulkUrls.length
    let succeeded = 0
    let failed = 0

    const supabase = getSupabase()
    if (!supabase) {
      setError('The store database is not configured.')
      setBusy(false)
      return
    }

    for (let i = 0; i < total; i++) {
      const targetUrl = parsedBulkUrls[i]
      setBulkProgress({
        current: i + 1,
        total,
        currentTitle: `Scraping: ${targetUrl.slice(0, 45)}...`,
      })

      try {
        const { data, error: fnError } = await supabase.functions.invoke('fetch-product-url', {
          body: { url: targetUrl },
        })

        if (fnError || !data?.ok) {
          failed++
          continue
        }

        const ext = data as ExtractedProduct
        const fx = Number(ext.fx_rate_to_kes || fxRate) || 1
        const guessed = guessCategory(ext.title || '')
        const specs = (ext.specs && typeof ext.specs === 'object' ? ext.specs : {}) as Record<string, string>
        const candidates: ExtractedImageCandidate[] =
          Array.isArray(ext.image_candidates) && ext.image_candidates.length > 0
            ? ext.image_candidates
            : (Array.isArray(ext.images) ? ext.images : []).map((u) => ({
                url: u,
                relevance: 'unverified' as const,
                source_url: ext.final_url || targetUrl,
              }))
        const accepted = candidates.filter((c) => c.relevance !== 'rejected')
        const primaryCandidate = candidates.find((c) => c.relevance === 'exact') || candidates.find((c) => c.relevance === 'likely')

        const bundle = await deriveBundle({
          title: ext.title || targetUrl,
          brand: ext.brand ?? null,
          model: ext.model ?? null,
          categorySlug: guessed,
          description: ext.description ?? null,
          specs,
          supplierPrice: ext.price ?? null,
          supplierCurrency: ext.currency || currency,
          fxRate: fx,
          competitorPrice: null,
          imagesCount: accepted.length,
        })

        const row = await createImport({
          source_type: 'url',
          source_url: ext.final_url || targetUrl,
          ...supplierPatch(),
          title: ext.title || targetUrl,
          brand_name: ext.brand ?? null,
          model: ext.model ?? null,
          category_slug: guessed,
          description: ext.description ?? null,
          specs,
          supplier_price: ext.price ?? null,
          supplier_currency: ext.currency || currency,
          fx_rate_to_kes: fx,
          extraction_status: 'extracted',
          extraction_notes: Array.isArray(ext.warnings) ? ext.warnings.join(' ') : null,
          image_query:
            ext.image_query ||
            buildImageQuery({ title: ext.title, brand: ext.brand, model: ext.model, categorySlug: guessed }),
        })

        if (candidates.length > 0) {
          await replaceImportImages(
            row.id,
            candidates.map((candidate, index) => ({
              url: candidate.url,
              alt: candidate.alt || `${ext.title || 'Product'} image ${index + 1}`,
              is_primary: primaryCandidate != null && candidate.url === primaryCandidate.url,
              status: candidate.relevance === 'rejected' ? ('rejected' as const) : ('pending' as const),
              source_url: candidate.source_url || ext.final_url || targetUrl,
              source_domain: candidate.source_domain || null,
              relevance: candidate.relevance || 'unverified',
              method: candidate.method || null,
              width: candidate.width ?? null,
              height: candidate.height ?? null,
              verification_note: candidate.verification_note ?? null,
            })),
          )
        }

        await updateImport(row.id, {
          content: bundle.content as unknown as Record<string, unknown>,
          seo: bundle.seo as unknown as Record<string, unknown>,
          pricing: bundle.pricing as unknown as Record<string, unknown>,
          completeness_score: bundle.completeness.score,
          missing_fields: bundle.completeness.missing,
          status: accepted.length > 0 ? 'in_review' : 'images_pending',
        })

        succeeded++
      } catch {
        failed++
      }
    }

    setBulkProgress(null)
    setBusy(false)
    setMessage(`Bulk scrape completed: ${succeeded} product(s) successfully staged into the list. ${failed > 0 ? `${failed} failed.` : ''}`)
    refreshQueue()
  }

  // -------------------------------------------------------------------------
  // Inline Price Editor
  // -------------------------------------------------------------------------
  const openPriceEditor = (row: ProductImportRow) => {
    setEditingRow(row)
    setEditPriceForm({
      supplier_price: row.supplier_price != null ? String(row.supplier_price) : '',
      supplier_currency: row.supplier_currency || 'KES',
      fx_rate_to_kes: String(row.fx_rate_to_kes || 1),
      selling_price: row.approved_selling_price != null ? String(row.approved_selling_price) : '',
    })
  }

  const handleSavePrice = async () => {
    if (!editingRow) return
    setSavingPrice(true)
    try {
      const suppPrice = editPriceForm.supplier_price ? Number(editPriceForm.supplier_price) : null
      const fx = Number(editPriceForm.fx_rate_to_kes) || 1
      const sellPrice = editPriceForm.selling_price ? Number(editPriceForm.selling_price) : null

      const tiers = await loadMarkupTiers().catch(() => DEFAULT_MARKUP_TIERS)
      const computed = computePricing({
        supplierPrice: suppPrice ?? 0,
        supplierCurrency: editPriceForm.supplier_currency,
        fxRateToKes: fx,
        costs: [],
        competitorPrice: editingRow.competitor_price,
        tiers,
        manualSellingPrice: sellPrice,
      })

      await updateImport(editingRow.id, {
        supplier_price: suppPrice,
        supplier_currency: editPriceForm.supplier_currency,
        fx_rate_to_kes: fx,
        approved_selling_price: sellPrice || computed.appliedSellingPrice,
        pricing: {
          supplier_cost_kes: computed.supplierCostKes,
          suggested_selling_price: computed.suggestedSellingPrice,
          applied_selling_price: sellPrice || computed.appliedSellingPrice,
          is_manual_override: Boolean(sellPrice),
          markup_pct: computed.markupPct,
          gross_profit: computed.grossProfit,
          gross_margin_pct: computed.grossMarginPct,
        },
      })

      setMessage(`Price updated for "${editingRow.title}"`)
      setEditingRow(null)
      refreshQueue()
    } catch (err: any) {
      setError(err.message || 'Could not update price.')
    } finally {
      setSavingPrice(false)
    }
  }

  // -------------------------------------------------------------------------
  // CSV import
  // -------------------------------------------------------------------------
  const handleCsvFile = async (file: File) => {
    const text = await file.text()
    setCsvText(text)
    await handleCsvParse(text)
  }

  const handleCsvParse = async (text?: string) => {
    setError(null)
    setMessage(null)
    setImportedIds([])
    const source = text ?? csvText
    if (!source.trim()) {
      setError('Paste CSV content or choose a file first.')
      return
    }
    setBusy(true)
    try {
      const plan = await buildCsvPlan(source)
      setPlans(plan)
      if (plan.length === 0) {
        setError('No rows were recognised from this CSV. Check the headers and delimiter.')
      }
    } catch (err: any) {
      setError(err.message || 'Could not parse the CSV.')
    } finally {
      setBusy(false)
    }
  }

  const handleCsvImport = async () => {
    const valid = plans.filter((p) => p.errors.length === 0)
    if (valid.length === 0) {
      setError('No valid rows to import.')
      return
    }
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const fx = Number(fxRate) || 1
      const created: Array<{ id: string; title: string }> = []
      const failures: string[] = []

      for (const plan of valid) {
        try {
          const m = plan.mapped
          const bundle = await deriveBundle({
            title: m.title,
            brand: m.brand_name,
            model: m.model,
            categorySlug: m.category_slug,
            description: m.description,
            specs: m.specs,
            supplierPrice: m.supplier_price,
            supplierCurrency: m.supplier_currency,
            fxRate: fx,
            competitorPrice: m.competitor_price,
            imagesCount: 0,
          })
          const row = await createImport({
            source_type: 'csv',
            source_url: m.source_url,
            ...supplierPatch(),
            title: m.title,
            brand_name: m.brand_name,
            model: m.model,
            category_slug: m.category_slug,
            description: m.description,
            specs: m.specs,
            supplier_price: m.supplier_price,
            supplier_currency: m.supplier_currency,
            fx_rate_to_kes: fx,
            competitor_price: m.competitor_price,
            extraction_status: 'extracted',
            image_query: buildImageQuery({
              title: m.title,
              brand: m.brand_name,
              model: m.model,
              categorySlug: m.category_slug,
            }),
          })
          await updateImport(row.id, {
            content: bundle.content as unknown as Record<string, unknown>,
            seo: bundle.seo as unknown as Record<string, unknown>,
            pricing: bundle.pricing as unknown as Record<string, unknown>,
            completeness_score: bundle.completeness.score,
            missing_fields: bundle.completeness.missing,
            status: 'images_pending',
          })
          created.push({ id: row.id, title: m.title })
        } catch (rowErr: any) {
          failures.push(`Row ${plan.rowNumber}: ${rowErr.message}`)
        }
      }
      setImportedIds(created)
      if (created.length > 0) {
        setMessage(`${created.length} product${created.length === 1 ? '' : 's'} imported. ${failures.length ? `${failures.length} row(s) failed.` : ''}`)
        refreshQueue()
      } else {
        setError(failures.length ? failures.join(' | ') : 'No products were imported.')
      }
    } finally {
      setBusy(false)
    }
  }

  // -------------------------------------------------------------------------
  // Manual import
  // -------------------------------------------------------------------------
  const handleManualCreate = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (manual.title.trim().length < 3) {
      setError('Enter a product title.')
      return
    }
    setBusy(true)
    try {
      const fx = Number(fxRate) || 1
      const specs: Record<string, string> = {}
      if (manual.processor.trim()) specs['processor_model'] = manual.processor.trim()
      if (manual.ram.trim()) specs['ram'] = manual.ram.trim()
      if (manual.storage.trim()) specs['storage_capacity'] = manual.storage.trim()
      if (manual.display.trim()) specs['screen_size'] = manual.display.trim()

      const price = manual.price ? Number(manual.price) : null
      const bundle = await deriveBundle({
        title: manual.title.trim(),
        brand: manual.brand.trim() || null,
        model: manual.model.trim() || null,
        categorySlug: category,
        description: manual.description.trim() || null,
        specs,
        supplierPrice: price,
        supplierCurrency: currency,
        fxRate: fx,
        competitorPrice: null,
        imagesCount: 0,
      })

      const row = await createImport({
        source_type: 'manual',
        ...supplierPatch(),
        title: manual.title.trim(),
        brand_name: manual.brand.trim() || null,
        model: manual.model.trim() || null,
        category_slug: category,
        description: manual.description.trim() || null,
        specs,
        supplier_price: price,
        supplier_currency: currency,
        fx_rate_to_kes: fx,
        extraction_status: 'manual',
        image_query: buildImageQuery({
          title: manual.title.trim(),
          brand: manual.brand.trim() || null,
          model: manual.model.trim() || null,
          categorySlug: category,
        }),
      })
      await updateImport(row.id, {
        content: bundle.content as unknown as Record<string, unknown>,
        seo: bundle.seo as unknown as Record<string, unknown>,
        pricing: bundle.pricing as unknown as Record<string, unknown>,
        completeness_score: bundle.completeness.score,
        missing_fields: bundle.completeness.missing,
        status: 'images_pending',
      })
      navigate(`/admin/product-review/${row.id}`)
    } catch (err: any) {
      setError(err.message || 'Could not create the draft.')
    } finally {
      setBusy(false)
    }
  }

  // Filtered queue items
  const filteredQueue = useMemo(() => {
    if (!queueFilter.trim()) return queue
    const term = queueFilter.toLowerCase()
    return queue.filter(
      (r) =>
        r.title.toLowerCase().includes(term) ||
        (r.brand_name && r.brand_name.toLowerCase().includes(term)) ||
        r.category_slug.toLowerCase().includes(term) ||
        r.status.toLowerCase().includes(term),
    )
  }, [queue, queueFilter])

  return (
    <AdminLayout
      title="Product Import Center"
      subtitle="Multi-supplier product intelligence, single & bulk scraping (up to 100 products), and price management"
    >
      {message && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-teal/30 bg-mint/50 p-3 text-xs font-bold text-tealdeep">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-tealdeep/60 hover:text-tealdeep">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {error && (
        <div className="mb-4 flex items-start justify-between rounded-lg border border-error/30 bg-error/10 p-3 text-xs font-bold text-error">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-error/60 hover:text-error">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Shared supplier settings */}
      <div className="mb-5 rounded-xl border border-line bg-card p-4 shadow-xs">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-[10px] font-bold uppercase text-muted">
            Supplier
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="input mt-1 w-full text-xs font-semibold">
              <option value="">No supplier selected</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.supplier_name}{s.shop_name ? ` — ${s.shop_name}` : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[10px] font-bold uppercase text-muted">
            Market Sourcing
            <select value={sourceKind} onChange={(e) => setSourceKind(e.target.value)} className="input mt-1 w-full text-xs font-semibold">
              {SOURCE_KINDS.map((k) => (
                <option key={k.value} value={k.value}>{k.label}</option>
              ))}
            </select>
          </label>
          <label className="block text-[10px] font-bold uppercase text-muted">
            Supplier Currency
            <input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} className="input mt-1 w-full text-xs font-bold" />
          </label>
          <label className="block text-[10px] font-bold uppercase text-muted">
            FX rate to KES
            <input type="number" step="0.0001" value={fxRate} onChange={(e) => setFxRate(e.target.value)} className="input mt-1 w-full text-xs font-bold" />
          </label>
        </div>
        <p className="mt-2 text-[11px] text-muted">
          Supplier settings apply to imported batches. {selectedSupplier ? `Selected: ${selectedSupplier.supplier_name} (${selectedSupplier.country}).` : ''}
        </p>
      </div>

      {/* Import Method Tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-line bg-card p-1">
        {([
          { id: 'url', label: 'Supplier URL Scraper', icon: Link2 },
          { id: 'csv', label: 'Spreadsheet / CSV', icon: FileSpreadsheet },
          { id: 'manual', label: 'Manual Entry', icon: PenLine },
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

      {/* URL Scraper Tab (Single or Bulk up to 100) */}
      {tab === 'url' && (
        <div className="space-y-4">
          {/* Mode Switcher */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setUrlMode('single')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                urlMode === 'single' ? 'bg-ink text-white' : 'bg-mist text-muted hover:text-ink'
              }`}
            >
              Single Product URL
            </button>
            <button
              type="button"
              onClick={() => setUrlMode('bulk')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${
                urlMode === 'bulk' ? 'bg-ink text-white' : 'bg-mist text-muted hover:text-ink'
              }`}
            >
              <Layers className="h-3.5 w-3.5" /> Bulk Scrape (Up to 100 Products)
            </button>
          </div>

          {/* Single URL Scraper */}
          {urlMode === 'single' && (
            <>
              <form onSubmit={handleUrlFetch} className="rounded-xl border border-line bg-card p-4 shadow-xs">
                <label className="block text-xs font-bold text-muted">Supplier product URL</label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://supplier.example.com/product/..."
                    className="input flex-1 text-xs"
                  />
                  <button type="submit" disabled={busy} className="btn btn-emerald !h-10 text-xs font-bold shadow-xs disabled:opacity-50">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />} Scrape & Extract
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-muted">
                  SSRF protected. Automatically extracts technical hardware specs, currency, images, and generates 8-section descriptions.
                </p>
              </form>

              {duplicate && (
                <div className="rounded-xl border border-amber/40 bg-amber/5 p-3 text-xs text-amberdeep">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="h-4 w-4" /> Possible duplicate detected
                  </div>
                  <p className="mt-1">
                    {duplicate.reason === 'existing_product'
                      ? `A published product already exists with slug: ${duplicate.productSlug}.`
                      : 'A matching import item already exists in the staging queue.'}
                  </p>
                </div>
              )}

              {extracted && (
                <div className="rounded-xl border border-line bg-card p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-ink">
                      <CheckCircle2 className="h-4 w-4 text-teal" /> Scraped Preview & Specifications
                    </div>
                    {extracted.completeness_score != null && (
                      <span className="rounded-full bg-teal/10 px-2 py-0.5 text-xs font-extrabold text-teal">
                        {extracted.completeness_score}% Complete
                      </span>
                    )}
                  </div>

                  <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg bg-mist/50 p-2.5">
                      <dt className="text-muted text-[10px] uppercase font-bold">Title</dt>
                      <dd className="font-bold text-ink truncate mt-0.5">{extracted.title || '—'}</dd>
                    </div>
                    <div className="rounded-lg bg-mist/50 p-2.5">
                      <dt className="text-muted text-[10px] uppercase font-bold">Brand & Model</dt>
                      <dd className="font-bold text-ink mt-0.5">{extracted.brand || '—'} {extracted.model || ''}</dd>
                    </div>
                    <div className="rounded-lg bg-mist/50 p-2.5">
                      <dt className="text-muted text-[10px] uppercase font-bold">Supplier Price</dt>
                      <dd className="font-bold text-teal mt-0.5">
                        {extracted.price != null ? `${extracted.price.toLocaleString()} ${extracted.currency || 'KES'}` : '—'}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-mist/50 p-2.5">
                      <dt className="text-muted text-[10px] uppercase font-bold">Estimated KES Cost</dt>
                      <dd className="font-bold text-ink mt-0.5">
                        {extracted.estimated_kes_cost ? formatKES(extracted.estimated_kes_cost) : '—'}
                      </dd>
                    </div>
                  </dl>

                  {/* Extracted Specs Highlights */}
                  {extracted.specs && Object.keys(extracted.specs).length > 0 && (
                    <div className="mt-3 rounded-lg border border-line p-3 text-xs">
                      <p className="font-extrabold text-ink text-[11px] uppercase tracking-wider mb-2">Normalized Hardware Specifications</p>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-muted">
                        {Object.entries(extracted.specs).slice(0, 9).map(([k, v]) => (
                          <div key={k} className="flex justify-between border-b border-line/40 pb-1">
                            <span className="capitalize">{k.replace(/_/g, ' ')}:</span>
                            <span className="font-semibold text-ink">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Candidate Images */}
                  <div className="mt-3">
                    <p className="font-bold text-ink text-xs mb-2">
                      Scored Images ({(extracted.image_candidates || []).filter((c) => c.relevance === 'exact' || c.relevance === 'likely').length} verified exact/likely)
                    </p>
                    <div className="grid gap-2 sm:grid-cols-4">
                      {(extracted.image_candidates || []).slice(0, 4).map((c, i) => (
                        <div key={i} className="flex flex-col items-center rounded-lg border border-line p-2 text-center">
                          <img src={c.url} alt="Candidate" className="h-20 w-20 object-contain mb-1" />
                          <span className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold ${relevanceBadgeClass(c.relevance)}`}>
                            {imageRelevanceLabel(c.relevance)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={handleUrlCreate}
                      disabled={busy}
                      className="btn btn-emerald !h-10 text-xs font-bold shadow-xs disabled:opacity-50"
                    >
                      <ArrowRight className="h-4 w-4" /> Save to Staging & Open Review
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Bulk URL Scraper (Up to 100) */}
          {urlMode === 'bulk' && (
            <div className="rounded-xl border border-line bg-card p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-extrabold text-ink">Bulk Product URL Scraper</p>
                  <p className="text-xs text-muted">
                    Paste supplier product URLs (one per line, up to 100 products). The engine will scrape, normalize, and stage them automatically into your queue.
                  </p>
                </div>
                <span className="rounded-full bg-mist px-3 py-1 text-xs font-bold text-ink">
                  {parsedBulkUrls.length} / 100 URLs detected
                </span>
              </div>

              <textarea
                rows={8}
                value={bulkUrlsText}
                onChange={(e) => setBulkUrlsText(e.target.value)}
                placeholder="https://supplier.com/item-1&#10;https://supplier.com/item-2&#10;https://supplier.com/item-3"
                className="input mt-3 w-full py-2 font-mono text-xs"
              />

              {bulkProgress && (
                <div className="mt-3 rounded-lg border border-teal/30 bg-mint/40 p-3">
                  <div className="flex items-center justify-between text-xs font-bold text-tealdeep">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-4 w-4 animate-spin text-teal" /> {bulkProgress.currentTitle}
                    </span>
                    <span>{bulkProgress.current} of {bulkProgress.total}</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full bg-teal transition-all duration-300"
                      style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBulkScrape}
                  disabled={busy || parsedBulkUrls.length === 0}
                  className="btn btn-emerald !h-10 text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}
                  Scrape & Stage All ({parsedBulkUrls.length} products)
                </button>
                {parsedBulkUrls.length > 0 && !busy && (
                  <button
                    type="button"
                    onClick={() => setBulkUrlsText('')}
                    className="btn btn-outline !h-10 text-xs font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CSV Import */}
      {tab === 'csv' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-line bg-card p-4 shadow-xs">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="block flex-1 text-xs font-bold text-muted">
                Upload CSV / spreadsheet export
                <input
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleCsvFile(file)
                  }}
                  className="mt-1 block w-full text-xs"
                />
              </label>
              <span className="text-[11px] text-muted">or paste below</span>
            </div>
            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="title,brand,price,currency,processor,ram,storage,display,category,url,description"
              className="input mt-3 w-full py-2 text-xs"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => handleCsvParse()} disabled={busy} className="btn btn-emerald !h-9 text-xs font-bold shadow-xs disabled:opacity-50">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />} Parse & preview
              </button>
              {plans.length > 0 && (
                <button type="button" onClick={handleCsvImport} disabled={busy} className="btn btn-outline !h-9 text-xs font-bold">
                  Import {plans.filter((p) => p.errors.length === 0).length} valid row(s)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry */}
      {tab === 'manual' && (
        <form onSubmit={handleManualCreate} className="rounded-xl border border-line bg-card p-4 shadow-xs">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-bold text-muted sm:col-span-2">
              Product title *
              <input value={manual.title} onChange={(e) => setManual({ ...manual, title: e.target.value })} className="input mt-1 w-full text-xs font-bold" placeholder="e.g. HP EliteBook 840 G8 Core i7 16GB 512GB" />
            </label>
            <label className="block text-xs font-bold text-muted">
              Brand
              <input value={manual.brand} onChange={(e) => setManual({ ...manual, brand: e.target.value })} className="input mt-1 w-full text-xs" placeholder="HP" />
            </label>
            <label className="block text-xs font-bold text-muted">
              Model
              <input value={manual.model} onChange={(e) => setManual({ ...manual, model: e.target.value })} className="input mt-1 w-full text-xs" />
            </label>
            <label className="block text-xs font-bold text-muted">
              Category
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input mt-1 w-full text-xs font-semibold">
                {CATEGORY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </label>
            <label className="block text-xs font-bold text-muted">
              Supplier price ({currency})
              <input type="number" value={manual.price} onChange={(e) => setManual({ ...manual, price: e.target.value })} className="input mt-1 w-full text-xs font-bold text-teal" placeholder="0" />
            </label>
            <label className="block text-xs font-bold text-muted">
              Processor
              <input value={manual.processor} onChange={(e) => setManual({ ...manual, processor: e.target.value })} className="input mt-1 w-full text-xs" placeholder="Intel Core i7-1165G7" />
            </label>
            <label className="block text-xs font-bold text-muted">
              RAM
              <input value={manual.ram} onChange={(e) => setManual({ ...manual, ram: e.target.value })} className="input mt-1 w-full text-xs" placeholder="16GB" />
            </label>
            <label className="block text-xs font-bold text-muted">
              Storage
              <input value={manual.storage} onChange={(e) => setManual({ ...manual, storage: e.target.value })} className="input mt-1 w-full text-xs" placeholder="512GB SSD" />
            </label>
            <label className="block text-xs font-bold text-muted">
              Display
              <input value={manual.display} onChange={(e) => setManual({ ...manual, display: e.target.value })} className="input mt-1 w-full text-xs" placeholder="14-inch FHD" />
            </label>
            <label className="block text-xs font-bold text-muted sm:col-span-2">
              Notes / description
              <textarea rows={3} value={manual.description} onChange={(e) => setManual({ ...manual, description: e.target.value })} className="input mt-1 w-full py-2 text-xs" />
            </label>
          </div>
          <button type="submit" disabled={busy} className="btn btn-emerald mt-4 !h-10 w-full text-xs font-bold shadow-xs disabled:opacity-50 sm:w-auto">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create Draft & Open Review
          </button>
        </form>
      )}

      {/* STAGING QUEUE & INLINE PRICE EDITOR */}
      <div className="mt-8">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-extrabold text-ink">Imported Products List ({queue.length})</p>
            <p className="text-xs text-muted">Review, adjust pricing, and approve items before publishing to the live catalog.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted" />
              <input
                type="text"
                value={queueFilter}
                onChange={(e) => setQueueFilter(e.target.value)}
                placeholder="Filter imports..."
                className="input !h-8 pl-8 text-xs w-48"
              />
            </div>
            <Link to="/admin/product-publishing" className="btn btn-outline !h-8 text-xs font-bold">
              Bulk Publishing →
            </Link>
          </div>
        </div>

        {queue.length === 0 ? (
          <div className="rounded-xl border border-line bg-card p-8 text-center text-xs text-muted">
            No products in the import list yet. Use the URL scraper or CSV uploader above to import products.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line bg-card shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-mist text-[10px] font-extrabold uppercase text-muted">
                <tr>
                  <th className="px-3 py-2.5">Product Title</th>
                  <th className="px-3 py-2.5">Category</th>
                  <th className="px-3 py-2.5">Supplier Cost</th>
                  <th className="px-3 py-2.5">Selling Price</th>
                  <th className="px-3 py-2.5">Completeness</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredQueue.slice(0, 50).map((row) => (
                  <tr key={row.id} className="hover:bg-mist/50">
                    <td className="px-3 py-2.5">
                      <p className="font-bold text-ink">{row.title}</p>
                      <p className="text-[10px] text-muted">{row.brand_name || 'Generic'} · {row.source_type.toUpperCase()}</p>
                    </td>
                    <td className="px-3 py-2.5 capitalize text-muted">
                      {row.category_slug.replace(/-/g, ' ')}
                    </td>
                    <td className="px-3 py-2.5 font-medium">
                      {row.supplier_price != null ? `${formatKES(row.supplier_price)} ${row.supplier_currency}` : '—'}
                    </td>
                    <td className="px-3 py-2.5 font-bold text-teal">
                      {row.approved_selling_price != null ? (
                        formatKES(row.approved_selling_price)
                      ) : (row.pricing as any)?.applied_selling_price != null ? (
                        formatKES(Number((row.pricing as any).applied_selling_price))
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-bold text-ink">{Math.round(row.completeness_score)}%</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="rounded-full bg-mist px-2 py-0.5 text-[10px] font-extrabold uppercase text-muted">
                        {row.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openPriceEditor(row)}
                        className="btn btn-outline !h-7 !px-2 text-[11px] font-bold mr-1.5"
                      >
                        <Edit3 className="h-3 w-3 mr-1" /> Edit Price
                      </button>
                      <Link
                        to={`/admin/product-review/${row.id}`}
                        className="btn btn-emerald !h-7 !px-2.5 text-[11px] font-bold"
                      >
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QUICK PRICE EDITOR MODAL */}
      {editingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-line bg-card p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <p className="text-sm font-extrabold text-ink">Edit Pricing</p>
              <button onClick={() => setEditingRow(null)} className="text-muted hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-xs font-semibold text-muted line-clamp-1">{editingRow.title}</p>

            <div className="mt-4 space-y-3">
              <label className="block text-xs font-bold text-muted">
                Supplier Cost
                <input
                  type="number"
                  value={editPriceForm.supplier_price}
                  onChange={(e) => setEditPriceForm({ ...editPriceForm, supplier_price: e.target.value })}
                  className="input mt-1 w-full text-xs font-bold"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs font-bold text-muted">
                  Currency
                  <input
                    value={editPriceForm.supplier_currency}
                    onChange={(e) => setEditPriceForm({ ...editPriceForm, supplier_currency: e.target.value.toUpperCase() })}
                    className="input mt-1 w-full text-xs font-bold"
                  />
                </label>
                <label className="block text-xs font-bold text-muted">
                  FX Rate to KES
                  <input
                    type="number"
                    step="0.0001"
                    value={editPriceForm.fx_rate_to_kes}
                    onChange={(e) => setEditPriceForm({ ...editPriceForm, fx_rate_to_kes: e.target.value })}
                    className="input mt-1 w-full text-xs font-bold"
                  />
                </label>
              </div>
              <label className="block text-xs font-bold text-muted">
                Target Selling Price (KES)
                <input
                  type="number"
                  value={editPriceForm.selling_price}
                  onChange={(e) => setEditPriceForm({ ...editPriceForm, selling_price: e.target.value })}
                  placeholder="Leave empty for auto markup tier"
                  className="input mt-1 w-full text-xs font-bold text-teal"
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-line pt-3">
              <button
                type="button"
                onClick={() => setEditingRow(null)}
                className="btn btn-outline !h-9 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePrice}
                disabled={savingPrice}
                className="btn btn-emerald !h-9 text-xs font-bold"
              >
                {savingPrice ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save Price
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
