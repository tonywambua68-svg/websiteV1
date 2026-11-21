// Pure image identity + relevance logic for the product importer.
// Kept free of Deno/network APIs so it can be unit-tested from Node.

export interface ImageIdentityInput {
  title?: string | null
  brand?: string | null
  model?: string | null
  category?: string | null
}

export interface Identity {
  brand: string | null
  family: string[]
  models: string[]
  generation: string | null
  type: string | null
  query: string
  terms: string[]
  complete: boolean
  missing: string[]
}

export interface RawImage {
  url: string
  alt: string | null
  context: string | null
  method: string
  width: number | null
  height: number | null
}

export interface ScoredImage extends RawImage {
  relevance: 'exact' | 'likely' | 'unverified' | 'rejected'
  note: string
  score: number
}

const KNOWN_BRANDS = [
  'dell', 'hp', 'lenovo', 'apple', 'asus', 'acer', 'msi', 'toshiba', 'dynabook', 'samsung',
  'microsoft', 'razer', 'gigabyte', 'huawei', 'xiaomi', 'infinix', 'teclast', 'chuwi',
  'fujitsu', 'panasonic', 'alienware', 'lg',
]

const FAMILY_WORDS = [
  'latitude', 'vostro', 'inspiron', 'xps', 'precision', 'elitebook', 'probook', 'zbook',
  'pavilion', 'envy', 'spectre', 'omen', 'victus', 'thinkpad', 'ideapad', 'legion', 'yoga',
  'thinkbook', 'macbook', 'zenbook', 'vivobook', 'proart', 'rog', 'tuf', 'aspire', 'nitro',
  'predator', 'swift', 'travelmate', 'surface', 'galaxy', 'matebook', 'optiplex', 'thinkcentre',
]

const FAMILY_DISPLAY: Record<string, string> = {
  elitebook: 'EliteBook',
  probook: 'ProBook',
  zbook: 'ZBook',
  thinkpad: 'ThinkPad',
  ideapad: 'IdeaPad',
  thinkbook: 'ThinkBook',
  macbook: 'MacBook',
  zenbook: 'ZenBook',
  vivobook: 'VivoBook',
  proart: 'ProArt',
  rog: 'ROG',
  tuf: 'TUF',
  thinkcentre: 'ThinkCentre',
}

const BRAND_DISPLAY: Record<string, string> = {
  hp: 'HP', asus: 'ASUS', msi: 'MSI', lg: 'LG', acer: 'Acer', apple: 'Apple', dell: 'Dell',
  lenovo: 'Lenovo', toshiba: 'Toshiba', dynabook: 'Dynabook', samsung: 'Samsung',
  microsoft: 'Microsoft', razer: 'Razer', gigabyte: 'Gigabyte', huawei: 'Huawei',
  xiaomi: 'Xiaomi', infinix: 'Infinix', teclast: 'Teclast', chuwi: 'Chuwi',
  fujitsu: 'Fujitsu', panasonic: 'Panasonic', alienware: 'Alienware',
}

function displayBrand(brand: string | null): string {
  if (!brand) return ''
  return BRAND_DISPLAY[brand] || brand.charAt(0).toUpperCase() + brand.slice(1)
}

function displayFamily(family: string): string {
  return FAMILY_DISPLAY[family] || family.charAt(0).toUpperCase() + family.slice(1)
}

function displayModel(model: string): string {
  if (/[a-z]/.test(model) && /\d/.test(model)) return model.toUpperCase()
  return model
}

function displayGeneration(generation: string | null): string {
  if (!generation) return ''
  const g = generation.match(/^g(\d+)$/)
  if (g) return `G${g[1]}`
  const gen = generation.match(/^gen(\d+)$/)
  if (gen) return `Gen ${gen[1]}`
  return generation
}

const GENERIC_WORDS = new Set([
  'laptop', 'laptops', 'notebook', 'notebooks', 'computer', 'computers', 'pc', 'pcs', 'desktop',
  'desktops', 'new', 'used', 'refurbished', 'refurb', 'grade', 'ex', 'uk', 'usa', 'imported',
  'genuine', 'original', 'with', 'and', 'for', 'the', 'intel', 'amd', 'core', 'ryzen', 'celeron',
  'pentium', 'athlon', 'windows', 'win', 'pro', 'home', 'inch', 'inches', 'display', 'screen',
  'ram', 'ssd', 'hdd', 'nvme', 'gb', 'tb', 'touch', 'touchscreen', 'backlit', 'keyboard', 'webcam',
  'bluetooth', 'wifi', 'battery', 'charger', 'warranty', 'business', 'gaming', 'student',
  'students', 'a', 'b', 'c',
])

const ACCESSORY_WORDS = [
  'bag', 'sleeve', 'backpack', 'case', 'cover', 'skin', 'charger', 'adapter', 'dock', 'stand',
  'mouse', 'keyboard', 'protector', 'sticker',
]

const BANNER_WORDS = [
  'banner', 'promo', 'advert', 'advertisement', 'sale', 'discount', 'coupon', 'logo', 'icon',
  'sprite', 'placeholder', 'avatar', 'flag', 'payment', 'visa', 'mastercard', 'paypal', 'spinner',
]

const RELATED_WORDS = [
  'related', 'recommend', 'similar', 'cross-sell', 'crosssell', 'upsell', 'recently-viewed',
  'you-may-also', 'also-bought', 'sponsored',
]

const MARKETPLACE_WORDS = [
  'aliexpress', 'alibaba', 'amazon', 'ebay', 'shopee', 'lazada', 'jumia', 'kilimall', 'temu',
  'wish.com', 'dhgate', 'banggood', 'gearbest', 'alipay',
]

const SOCIAL_WORDS = [
  'facebook', 'instagram', 'twitter', 'x.com', 'whatsapp', 'youtube', 'tiktok', 'linkedin',
  'pinterest', 'telegram', 'social-share', 'social_share', 'socialpreview', 'social-preview',
  'share-image', 'share_image', 'og-default', 'og_default',
]

const PAYMENT_WORDS = [
  'visa', 'mastercard', 'amex', 'american-express', 'americanexpress', 'paypal', 'mpesa',
  'm-pesa', 'applepay', 'apple-pay', 'googlepay', 'google-pay', 'stripe', 'skrill', 'payoneer',
  'payment', 'secure-payment', 'installment',
]

const LOGO_WORDS = ['logo', 'watermark', 'favicon', 'site-icon', 'brandmark']

const GENERIC_IMAGE_WORDS = [
  'placeholder', 'no-image', 'noimage', 'no_image', 'default-image', 'defaultimage',
  'coming-soon', 'comingsoon', 'banner', 'promo', 'advert', 'advertisement', 'sale',
  'discount', 'coupon', 'deal-', 'sponsor', 'header-logo', 'footer-logo', 'sprite', 'avatar',
  'flag', 'share', 'thumbnail-default',
]

export function wordList(value: string): string[] {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean)
}

export function compact(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function isCapacity(token: string): boolean {
  return /^\d+(gb|tb|g|t)$/.test(token) || /^\d+(\.\d+)?(ghz|mhz|inch|in)$/.test(token)
}

function isCoreTier(token: string): boolean {
  return /^(i3|i5|i7|i9|m1|m2|m3|m4)$/.test(token)
}

export function buildIdentity(input: ImageIdentityInput): Identity {
  const title = (input.title || '').trim()
  const titleWords = wordList(title)
  const brandHint = wordList(input.brand || '')[0] || null

  const brand =
    (brandHint && KNOWN_BRANDS.includes(brandHint) ? brandHint : null) ||
    KNOWN_BRANDS.find((b) => titleWords.includes(b)) ||
    brandHint

  const family = FAMILY_WORDS.filter((f) => titleWords.includes(f) || titleWords.includes(f + 's'))

  const models: string[] = []
  const explicitModel = (input.model || '').trim()
  if (explicitModel) {
    const explicitWords = wordList(explicitModel)
    for (const token of explicitWords) {
      if (token.length < 2 || GENERIC_WORDS.has(token) || isCapacity(token) || isCoreTier(token)) continue
      if (token === 'gen' || token === 'generation') continue
      if (FAMILY_WORDS.includes(token) || /^g\d{1,2}$/.test(token) || /^gen\d+$/.test(token)) continue
      models.push(token)
    }
    if (explicitWords.length === 1) {
      const compactModel = compact(explicitModel)
      if (compactModel.length >= 3) models.push(compactModel)
    }
  }

  const generationMatch = title.toLowerCase().match(/\b(?:(\d{1,2})(?:st|nd|rd|th)\s*gen|gen\s*(\d{1,2})|g(\d{1,2}))\b/)
  const generation = generationMatch
    ? generationMatch[3]
      ? `g${generationMatch[3]}`
      : `gen${generationMatch[1] || generationMatch[2]}`
    : null

  for (const raw of titleWords) {
    if (raw === brand || GENERIC_WORDS.has(raw) || FAMILY_WORDS.includes(raw)) continue
    if (isCapacity(raw) || isCoreTier(raw)) continue
    if (/^g\d{1,2}$/.test(raw) || /^gen\d+$/.test(raw)) continue

    const hasLetter = /[a-z]/.test(raw)
    const hasDigit = /\d/.test(raw)
    if (/^\d+$/.test(raw) && raw.length >= 3) models.push(raw)
    else if (hasLetter && hasDigit && raw.length >= 2) models.push(raw)
  }

  const uniqueModels = Array.from(new Set(models)).slice(0, 6)
  const category = (input.category || '').toLowerCase()
  const type = category.includes('laptop')
    ? 'laptop'
    : category.includes('accessor')
    ? 'accessory'
    : titleWords.includes('laptop')
    ? 'laptop'
    : null

  const missing: string[] = []
  if (!brand) missing.push('brand')
  if (uniqueModels.length === 0 && family.length === 0) missing.push('exact model')
  if (!type) missing.push('product type')
  const complete = missing.length === 0

  const queryParts = complete
    ? [
        displayBrand(brand),
        ...family.map(displayFamily),
        ...uniqueModels.map(displayModel),
        displayGeneration(generation),
        type || '',
        'product images',
      ].filter(Boolean)
    : []

  return {
    brand,
    family,
    models: uniqueModels,
    generation,
    type,
    query: queryParts.join(' ').replace(/\s+/g, ' ').trim(),
    terms: Array.from(new Set([brand, ...family, ...uniqueModels, generation].filter(Boolean) as string[])),
    complete,
    missing,
  }
}

const IGNORED_NUMBER_TOKENS = new Set([
  '1080', '720', '768', '900', '1200', '1366', '1440', '1600', '1800', '1920',
  '2160', '2560', '3840', '500', '600', '800', '1000', '1500', '2000', '3000',
])

function stripSizeHints(value: string): string {
  return value
    .replace(/\b\d{2,5}\s*[x×]\s*\d{2,5}\b/gi, ' ')
    .replace(/\b(?:w|h|wid|hei|width|height)[_-]?\d{2,5}\b/gi, ' ')
}

function generationNumber(value: string | null): number | null {
  if (!value) return null
  const match = value.match(/(\d{1,2})/)
  return match ? Number(match[1]) : null
}

/**
 * Returns a reason when the image text points at a different model number or
 * generation than the product being imported. This is what stops a Latitude
 * 5420 import from collecting Latitude 5410 or 5430 photographs.
 */
export function conflictingIdentity(identity: Identity, haystack: string): string | null {
  if (!identity.complete) return null
  const cleaned = stripSizeHints(haystack).toLowerCase()
  const tokens = wordList(cleaned)

  const wantedGeneration = generationNumber(identity.generation)
  if (wantedGeneration != null) {
    for (const match of cleaned.matchAll(/\b(?:gen\s*(\d{1,2})|g(\d{1,2}))\b/gi)) {
      const found = Number(match[1] || match[2])
      if (Number.isFinite(found) && found !== wantedGeneration) {
        return `Different model generation (Gen ${found} / G${found}).`
      }
    }
  }

  const knownModels = identity.models.map(compact)
  for (const token of tokens) {
    if (GENERIC_WORDS.has(token) || isCapacity(token) || isCoreTier(token)) continue
    if (IGNORED_NUMBER_TOKENS.has(token)) continue
    if (/^(19|20)\d{2}$/.test(token)) continue

    let candidate: string | null = null
    if (/^\d{3,5}$/.test(token)) candidate = token
    else if (/^[a-z]{1,3}\d{2,4}[a-z]{0,2}$/.test(token)) candidate = token
    if (!candidate) continue

    if (knownModels.some((m) => m === candidate || m.includes(candidate) || candidate.includes(m))) continue
    if (/^\d{3,5}$/.test(candidate) && !/^\d{3,5}$/.test(compact(identity.models[0] || ''))) continue
    return `Different model number (${candidate.toUpperCase()}), not the model on this page.`
  }

  return null
}

export function blockedReason(identity: Identity, image: RawImage): string | null {
  const haystack = `${image.url} ${image.alt || ''} ${image.context || ''}`.toLowerCase()
  const ownWords = new Set([identity.brand, identity.type, ...identity.family, ...identity.models].filter(Boolean) as string[])

  for (const word of LOGO_WORDS) {
    if (haystack.includes(word)) return `Logo or watermark detected (${word}).`
  }
  for (const word of PAYMENT_WORDS) {
    if (haystack.includes(word) && !ownWords.has(word)) return `Payment or financing icon (${word}), not a product photo.`
  }
  for (const word of SOCIAL_WORDS) {
    if (haystack.includes(word)) return 'Social media or share preview, not a product photo.'
  }
  for (const word of BANNER_WORDS) {
    if (haystack.includes(word) && !ownWords.has(word)) return `Looks like a ${word}, not a product photo.`
  }
  for (const word of GENERIC_IMAGE_WORDS) {
    if (haystack.includes(word) && !ownWords.has(word)) return `Generic site graphic (${word}), not a product photo.`
  }
  for (const word of ACCESSORY_WORDS) {
    if (identity.type === 'accessory') break
    if (haystack.includes(word) && !ownWords.has(word)) return `Looks like an accessory (${word}).`
  }
  for (const word of RELATED_WORDS) {
    if (haystack.includes(word)) return 'Found in a related-products or advertising block.'
  }
  return null
}

export function scoreImage(identity: Identity, image: RawImage): ScoredImage {
  const haystack = `${image.url} ${image.alt || ''} ${image.context || ''}`.toLowerCase()
  const haystackCompact = compact(haystack)

  let baseScore = 0
  let modelsFound = 0
  for (const model of identity.models) {
    if (haystackCompact.includes(compact(model)) || haystack.includes(model)) {
      baseScore += 3
      modelsFound += 1
    }
  }
  const familyFound = identity.family.some((f) => haystack.includes(f))
  if (familyFound) baseScore += 2
  const brandFound = Boolean(identity.brand && haystack.includes(identity.brand))
  if (brandFound) baseScore += 2
  if (identity.generation && haystackCompact.includes(identity.generation)) baseScore += 2

  let relevance: ScoredImage['relevance'] = 'unverified'
  let note = identity.complete
    ? 'Could not confirm this image shows the exact model.'
    : `Product identity is incomplete (missing ${identity.missing.join(', ')}); this image cannot be verified.`

  if (identity.complete) {
    if (image.method === 'jsonld') {
      relevance = baseScore >= 3 ? 'exact' : 'likely'
      note = 'Official product structured data (JSON-LD) on this product page.'
    } else if (modelsFound > 0 && (familyFound || brandFound) && baseScore >= 5) {
      relevance = 'exact'
      note = 'Image URL or alt text names this exact model.'
    } else if (image.method === 'gallery' && !blockedReason(identity, image)) {
      relevance = 'likely'
      note = 'Extracted directly from the supplier product gallery. Review angle before approving.'
    } else if (baseScore >= 3) {
      relevance = 'likely'
      note = image.method === 'og'
        ? 'Main social image of this product page; the page identifies the model. Review before approving.'
        : 'Matches the brand/family but the exact model is not fully stated. Review before approving.'
    }
  }

  const score = baseScore + (image.method === 'jsonld' ? 2 : image.method === 'gallery' ? 1 : 0)

  if (score === 0 && relevance !== 'rejected' && image.method !== 'gallery' && image.method !== 'jsonld') {
    relevance = 'unverified'
    note = 'No brand or model evidence in this image; it cannot be treated as a product photo.'
  }

  if (image.width && image.height && (image.width < 400 || image.height < 300) && relevance !== 'rejected') {
    relevance = 'unverified'
    note = `Low-resolution thumbnail (${image.width}×${image.height}); use a larger image.`
  }

  const sizeHint = image.url.match(/image[_-](\d{2,4})|[/_-](\d{2,4})x\d{2,4}[./]/i)
  const hintedWidth = sizeHint ? Number(sizeHint[1] || sizeHint[2]) : null
  if (hintedWidth && hintedWidth < 800 && relevance !== 'rejected') {
    relevance = 'unverified'
    note = `Low-resolution image variant (${hintedWidth}px); look for the full-size version.`
  }

  const marketplace = MARKETPLACE_WORDS.find((word) => haystack.includes(word))
  if (marketplace && (modelsFound === 0 || /logo|banner|social|share|marketplace/.test(haystack))) {
    relevance = 'rejected'
    note = `Marketplace branding (${marketplace}), not a product photograph.`
  }

  const blocked = blockedReason(identity, image)
  if (blocked) {
    relevance = 'rejected'
    note = blocked
  }

  return { ...image, relevance, note, score }
}

export function pickCandidates(scored: ScoredImage[], limit = 12): ScoredImage[] {
  const order: Record<ScoredImage['relevance'], number> = { exact: 0, likely: 1, unverified: 2, rejected: 3 }
  const sorted = [...scored].sort((a, b) => order[a.relevance] - order[b.relevance] || b.score - a.score)

  const accepted = sorted.filter((image) => image.relevance === 'exact' || image.relevance === 'likely')
  const unverified = sorted.filter((image) => image.relevance === 'unverified' && (image.method !== 'inline' || image.score > 0)).slice(0, 6)
  const rejected = sorted.filter((image) => image.relevance === 'rejected' && image.method !== 'inline').slice(0, 6)

  return [...accepted.slice(0, limit), ...unverified, ...rejected]
}

// ---------------------------------------------------------------------------
// Candidate extraction from page HTML (no DOM, deterministic)
// ---------------------------------------------------------------------------

export function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
}

export function metaContent(html: string, key: string): string | null {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]*content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${escaped}["']`, 'i'),
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m && m[1]) return decodeEntities(m[1]).trim()
  }
  return null
}

export interface JsonLdProduct {
  name?: string
  description?: string
  brand?: unknown
  image?: unknown
  sku?: string
  category?: string
  offers?: unknown
  additionalProperty?: Array<{ name?: string; value?: string }>
}

export function parseJsonLd(html: string): JsonLdProduct | null {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
  const candidates: any[] = []
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(decodeEntities(block[1].trim()))
      if (Array.isArray(parsed)) candidates.push(...parsed)
      else if (parsed && Array.isArray((parsed as any)['@graph'])) candidates.push(...(parsed as any)['@graph'])
      else candidates.push(parsed)
    } catch {
      // ignore malformed JSON-LD
    }
  }
  for (const item of candidates) {
    const type = item?.['@type']
    const types = Array.isArray(type) ? type : [type]
    if (types.some((t: unknown) => String(t).toLowerCase() === 'product')) {
      return item as JsonLdProduct
    }
  }
  return null
}

export function imageListFromJsonLd(image: unknown): string[] {
  if (!image) return []
  if (typeof image === 'string') return [image]
  if (Array.isArray(image)) return image.flatMap((i) => imageListFromJsonLd(i))
  if (typeof image === 'object' && image && 'url' in image) return [String((image as any).url)]
  return []
}

export function absolute(base: string, maybe: string): string | null {
  try {
    return new URL(maybe, base).toString()
  } catch {
    return null
  }
}

export function normaliseImageUrl(raw: string): string | null {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  if (/\.svg($|\?)/i.test(url.pathname)) return null
  if (/%%.*%%|\{.*\}/.test(url.pathname) || /placeholder/i.test(url.pathname)) return null
  if (/sprite|icon|logo|placeholder|blank|pixel|spacer/i.test(url.pathname)) return null
  const sizeParams = /^(w|h|hei|wid|width|height|size|fit|resize|quality|qlt|scl)$/i
  for (const key of [...url.searchParams.keys()]) {
    if (sizeParams.test(key)) url.searchParams.delete(key)
  }
  url.hash = ''
  return url.toString()
}

function attr(tag: string, name: string): string | null {
  const re = new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i')
  const m = tag.match(re)
  return m ? decodeEntities(m[1]).trim() : null
}

function firstSrcsetUrl(value: string | null): string | null {
  if (!value) return null
  const first = value.split(',')[0]?.trim()
  if (!first) return null
  return first.split(/\s+/)[0] || null
}

function imageAttrsFromTag(tag: string): string[] {
  const attrs = ['src', 'data-src', 'data-lazy-src', 'data-original', 'data-zoom-image', 'data-large_image', 'data-image']
  const found: string[] = []
  for (const name of attrs) {
    const value = attr(tag, name)
    if (value && !value.startsWith('data:') && !value.startsWith('blob:')) found.push(value)
  }
  const srcset = firstSrcsetUrl(attr(tag, 'srcset') || attr(tag, 'data-srcset'))
  if (srcset) found.push(srcset)
  return found
}

function contextFor(html: string, index: number): string {
  const start = Math.max(0, index - 900)
  const slice = html.slice(start, index)
  const tags = [...slice.matchAll(/<(?:div|li|figure|section|a)\b[^>]*class=["']([^"']+)["'][^>]*>/gi)]
  const last = tags[tags.length - 1]
  const idMatch = slice.match(/<(?:div|section)\b[^>]*id=["']([^"']+)["'][^>]*>\s*$/i)
  return `${last?.[1] || ''} ${idMatch?.[1] || ''}`.trim()
}

export function extractScoredCandidates(
  identity: Identity,
  html: string,
  finalUrl: string,
  limit = 12,
  pageTitle = '',
): ScoredImage[] {
  const seen = new Set<string>()
  const out: ScoredImage[] = []

  const push = (raw: RawImage) => {
    const normalised = normaliseImageUrl(raw.url)
    if (!normalised) return
    const parsed = new URL(normalised)
    const key = `${parsed.hostname}${parsed.pathname}`
    if (seen.has(key)) return
    seen.add(key)
    out.push(scoreImage(identity, { ...raw, url: normalised }))
  }

  for (const candidate of imageListFromJsonLd(parseJsonLd(html)?.image)) {
    const abs = absolute(finalUrl, candidate)
    if (abs) {
      push({
        url: abs,
        alt: parseJsonLd(html)?.name ? String(parseJsonLd(html)?.name) : null,
        context: `structured data ${pageTitle}`.trim(),
        method: 'jsonld',
        width: null,
        height: null,
      })
    }
  }

  const ogImage = metaContent(html, 'og:image') || metaContent(html, 'og:image:secure_url') || metaContent(html, 'twitter:image')
  if (ogImage) {
    const abs = absolute(finalUrl, ogImage)
    if (abs) {
      push({
        url: abs,
        alt: metaContent(html, 'og:image:alt') || pageTitle || null,
        context: `social card ${pageTitle}`.trim(),
        method: 'og',
        width: Number(metaContent(html, 'og:image:width') || '') || null,
        height: Number(metaContent(html, 'og:image:height') || '') || null,
      })
    }
  }

  const imgRegex = /<img\b[^>]*>/gi
  let match: RegExpExecArray | null
  while ((match = imgRegex.exec(html))) {
    const tag = match[0]
    const sources = imageAttrsFromTag(tag)
    if (sources.length === 0) continue

    const context = contextFor(html, match.index)
    const gallery = /gallery|product|thumb|swiper|carousel|media|zoom|pdp|detail/i.test(context)
    const alt = attr(tag, 'alt') || attr(tag, 'title')
    const width = Number(attr(tag, 'width') || '') || null
    const height = Number(attr(tag, 'height') || '') || null

    for (const source of sources) {
      const abs = absolute(finalUrl, source)
      if (!abs) continue
      push({
        url: abs,
        alt,
        context: context || null,
        method: gallery ? 'gallery' : 'inline',
        width,
        height,
      })
    }
    if (out.length >= limit * 3) break
  }

  return out
}

export function candidatePayload(identity: Identity, scored: ScoredImage[], sourceUrl: string) {
  return pickCandidates(scored).map((c) => ({
    url: c.url,
    alt: c.alt,
    source_url: sourceUrl,
    source_domain: (() => {
      try {
        return new URL(c.url).hostname.replace(/^www\./, '')
      } catch {
        return null
      }
    })(),
    relevance: c.relevance,
    method: c.method,
    width: c.width,
    height: c.height,
    verification_note: c.note,
  }))
}
