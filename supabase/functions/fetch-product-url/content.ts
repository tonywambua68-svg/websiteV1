// OREMITECH 8-Section Deterministic Product Description & SEO Generator.
// Follows OREMITECH's preferred commercial structure for electronics retailing in Kenya.
// Never invents specifications, benchmark numbers, or false warranties.

import type { NormalizedSpecs } from './specs.ts'

export interface StructuredDescription {
  overview: string
  processor: string
  memory: string
  storage: string
  display: string
  design: string
  key_features: string[]
  contact_info: string
  full_html: string
  full_text: string
}

export interface GeneratedSeo {
  title: string
  meta_description: string
  slug: string
  focus_keyword: string
  secondary_keywords: string
  social_title: string
  social_description: string
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

/**
 * Builds the 8-section OREMITECH description from verified/extracted specifications.
 */
export function generateOremitechDescription(
  title: string,
  specs: NormalizedSpecs,
  priceKes?: number | null,
): StructuredDescription {
  const brand = specs.brand || 'Premium'
  const model = specs.model || title
  const category = specs.category || 'laptops'
  const isLaptop = category === 'laptops'

  // 1. Product Overview
  let overview = `The **${brand} ${model}** is an enterprise-grade ${isLaptop ? 'business laptop' : 'electronics solution'} engineered for professionals, students, and businesses in Kenya who demand reliable performance, durability, and daily efficiency.`
  if (specs.laptop_condition) {
    overview += ` Offered in **${specs.laptop_condition}** condition, every unit undergoes rigorous OREMITECH hardware testing before dispatch.`
  }

  // 2. Processor Performance
  let processor = ''
  if (specs.processor_model) {
    processor = `Powered by the **${specs.processor_model}**${specs.processor_generation ? ` (${specs.processor_generation})` : ''}, this machine delivers responsive computing power capable of handling intensive office workflows, data analysis, research, and high-volume multitasking without slowdowns.`
  } else {
    processor = `Equipped with a high-efficiency multi-core processor designed for steady workflow productivity and everyday task management.`
  }

  // 3. Memory and Multitasking
  let memory = ''
  if (specs.ram) {
    memory = `With **${specs.ram}**${specs.ram_type ? ` of high-speed ${specs.ram_type}` : ''} memory, the system provides generous multitasking headroom, allowing you to run multiple heavy applications, virtual spreadsheets, and dozens of browser tabs smoothly.`
  } else {
    memory = `Configured with ample system memory to support modern office suites and smooth day-to-day multitasking.`
  }

  // 4. Storage
  let storage = ''
  if (specs.storage_capacity) {
    const isFast = /ssd|nvme/i.test(specs.storage_type || '')
    storage = `Features a **${specs.storage_capacity} ${specs.storage_type || 'Solid State Drive'}**, offering ${isFast ? 'ultra-fast boot times, instant application launches, and rapid file transfers' : 'spacious and dependable storage'} for all your important work files and media.`
  } else {
    storage = `Includes fast solid-state storage for quick operating system startups and secure document storage.`
  }

  // 5. Display
  let display = ''
  if (specs.screen_size || specs.screen_resolution) {
    const parts = [
      specs.screen_size ? `**${specs.screen_size}**` : '',
      specs.screen_resolution ? `**${specs.screen_resolution}**` : '',
      specs.display_technology ? specs.display_technology : '',
      specs.touchscreen ? specs.touchscreen : '',
    ].filter(Boolean)
    display = `Boasts a sharp ${parts.join(' ')} display designed for comfortable viewing during long working hours, clear document presentation, and vibrant media playback.`
  } else {
    display = `Features a high-definition anti-glare display optimized for clear visibility and reduced eye strain.`
  }

  // 6. Design and Productivity
  let design = `Crafted with a sleek, durable chassis built to withstand the demands of business travel and everyday Kenyan workspace environments.`
  if (specs.operating_system) {
    design += ` Pre-installed with genuine **${specs.operating_system}**, providing built-in security, streamlined enterprise tools, and seamless compatibility with modern business applications.`
  }

  // 7. Key Features and Specifications
  const key_features: string[] = []
  if (specs.processor_model) key_features.push(`**Processor:** ${specs.processor_model}${specs.processor_generation ? ` (${specs.processor_generation})` : ''}`)
  if (specs.ram) key_features.push(`**Memory (RAM):** ${specs.ram}${specs.ram_type ? ` ${specs.ram_type}` : ''}`)
  if (specs.storage_capacity) key_features.push(`**Storage:** ${specs.storage_capacity} ${specs.storage_type || 'SSD'}`)
  if (specs.screen_size || specs.screen_resolution) key_features.push(`**Display:** ${specs.screen_size || ''} ${specs.screen_resolution || ''} ${specs.display_technology || ''}`.trim())
  if (specs.touchscreen && specs.touchscreen.includes('Touch')) key_features.push(`**Touchscreen:** ${specs.touchscreen}`)
  if (specs.graphics) key_features.push(`**Graphics:** ${specs.graphics}`)
  if (specs.operating_system) key_features.push(`**Operating System:** ${specs.operating_system}`)
  if (specs.laptop_condition) key_features.push(`**Condition:** ${specs.laptop_condition}`)
  if (specs.warranty) key_features.push(`**Warranty:** ${specs.warranty}`)
  if (specs.mpn) key_features.push(`**Model / Part No:** ${specs.mpn}`)

  // 8. OREMITECH Contact Information
  const contact_info = `**Order from OREMITECH SOLUTIONS:**\n` +
    `• Same-day delivery within Nairobi Metro & secure countrywide parcel courier across all 47 counties in Kenya.\n` +
    `• Every laptop is thoroughly inspected and verified by our technical specialists.\n` +
    `• For inquiries, orders, or custom hardware upgrades, contact OREMITECH customer care via phone/WhatsApp or visit our shop.`

  const full_text = [
    `### 1. Product Overview\n${overview}`,
    `### 2. Processor Performance\n${processor}`,
    `### 3. Memory and Multitasking\n${memory}`,
    `### 4. Storage\n${storage}`,
    `### 5. Display\n${display}`,
    `### 6. Design and Productivity\n${design}`,
    `### 7. Key Features and Specifications\n${key_features.map((f) => `• ${f}`).join('\n')}`,
    `### 8. OREMITECH Verification & Delivery\n${contact_info}`,
  ].join('\n\n')

  return {
    overview,
    processor,
    memory,
    storage,
    display,
    design,
    key_features,
    contact_info,
    full_html: full_text,
    full_text,
  }
}

/**
 * Builds structured SEO tags tailored for the Kenyan electronics market.
 */
export function generateOremitechSeo(
  title: string,
  specs: NormalizedSpecs,
  priceKes?: number | null,
): GeneratedSeo {
  const brand = specs.brand || 'Electronics'
  const model = specs.model || title

  const specParts = [
    specs.processor_model ? specs.processor_model.replace(/Intel\s+|AMD\s+/i, '') : '',
    specs.ram || '',
    specs.storage_capacity || '',
  ].filter(Boolean)

  const specSnippet = specParts.length ? ` (${specParts.join(', ')})` : ''
  const suffix = ' | OREMITECH Kenya'
  const maxBaseLen = Math.max(10, 65 - suffix.length)
  const base = `${brand} ${model}${specSnippet}`.trim()
  const seoTitle = `${base.slice(0, maxBaseLen).trim()}${suffix}`

  const metaDesc = `Buy the ${brand} ${model}${specSnippet} in Kenya. ${
    specs.laptop_condition ? `${specs.laptop_condition} condition. ` : ''
  }Genuine quality, best price in Nairobi, and fast nationwide delivery from OREMITECH.`.slice(0, 160)

  const focusKeyword = `${brand} ${model} Kenya`.slice(0, 60)
  const secondaryKeywords = [
    `${brand} ${model} Nairobi`,
    `${brand} laptops Kenya`,
    'laptops for sale in Nairobi',
    'refurbished laptops Kenya',
    'buy laptop Kenya',
    'OREMITECH Solutions',
  ].join(', ')

  const cleanSlug = slugify(`${brand}-${model}`)

  return {
    title: seoTitle,
    meta_description: metaDesc,
    slug: cleanSlug,
    focus_keyword: focusKeyword,
    secondary_keywords: secondaryKeywords,
    social_title: `${brand} ${model} — Available at OREMITECH Kenya`,
    social_description: metaDesc,
  }
}
