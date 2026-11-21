export type ImageRelevance = 'exact' | 'likely' | 'unverified' | 'rejected'

export interface ImageRelevanceInput {
  title?: string | null
  brand?: string | null
  model?: string | null
  categorySlug?: string | null
}

export interface ProductIdentity {
  brand: string | null
  family: string[]
  models: string[]
  generation: string | null
  type: string | null
  query: string
  terms: string[]
}

const KNOWN_BRANDS = [
  'dell',
  'hp',
  'lenovo',
  'apple',
  'asus',
  'acer',
  'msi',
  'toshiba',
  'dynabook',
  'samsung',
  'microsoft',
  'razer',
  'gigabyte',
  'huawei',
  'xiaomi',
  'infinix',
  'teclast',
  'chuwi',
  'fujitsu',
  'panasonic',
  'alienware',
  'lg',
]

const FAMILY_WORDS = [
  'latitude',
  'vostro',
  'inspiron',
  'xps',
  'precision',
  'elitebook',
  'probook',
  'zbook',
  'pavilion',
  'envy',
  'spectre',
  'omen',
  'victus',
  'thinkpad',
  'ideapad',
  'legion',
  'yoga',
  'thinkbook',
  'macbook',
  'zenbook',
  'vivobook',
  'proart',
  'rog',
  'tuf',
  'aspire',
  'nitro',
  'predator',
  'swift',
  'travelmate',
  'surface',
  'galaxy',
  'matebook',
  'optiplex',
  'thinkcentre',
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
  hp: 'HP',
  asus: 'ASUS',
  msi: 'MSI',
  lg: 'LG',
  acer: 'Acer',
  apple: 'Apple',
  dell: 'Dell',
  lenovo: 'Lenovo',
  toshiba: 'Toshiba',
  dynabook: 'Dynabook',
  samsung: 'Samsung',
  microsoft: 'Microsoft',
  razer: 'Razer',
  gigabyte: 'Gigabyte',
  huawei: 'Huawei',
  xiaomi: 'Xiaomi',
  infinix: 'Infinix',
  teclast: 'Teclast',
  chuwi: 'Chuwi',
  fujitsu: 'Fujitsu',
  panasonic: 'Panasonic',
  alienware: 'Alienware',
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
  'laptop',
  'laptops',
  'notebook',
  'notebooks',
  'computer',
  'computers',
  'pc',
  'pcs',
  'desktop',
  'desktops',
  'new',
  'used',
  'refurbished',
  'refurb',
  'grade',
  'ex',
  'uk',
  'usa',
  'imported',
  'genuine',
  'original',
  'with',
  'and',
  'for',
  'the',
  'intel',
  'amd',
  'core',
  'ryzen',
  'celeron',
  'pentium',
  'athlon',
  'windows',
  'win',
  'pro',
  'home',
  'inch',
  'inches',
  'display',
  'screen',
  'ram',
  'ssd',
  'hdd',
  'nvme',
  'gb',
  'tb',
  'touch',
  'touchscreen',
  'backlit',
  'keyboard',
  'webcam',
  'bluetooth',
  'wifi',
  'battery',
  'charger',
  'warranty',
  'business',
  'gaming',
  'student',
  'students',
  'grade',
  'a',
  'b',
  'c',
])

const ACCESSORY_WORDS = [
  'bag',
  'sleeve',
  'backpack',
  'case',
  'cover',
  'skin',
  'charger',
  'adapter',
  'dock',
  'stand',
  'mouse',
  'keyboard',
  'protector',
  'sticker',
]

const BANNER_WORDS = [
  'banner',
  'promo',
  'advert',
  'advertisement',
  'sale',
  'discount',
  'coupon',
  'logo',
  'icon',
  'sprite',
  'placeholder',
  'avatar',
  'flag',
  'payment',
  'visa',
  'mastercard',
  'paypal',
  'spinner',
]

const RELATED_WORDS = ['related', 'recommend', 'similar', 'cross-sell', 'crosssell', 'upsell', 'recently-viewed', 'you-may-also']

function words(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

function compact(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function isCapacity(token: string): boolean {
  return /^\d+(gb|tb|g|t)$/.test(token) || /^\d+(gb|tb)$/.test(token) || /^\d+(\.\d+)?(ghz|mhz|inch|in)$/.test(token)
}

function isCoreTier(token: string): boolean {
  return /^(i3|i5|i7|i9|m1|m2|m3|m4)$/.test(token)
}

export function buildProductIdentity(input: ImageRelevanceInput): ProductIdentity {
  const title = (input.title || '').trim()
  const titleWords = words(title)
  const brandHint = words(input.brand || '')[0] || null

  const brand =
    (brandHint && KNOWN_BRANDS.includes(brandHint) ? brandHint : null) ||
    KNOWN_BRANDS.find((b) => titleWords.includes(b)) ||
    brandHint

  const family = FAMILY_WORDS.filter((f) => titleWords.includes(f) || titleWords.includes(f + 's'))

  const modelTokens: string[] = []
  const explicitModel = (input.model || '').trim()
  if (explicitModel) {
    const explicitWords = words(explicitModel)
    for (const token of explicitWords) {
      if (token.length < 2 || GENERIC_WORDS.has(token) || isCapacity(token) || isCoreTier(token)) continue
      if (token === 'gen' || token === 'generation') continue
      if (FAMILY_WORDS.includes(token) || /^g\d{1,2}$/.test(token) || /^gen\d+$/.test(token)) continue
      modelTokens.push(token)
    }
    if (explicitWords.length === 1) {
      const explicitCompact = compact(explicitModel)
      if (explicitCompact.length >= 3) modelTokens.push(explicitCompact)
    }
  }

  const generationMatch = title.toLowerCase().match(/\b(?:(\d{1,2})(?:st|nd|rd|th)\s*gen|gen\s*(\d{1,2})|g(\d{1,2}))\b/)
  const generation = generationMatch
    ? generationMatch[3]
      ? `g${generationMatch[3]}`
      : `gen${generationMatch[1] || generationMatch[2]}`
    : null

  for (const rawToken of titleWords) {
    if (rawToken === brand || GENERIC_WORDS.has(rawToken) || FAMILY_WORDS.includes(rawToken)) continue
    if (isCapacity(rawToken) || isCoreTier(rawToken)) continue
    if (/^g\d{1,2}$/.test(rawToken)) continue
    if (/^gen\d+$/.test(rawToken)) continue

    const hasLetter = /[a-z]/.test(rawToken)
    const hasDigit = /\d/.test(rawToken)
    const pureDigits = /^\d+$/.test(rawToken)

    if (pureDigits && rawToken.length >= 3) modelTokens.push(rawToken)
    else if (hasLetter && hasDigit && rawToken.length >= 2) modelTokens.push(rawToken)
  }

  const models = Array.from(new Set(modelTokens)).slice(0, 6)

  const typeFromCategory: Record<string, string> = {
    laptops: 'laptop',
    'gaming-laptops': 'gaming laptop',
    'computer-accessories': 'accessory',
    monitors: 'monitor',
    desktops: 'desktop',
    printers: 'printer',
  }
  const type = (input.categorySlug && typeFromCategory[input.categorySlug]) || (titleWords.includes('laptop') ? 'laptop' : null)

  const queryParts = [
    displayBrand(brand),
    ...family.map(displayFamily),
    ...models.map(displayModel),
    displayGeneration(generation),
    type || '',
    'product images',
  ].filter(Boolean)

  const terms = Array.from(new Set([brand, ...family, ...models, generation].filter(Boolean) as string[]))

  return {
    brand,
    family,
    models,
    generation,
    type,
    query: queryParts.join(' ').replace(/\s+/g, ' ').trim(),
    terms,
  }
}

export function buildImageQuery(input: ImageRelevanceInput): string {
  return buildProductIdentity(input).query
}

export function imageRelevanceLabel(relevance: ImageRelevance | string | null | undefined): string {
  switch (relevance) {
    case 'exact':
      return 'Exact match'
    case 'likely':
      return 'Likely match'
    case 'rejected':
      return 'Rejected'
    default:
      return 'Needs verification'
  }
}

export function relevanceTone(relevance: ImageRelevance | string | null | undefined): 'success' | 'info' | 'warning' | 'error' {
  switch (relevance) {
    case 'exact':
      return 'success'
    case 'likely':
      return 'info'
    case 'rejected':
      return 'error'
    default:
      return 'warning'
  }
}

export function hasBlockingWords(identity: ProductIdentity, candidate: { url: string; alt?: string | null; context?: string | null }): string | null {
  const haystack = `${candidate.url} ${candidate.alt || ''} ${candidate.context || ''}`.toLowerCase()
  const ownWords = new Set([identity.brand, identity.type, ...identity.family, ...identity.models].filter(Boolean) as string[])

  for (const word of BANNER_WORDS) {
    if (haystack.includes(word) && !ownWords.has(word)) return `Looks like a ${word} rather than a product photo.`
  }
  for (const word of ACCESSORY_WORDS) {
    if (identity.type === 'accessory') break
    if (haystack.includes(word) && !ownWords.has(word)) return `Looks like an accessory (${word}), not this product.`
  }
  for (const word of RELATED_WORDS) {
    if (haystack.includes(word)) return 'Appears in a related or recommended products block.'
  }
  return null
}
