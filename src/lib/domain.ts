export type StaffRole =
  | 'owner'
  | 'manager'
  | 'product_researcher'
  | 'inventory_assistant'
  | 'sales_assistant'
  | 'customer'

export interface Profile {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  avatar_url: string | null
  role: StaffRole
  account_status: 'active' | 'suspended'
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  parent_id: string | null
  name: string
  slug: string
  description: string
  menu_group: string
  sort_order: number
  is_active: boolean
  seo_title: string | null
  seo_description: string | null
  seo_focus_keyword: string | null
  seo_social_title: string | null
  seo_social_description: string | null
}

export interface Brand {
  id: string
  name: string
  slug: string
  is_active: boolean
  sort_order: number
}

export interface CatalogueImage {
  url: string
  alt: string
}

export interface CatalogueVariant {
  id: string
  label: string
  selling_price: number
  ram: string | null
  storage_capacity: string | null
}

export type Availability = 'in_stock' | 'supplier' | 'unavailable'

export interface CatalogueProduct {
  id: string
  slug: string
  name: string
  model: string | null
  description: string
  selling_price: number
  comparison_price: number | null
  featured: boolean
  laptop_condition: string
  warranty: string | null
  processor_manufacturer: string | null
  processor_model: string | null
  processor_generation: string | null
  ram: string | null
  ram_type: string | null
  storage_capacity: string | null
  storage_type: string | null
  screen_size: string | null
  screen_resolution: string | null
  graphics: string | null
  operating_system: string | null
  keyboard_layout: string | null
  battery_condition: string | null
  weight: string | null
  colour: string | null
  seo_title: string | null
  seo_description: string | null
  seo_focus_keyword: string | null
  seo_secondary_keywords: string | null
  seo_social_title: string | null
  seo_social_description: string | null
  publication_status: string
  published_at: string | null
  created_at: string
  brand_name: string | null
  brand_slug: string | null
  category_name: string
  category_slug: string
  menu_group: string
  owned_available: number
  supplier_available: number
  availability: Availability
  image_url: string | null
  images: CatalogueImage[]
  variants: CatalogueVariant[]
  extra_specs: Record<string, string>
  search_text: string
}

export interface PublicSettings {
  business_name: string
  tagline: string
  currency: string
  timezone: string
  whatsapp_e164: string
  store_email: string
  store_location: string
  ga_measurement_id: string
  gsc_verification: string
}

export interface ShopQuery {
  q?: string
  category?: string
  brand?: string
  min?: string
  max?: string
  processor?: string
  ram?: string
  storage?: string
  condition?: string
  availability?: string
  offers?: string
  featured?: string
  sort?: string
  page?: string
}

export const PAGE_SIZE = 24

export function asCatalogue(row: Record<string, unknown>): CatalogueProduct {
  const images = Array.isArray(row.images) ? row.images : []
  const variants = Array.isArray(row.variants) ? row.variants : []
  const specs = row.extra_specs && typeof row.extra_specs === 'object' ? row.extra_specs : {}
  return {
    ...(row as unknown as CatalogueProduct),
    selling_price: Number(row.selling_price),
    comparison_price: row.comparison_price == null ? null : Number(row.comparison_price),
    owned_available: Number(row.owned_available ?? 0),
    supplier_available: Number(row.supplier_available ?? 0),
    images: images as CatalogueProduct['images'],
    variants: variants as CatalogueProduct['variants'],
    extra_specs: specs as Record<string, string>,
  }
}

export const CONDITION_OPTIONS = [
  'new',
  'refurbished',
  'open_box',
  'used_excellent',
  'used_good',
  'for_parts',
  'unspecified',
] as const

export interface BlogCategory {
  id: string
  name: string
  slug: string
  description: string
  seo_title: string | null
  seo_description: string | null
  seo_focus_keyword: string | null
  seo_social_title: string | null
  seo_social_description: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BlogArticle {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  featured_image_url: string | null
  featured_image_alt: string | null
  category_id: string | null
  category: BlogCategory | null
  author_id: string | null
  seo_title: string | null
  seo_description: string | null
  seo_focus_keyword: string | null
  seo_secondary_keywords: string | null
  seo_social_title: string | null
  seo_social_description: string | null
  publication_status: 'draft' | 'published' | 'archived' | 'scheduled'
  published_at: string | null
  scheduled_at: string | null
  created_at: string
  updated_at: string
}
