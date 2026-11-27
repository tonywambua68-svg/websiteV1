import { FormEvent, useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronDown, Laptop, X } from 'lucide-react'
import { useProductStore } from '@/store/productStore'
import type { CatalogueProduct } from '@/lib/domain'
import { formatKES } from '@/lib/commerce'

const PLACEHOLDER = '/images/products/laptop-placeholder.svg'

interface SearchBoxProps {
  onNavigate?: () => void
  placeholder?: string
  autoFocus?: boolean
}

export default function SearchBox({ onNavigate, placeholder = 'Search laptops, HP, Dell, Core i7, 16GB RAM, SSDs...', autoFocus = false }: SearchBoxProps) {
  const navigate = useNavigate()
  const searchProducts = useProductStore((state) => state.searchProducts)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CatalogueProduct[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [category, setCategory] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }
    const timer = window.setTimeout(() => {
      searchProducts(query).then((res) => {
        setResults(res.slice(0, 8))
        setIsOpen(true)
      })
    }, 200)
    return () => window.clearTimeout(timer)
  }, [query, searchProducts])

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const term = query.trim()
    if (!term && !category) return
    onNavigate?.()
    setIsOpen(false)
    const params = new URLSearchParams()
    if (term) params.set('q', term)
    if (category) params.set('category', category)
    navigate(`/shop?${params.toString()}`)
  }

  const handleSelectProduct = (slug: string) => {
    onNavigate?.()
    setIsOpen(false)
    navigate(`/product/${slug}`)
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={submit} className="flex h-11 w-full overflow-hidden rounded-md border border-line bg-white shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        {/* Category prefix selector (Amazon style) */}
        <div className="hidden border-r border-line bg-slate-50 px-3 text-xs font-semibold text-slate-700 sm:flex sm:items-center">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="cursor-pointer bg-transparent text-xs font-semibold text-slate-700 outline-none pr-1"
            aria-label="Category selector"
          >
            <option value="">All Categories</option>
            <option value="laptops">Laptops</option>
            <option value="desktops">Desktops</option>
            <option value="monitors">Monitors</option>
            <option value="storage-devices">Storage & SSDs</option>
            <option value="computer-accessories">Accessories</option>
          </select>
        </div>

        {/* Input */}
        <div className="relative flex flex-1 items-center">
          <input
            type="text"
            value={query}
            autoFocus={autoFocus}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => {
              if (results.length > 0) setIsOpen(true)
            }}
            className="h-full w-full bg-transparent px-3 text-sm text-ink placeholder:text-slate-400 outline-none"
            placeholder={placeholder}
            aria-label="Search products"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setResults([])
                setIsOpen(false)
              }}
              className="mr-2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search Submit Button (Electric Blue) */}
        <button
          type="submit"
          className="flex h-full w-12 items-center justify-center bg-primary text-white transition-colors hover:bg-primary-hover focus:outline-none"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>
      </form>

      {/* Instant Suggestions Dropdown (Amazon/Jumia marketplace style) */}
      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-y-auto rounded-lg border border-line bg-white py-2 shadow-2xl">
          <div className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted border-b border-line">
            Product Suggestions
          </div>
          <ul>
            {results.map((product) => (
              <li key={product.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-slate-50"
                  onClick={() => handleSelectProduct(product.slug)}
                >
                  <img
                    src={product.image_url || PLACEHOLDER}
                    alt={product.name}
                    className="h-10 w-10 shrink-0 rounded object-contain bg-slate-50 p-1 border border-slate-100"
                    onError={(e) => {
                      e.currentTarget.src = PLACEHOLDER
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-ink">
                      {product.name}
                    </span>
                    <span className="block text-[11px] text-muted">
                      {product.brand_name || 'Brand'} · {product.processor_model || product.category_name}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-primary">
                    {formatKES(product.selling_price)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-line px-3 pt-2 text-center">
            <button
              type="button"
              onClick={submit}
              className="text-xs font-bold text-primary hover:underline"
            >
              View all results for &ldquo;{query}&rdquo; →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
