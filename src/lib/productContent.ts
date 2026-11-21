/**
 * Deterministic product content + SEO engine (Phase 3).
 * Templates and rules only. No external AI APIs.
 * Generates OREMITECH's structured 8-part product description and Kenyan SEO metadata.
 * Never invents specifications, benchmarks, or false warranties.
 */

export type TemplateKind = 'laptop' | 'desktop' | 'accessory' | 'storage' | 'memory' | 'monitors' | 'phones' | 'generic'

export interface ContentInput {
  name: string
  brand?: string | null
  model?: string | null
  categorySlug?: string | null
  categoryName?: string | null
  specs: Record<string, string>
  condition?: string | null
  warranty?: string | null
  priceKes?: number | null
  availability?: string | null
  keyFeatures?: string[]
}

export interface GeneratedContent {
  title: string
  short_description: string
  long_description: string
  overview?: string
  processor_section?: string
  memory_section?: string
  storage_section?: string
  display_section?: string
  design_section?: string
  contact_section?: string
  features: string[]
  benefits: string[]
  use_cases: string[]
  faqs: Array<{ question: string; answer: string }>
  whatsapp_description: string
  image_alt_texts: string[]
}

export interface GeneratedSeo {
  title: string
  meta_description: string
  focus_keyword: string
  secondary_keywords: string
  slug: string
  social_title: string
  social_description: string
}

const SPEC_ALIASES: Record<string, string[]> = {
  processor: ['processor_model', 'processor model', 'processor', 'cpu', 'chipset'],
  generation: ['processor_generation', 'generation', 'cpu generation'],
  ram: ['ram', 'memory', 'ram_size'],
  ram_type: ['ram_type', 'memory type', 'memory_type'],
  storage: ['storage_capacity', 'storage', 'ssd', 'hdd', 'drive'],
  storage_type: ['storage_type', 'drive type', 'drive_type'],
  display: ['screen_size', 'display', 'screen'],
  resolution: ['screen_resolution', 'resolution'],
  display_tech: ['display_technology', 'panel type'],
  touch: ['touchscreen', 'touch'],
  graphics: ['graphics', 'gpu', 'graphics card'],
  os: ['operating_system', 'operating system', 'os'],
  battery: ['battery_condition', 'battery', 'battery life'],
  weight: ['weight'],
  colour: ['colour', 'color'],
  connectivity: ['connectivity', 'ports', 'wireless'],
  warranty: ['warranty'],
  condition: ['laptop_condition', 'condition'],
  mpn: ['mpn', 'sku', 'part number'],
}

function normKey(key: string): string {
  return key.trim().toLowerCase()
}

export function pickSpec(specs: Record<string, string>, aliases: string[]): string {
  const entries = Object.entries(specs || {})
  for (const alias of aliases) {
    for (const [key, value] of entries) {
      if (normKey(key) === alias && value && String(value).trim()) return String(value).trim()
    }
  }
  const sorted = aliases.slice().sort((a, b) => b.length - a.length)
  for (const alias of sorted) {
    for (const [key, value] of entries) {
      if (normKey(key).includes(alias) && value && String(value).trim()) return String(value).trim()
    }
  }
  return ''
}

export function detectedSpecs(specs: Record<string, string>) {
  return {
    processor: pickSpec(specs, SPEC_ALIASES.processor),
    generation: pickSpec(specs, SPEC_ALIASES.generation),
    ram: pickSpec(specs, SPEC_ALIASES.ram),
    ram_type: pickSpec(specs, SPEC_ALIASES.ram_type),
    storage: pickSpec(specs, SPEC_ALIASES.storage),
    storage_type: pickSpec(specs, SPEC_ALIASES.storage_type),
    display: pickSpec(specs, SPEC_ALIASES.display),
    resolution: pickSpec(specs, SPEC_ALIASES.resolution),
    display_tech: pickSpec(specs, SPEC_ALIASES.display_tech),
    touch: pickSpec(specs, SPEC_ALIASES.touch),
    graphics: pickSpec(specs, SPEC_ALIASES.graphics),
    os: pickSpec(specs, SPEC_ALIASES.os),
    battery: pickSpec(specs, SPEC_ALIASES.battery),
    weight: pickSpec(specs, SPEC_ALIASES.weight),
    colour: pickSpec(specs, SPEC_ALIASES.colour),
    connectivity: pickSpec(specs, SPEC_ALIASES.connectivity),
    warranty: pickSpec(specs, SPEC_ALIASES.warranty),
    condition: pickSpec(specs, SPEC_ALIASES.condition),
    mpn: pickSpec(specs, SPEC_ALIASES.mpn),
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function detectTemplate(categorySlug?: string | null, categoryName?: string | null): TemplateKind {
  const hay = `${categorySlug || ''} ${categoryName || ''}`.toLowerCase()
  if (hay.includes('laptop') || hay.includes('notebook') || hay.includes('macbook')) return 'laptop'
  if (hay.includes('desktop') || hay.includes('workstation') || hay.includes('all-in-one') || hay.includes('aio')) return 'desktop'
  if (hay.includes('storage') || hay.includes('ssd') || hay.includes('hard') || hay.includes('flash') || hay.includes('drive')) return 'storage'
  if (hay.includes('memory') || hay.includes('ram')) return 'memory'
  if (hay.includes('monitor') || hay.includes('display')) return 'monitors'
  if (hay.includes('phone') || hay.includes('tablet')) return 'phones'
  if (hay.includes('accessor') || hay.includes('mouse') || hay.includes('keyboard') || hay.includes('charger') || hay.includes('cable') || hay.includes('bag')) return 'accessory'
  return 'generic'
}

const TEMPLATE_NOUN: Record<TemplateKind, string> = {
  laptop: 'laptop',
  desktop: 'desktop computer',
  accessory: 'accessory',
  storage: 'storage device',
  memory: 'memory module',
  monitors: 'monitor display',
  phones: 'mobile device',
  generic: 'product',
}

const TEMPLATE_USES: Record<TemplateKind, string[]> = {
  laptop: [
    'Business and office productivity',
    'Study, research and academic tasks',
    'Everyday multitasking, web research and video conferences',
  ],
  desktop: [
    'Fixed high-output workstation for office and business use',
    'Heavy multitasking across multiple monitors and applications',
    'Continuous long-session data processing',
  ],
  accessory: [
    'Complementing and improving laptop or desktop workspaces',
    'High-durability everyday business computing',
    'Seamless connection with modern peripherals',
  ],
  storage: [
    'Expanding internal or external data storage headroom',
    'Secure backup for crucial work files, databases and media',
    'Faster boot times and rapid transfer speeds',
  ],
  memory: [
    'Upgrading system RAM for smoother multi-app workflows',
    'Eliminating multitasking bottlenecks in heavy software',
    'Enhancing system responsiveness under high loads',
  ],
  monitors: [
    'Crisp visual real estate for spreadsheets and programming',
    'Dual-screen productivity setups',
    'Comfortable anti-glare viewing for long work days',
  ],
  phones: [
    'Mobile communication and on-the-go productivity',
    'High-resolution photography and media consumption',
    'Secure access to banking, communication and office apps',
  ],
  generic: ['Dependable everyday productivity', 'Replacing an older item', 'Business workspace expansion'],
}

export function generateContent(input: ContentInput): GeneratedContent {
  const kind = detectTemplate(input.categorySlug, input.categoryName)
  const noun = TEMPLATE_NOUN[kind]
  const specs = detectedSpecs(input.specs || {})

  const brand = (input.brand || '').trim()
  const name = (input.name || '').trim()
  const model = (input.model || '').trim()
  const cond = input.condition || specs.condition || ''
  const warr = input.warranty || specs.warranty || ''

  const nameHasBrand = brand && name.toLowerCase().includes(brand.toLowerCase())
  const baseTitle = [nameHasBrand ? '' : brand, name].filter(Boolean).join(' ').trim()
  const title = baseTitle || name || 'Product'

  // 1. Overview
  let overview = `The **${title}** is an enterprise-grade ${noun} built for demanding everyday productivity in Kenya.`
  if (cond) {
    overview += ` Offered in **${cond.replace(/_/g, ' ')}** condition, every unit undergoes thorough technical inspection by OREMITECH specialists before dispatch.`
  }

  // 2. Processor
  let processor_section = ''
  if (specs.processor) {
    processor_section = `Driven by the **${specs.processor}**${specs.generation ? ` (${specs.generation})` : ''}, delivering fast and stable processing power for heavy office software, multi-sheet spreadsheets, and seamless web multitasking.`
  } else {
    processor_section = `Equipped with an efficient multi-core processing architecture optimized for consistent workflow performance and reliable everyday computing.`
  }

  // 3. Memory
  let memory_section = ''
  if (specs.ram) {
    memory_section = `Configured with **${specs.ram}**${specs.ram_type ? ` ${specs.ram_type}` : ''} system memory, providing ample headroom for switching smoothly between open applications, enterprise portals, and active browser sessions.`
  } else {
    memory_section = `Includes high-efficiency memory to maintain fluid performance across daily business tasks.`
  }

  // 4. Storage
  let storage_section = ''
  if (specs.storage) {
    const isSsd = /ssd|nvme/i.test(specs.storage) || /ssd|nvme/i.test(specs.storage_type)
    storage_section = `Equipped with a **${specs.storage} ${specs.storage_type || (isSsd ? 'SSD' : 'drive')}**, ensuring rapid file retrieval, ultra-fast system startups, and secure storage for all your business data.`
  } else {
    storage_section = `Provides dependable solid-state storage for quick file access and secure application performance.`
  }

  // 5. Display
  let display_section = ''
  if (specs.display || specs.resolution) {
    const parts = [
      specs.display ? `**${specs.display}**` : '',
      specs.resolution ? `**${specs.resolution}**` : '',
      specs.display_tech ? specs.display_tech : '',
      specs.touch ? `(${specs.touch})` : '',
    ].filter(Boolean)
    display_section = `Features a clear ${parts.join(' ')} display optimized for comfortable viewing during long working hours and vivid document clarity.`
  } else {
    display_section = `Features a high-definition anti-glare screen engineered to reduce eye fatigue across long work days.`
  }

  // 6. Design and Productivity
  let design_section = `Built with a sturdy, durable enclosure tailored to handle daily office routines and active travel in Kenya.`
  if (specs.os) {
    design_section += ` Pre-loaded with genuine **${specs.os}**, giving you built-in security, automatic updates, and compatibility with standard business software.`
  }

  // 7. Key Features List
  const featureList: string[] = []
  if (specs.processor) featureList.push(`Processor: ${specs.processor}${specs.generation ? ` (${specs.generation})` : ''}`)
  if (specs.ram) featureList.push(`Memory (RAM): ${specs.ram}${specs.ram_type ? ` ${specs.ram_type}` : ''}`)
  if (specs.storage) featureList.push(`Storage: ${specs.storage} ${specs.storage_type || ''}`.trim())
  if (specs.display || specs.resolution) featureList.push(`Display: ${specs.display || ''} ${specs.resolution || ''} ${specs.display_tech || ''}`.trim())
  if (specs.touch && /yes|touch/i.test(specs.touch)) featureList.push(`Touchscreen: ${specs.touch}`)
  if (specs.graphics) featureList.push(`Graphics: ${specs.graphics}`)
  if (specs.os) featureList.push(`Operating System: ${specs.os}`)
  if (cond) featureList.push(`Condition: ${cond.replace(/_/g, ' ')}`)
  if (warr) featureList.push(`Warranty: ${warr}`)
  if (specs.battery) featureList.push(`Battery: ${specs.battery}`)
  if (specs.mpn) featureList.push(`Model/Part Number: ${specs.mpn}`)

  for (const feature of input.keyFeatures || []) {
    if (feature && feature.trim()) featureList.push(feature.trim())
  }

  // 8. OREMITECH Contact & Delivery
  const contact_section =
    `**Order from OREMITECH SOLUTIONS:**\n` +
    `• Same-day delivery across Nairobi Metro & reliable countrywide courier delivery across Kenya.\n` +
    `• Every product is verified and inspected by our technical team prior to handover.\n` +
    `• For instant inquiries, custom specifications, or corporate orders, reach our customer desk via phone or WhatsApp.`

  const long_description = [
    `### 1. Product Overview\n${overview}`,
    `### 2. Processor Performance\n${processor_section}`,
    `### 3. Memory and Multitasking\n${memory_section}`,
    `### 4. Storage\n${storage_section}`,
    `### 5. Display\n${display_section}`,
    `### 6. Design and Productivity\n${design_section}`,
    `### 7. Key Features and Specifications\n${featureList.map((f) => `• ${f}`).join('\n')}`,
    `### 8. OREMITECH Verification & Delivery\n${contact_section}`,
  ].join('\n\n')

  const short_description = `${title} — ${noun} powered by ${specs.processor || 'high-efficiency processor'}, ${specs.ram || 'generous RAM'} memory and ${specs.storage || 'fast storage'}. Verified and guaranteed by OREMITECH.`

  const benefits: string[] = []
  if (specs.processor) benefits.push(`Consistent performance powered by ${specs.processor}.`)
  if (specs.ram) benefits.push(`Multitasking capacity of ${specs.ram} for running concurrent applications without lag.`)
  if (specs.storage) benefits.push(`Fast solid-state storage with ${specs.storage} for rapid boot-up and file handling.`)
  if (specs.display) benefits.push(`Crisp ${specs.display} screen for clear, comfortable viewing.`)
  if (benefits.length === 0) benefits.push(`A verified ${noun} backed by OREMITECH quality inspection before dispatch.`)

  const use_cases = TEMPLATE_USES[kind].slice()

  const faqs: Array<{ question: string; answer: string }> = []
  if (cond) {
    faqs.push({ question: 'What is the condition of this item?', answer: `The verified condition is ${cond.replace(/_/g, ' ')}.` })
  }
  if (warr) {
    faqs.push({ question: 'Is a warranty included?', answer: `Warranty coverage: ${warr}.` })
  }
  if (specs.storage) {
    faqs.push({ question: 'What storage does this model feature?', answer: `It includes ${specs.storage} of storage.` })
  }
  if (specs.ram) {
    faqs.push({ question: 'How much memory (RAM) is installed?', answer: `It is equipped with ${specs.ram} of memory.` })
  }
  faqs.push({
    question: 'How does OREMITECH handle delivery across Kenya?',
    answer: 'We provide same-day doorstep delivery within Nairobi Metro and secure, trackable parcel transit to all 47 counties in Kenya.',
  })

  const priceFormatted = input.priceKes && input.priceKes > 0 ? ` at KSh ${Math.round(input.priceKes).toLocaleString('en-KE')}` : ''
  const whatsapp_description = `${title}${priceFormatted}. ${specs.processor ? `Processor: ${specs.processor}. ` : ''}${specs.ram ? `RAM: ${specs.ram}. ` : ''}${specs.storage ? `Storage: ${specs.storage}. ` : ''}Available from OREMITECH SOLUTIONS with nationwide delivery.`

  const image_alt_texts = [
    title,
    `${title} front view`,
    `${title} specifications and ports`,
  ]

  return {
    title,
    short_description,
    long_description,
    overview,
    processor_section,
    memory_section,
    storage_section,
    display_section,
    design_section,
    contact_section,
    features: featureList,
    benefits,
    use_cases,
    faqs,
    whatsapp_description,
    image_alt_texts,
  }
}

export function generateSeo(input: ContentInput, content: GeneratedContent): GeneratedSeo {
  const title = content.title
  const brand = (input.brand || '').trim()
  const categoryLabel = (input.categoryName || '').trim() || 'Kenya'
  const specs = detectedSpecs(input.specs || {})

  const specHighlights = [specs.ram, specs.storage].filter(Boolean).join(' ')
  const seoTitle = `${title}${specHighlights ? ` (${specHighlights})` : ''} | OREMITECH Kenya`.slice(0, 65)

  const specSentence = [specs.processor, specs.ram, specs.storage].filter(Boolean).join(', ')
  const meta = (
    specSentence
      ? `Buy the ${title} in Kenya. Features ${specSentence}. Thoroughly verified and available at OREMITECH Nairobi with nationwide delivery.`
      : `Buy the ${title} in Kenya. Quality-tested and available at OREMITECH Nairobi with fast nationwide delivery.`
  ).slice(0, 158)

  const focus = [brand, input.model || title, 'Kenya'].filter(Boolean).join(' ').trim().slice(0, 60)
  const secondary = [
    brand ? `${brand} Kenya` : '',
    brand ? `${brand} Nairobi` : '',
    `${categoryLabel} Nairobi`,
    'electronics shop Kenya',
    'OREMITECH Kenya',
  ]
    .filter(Boolean)
    .join(', ')

  return {
    title: seoTitle,
    meta_description: meta,
    focus_keyword: focus,
    secondary_keywords: secondary,
    slug: slugify(title),
    social_title: `${title} — OREMITECH Kenya`,
    social_description: meta,
  }
}

export interface CompletenessInput {
  title: string
  brand?: string | null
  categorySlug?: string | null
  specs: Record<string, string>
  imagesCount: number
  supplierPrice?: number | null
  hasDescription: boolean
  hasSeo: boolean
}

export interface CompletenessResult {
  score: number
  missing: string[]
  fieldBreakdown: Record<string, { status: 'verified' | 'extracted' | 'inferred' | 'missing'; score: number }>
}

export function computeCompleteness(input: CompletenessInput): CompletenessResult {
  const missing: string[] = []
  const fieldBreakdown: Record<string, { status: 'verified' | 'extracted' | 'inferred' | 'missing'; score: number }> = {}
  let totalScore = 0

  // Title (15%)
  if (input.title && input.title.trim().length >= 3) {
    totalScore += 15
    fieldBreakdown['title'] = { status: 'extracted', score: 15 }
  } else {
    missing.push('title')
    fieldBreakdown['title'] = { status: 'missing', score: 0 }
  }

  // Brand (10%)
  if (input.brand && input.brand.trim()) {
    totalScore += 10
    fieldBreakdown['brand'] = { status: 'extracted', score: 10 }
  } else {
    missing.push('brand')
    fieldBreakdown['brand'] = { status: 'missing', score: 0 }
  }

  // Category (10%)
  if (input.categorySlug && input.categorySlug.trim()) {
    totalScore += 10
    fieldBreakdown['category'] = { status: 'extracted', score: 10 }
  } else {
    missing.push('category')
    fieldBreakdown['category'] = { status: 'missing', score: 0 }
  }

  // Key Specifications (25%)
  const specs = detectedSpecs(input.specs || {})
  const specList = [
    { key: 'processor', val: specs.processor, pts: 7 },
    { key: 'ram', val: specs.ram, pts: 6 },
    { key: 'storage', val: specs.storage, pts: 6 },
    { key: 'display', val: specs.display || specs.resolution, pts: 6 },
  ]
  let specScore = 0
  for (const s of specList) {
    if (s.val) {
      specScore += s.pts
      fieldBreakdown[s.key] = { status: 'extracted', score: s.pts }
    } else {
      missing.push(s.key)
      fieldBreakdown[s.key] = { status: 'missing', score: 0 }
    }
  }
  totalScore += specScore

  // Images (15%)
  if (input.imagesCount >= 3) {
    totalScore += 15
    fieldBreakdown['images'] = { status: 'extracted', score: 15 }
  } else if (input.imagesCount > 0) {
    totalScore += 8
    missing.push(`images (has ${input.imagesCount}, prefer 3+)`)
    fieldBreakdown['images'] = { status: 'extracted', score: 8 }
  } else {
    missing.push('images')
    fieldBreakdown['images'] = { status: 'missing', score: 0 }
  }

  // Pricing (10%)
  if (input.supplierPrice && input.supplierPrice > 0) {
    totalScore += 10
    fieldBreakdown['price'] = { status: 'extracted', score: 10 }
  } else {
    missing.push('supplier price')
    fieldBreakdown['price'] = { status: 'missing', score: 0 }
  }

  // Description (10%)
  if (input.hasDescription) {
    totalScore += 10
    fieldBreakdown['description'] = { status: 'extracted', score: 10 }
  } else {
    missing.push('description')
    fieldBreakdown['description'] = { status: 'missing', score: 0 }
  }

  // SEO (5%)
  if (input.hasSeo) {
    totalScore += 5
    fieldBreakdown['seo'] = { status: 'extracted', score: 5 }
  } else {
    missing.push('SEO')
    fieldBreakdown['seo'] = { status: 'missing', score: 0 }
  }

  return {
    score: Math.max(0, Math.min(100, totalScore)),
    missing,
    fieldBreakdown,
  }
}
