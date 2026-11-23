/** Data access + helpers for the product import / review / publishing workflow. */

import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabase } from '@/lib/supabase'
import { slugify } from '@/lib/productContent'

export type ImportSourceType = 'url' | 'csv' | 'manual'
export type ImportStatus =
  | 'draft'
  | 'extracted'
  | 'images_pending'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'archived'
  | 'published'
export type AvailabilityStatus = 'in_stock' | 'supplier' | 'preorder' | 'out_of_stock' | 'discontinued'
export type SourceKind = 'nairobi_cbd' | 'kenya_other' | 'china' | 'international'

export interface ProductImportRow {
  id: string
  source_type: ImportSourceType
  source_url: string | null
  supplier_id: string | null
  supplier_name: string | null
  source_kind: string
  title: string
  model: string | null
  brand_name: string | null
  category_slug: string
  description: string | null
  specs: Record<string, string>
  supplier_price: number | null
  supplier_currency: string
  fx_rate_to_kes: number
  competitor_price: number | null
  availability_status: AvailabilityStatus
  availability_verified: boolean
  extraction_status: 'pending' | 'extracted' | 'manual' | 'failed'
  extraction_notes: string | null
  image_query: string | null
  content: Record<string, unknown>
  seo: Record<string, unknown>
  pricing: Record<string, unknown>
  completeness_score: number
  missing_fields: string[]
  status: ImportStatus
  approved_selling_price: number | null
  price_override_reason: string | null
  linked_product_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ImportImage {
  id: string
  import_id: string
  url: string
  alt: string | null
  sort_order: number
  is_primary: boolean
  status: 'pending' | 'approved' | 'rejected'
  source_url: string | null
  source_domain: string | null
  relevance: 'exact' | 'likely' | 'unverified' | 'rejected'
  method: string | null
  width: number | null
  height: number | null
  verification_note: string | null
}

export interface AcquisitionCostRow {
  id: string
  import_id: string
  label: string
  amount: number
  currency: string
  is_estimated: boolean
  notes: string | null
}

export interface SupplierOption {
  id: string
  supplier_name: string
  shop_name: string | null
  source_kind: string
  country: string
  currency: string
  reliability_rating: number | null
}

function client(): SupabaseClient {
  const supabase = getSupabase()
  if (!supabase) throw new Error('The store database is not configured.')
  return supabase
}

function asNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export function normalizeImportRow(row: Record<string, unknown>): ProductImportRow {
  return {
    ...(row as unknown as ProductImportRow),
    specs: (row.specs && typeof row.specs === 'object' ? row.specs : {}) as Record<string, string>,
    content: (row.content && typeof row.content === 'object' ? row.content : {}) as Record<string, unknown>,
    seo: (row.seo && typeof row.seo === 'object' ? row.seo : {}) as Record<string, unknown>,
    pricing: (row.pricing && typeof row.pricing === 'object' ? row.pricing : {}) as Record<string, unknown>,
    supplier_price: asNumber(row.supplier_price),
    fx_rate_to_kes: asNumber(row.fx_rate_to_kes) ?? 1,
    competitor_price: asNumber(row.competitor_price),
    approved_selling_price: asNumber(row.approved_selling_price),
    missing_fields: Array.isArray(row.missing_fields) ? (row.missing_fields as string[]) : [],
    completeness_score: asNumber(row.completeness_score) ?? 0,
  }
}

// ---------------------------------------------------------------------------
// CSV parsing
// ---------------------------------------------------------------------------

export function parseCsv(text: string): Array<Record<string, string>> {
  const rows: string[][] = []
  let field = ''
  let row: string[] = []
  let inQuotes = false

  const pushField = () => {
    row.push(field)
    field = ''
  }
  const pushRow = () => {
    pushField()
    if (row.some((cell) => cell.trim() !== '')) rows.push(row)
    row = []
  }

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      pushField()
    } else if (char === '\n') {
      pushRow()
    } else if (char === '\r') {
      // ignore
    } else {
      field += char
    }
  }
  if (field.length > 0 || row.length > 0) pushRow()

  if (rows.length === 0) return []
  const headers = rows[0].map((h) => h.trim().toLowerCase())
  return rows.slice(1).map((cells) => {
    const record: Record<string, string> = {}
    headers.forEach((header, index) => {
      record[header] = (cells[index] ?? '').trim()
    })
    return record
  })
}

const HEADER_ALIASES: Record<string, string[]> = {
  title: ['title', 'name', 'product', 'product name', 'product_name'],
  brand: ['brand', 'manufacturer'],
  model: ['model', 'model number'],
  category: ['category', 'category_slug', 'type'],
  price: ['price', 'supplier_price', 'cost', 'purchase price', 'buying price'],
  currency: ['currency', 'supplier_currency'],
  url: ['url', 'source_url', 'link', 'product url'],
  processor: ['processor', 'cpu', 'chipset'],
  ram: ['ram', 'memory'],
  storage: ['storage', 'ssd', 'hdd', 'drive'],
  display: ['display', 'screen', 'screen size'],
  graphics: ['graphics', 'gpu'],
  os: ['os', 'operating system'],
  condition: ['condition'],
  warranty: ['warranty'],
  description: ['description', 'notes'],
  competitor_price: ['competitor_price', 'market price', 'competitor'],
}

function pick(record: Record<string, string>, key: string): string {
  for (const alias of HEADER_ALIASES[key] || []) {
    if (record[alias] != null && record[alias] !== '') return record[alias]
  }
  return ''
}

export interface CsvMappedImport {
  title: string
  brand_name: string | null
  model: string | null
  category_slug: string
  source_url: string | null
  supplier_price: number | null
  supplier_currency: string
  competitor_price: number | null
  description: string | null
  specs: Record<string, string>
}

export function mapCsvRow(record: Record<string, string>): CsvMappedImport {
  const specs: Record<string, string> = {}
  const specFields: Array<[string, string]> = [
    ['Processor', pick(record, 'processor')],
    ['RAM', pick(record, 'ram')],
    ['Storage', pick(record, 'storage')],
    ['Display', pick(record, 'display')],
    ['Graphics', pick(record, 'graphics')],
    ['Operating System', pick(record, 'os')],
    ['Condition', pick(record, 'condition')],
    ['Warranty', pick(record, 'warranty')],
  ]
  for (const [label, value] of specFields) {
    if (value) specs[label] = value
  }
  const category = pick(record, 'category')
  return {
    title: pick(record, 'title'),
    brand_name: pick(record, 'brand') || null,
    model: pick(record, 'model') || null,
    category_slug: category ? slugify(category) : 'laptops',
    source_url: pick(record, 'url') || null,
    supplier_price: asNumber(pick(record, 'price')),
    supplier_currency: pick(record, 'currency') || 'KES',
    competitor_price: asNumber(pick(record, 'competitor_price')),
    description: pick(record, 'description') || null,
    specs,
  }
}

export interface CsvImportPlan {
  row: Record<string, string>
  rowNumber: number
  mapped: CsvMappedImport
  errors: string[]
  duplicate: DuplicateCheck | null
}

export async function buildCsvPlan(text: string): Promise<CsvImportPlan[]> {
  const records = parseCsv(text)
  const plans: CsvImportPlan[] = []
  for (let i = 0; i < records.length; i += 1) {
    const mapped = mapCsvRow(records[i])
    const errors: string[] = []
    if (!mapped.title || mapped.title.trim().length < 3) errors.push('Missing product title')
    if (mapped.supplier_price == null || mapped.supplier_price <= 0) errors.push('Missing or invalid supplier price')
    const duplicate = mapped.title ? await detectDuplicate({ title: mapped.title, sourceUrl: mapped.source_url, brand: mapped.brand_name }) : null
    plans.push({ row: records[i], rowNumber: i + 2, mapped, errors, duplicate })
  }
  return plans
}

// ---------------------------------------------------------------------------
// Duplicate detection
// ---------------------------------------------------------------------------

export interface DuplicateCheck {
  importId?: string
  productSlug?: string
  reason: 'source_url' | 'title_brand' | 'existing_product'
}

export async function detectDuplicate(input: {
  title?: string | null
  brand?: string | null
  sourceUrl?: string | null
}): Promise<DuplicateCheck | null> {
  const supabase = client()

  if (input.sourceUrl && input.sourceUrl.trim()) {
    const { data } = await supabase
      .from('product_imports')
      .select('id')
      .eq('source_url', input.sourceUrl.trim())
      .limit(1)
    if (data && data.length > 0) return { importId: data[0].id, reason: 'source_url' }
  }

  if (input.title && input.title.trim().length >= 3) {
    let query = supabase
      .from('product_imports')
      .select('id')
      .ilike('title', input.title.trim())
      .limit(1)
    if (input.brand && input.brand.trim()) query = query.ilike('brand_name', input.brand.trim())
    const { data } = await query
    if (data && data.length > 0) return { importId: data[0].id, reason: 'title_brand' }
  }

  if (input.title) {
    const candidateSlug = slugify(input.title)
    if (candidateSlug) {
      const { data } = await supabase
        .from('products')
        .select('slug')
        .like('slug', `${candidateSlug.slice(0, 40)}%`)
        .limit(1)
      if (data && data.length > 0) return { productSlug: data[0].slug, reason: 'existing_product' }
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Imports CRUD
// ---------------------------------------------------------------------------

export interface ImportDraftInput {
  source_type: ImportSourceType
  source_url?: string | null
  supplier_id?: string | null
  supplier_name?: string | null
  source_kind?: string
  title: string
  model?: string | null
  brand_name?: string | null
  category_slug?: string
  description?: string | null
  specs?: Record<string, string>
  supplier_price?: number | null
  supplier_currency?: string
  fx_rate_to_kes?: number
  competitor_price?: number | null
  availability_status?: AvailabilityStatus
  extraction_status?: 'pending' | 'extracted' | 'manual' | 'failed'
  extraction_notes?: string | null
  image_query?: string | null
}

export async function createImport(input: ImportDraftInput): Promise<ProductImportRow> {
  const supabase = client()
  const { data: userData } = await supabase.auth.getUser()
  const payload = {
    ...input,
    category_slug: input.category_slug || 'laptops',
    specs: input.specs || {},
    supplier_currency: input.supplier_currency || 'KES',
    fx_rate_to_kes: input.fx_rate_to_kes ?? 1,
    source_kind: input.source_kind || 'nairobi_cbd',
    status: 'draft',
    created_by: userData.user?.id ?? null,
  }
  const { data, error } = await supabase.from('product_imports').insert(payload).select('*').single()
  if (error) throw new Error(error.message)
  return normalizeImportRow(data as Record<string, unknown>)
}

export async function updateImport(id: string, patch: Record<string, unknown>): Promise<void> {
  const supabase = client()
  const { error } = await supabase.from('product_imports').update(patch).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function fetchImports(): Promise<ProductImportRow[]> {
  const supabase = client()
  const { data, error } = await supabase.from('product_imports').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => normalizeImportRow(row as Record<string, unknown>))
}

export async function fetchImport(id: string): Promise<ProductImportRow | null> {
  const supabase = client()
  const { data, error } = await supabase.from('product_imports').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? normalizeImportRow(data as Record<string, unknown>) : null
}

export async function deleteImport(id: string): Promise<void> {
  const supabase = client()
  const { error } = await supabase.from('product_imports').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteImports(ids: string[]): Promise<void> {
  if (!ids || ids.length === 0) return
  const supabase = client()
  const { error } = await supabase.from('product_imports').delete().in('id', ids)
  if (error) throw new Error(error.message)
}

export async function deleteAllImports(options?: { onlyDrafts?: boolean }): Promise<void> {
  const supabase = client()
  let query = supabase.from('product_imports').delete()
  if (options?.onlyDrafts) {
    query = query.in('status', ['draft', 'extracted', 'images_pending', 'in_review'])
  } else {
    query = query.neq('id', '00000000-0000-0000-0000-000000000000')
  }
  const { error } = await query
  if (error) throw new Error(error.message)
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

export async function fetchImportImages(importId: string): Promise<ImportImage[]> {
  const supabase = client()
  const { data, error } = await supabase
    .from('product_import_images')
    .select('*')
    .eq('import_id', importId)
    .order('sort_order', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({
    ...(row as ImportImage),
    sort_order: Number((row as ImportImage).sort_order ?? 0),
  }))
}

export interface ImportImageInput {
  url: string
  alt?: string | null
  is_primary?: boolean
  status?: 'pending' | 'approved' | 'rejected'
  source_url?: string | null
  source_domain?: string | null
  relevance?: 'exact' | 'likely' | 'unverified' | 'rejected'
  method?: string | null
  width?: number | null
  height?: number | null
  verification_note?: string | null
}

export async function replaceImportImages(importId: string, images: ImportImageInput[]): Promise<void> {
  const supabase = client()
  const { error: delError } = await supabase.from('product_import_images').delete().eq('import_id', importId)
  if (delError) throw new Error(delError.message)
  if (images.length === 0) return
  const rows = images.map((img, index) => ({
    import_id: importId,
    url: img.url,
    alt: img.alt ?? null,
    sort_order: index,
    is_primary: img.is_primary ?? false,
    status: img.status ?? 'pending',
    source_url: img.source_url ?? null,
    source_domain: img.source_domain ?? null,
    relevance: img.relevance ?? 'unverified',
    method: img.method ?? 'manual',
    width: img.width ?? null,
    height: img.height ?? null,
    verification_note: img.verification_note ?? null,
  }))
  const { error } = await supabase.from('product_import_images').insert(rows)
  if (error) throw new Error(error.message)
}

export async function addImportImage(importId: string, image: ImportImageInput): Promise<void> {
  const supabase = client()
  const { data: existing, error: readError } = await supabase
    .from('product_import_images')
    .select('sort_order')
    .eq('import_id', importId)
    .order('sort_order', { ascending: false })
    .limit(1)
  if (readError) throw new Error(readError.message)
  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1
  const { error } = await supabase.from('product_import_images').insert({
    import_id: importId,
    url: image.url,
    alt: image.alt ?? null,
    sort_order: nextOrder,
    is_primary: image.is_primary ?? false,
    status: image.status ?? 'approved',
    source_url: image.source_url ?? null,
    source_domain: image.source_domain ?? null,
    relevance: image.relevance ?? 'exact',
    method: image.method ?? 'manual',
    width: image.width ?? null,
    height: image.height ?? null,
    verification_note: image.verification_note ?? 'Uploaded manually by the administrator.',
  })
  if (error) throw new Error(error.message)
}

export async function updateImportImage(id: string, patch: Partial<ImportImage>): Promise<void> {
  const supabase = client()
  const { error } = await supabase.from('product_import_images').update(patch).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteImportImage(id: string): Promise<void> {
  const supabase = client()
  const { error } = await supabase.from('product_import_images').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ---------------------------------------------------------------------------
// Acquisition costs
// ---------------------------------------------------------------------------

export async function fetchAcquisitionCosts(importId: string): Promise<AcquisitionCostRow[]> {
  const supabase = client()
  const { data, error } = await supabase
    .from('acquisition_costs')
    .select('*')
    .eq('import_id', importId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({ ...(row as AcquisitionCostRow), amount: Number((row as AcquisitionCostRow).amount) }))
}

export async function replaceAcquisitionCosts(
  importId: string,
  costs: Array<{ label: string; amount: number; currency?: string; is_estimated?: boolean; notes?: string | null }>,
): Promise<void> {
  const supabase = client()
  const { error: delError } = await supabase.from('acquisition_costs').delete().eq('import_id', importId)
  if (delError) throw new Error(delError.message)
  if (costs.length === 0) return
  const rows = costs.map((c) => ({
    import_id: importId,
    label: c.label,
    amount: c.amount,
    currency: c.currency || 'KES',
    is_estimated: c.is_estimated ?? true,
    notes: c.notes ?? null,
  }))
  const { error } = await supabase.from('acquisition_costs').insert(rows)
  if (error) throw new Error(error.message)
}

// ---------------------------------------------------------------------------
// Markup tiers
// ---------------------------------------------------------------------------

export async function loadMarkupTiers() {
  const supabase = client()
  const { data, error } = await supabase
    .from('supplier_markup_tiers')
    .select('*')
    .order('min_price', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({
    ...row,
    min_price: Number(row.min_price),
    max_price: row.max_price == null ? null : Number(row.max_price),
    markup_pct: Number(row.markup_pct),
  }))
}

export async function saveMarkupTier(tier: {
  id?: string
  min_price: number
  max_price: number | null
  markup_pct: number
  label?: string | null
  is_active?: boolean
}) {
  const supabase = client()
  if (tier.id) {
    const { error } = await supabase
      .from('supplier_markup_tiers')
      .update({
        min_price: tier.min_price,
        max_price: tier.max_price,
        markup_pct: tier.markup_pct,
        label: tier.label ?? null,
        is_active: tier.is_active ?? true,
      })
      .eq('id', tier.id)
    if (error) throw new Error(error.message)
    return
  }
  const { error } = await supabase.from('supplier_markup_tiers').insert({
    min_price: tier.min_price,
    max_price: tier.max_price,
    markup_pct: tier.markup_pct,
    label: tier.label ?? null,
    is_active: tier.is_active ?? true,
  })
  if (error) throw new Error(error.message)
}

export async function deleteMarkupTier(id: string) {
  const supabase = client()
  const { error } = await supabase.from('supplier_markup_tiers').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ---------------------------------------------------------------------------
// Suppliers
// ---------------------------------------------------------------------------

export async function loadSuppliers(): Promise<SupplierOption[]> {
  const supabase = client()
  const { data, error } = await supabase
    .from('suppliers')
    .select('id, supplier_name, shop_name, source_kind, country, currency, reliability_rating')
    .order('supplier_name', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as SupplierOption[]
}

// ---------------------------------------------------------------------------
// Approval + publishing
// ---------------------------------------------------------------------------

export async function approveImport(id: string, approvedPrice: number, overrideReason: string | null, pricing: Record<string, unknown>): Promise<void> {
  const supabase = client()
  const { error } = await supabase
    .from('product_imports')
    .update({
      status: 'approved',
      approved_selling_price: approvedPrice,
      price_override_reason: overrideReason,
      pricing,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function publishImport(id: string): Promise<string> {
  const supabase = client()
  const { data, error } = await supabase.rpc('publish_product_import', { p_import_id: id })
  if (error) throw new Error(error.message)
  return String(data)
}

export async function fetchProductSlugs(ids: string[]): Promise<Record<string, string>> {
  const clean = ids.filter(Boolean)
  if (clean.length === 0) return {}
  const supabase = client()
  const { data, error } = await supabase.from('products').select('id, slug').in('id', clean)
  if (error) return {}
  const map: Record<string, string> = {}
  for (const row of data ?? []) {
    const record = row as { id?: string; slug?: string }
    if (record.id && record.slug) map[record.id] = record.slug
  }
  return map
}

export interface BulkPublishResult {
  importId: string
  title: string
  ok: boolean
  message: string
  productId?: string
}

export async function bulkPublish(items: Array<{ id: string; title: string }>): Promise<BulkPublishResult[]> {
  const results: BulkPublishResult[] = []
  for (const item of items) {
    try {
      const productId = await publishImport(item.id)
      results.push({ importId: item.id, title: item.title, ok: true, message: 'Published', productId })
    } catch (err: any) {
      results.push({ importId: item.id, title: item.title, ok: false, message: err?.message || 'Failed to publish' })
    }
  }
  return results
}
