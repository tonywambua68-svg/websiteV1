import productsJson from '@/data/products.json'
import type { CatalogueProduct } from '@/lib/domain'
import { slugify } from '@/lib/commerce'

interface RawProduct {
  id: string
  sku?: string
  name: string
  category: string
  subcategory?: string
  brand: string
  price: number
  oldPrice?: number | null
  image?: string
  images?: string[]
  description: string
  specs?: Record<string, string>
  inStock?: boolean
  stock?: number
  tag?: string | null
  createdAt?: string
}

export const FALLBACK_CATALOGUE: CatalogueProduct[] = (productsJson as unknown as RawProduct[]).map((p) => {
  const slug = p.id || slugify(p.name)
  const categorySlug = slugify(p.category || 'electronics')
  const brandSlug = slugify(p.brand || 'other')
  const img = p.image || (p.images && p.images[0]) || '/images/products/laptop-placeholder.svg'
  const specs = p.specs || {}
  const stock = typeof p.stock === 'number' ? p.stock : (p.inStock ? 8 : 0)

  // Smart OS determination across smartphones, laptops, tablets and consoles
  let detectedOS: string | null = specs['OS'] || specs['Operating System'] || null
  if (!detectedOS) {
    if (p.category === 'Phones') {
      detectedOS = p.brand.toLowerCase() === 'apple' ? 'iOS' : 'Android'
    } else if (p.category === 'Tablets') {
      detectedOS = p.brand.toLowerCase() === 'apple' ? 'iPadOS' : 'Android'
    } else if (p.category === 'Laptops') {
      detectedOS = p.brand.toLowerCase() === 'apple' ? 'macOS' : 'Windows 11 Pro'
    }
  }

  const detectedProcessor = specs['Processor'] || specs['Chipset'] || null
  const allSpecValues = Object.values(specs).join(' ')

  return {
    id: p.id,
    slug: slug,
    name: p.name,
    model: p.name,
    description: p.description || `${p.name} - genuine electronics and tech gear in Kenya.`,
    selling_price: Number(p.price) || 0,
    comparison_price: p.oldPrice ? Number(p.oldPrice) : null,
    featured: Boolean(p.tag === 'Best Seller' || p.oldPrice),
    laptop_condition: specs['Condition'] ? slugify(specs['Condition']) : 'new',
    warranty: specs['Warranty'] || '1 Year Official Warranty',
    processor_manufacturer: detectedProcessor ? detectedProcessor.split(' ')[0] : null,
    processor_model: detectedProcessor,
    processor_generation: null,
    ram: specs['RAM'] || null,
    ram_type: specs['RAM']?.includes('DDR') ? specs['RAM'].split(' ').pop() || null : null,
    storage_capacity: specs['Storage'] || null,
    storage_type: specs['Storage']?.includes('SSD') ? 'SSD' : null,
    screen_size: specs['Display'] || specs['Screen'] || null,
    screen_resolution: null,
    graphics: specs['Graphics'] || null,
    operating_system: detectedOS,
    keyboard_layout: specs['Keyboard'] || (p.category === 'Laptops' ? 'Standard QWERTY' : null),
    battery_condition: specs['Battery'] || 'Healthy (100%)',
    weight: specs['Weight'] || (p.category === 'Phones' ? '185g' : '1.4 kg'),
    colour: specs['Color'] || 'Original Manufacturer Finish',
    seo_title: `${p.name} | OREMITECH Kenya`,
    seo_description: p.description || `${p.name} available at OREMITECH Kenya in KSh. Fast delivery nationwide.`,
    seo_focus_keyword: `${p.name} ${p.brand}`.trim(),
    seo_secondary_keywords: `${p.brand} laptop, ${p.category} Kenya, buy ${p.name}`.trim(),
    seo_social_title: `${p.name} - Verified at OREMITECH Kenya`,
    seo_social_description: `Get a verified ${p.name} with nationwide delivery in Kenya. Quality assured.`,
    published_at: p.createdAt || '2026-10-01T00:00:00Z',
    created_at: p.createdAt || '2026-10-01T00:00:00Z',
    brand_name: p.brand,
    brand_slug: brandSlug,
    category_name: p.category,
    category_slug: categorySlug,
    menu_group: categorySlug.includes('phone') ? 'phones' : categorySlug.includes('access') ? 'accessories' : 'electronics',
    owned_available: stock,
    supplier_available: 0,
    publication_status: 'published',
    availability: stock > 0 ? 'in_stock' : 'unavailable',
    image_url: img,
    images: [{ url: img, alt: p.name }],
    variants: [],
    extra_specs: specs,
    search_text: `${p.name} ${p.brand} ${p.category} ${p.subcategory || ''} ${allSpecValues}`.toLowerCase(),
  }
})
