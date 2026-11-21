import { create } from 'zustand'
import { getSupabase } from '@/lib/supabase'
import { asCatalogue, PAGE_SIZE, type CatalogueProduct, type ShopQuery } from '@/lib/domain'
import { errorText, searchPattern } from '@/lib/commerce'
import { FALLBACK_CATALOGUE } from '@/data/fallbackCatalogue'
import { isProductUuid } from '@/lib/productIds'

interface ProductState {
  products: CatalogueProduct[]
  allProducts: CatalogueProduct[]
  loading: boolean
  error: string | null
  total: number
  page: number
  fetchProducts: (filters?: ShopQuery) => Promise<void>
  fetchProductBySlug: (identifier: string) => Promise<CatalogueProduct | null>
  fetchProduct: (identifier: string) => Promise<CatalogueProduct | null>
  fetchRelated: (product: CatalogueProduct) => Promise<CatalogueProduct[]>
  searchProducts: (query: string) => Promise<CatalogueProduct[]>
  fetchSection: (filters: ShopQuery, limit?: number) => Promise<CatalogueProduct[]>
}

function applyFilters(query: any, filters: ShopQuery) {
  let next = query
  if (filters.category) next = next.eq('category_slug', filters.category)
  if (filters.brand) {
    const brands = filters.brand.split(',').map((brand) => brand.trim()).filter(Boolean)
    next = brands.length === 1 ? next.eq('brand_slug', brands[0]) : next.in('brand_slug', brands)
  }
  if (filters.min) next = next.gte('selling_price', Number(filters.min))
  if (filters.max) next = next.lte('selling_price', Number(filters.max))
  if (filters.processor) next = next.or(`processor_model.ilike.%${filters.processor}%,processor_manufacturer.ilike.%${filters.processor}%`)
  if (filters.ram) next = next.ilike('ram', `%${filters.ram}%`)
  if (filters.storage) next = next.ilike('storage_capacity', `%${filters.storage}%`)
  if (filters.condition) next = next.eq('laptop_condition', filters.condition)
  if (filters.availability === 'in_stock' || filters.availability === 'supplier') next = next.eq('availability', filters.availability)
  if (filters.offers === '1') next = next.not('comparison_price', 'is', null)
  if (filters.featured === '1') next = next.eq('featured', true)
  const pattern = filters.q ? searchPattern(filters.q) : null
  if (pattern) next = next.ilike('search_text', pattern)
  if (filters.sort === 'price_asc') next = next.order('selling_price', { ascending: true })
  else if (filters.sort === 'price_desc') next = next.order('selling_price', { ascending: false })
  else next = next.order('published_at', { ascending: false })
  return next
}

function filterFallback(list: CatalogueProduct[], filters: ShopQuery = {}): CatalogueProduct[] {
  let res = [...list]
  if (filters.category) {
    const cat = filters.category.toLowerCase()
    res = res.filter((p) => p.category_slug === cat || p.category_name.toLowerCase().includes(cat))
  }
  if (filters.brand) {
    const brands = filters.brand.toLowerCase().split(',').map((b) => b.trim()).filter(Boolean)
    if (brands.length > 0) {
      res = res.filter((p) => brands.includes(p.brand_slug?.toLowerCase() || '') || brands.includes(p.brand_name?.toLowerCase() || ''))
    }
  }
  if (filters.min) res = res.filter((p) => p.selling_price >= Number(filters.min))
  if (filters.max) res = res.filter((p) => p.selling_price <= Number(filters.max))
  if (filters.processor) {
    const proc = filters.processor.toLowerCase()
    res = res.filter((p) => p.processor_model?.toLowerCase().includes(proc) || p.processor_manufacturer?.toLowerCase().includes(proc))
  }
  if (filters.ram) {
    const ram = filters.ram.toLowerCase()
    res = res.filter((p) => p.ram?.toLowerCase().includes(ram))
  }
  if (filters.storage) {
    const st = filters.storage.toLowerCase()
    res = res.filter((p) => p.storage_capacity?.toLowerCase().includes(st))
  }
  if (filters.condition) {
    res = res.filter((p) => p.laptop_condition.toLowerCase() === filters.condition?.toLowerCase())
  }
  if (filters.availability) {
    res = res.filter((p) => p.availability === filters.availability)
  }
  if (filters.offers === '1') {
    res = res.filter((p) => p.comparison_price && p.comparison_price > p.selling_price)
  }
  if (filters.featured === '1') {
    res = res.filter((p) => p.featured)
  }
  if (filters.q) {
    const q = filters.q.toLowerCase()
    res = res.filter((p) => p.search_text.includes(q) || p.name.toLowerCase().includes(q) || p.brand_name?.toLowerCase().includes(q))
  }
  if (filters.sort === 'price_asc') res.sort((a, b) => a.selling_price - b.selling_price)
  else if (filters.sort === 'price_desc') res.sort((a, b) => b.selling_price - a.selling_price)
  return res
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: FALLBACK_CATALOGUE,
  allProducts: FALLBACK_CATALOGUE,
  loading: false,
  error: null,
  total: FALLBACK_CATALOGUE.length,
  page: 1,

  fetchProducts: async (filters: ShopQuery = {}) => {
    const supabase = getSupabase()
    const page = Math.max(1, Number(filters.page ?? 1) || 1)
    const from = (page - 1) * PAGE_SIZE

    if (!supabase) {
      const filtered = filterFallback(FALLBACK_CATALOGUE, filters)
      const paged = filtered.slice(from, from + PAGE_SIZE)
      set({
        products: paged,
        allProducts: FALLBACK_CATALOGUE,
        total: filtered.length,
        page,
        loading: false,
        error: null,
      })
      return
    }

    set({ loading: true, error: null })
    try {
      const { data, count, error } = await applyFilters(
        supabase.from('catalogue_products').select('*', { count: 'exact' }),
        filters,
      ).range(from, from + PAGE_SIZE - 1)

      if (error) throw error

      if (data && data.length > 0) {
        const mapped = (data as Record<string, unknown>[]).map((row) => asCatalogue(row))
        set({
          products: mapped,
          allProducts: mapped,
          total: count ?? mapped.length,
          page,
          loading: false,
        })
      } else {
        set({
          products: [],
          allProducts: [],
          total: 0,
          page,
          loading: false,
          error: null,
        })
      }
    } catch (error) {
      set({
        products: [],
        allProducts: [],
        total: 0,
        page,
        loading: false,
        error: errorText(error),
      })
    }
  },

  fetchProductBySlug: async (identifier: string) => {
    if (!identifier) return null
    const cleanId = identifier.trim()
    const supabase = getSupabase()

    if (supabase) {
      try {
        const query = supabase.from('catalogue_products').select('*')
        if (isProductUuid(cleanId)) {
          query.eq('id', cleanId)
        } else {
          query.eq('slug', cleanId)
        }
        const { data, error } = await query.maybeSingle()
        if (!error && data) {
          return asCatalogue(data as Record<string, unknown>)
        }
      } catch (err) {
        console.warn('Supabase product fetch fallback:', err)
      }
      return null
    }

    // Fallback search by slug or ID
    const found = FALLBACK_CATALOGUE.find(
      (p) => p.slug.toLowerCase() === cleanId.toLowerCase() || p.id.toLowerCase() === cleanId.toLowerCase()
    )
    return found || null
  },

  fetchProduct: async (identifier: string) => {
    return get().fetchProductBySlug(identifier)
  },

  fetchRelated: async (product: CatalogueProduct) => {
    const supabase = getSupabase()
    if (supabase) {
      try {
        const { data } = await supabase
          .from('catalogue_products')
          .select('*')
          .eq('category_slug', product.category_slug)
          .neq('id', product.id)
          .limit(4)
        if (data && data.length > 0) {
          return (data as Record<string, unknown>[]).map((row) => asCatalogue(row))
        }
      } catch (err) {
        console.warn('Supabase related products fallback:', err)
      }
      return []
    }
    return FALLBACK_CATALOGUE.filter(
      (p) => (p.category_slug === product.category_slug || p.brand_slug === product.brand_slug) && p.id !== product.id
    ).slice(0, 4)
  },

  searchProducts: async (query: string) => {
    const supabase = getSupabase()
    const pattern = searchPattern(query)
    if (!query || query.trim().length < 2) return []

    if (supabase && pattern) {
      try {
        const { data, error } = await supabase
          .from('catalogue_products')
          .select('*')
          .ilike('search_text', pattern)
          .limit(8)
        if (!error && data) {
          return (data as Record<string, unknown>[]).map((row) => asCatalogue(row))
        }
      } catch (err) {
        console.warn('Supabase search unavailable:', err)
      }
      return []
    }

    const q = query.toLowerCase().trim()
    return FALLBACK_CATALOGUE.filter(
      (p) => p.search_text.includes(q) || p.name.toLowerCase().includes(q) || p.brand_name?.toLowerCase().includes(q)
    ).slice(0, 8)
  },

  fetchSection: async (filters: ShopQuery, limit = 8) => {
    const supabase = getSupabase()
    if (supabase) {
      try {
        const { data, error } = await applyFilters(supabase.from('catalogue_products').select('*'), filters).limit(limit)
        if (!error && data) {
          return (data as Record<string, unknown>[]).map((row) => asCatalogue(row))
        }
      } catch (err) {
        console.warn('Supabase section fetch unavailable:', err)
      }
      return []
    }
    return filterFallback(FALLBACK_CATALOGUE, filters).slice(0, limit)
  },
}))
