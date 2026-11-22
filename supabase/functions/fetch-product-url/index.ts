// OREMITECH Multi-Supplier Product Intelligence & Import Engine.
// Fetches publicly accessible supplier pages with robust SSRF protection (DNS pre-resolution,
// redirect verification, size limits). Extracts JSON-LD, Microdata, OpenGraph, and HTML spec tables.
// Normalizes hardware specs, computes tiered provisional pricing, scores images with provenance,
// and generates structured 8-section OREMITECH product descriptions and SEO tags.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { assertSafeUrl, safeFetchHtml } from './ssrf.ts'
import {
  extractHtmlSpecs,
  findProductJsonLd,
  getMetaTag,
  normalizeHardware,
  parseAllJsonLd,
  stripTags,
} from './specs.ts'
import { calculateProvisionalPrice, detectPriceAndCurrency } from './pricing.ts'
import { generateOremitechDescription, generateOremitechSeo } from './content.ts'
import {
  buildIdentity,
  candidatePayload,
  decodeEntities,
  extractScoredCandidates,
} from './scoring.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function titleTag(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return m ? decodeEntities(m[1]).replace(/\s+/g, ' ').trim() : null
}

function brandFromJsonLd(brand: unknown): string | null {
  if (!brand) return null
  if (typeof brand === 'string') return brand.trim() || null
  if (Array.isArray(brand) && brand[0]) return brandFromJsonLd(brand[0])
  if (typeof brand === 'object' && brand && 'name' in brand) return String((brand as any).name).trim() || null
  return null
}

function offerFromJsonLd(offers: unknown): { price: number | null; currency: string | null } {
  const first = Array.isArray(offers) ? offers[0] : offers
  if (!first || typeof first !== 'object') return { price: null, currency: null }
  const priceRaw = (first as any).price ?? (first as any).lowPrice
  const currency = (first as any).priceCurrency ?? null
  const price = priceRaw == null ? null : Number(String(priceRaw).replace(/[^0-9.]/g, ''))
  return {
    price: Number.isFinite(price as number) ? (price as number) : null,
    currency: currency ? String(currency) : null,
  }
}

/**
 * Scrapes and extracts a single supplier product URL.
 */
export async function scrapeProductUrl(rawUrl: string): Promise<Record<string, unknown>> {
  const startUrl = assertSafeUrl(rawUrl)
  const { html, finalUrl } = await safeFetchHtml(startUrl)

  const jsonLdObjects = parseAllJsonLd(html)
  const productJsonLd = findProductJsonLd(jsonLdObjects)
  const warnings: string[] = []

  // Extract core metadata
  const title =
    (productJsonLd?.name && String(productJsonLd.name).trim()) ||
    getMetaTag(html, 'og:title') ||
    getMetaTag(html, 'twitter:title') ||
    titleTag(html) ||
    ''

  if (!title) {
    warnings.push('No product title was found on the page.')
  }

  const rawDescription =
    (productJsonLd?.description && String(productJsonLd.description).trim()) ||
    getMetaTag(html, 'og:description') ||
    getMetaTag(html, 'description') ||
    ''

  const brandFromLd = brandFromJsonLd(productJsonLd?.brand)
  const brandFromMeta = getMetaTag(html, 'product:brand')

  // Extract raw HTML specifications from tables & definition lists
  const tableSpecs = extractHtmlSpecs(html)
  if (productJsonLd?.additionalProperty && Array.isArray(productJsonLd.additionalProperty)) {
    for (const prop of productJsonLd.additionalProperty) {
      if (prop?.name && prop?.value) {
        tableSpecs[String(prop.name).trim()] = String(prop.value).trim()
      }
    }
  }

  // Hardware normalization engine
  const { specs, provenance } = normalizeHardware(title, tableSpecs, rawDescription)
  if (brandFromLd || brandFromMeta) {
    specs.brand = brandFromLd || brandFromMeta || specs.brand
    provenance.brand = { value: specs.brand, source: 'jsonld', confidence: 0.95, status: 'extracted' }
  }

  // Pricing & currency engine
  const offer = offerFromJsonLd(productJsonLd?.offers)
  const pricingData = detectPriceAndCurrency(offer.price, offer.currency, `${html.slice(0, 50000)}`)
  const provisional = calculateProvisionalPrice(pricingData.estimatedKesCost || 0)

  // Identity & Image extraction with relevance scoring
  const identity = buildIdentity({
    title,
    brand: specs.brand || null,
    model: specs.model || (productJsonLd?.sku ? String(productJsonLd.sku) : null),
    category: specs.category || null,
  })

  const scoredImages = extractScoredCandidates(identity, html, finalUrl, 16, title)
  const candidates = candidatePayload(identity, scoredImages, finalUrl)
  const verifiedImages = candidates.filter((c) => c.relevance === 'exact' || c.relevance === 'likely')

  // Ensure every product ships with at least two images when the supplier page
  // provides them. Prefer exact/likely matches, then fill from the next-best
  // candidates (likely/unverified gallery images) so reviews always have
  // alternates to choose from.
  let selectedImages = verifiedImages
  if (selectedImages.length < 2 && candidates.length > 0) {
    const extras = candidates
      .filter((c) => !selectedImages.some((s) => s.url === c.url))
      .slice(0, 2 - selectedImages.length)
    selectedImages = [...selectedImages, ...extras]
  }
  selectedImages = selectedImages.slice(0, 8)

  // Generate 8-section OREMITECH description
  const content = generateOremitechDescription(title, specs, provisional.provisionalPrice)

  // Generate SEO
  const seo = generateOremitechSeo(title, specs, provisional.provisionalPrice)

  // Field completeness and confidence
  const coreFields: Array<keyof typeof specs> = [
    'product_name',
    'brand',
    'model',
    'processor_model',
    'ram',
    'storage_capacity',
    'screen_size',
  ]
  const missingFields = coreFields.filter((f) => !specs[f] || provenance[f].status === 'missing')
  const completedCount = coreFields.length - missingFields.length
  const completenessScore = Math.round((completedCount / coreFields.length) * 100)

  return {
    ok: true,
    source_url: rawUrl,
    final_url: finalUrl,
    title: title || 'Imported Product',
    detected_product_name: title || null,
    brand: specs.brand || null,
    model: specs.model || null,
    category_slug: specs.category || 'laptops',
    description: content.full_text,
    raw_specs: tableSpecs,
    specs,
    specs_provenance: provenance,
    supplier_price: pricingData.originalPrice,
    supplier_currency: pricingData.originalCurrency,
    fx_rate_to_kes: pricingData.fxRateToKes,
    estimated_kes_cost: pricingData.estimatedKesCost,
    provisional_selling_price: provisional.provisionalPrice,
    markup_pct: provisional.markupPct,
    markup_tier_label: provisional.tierLabel,
    image_query: identity.query,
    images: selectedImages.map((c) => c.url),
    image_candidates: candidates,
    content: {
      title,
      overview: content.overview,
      short_description: `${specs.brand} ${specs.model} featuring ${specs.processor_model || ''} ${specs.ram || ''} ${specs.storage_capacity || ''}.`,
      long_description: content.full_text,
      features: content.key_features,
      full_html: content.full_html,
    },
    seo,
    completeness_score: completenessScore,
    missing_fields: missingFields,
    warnings,
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader.startsWith('Bearer ')) {
      return json({ ok: false, error: 'Sign in to import products' }, 401)
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: userData, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', ''),
    )
    if (userError || !userData.user) {
      return json({ ok: false, error: 'Your session has expired. Please sign in again.' }, 401)
    }

    const body = await req.json().catch(() => ({}))
    const rawUrl = String(body?.url || '').trim()
    const rawUrls = Array.isArray(body?.urls) ? body.urls.map((u: any) => String(u).trim()).filter(Boolean) : []

    // Single URL scrape
    if (rawUrl) {
      const result = await scrapeProductUrl(rawUrl)
      return json(result)
    }

    // Batch URLs scrape (up to 100 products)
    if (rawUrls.length > 0) {
      const maxBatch = Math.min(rawUrls.length, 100)
      const results: any[] = []
      for (let i = 0; i < maxBatch; i++) {
        const u = rawUrls[i]
        try {
          const res = await scrapeProductUrl(u)
          results.push(res)
        } catch (err: any) {
          results.push({
            ok: false,
            source_url: u,
            error: err?.message || 'Failed to scrape product',
          })
        }
      }
      return json({ ok: true, batch: true, results, total: results.length })
    }

    return json({ ok: false, error: 'A product URL or list of URLs is required' }, 400)
  } catch (err: any) {
    const message = err?.name === 'AbortError' ? 'The page took too long to respond.' : err?.message || 'Import failed'
    return json({ ok: false, error: message }, 200)
  }
})
