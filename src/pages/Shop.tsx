import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useProductStore } from '@/store/productStore'
import ProductCard from '@/components/ProductCard'
import type { ShopQuery } from '@/lib/domain'
import { Search, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react'

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'newest', label: 'Newest Arrivals' },
]

const RAM_OPTIONS = ['8GB', '16GB', '32GB', '64GB']
const STORAGE_OPTIONS = ['256GB', '512GB', '1TB', '2TB']
const PROCESSOR_OPTIONS = ['Intel Core i5', 'Intel Core i7', 'Intel Core i9', 'Ryzen 5', 'Ryzen 7', 'Apple M']
const CONDITION_OPTIONS = [
  { value: 'new', label: 'Brand New' },
  { value: 'refurbished', label: 'Refurbished' },
  { value: 'open_box', label: 'Open Box' },
  { value: 'used_excellent', label: 'Used - Excellent' },
]

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { products, fetchProducts, loading, total, allProducts } = useProductStore()

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || searchParams.get('search') || '')

  // Extract current query filters from URL
  const currentCategory = searchParams.get('category') || ''
  const currentBrand = searchParams.get('brand') || ''
  const currentMin = searchParams.get('min') || searchParams.get('minPrice') || ''
  const currentMax = searchParams.get('max') || searchParams.get('maxPrice') || ''
  const currentProcessor = searchParams.get('processor') || ''
  const currentRam = searchParams.get('ram') || ''
  const currentStorage = searchParams.get('storage') || ''
  const currentCondition = searchParams.get('condition') || ''
  const currentAvailability = searchParams.get('availability') || ''
  const currentSort = searchParams.get('sort') || 'featured'
  const currentOffers = searchParams.get('offers') || ''
  const currentQ = searchParams.get('q') || searchParams.get('search') || ''

  // Sync search input when URL changes
  useEffect(() => {
    setSearchInput(currentQ)
  }, [currentQ])

  // Trigger store fetch whenever search parameters change
  useEffect(() => {
    const query: ShopQuery = {
      q: currentQ || undefined,
      category: currentCategory || undefined,
      brand: currentBrand || undefined,
      min: currentMin || undefined,
      max: currentMax || undefined,
      processor: currentProcessor || undefined,
      ram: currentRam || undefined,
      storage: currentStorage || undefined,
      condition: currentCondition || undefined,
      availability: currentAvailability || undefined,
      offers: currentOffers || undefined,
      sort: currentSort !== 'featured' ? currentSort : undefined,
    }
    fetchProducts(query)
  }, [
    currentQ,
    currentCategory,
    currentBrand,
    currentMin,
    currentMax,
    currentProcessor,
    currentRam,
    currentStorage,
    currentCondition,
    currentAvailability,
    currentOffers,
    currentSort,
    fetchProducts,
  ])

  // Helper to update URL params
  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(updates)) {
      if (!value || value.trim() === '') {
        next.delete(key)
        if (key === 'q') next.delete('search')
        if (key === 'min') next.delete('minPrice')
        if (key === 'max') next.delete('maxPrice')
      } else {
        next.set(key, value.trim())
      }
    }
    setSearchParams(next, { replace: false })
  }

  // Derive dynamic available brands from the catalogue
  const availableBrands = useMemo(() => {
    const brands = new Set<string>()
    allProducts.forEach((p) => {
      if (p.brand_name) brands.add(p.brand_name)
    })
    return Array.from(brands).sort()
  }, [allProducts])

  // Derive available categories
  const availableCategories = useMemo(() => {
    const cats = new Set<string>()
    allProducts.forEach((p) => {
      if (p.category_name) cats.add(p.category_name)
    })
    return Array.from(cats).sort()
  }, [allProducts])

  const selectedBrands = currentBrand.split(',').filter(Boolean)
  const toggleBrand = (brandName: string) => {
    const bSlug = brandName.toLowerCase()
    const next = selectedBrands.includes(bSlug)
      ? selectedBrands.filter((b) => b !== bSlug)
      : [...selectedBrands, bSlug]
    updateParams({ brand: next.join(',') || null })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateParams({ q: searchInput.trim() || null })
  }

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: false })
    setSearchInput('')
  }

  // Active filter chips list
  const activeChips: Array<{ label: string; onClear: () => void }> = []
  if (currentQ) activeChips.push({ label: `Search: "${currentQ}"`, onClear: () => updateParams({ q: null }) })
  if (currentCategory) activeChips.push({ label: `Category: ${currentCategory}`, onClear: () => updateParams({ category: null }) })
  selectedBrands.forEach((b) =>
    activeChips.push({
      label: `Brand: ${b.toUpperCase()}`,
      onClear: () => toggleBrand(b),
    })
  )
  if (currentProcessor) activeChips.push({ label: `CPU: ${currentProcessor}`, onClear: () => updateParams({ processor: null }) })
  if (currentRam) activeChips.push({ label: `RAM: ${currentRam}`, onClear: () => updateParams({ ram: null }) })
  if (currentStorage) activeChips.push({ label: `Storage: ${currentStorage}`, onClear: () => updateParams({ storage: null }) })
  if (currentCondition) activeChips.push({ label: `Condition: ${currentCondition}`, onClear: () => updateParams({ condition: null }) })
  if (currentAvailability) activeChips.push({ label: `In Stock Only`, onClear: () => updateParams({ availability: null }) })
  if (currentMin || currentMax) {
    activeChips.push({
      label: `Price: KSh ${currentMin || '0'} – ${currentMax || 'Any'}`,
      onClear: () => updateParams({ min: null, max: null }),
    })
  }
  if (currentOffers === '1') activeChips.push({ label: 'On Sale / Offers', onClear: () => updateParams({ offers: null }) })

  return (
    <div className="wrap py-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 border-b border-line pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink md:text-3xl">
            {currentCategory ? `${currentCategory} in Kenya` : 'All Laptops & Computer Hardware'}
          </h1>
          <p className="mt-1 text-xs text-muted">
            {total} {total === 1 ? 'product' : 'products'} available · Prices in Kenyan Shillings (KES)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick search input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search model, specs…"
              className="input !h-9 w-full pr-8 text-xs bg-white"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>

          {/* Sort dropdown */}
          <div className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-semibold shadow-xs">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={currentSort}
              onChange={(e) => updateParams({ sort: e.target.value })}
              className="bg-transparent font-bold text-ink outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Mobile filter toggle */}
          <button
            type="button"
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="btn btn-outline !h-9 gap-1.5 text-xs font-bold lg:hidden"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters {activeChips.length > 0 && `(${activeChips.length})`}
          </button>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeChips.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-muted">Active:</span>
          {activeChips.map((chip, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-blue-50 px-2.5 py-1 text-xs font-bold text-primary"
            >
              {chip.label}
              <button
                type="button"
                onClick={chip.onClear}
                className="hover:text-error"
                aria-label={`Remove filter ${chip.label}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs font-bold text-error hover:underline ml-2"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Main Grid: Sidebar Filters + Products */}
      <div className="mt-6 grid gap-8 lg:grid-cols-[260px_1fr]">
        {/* Desktop Sidebar Filters */}
        <aside
          className={`space-y-6 lg:block ${
            mobileFilterOpen
              ? 'fixed inset-0 z-50 overflow-y-auto bg-white p-6 shadow-2xl'
              : 'hidden'
          }`}
        >
          {mobileFilterOpen && (
            <div className="flex items-center justify-between border-b border-line pb-4 lg:hidden">
              <h2 className="font-display text-lg font-bold text-ink">Filter Products</h2>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-line"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Categories */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted">Category</h3>
            <div className="mt-2.5 space-y-1.5 text-xs">
              <button
                type="button"
                onClick={() => updateParams({ category: null })}
                className={`block w-full text-left font-semibold ${
                  !currentCategory ? 'text-primary font-extrabold' : 'text-ink hover:text-primary'
                }`}
              >
                All Categories
              </button>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => updateParams({ category: cat.toLowerCase().replace(/\s+/g, '-') })}
                  className={`block w-full text-left font-semibold ${
                    currentCategory === cat.toLowerCase().replace(/\s+/g, '-')
                      ? 'text-primary font-extrabold'
                      : 'text-ink hover:text-primary'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Brands */}
          <div className="border-t border-line pt-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted">Brand</h3>
            <div className="mt-2.5 max-h-48 space-y-2 overflow-y-auto pr-1 text-xs">
              {availableBrands.map((brandName) => {
                const checked = selectedBrands.includes(brandName.toLowerCase())
                return (
                  <label key={brandName} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleBrand(brandName)}
                      className="rounded border-line text-primary focus:ring-primary"
                    />
                    <span className={`font-semibold ${checked ? 'text-primary' : 'text-ink'}`}>
                      {brandName}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Price Range */}
          <div className="border-t border-line pt-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted">Price (KSh)</h3>
            <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
              <input
                type="number"
                placeholder="Min KSh"
                value={currentMin}
                onChange={(e) => updateParams({ min: e.target.value || null })}
                className="input !h-8 text-xs bg-white"
              />
              <input
                type="number"
                placeholder="Max KSh"
                value={currentMax}
                onChange={(e) => updateParams({ max: e.target.value || null })}
                className="input !h-8 text-xs bg-white"
              />
            </div>
            <div className="mt-2 space-y-1 text-[11px]">
              <button
                type="button"
                onClick={() => updateParams({ min: null, max: '60000' })}
                className="block text-muted hover:text-primary"
              >
                Under KSh 60,000
              </button>
              <button
                type="button"
                onClick={() => updateParams({ min: '60000', max: '90000' })}
                className="block text-muted hover:text-primary"
              >
                KSh 60,000 – 90,000
              </button>
              <button
                type="button"
                onClick={() => updateParams({ min: '90000', max: '140000' })}
                className="block text-muted hover:text-primary"
              >
                KSh 90,000 – 140,000
              </button>
              <button
                type="button"
                onClick={() => updateParams({ min: '140000', max: null })}
                className="block text-muted hover:text-primary"
              >
                Above KSh 140,000
              </button>
            </div>
          </div>

          {/* Processor Filter */}
          <div className="border-t border-line pt-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted">Processor</h3>
            <div className="mt-2.5 space-y-1.5 text-xs">
              {PROCESSOR_OPTIONS.map((proc) => (
                <button
                  key={proc}
                  type="button"
                  onClick={() => updateParams({ processor: currentProcessor === proc ? null : proc })}
                  className={`block w-full text-left font-semibold ${
                    currentProcessor === proc ? 'text-primary font-extrabold' : 'text-muted hover:text-ink'
                  }`}
                >
                  {proc}
                </button>
              ))}
            </div>
          </div>

          {/* RAM Filter */}
          <div className="border-t border-line pt-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted">RAM Memory</h3>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {RAM_OPTIONS.map((ram) => (
                <button
                  key={ram}
                  type="button"
                  onClick={() => updateParams({ ram: currentRam === ram ? null : ram })}
                  className={`rounded-md border px-2 py-1 text-xs font-bold transition ${
                    currentRam === ram
                      ? 'border-primary bg-primary text-white'
                      : 'border-line bg-white text-muted hover:border-ink'
                  }`}
                >
                  {ram}
                </button>
              ))}
            </div>
          </div>

          {/* Storage Filter */}
          <div className="border-t border-line pt-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted">Storage</h3>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {STORAGE_OPTIONS.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => updateParams({ storage: currentStorage === st ? null : st })}
                  className={`rounded-md border px-2 py-1 text-xs font-bold transition ${
                    currentStorage === st
                      ? 'border-primary bg-primary text-white'
                      : 'border-line bg-white text-muted hover:border-ink'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Condition Filter */}
          <div className="border-t border-line pt-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted">Condition</h3>
            <div className="mt-2.5 space-y-1.5 text-xs">
              {CONDITION_OPTIONS.map((cond) => (
                <label key={cond.value} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="condition"
                    checked={currentCondition === cond.value}
                    onChange={() => updateParams({ condition: cond.value })}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="font-semibold text-ink">{cond.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Stock availability toggle */}
          <div className="border-t border-line pt-4">
            <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-ink">
              <input
                type="checkbox"
                checked={currentAvailability === 'in_stock'}
                onChange={(e) => updateParams({ availability: e.target.checked ? 'in_stock' : null })}
                className="rounded border-line text-primary focus:ring-primary"
              />
              In Stock at Oremitech
            </label>
          </div>

          {mobileFilterOpen && (
            <button
              type="button"
              onClick={() => setMobileFilterOpen(false)}
              className="btn btn-primary w-full text-xs font-bold mt-4"
            >
              Apply Filters
            </button>
          )}
        </aside>

        {/* Product Grid / Empty State */}
        <main>
          {loading ? (
            <div className="py-20 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="mt-3 text-xs font-bold text-muted">Updating catalogue…</p>
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-xl border border-line bg-white p-12 text-center shadow-xs">
              <h2 className="font-display text-xl font-bold text-ink">No products match your criteria</h2>
              <p className="mt-2 text-xs text-muted">
                Try loosening your filters or searching for another laptop model or specification.
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="btn btn-outline mt-5 text-xs font-bold"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
