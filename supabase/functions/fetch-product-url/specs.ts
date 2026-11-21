// Specification extraction, table parsing, and hardware normalization engine for OREMITECH.
// Extracts structured technical data from JSON-LD, Microdata, OpenGraph, HTML tables,
// definition lists, and product description containers.

export interface FieldProvenance {
  value: string
  source: 'jsonld' | 'meta' | 'html_spec' | 'inferred' | 'manual'
  confidence: number // 0.0 to 1.0
  status: 'extracted' | 'inferred' | 'manual' | 'verified' | 'missing'
}

export interface NormalizedSpecs {
  product_name: string
  brand: string
  model: string
  processor_manufacturer: string
  processor_model: string
  processor_generation: string
  ram: string
  ram_type: string
  storage_capacity: string
  storage_type: string
  screen_size: string
  screen_resolution: string
  display_technology: string
  touchscreen: string
  graphics: string
  operating_system: string
  laptop_condition: string
  warranty: string
  category: string
  mpn: string
  keyboard_layout: string
  colour: string
  weight: string
  battery_condition: string
}

export interface ExtractionResult {
  title: string
  brand: string | null
  model: string | null
  category_slug: string
  description: string | null
  raw_specs: Record<string, string>
  normalized_specs: NormalizedSpecs
  provenance: Record<keyof NormalizedSpecs, FieldProvenance>
  missing_fields: string[]
  overall_confidence: number
}

// ---------------------------------------------------------------------------
// HTML String & Entity Helpers
// ---------------------------------------------------------------------------

export function decodeHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/\s+/g, ' ')
    .trim()
}

export function stripTags(html: string): string {
  return decodeHtml(html.replace(/<[^>]*>/g, ' '))
}

// ---------------------------------------------------------------------------
// JSON-LD Extractor
// ---------------------------------------------------------------------------

export function parseAllJsonLd(html: string): any[] {
  const objects: any[] = []
  const matches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  for (const m of matches) {
    const raw = m[1].trim()
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        objects.push(...parsed)
      } else if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed['@graph'])) {
          objects.push(...parsed['@graph'])
        } else {
          objects.push(parsed)
        }
      }
    } catch {
      // Ignore malformed JSON-LD scripts
    }
  }
  return objects
}

export function findProductJsonLd(objects: any[]): any | null {
  for (const obj of objects) {
    if (!obj || typeof obj !== 'object') continue
    const type = String(obj['@type'] || '').toLowerCase()
    if (type === 'product' || type.endsWith('/product')) {
      return obj
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Meta & OpenGraph Extractor
// ---------------------------------------------------------------------------

export function getMetaTag(html: string, nameOrProperty: string): string | null {
  const esc = nameOrProperty.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
  const pattern = new RegExp(
    `<meta[^>]+(?:name|property)=["']${esc}["'][^>]+content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${esc}["']`,
    'i',
  )
  const m = html.match(pattern)
  const val = m ? (m[1] !== undefined ? m[1] : m[2]) : null
  return val ? decodeHtml(val) : null
}

// ---------------------------------------------------------------------------
// HTML Specification Tables & Definition Lists Extractor
// ---------------------------------------------------------------------------

export function extractHtmlSpecs(html: string): Record<string, string> {
  const specs: Record<string, string> = {}

  // 1. Table rows: <tr><th>Key</th><td>Value</td></tr> or <tr><td>Key</td><td>Value</td></tr>
  const trMatches = html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)
  for (const tr of trMatches) {
    const rowHtml = tr[1]
    const cells = [...rowHtml.matchAll(/<(?:th|td)[^>]*>([\s\S]*?)<\/(?:th|td)>/gi)].map((c) => stripTags(c[1]))
    if (cells.length === 2) {
      const k = cells[0].trim()
      const v = cells[1].trim()
      if (k && v && k.length < 100 && v.length < 500 && !specs[k]) {
        specs[k] = v
      }
    }
  }

  // 2. Definition lists: <dt>Key</dt><dd>Value</dd>
  const dlMatches = html.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi)
  for (const dl of dlMatches) {
    const k = stripTags(dl[1]).trim()
    const v = stripTags(dl[2]).trim()
    if (k && v && k.length < 100 && v.length < 500 && !specs[k]) {
      specs[k] = v
    }
  }

  // 3. Common spec items: <li class="...spec..."><span class="label">Key:</span> <span class="val">Value</span></li>
  const liMatches = html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)
  for (const li of liMatches) {
    const text = stripTags(li[1]).trim()
    const m = text.match(/^([^:–—]{3,50})\s*[:–—]\s*(.{2,300})$/)
    if (m) {
      const k = m[1].trim()
      const v = m[2].trim()
      if (k && v && !specs[k] && !/^(http|copyright|all rights|price|shipping)/i.test(k)) {
        specs[k] = v
      }
    }
  }

  return specs
}

// ---------------------------------------------------------------------------
// Hardware Specification Normalization Engine
// ---------------------------------------------------------------------------

export function normalizeHardware(
  title: string,
  rawSpecs: Record<string, string>,
  description: string = '',
): { specs: NormalizedSpecs; provenance: Record<keyof NormalizedSpecs, FieldProvenance> } {
  const combinedText = `${title} ${description} ${Object.entries(rawSpecs)
    .map(([k, v]) => `${k}: ${v}`)
    .join(' ')}`

  const specs: NormalizedSpecs = {
    product_name: title.trim(),
    brand: '',
    model: '',
    processor_manufacturer: '',
    processor_model: '',
    processor_generation: '',
    ram: '',
    ram_type: '',
    storage_capacity: '',
    storage_type: '',
    screen_size: '',
    screen_resolution: '',
    display_technology: '',
    touchscreen: '',
    graphics: '',
    operating_system: '',
    laptop_condition: '',
    warranty: '',
    category: 'laptops',
    mpn: '',
    keyboard_layout: '',
    colour: '',
    weight: '',
    battery_condition: '',
  }

  const provenance: Record<keyof NormalizedSpecs, FieldProvenance> = {
    product_name: { value: title, source: 'meta', confidence: 0.95, status: title ? 'extracted' : 'missing' },
    brand: { value: '', source: 'meta', confidence: 0, status: 'missing' },
    model: { value: '', source: 'meta', confidence: 0, status: 'missing' },
    processor_manufacturer: { value: '', source: 'html_spec', confidence: 0, status: 'missing' },
    processor_model: { value: '', source: 'html_spec', confidence: 0, status: 'missing' },
    processor_generation: { value: '', source: 'inferred', confidence: 0, status: 'missing' },
    ram: { value: '', source: 'html_spec', confidence: 0, status: 'missing' },
    ram_type: { value: '', source: 'html_spec', confidence: 0, status: 'missing' },
    storage_capacity: { value: '', source: 'html_spec', confidence: 0, status: 'missing' },
    storage_type: { value: '', source: 'html_spec', confidence: 0, status: 'missing' },
    screen_size: { value: '', source: 'html_spec', confidence: 0, status: 'missing' },
    screen_resolution: { value: '', source: 'html_spec', confidence: 0, status: 'missing' },
    display_technology: { value: '', source: 'html_spec', confidence: 0, status: 'missing' },
    touchscreen: { value: '', source: 'html_spec', confidence: 0, status: 'missing' },
    graphics: { value: '', source: 'html_spec', confidence: 0, status: 'missing' },
    operating_system: { value: '', source: 'html_spec', confidence: 0, status: 'missing' },
    laptop_condition: { value: '', source: 'html_spec', confidence: 0, status: 'missing' },
    warranty: { value: '', source: 'html_spec', confidence: 0, status: 'missing' },
    category: { value: 'laptops', source: 'inferred', confidence: 0.85, status: 'inferred' },
    mpn: { value: '', source: 'html_spec', confidence: 0, status: 'missing' },
    keyboard_layout: { value: '', source: 'html_spec', confidence: 0, status: 'missing' },
    colour: { value: '', source: 'html_spec', confidence: 0, status: 'missing' },
    weight: { value: '', source: 'html_spec', confidence: 0, status: 'missing' },
    battery_condition: { value: '', source: 'html_spec', confidence: 0, status: 'missing' },
  }

  const findRaw = (aliases: string[]): { val: string; key: string } | null => {
    for (const [k, v] of Object.entries(rawSpecs)) {
      const lower = k.toLowerCase().replace(/[^a-z0-9]/g, ' ')
      for (const a of aliases) {
        if (lower.includes(a.toLowerCase())) return { val: v.trim(), key: k }
      }
    }
    return null
  }

  // 1. BRAND
  const brandKeywords = [
    { name: 'HP', regex: /\b(hp|hewlett[\s-]?packard)\b/i },
    { name: 'Dell', regex: /\bdell\b/i },
    { name: 'Lenovo', regex: /\blenovo\b/i },
    { name: 'Apple', regex: /\bapple\b/i },
    { name: 'ASUS', regex: /\basus\b/i },
    { name: 'Acer', regex: /\bacer\b/i },
    { name: 'Microsoft', regex: /\bmicrosoft\b/i },
    { name: 'MSI', regex: /\bmsi\b/i },
    { name: 'Samsung', regex: /\bsamsung\b/i },
    { name: 'Toshiba', regex: /\btoshiba\b/i },
  ]
  const brandDirect = findRaw(['brand', 'manufacturer', 'make'])
  if (brandDirect) {
    specs.brand = brandDirect.val
    provenance.brand = { value: brandDirect.val, source: 'html_spec', confidence: 0.95, status: 'extracted' }
  } else {
    for (const b of brandKeywords) {
      if (b.regex.test(title)) {
        specs.brand = b.name
        provenance.brand = { value: b.name, source: 'inferred', confidence: 0.9, status: 'inferred' }
        break
      }
    }
  }

  // 2. MODEL
  const modelPatterns = [
    // HP EliteBook / ProBook / ZBook / Envy / Spectre / Pavilion / Omen / Victus
    /\b(EliteBook\s+(?:x360\s+)?(?:\d{3,4}(?:\s*G\d+)?|\d{2,4}))\b/i,
    /\b(ProBook\s+(?:\d{3,4}(?:\s*G\d+)?|\d{2,4}))\b/i,
    /\b(ZBook\s+(?:Firefly|Power|Studio|Fury)?\s*(?:\d{2,4}(?:\s*G\d+)?|\d{2,4}))\b/i,
    // Lenovo ThinkPad T/X/E/L/P/Yoga
    /\b(ThinkPad\s+(?:[TXELP]\d{2,3}(?:s|p|g)?(?:\s*Gen\s*\d+)?|X1\s+(?:Carbon|Yoga|Extreme)(?:\s*Gen\s*\d+)?))\b/i,
    /\b(IdeaPad\s+(?:Gaming\s+)?(?:\d|Slim|Flex|Pro)?\s*\d{1,4}[a-z0-9-]*)\b/i,
    // Dell Latitude / XPS / Precision / Inspiron / Vostro
    /\b(Latitude\s+\d{4}(?:\s*2-in-1)?)\b/i,
    /\b(XPS\s+\d{2,4}(?:\s*Plus)?)\b/i,
    /\b(Precision\s+\d{4})\b/i,
    /\b(Inspiron\s+\d{4})\b/i,
    /\b(Vostro\s+\d{4})\b/i,
    // Apple MacBook
    /\b(MacBook\s+(?:Pro|Air)(?:\s*\(?[0-9]{2}-inch\)?)?)\b/i,
  ]
  for (const pat of modelPatterns) {
    const m = combinedText.match(pat)
    if (m) {
      specs.model = m[1].replace(/\s+/g, ' ').trim()
      provenance.model = { value: specs.model, source: 'extracted', confidence: 0.9, status: 'extracted' }
      break
    }
  }
  if (!specs.model) {
    const rawModel = findRaw(['model', 'series', 'product line'])
    if (rawModel) {
      specs.model = rawModel.val
      provenance.model = { value: rawModel.val, source: 'html_spec', confidence: 0.85, status: 'extracted' }
    }
  }

  // 3. PROCESSOR MANUFACTURER & MODEL & GENERATION
  const cpuRaw = findRaw(['processor', 'cpu', 'processor model', 'processor type', 'chip'])
  const cpuText = cpuRaw ? `${cpuRaw.val} ${combinedText}` : combinedText

  // Intel Core
  const intelMatch = cpuText.match(
    /\b(Intel\s+(?:Core\s+)?(?:i[3579]|Ultra\s+[579])[\s-]?(\d{4,5}[A-Z]{0,2}|[A-Z0-9-]{3,10}))\b/i,
  )
  // AMD Ryzen
  const amdMatch = cpuText.match(/\b(AMD\s+Ryzen\s+[3579](?:\s+PRO)?[\s-]?(?:\d{4}[A-Z]{0,2}))\b/i)
  // Apple Silicon
  const appleMatch = cpuText.match(/\b(Apple\s+M[1234](?:\s+(?:Pro|Max|Ultra))?)\b/i)
  // Intel Celeron / Pentium / Xeon
  const otherIntel = cpuText.match(/\b(Intel\s+(?:Celeron|Pentium|Xeon)[\s-]?[A-Z0-9-]*)\b/i)

  if (intelMatch) {
    specs.processor_manufacturer = 'Intel'
    specs.processor_model = intelMatch[1].replace(/\s+/g, ' ').trim()
    provenance.processor_manufacturer = { value: 'Intel', source: 'inferred', confidence: 0.95, status: 'inferred' }
    provenance.processor_model = { value: specs.processor_model, source: cpuRaw ? 'html_spec' : 'inferred', confidence: 0.92, status: 'extracted' }

    // Generation extraction (e.g. i7-1165G7 -> 11th Gen, i5-10210U -> 10th Gen, i7-8550U -> 8th Gen, i7-12700H -> 12th Gen)
    const genNum = intelMatch[2]?.match(/^(\d{1,2})\d{2,3}/)
    if (genNum) {
      const g = Number(genNum[1])
      if (g >= 4 && g <= 14) {
        specs.processor_generation = `${g}th Gen`
        provenance.processor_generation = { value: specs.processor_generation, source: 'inferred', confidence: 0.9, status: 'inferred' }
      }
    }
  } else if (amdMatch) {
    specs.processor_manufacturer = 'AMD'
    specs.processor_model = amdMatch[1].replace(/\s+/g, ' ').trim()
    provenance.processor_manufacturer = { value: 'AMD', source: 'inferred', confidence: 0.95, status: 'inferred' }
    provenance.processor_model = { value: specs.processor_model, source: cpuRaw ? 'html_spec' : 'inferred', confidence: 0.92, status: 'extracted' }

    const ryzenSeries = amdMatch[0].match(/(\d)\d{3}/)
    if (ryzenSeries) {
      specs.processor_generation = `${ryzenSeries[1]}000 Series`
      provenance.processor_generation = { value: specs.processor_generation, source: 'inferred', confidence: 0.9, status: 'inferred' }
    }
  } else if (appleMatch) {
    specs.processor_manufacturer = 'Apple'
    specs.processor_model = appleMatch[1].trim()
    provenance.processor_manufacturer = { value: 'Apple', source: 'inferred', confidence: 0.95, status: 'inferred' }
    provenance.processor_model = { value: specs.processor_model, source: 'extracted', confidence: 0.95, status: 'extracted' }
  } else if (otherIntel) {
    specs.processor_manufacturer = 'Intel'
    specs.processor_model = otherIntel[1].trim()
    provenance.processor_manufacturer = { value: 'Intel', source: 'inferred', confidence: 0.9, status: 'inferred' }
    provenance.processor_model = { value: specs.processor_model, source: 'extracted', confidence: 0.85, status: 'extracted' }
  } else if (cpuRaw) {
    specs.processor_model = cpuRaw.val
    provenance.processor_model = { value: cpuRaw.val, source: 'html_spec', confidence: 0.8, status: 'extracted' }
  }

  // Check explicit generation in specs
  const genRaw = findRaw(['generation', 'processor generation'])
  if (genRaw && genRaw.val) {
    specs.processor_generation = genRaw.val
    provenance.processor_generation = { value: genRaw.val, source: 'html_spec', confidence: 0.95, status: 'extracted' }
  }

  // 4. RAM CAPACITY & TYPE
  const ramRaw = findRaw(['ram', 'memory', 'system memory', 'ram size', 'installed memory'])
  const ramText = ramRaw ? `${ramRaw.val} ${combinedText}` : combinedText

  const ramMatch = ramText.match(/\b(4|8|12|16|24|32|64|128)\s*(?:GB|G)\s*(?:RAM|Memory)?\b/i)
  if (ramMatch) {
    specs.ram = `${ramMatch[1]} GB`
    provenance.ram = { value: `${ramMatch[1]} GB`, source: ramRaw ? 'html_spec' : 'inferred', confidence: 0.9, status: 'extracted' }
  }

  const ramTypeMatch = ramText.match(/\b(LPDDR5[Xx]?|DDR5|LPDDR4[Xx]?|DDR4|DDR3)\b/i)
  if (ramTypeMatch) {
    specs.ram_type = ramTypeMatch[1].toUpperCase()
    provenance.ram_type = { value: specs.ram_type, source: ramRaw ? 'html_spec' : 'inferred', confidence: 0.9, status: 'extracted' }
  }

  // 5. STORAGE CAPACITY & TYPE
  const storageRaw = findRaw(['storage', 'hard drive', 'ssd', 'hdd', 'solid state drive', 'internal storage'])
  const storageText = storageRaw ? `${storageRaw.val} ${combinedText}` : combinedText

  const storageCapMatch = storageText.match(/\b(128|256|512)\s*(?:GB|G)\b|\b(1|2|4)\s*(?:TB|T)\b/i)
  if (storageCapMatch) {
    const cap = storageCapMatch[1] ? `${storageCapMatch[1]} GB` : `${storageCapMatch[2]} TB`
    specs.storage_capacity = cap
    provenance.storage_capacity = { value: cap, source: storageRaw ? 'html_spec' : 'inferred', confidence: 0.9, status: 'extracted' }
  }

  if (/\b(PCIe(?:\s+Gen\s*\d)?(?:\s+NVMe)?\s+M\.2\s+SSD|NVMe(?:\s+M\.2)?\s+SSD|NVMe|M\.2\s+SSD)\b/i.test(storageText)) {
    specs.storage_type = 'PCIe NVMe M.2 SSD'
    provenance.storage_type = { value: 'PCIe NVMe M.2 SSD', source: storageRaw ? 'html_spec' : 'inferred', confidence: 0.9, status: 'extracted' }
  } else if (/\bSSD|Solid[\s-]State\b/i.test(storageText)) {
    specs.storage_type = 'SSD'
    provenance.storage_type = { value: 'SSD', source: storageRaw ? 'html_spec' : 'inferred', confidence: 0.85, status: 'extracted' }
  } else if (/\bHDD|Hard[\s-]Disk\b/i.test(storageText)) {
    specs.storage_type = 'HDD'
    provenance.storage_type = { value: 'HDD', source: storageRaw ? 'html_spec' : 'inferred', confidence: 0.85, status: 'extracted' }
  }

  // 6. SCREEN SIZE, RESOLUTION, TECH & TOUCH
  const screenRaw = findRaw(['display', 'screen', 'screen size', 'display size', 'screen diagonal'])
  const screenText = screenRaw ? `${screenRaw.val} ${combinedText}` : combinedText

  const sizeMatch = screenText.match(/\b(11\.6|12\.5|13\.3|13\.5|14\.0|14|15\.6|15|16\.0|16|17\.3|17)\s*(?:["”]|inch|-inch|\b)/i)
  if (sizeMatch) {
    const sz = sizeMatch[1].includes('.') ? `${sizeMatch[1]}"` : `${sizeMatch[1]}.0"`
    specs.screen_size = sz
    provenance.screen_size = { value: sz, source: screenRaw ? 'html_spec' : 'inferred', confidence: 0.92, status: 'extracted' }
  }

  if (/\b(3840\s*[x×]\s*2160|4K(?:\s*UHD)?)\b/i.test(screenText) || /\b4K\b/i.test(screenText)) {
    specs.screen_resolution = '3840 x 2160 (4K UHD)'
    provenance.screen_resolution = { value: specs.screen_resolution, source: screenRaw ? 'html_spec' : 'inferred', confidence: 0.92, status: 'extracted' }
  } else if (/\b(2560\s*[x×]\s*1440|2560\s*[x×]\s*1600|QHD|2K)\b/i.test(screenText)) {
    specs.screen_resolution = '2560 x 1440 (QHD)'
    provenance.screen_resolution = { value: specs.screen_resolution, source: screenRaw ? 'html_spec' : 'inferred', confidence: 0.9, status: 'extracted' }
  } else if (/\b(1920\s*[x×]\s*1080|1920\s*[x×]\s*1200|FHD|Full\s*HD)\b/i.test(screenText)) {
    specs.screen_resolution = '1920 x 1080 (FHD)'
    provenance.screen_resolution = { value: specs.screen_resolution, source: screenRaw ? 'html_spec' : 'inferred', confidence: 0.92, status: 'extracted' }
  } else if (/\b(1366\s*[x×]\s*768)\b/i.test(screenText)) {
    specs.screen_resolution = '1366 x 768 (HD)'
    provenance.screen_resolution = { value: specs.screen_resolution, source: screenRaw ? 'html_spec' : 'inferred', confidence: 0.88, status: 'extracted' }
  }

  if (/\bOLED\b/i.test(screenText)) {
    specs.display_technology = 'OLED'
    provenance.display_technology = { value: 'OLED', source: 'extracted', confidence: 0.9, status: 'extracted' }
  } else if (/\bIPS\b/i.test(screenText)) {
    specs.display_technology = 'IPS'
    provenance.display_technology = { value: 'IPS', source: 'extracted', confidence: 0.9, status: 'extracted' }
  } else if (/\bWVA\b/i.test(screenText)) {
    specs.display_technology = 'WVA'
    provenance.display_technology = { value: 'WVA', source: 'extracted', confidence: 0.85, status: 'extracted' }
  }

  // Touchscreen
  if (/\b(x360|2-in-1|convertible|touchscreen|touch-screen|touch enabled|multi-touch)\b/i.test(screenText)) {
    specs.touchscreen = 'Yes (Touchscreen)'
    provenance.touchscreen = { value: 'Yes (Touchscreen)', source: 'extracted', confidence: 0.95, status: 'extracted' }
  } else if (/\b(non-touch|non touch|no touch)\b/i.test(screenText)) {
    specs.touchscreen = 'No (Non-touch)'
    provenance.touchscreen = { value: 'No (Non-touch)', source: 'html_spec', confidence: 0.95, status: 'extracted' }
  } else {
    const rawTouch = findRaw(['touch', 'touchscreen'])
    if (rawTouch && /no|non-touch/i.test(rawTouch.val)) {
      specs.touchscreen = 'No (Non-touch)'
      provenance.touchscreen = { value: 'No (Non-touch)', source: 'html_spec', confidence: 0.95, status: 'extracted' }
    }
  }

  // 7. GRAPHICS / GPU
  const gpuRaw = findRaw(['graphics', 'gpu', 'video card', 'graphics card', 'graphics processor'])
  const gpuText = gpuRaw ? `${gpuRaw.val} ${combinedText}` : combinedText

  const discreteGpu = gpuText.match(
    /\b(NVIDIA\s+(?:GeForce\s+)?(?:RTX|GTX|Quadro|T\d{3,4})\s+[A-Z0-9\s]+(?:\d+\s*GB)?|AMD\s+Radeon\s+(?:RX|Pro)\s+[A-Z0-9\s]+)\b/i,
  )
  if (discreteGpu) {
    specs.graphics = discreteGpu[1].replace(/\s+/g, ' ').trim()
    provenance.graphics = { value: specs.graphics, source: gpuRaw ? 'html_spec' : 'extracted', confidence: 0.9, status: 'extracted' }
  } else if (/\b(Intel\s+Iris\s+X[eé](?:\s+Graphics)?)\b/i.test(gpuText)) {
    specs.graphics = 'Intel Iris Xe Graphics'
    provenance.graphics = { value: 'Intel Iris Xe Graphics', source: 'extracted', confidence: 0.9, status: 'extracted' }
  } else if (/\b(Intel\s+UHD(?:\s+Graphics)?)\b/i.test(gpuText)) {
    specs.graphics = 'Intel UHD Graphics'
    provenance.graphics = { value: 'Intel UHD Graphics', source: 'extracted', confidence: 0.9, status: 'extracted' }
  } else if (/\b(AMD\s+Radeon(?:\s+Graphics)?)\b/i.test(gpuText)) {
    specs.graphics = 'AMD Radeon Graphics'
    provenance.graphics = { value: 'AMD Radeon Graphics', source: 'extracted', confidence: 0.9, status: 'extracted' }
  } else if (gpuRaw) {
    specs.graphics = gpuRaw.val
    provenance.graphics = { value: gpuRaw.val, source: 'html_spec', confidence: 0.85, status: 'extracted' }
  }

  // 8. OPERATING SYSTEM
  const osRaw = findRaw(['operating system', 'os', 'software'])
  const osText = osRaw ? `${osRaw.val} ${combinedText}` : combinedText

  if (/\bWindows\s+11\s+Pro\b/i.test(osText)) {
    specs.operating_system = 'Windows 11 Pro'
    provenance.operating_system = { value: 'Windows 11 Pro', source: osRaw ? 'html_spec' : 'inferred', confidence: 0.92, status: 'extracted' }
  } else if (/\bWindows\s+11\s+Home\b/i.test(osText)) {
    specs.operating_system = 'Windows 11 Home'
    provenance.operating_system = { value: 'Windows 11 Home', source: osRaw ? 'html_spec' : 'inferred', confidence: 0.92, status: 'extracted' }
  } else if (/\bWindows\s+10\s+Pro\b/i.test(osText)) {
    specs.operating_system = 'Windows 10 Pro'
    provenance.operating_system = { value: 'Windows 10 Pro', source: osRaw ? 'html_spec' : 'inferred', confidence: 0.92, status: 'extracted' }
  } else if (/\bmacOS\b/i.test(osText)) {
    specs.operating_system = 'macOS'
    provenance.operating_system = { value: 'macOS', source: 'inferred', confidence: 0.95, status: 'inferred' }
  } else if (osRaw) {
    specs.operating_system = osRaw.val
    provenance.operating_system = { value: osRaw.val, source: 'html_spec', confidence: 0.85, status: 'extracted' }
  }

  // 9. CONDITION & WARRANTY (Only when explicitly stated)
  const condRaw = findRaw(['condition', 'item condition', 'state'])
  if (condRaw) {
    specs.laptop_condition = condRaw.val
    provenance.laptop_condition = { value: condRaw.val, source: 'html_spec', confidence: 0.9, status: 'extracted' }
  } else if (/\b(brand new|factory sealed)\b/i.test(combinedText)) {
    specs.laptop_condition = 'Brand New'
    provenance.laptop_condition = { value: 'Brand New', source: 'inferred', confidence: 0.85, status: 'inferred' }
  } else if (/\b(refurbished|certified pre-owned|ex-uk|ex uk)\b/i.test(combinedText)) {
    const isExUk = /\b(ex-uk|ex uk)\b/i.test(combinedText)
    specs.laptop_condition = isExUk ? 'Refurbished (Ex-UK)' : 'Refurbished'
    provenance.laptop_condition = { value: specs.laptop_condition, source: 'inferred', confidence: 0.85, status: 'inferred' }
  }

  const warrRaw = findRaw(['warranty', 'guarantee'])
  if (warrRaw) {
    specs.warranty = warrRaw.val
    provenance.warranty = { value: warrRaw.val, source: 'html_spec', confidence: 0.95, status: 'extracted' }
  }

  // 10. MPN / PART NUMBER
  const mpnRaw = findRaw(['mpn', 'part number', 'model number', 'sku', 'manufacturer part number'])
  if (mpnRaw) {
    specs.mpn = mpnRaw.val
    provenance.mpn = { value: mpnRaw.val, source: 'html_spec', confidence: 0.95, status: 'extracted' }
  }

  // 11. CATEGORY DETERMINATION
  const catText = `${title} ${description}`.toLowerCase()
  if (/\b(laptop memory|ram module|sodimm|ddr4 sodimm|ddr5 sodimm|desktop ram)\b/i.test(catText)) {
    specs.category = 'memory'
  } else if (/\b(laptop charger|laptop bag|laptop sleeve|laptop stand|laptop adapter|mouse|keyboard|charger|adapter|dock|bag|cable|headset|earbuds|accessory)\b/i.test(catText)) {
    specs.category = 'computer-accessories'
  } else if (/\b(internal ssd|external ssd|portable ssd|nvme ssd|m\.2 ssd|solid state drive|hard drive|flash drive|microsd)\b/i.test(catText)) {
    specs.category = 'storage'
  } else if (/\b(monitor|display screen|curved monitor|gaming monitor)\b/i.test(catText)) {
    specs.category = 'monitors'
  } else if (/\b(phone|smartphone|iphone|galaxy s|tablet|ipad)\b/i.test(catText)) {
    specs.category = 'phones'
  } else if (/\b(desktop|workstation|all-in-one|aio|tower|optiplex|thinkcentre)\b/i.test(catText)) {
    specs.category = 'desktops'
  } else if (/\b(laptop|notebook|macbook|elitebook|thinkpad|latitude|probook|zbook|yoga|inspiron|vostro|zenbook|ideapad)\b/i.test(catText)) {
    specs.category = 'laptops'
  } else {
    specs.category = 'laptops'
  }
  provenance.category = { value: specs.category, source: 'inferred', confidence: 0.88, status: 'inferred' }

  return { specs, provenance }
}
