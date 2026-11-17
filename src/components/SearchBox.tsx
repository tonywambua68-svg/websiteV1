import { FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useProductStore } from '@/store/productStore'
import type { CatalogueProduct } from '@/lib/domain'
import { formatKES } from '@/lib/commerce'

export default function SearchBox({ onNavigate }: { compact?: boolean; onNavigate?: () => void }) {
  const navigate = useNavigate()
  const searchProducts = useProductStore((state) => state.searchProducts)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CatalogueProduct[]>([])

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    const timer = window.setTimeout(() => {
      searchProducts(query).then(setResults)
    }, 250)
    return () => window.clearTimeout(timer)
  }, [query, searchProducts])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const term = query.trim()
    if (!term) return
    onNavigate?.()
    navigate(`/shop?q=${encodeURIComponent(term)}`)
    setResults([])
  }

  return (
    <div className="relative min-w-0 flex-1">
      <form onSubmit={submit} className="flex overflow-hidden rounded-lg border border-line bg-card">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
          placeholder="Search brand, model, processor, RAM, storage"
          aria-label="Search products"
        />
        <button type="submit" className="grid w-11 place-items-center bg-teal text-white" aria-label="Search">
          <Search className="h-4 w-4" />
        </button>
      </form>
      {results.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-80 w-full overflow-auto rounded-lg border border-line bg-card shadow-lg">
          {results.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-mint"
                onClick={() => {
                  onNavigate?.()
                  setResults([])
                  navigate(`/product/${product.slug}`)
                }}
              >
                <span>
                  <span className="block font-semibold">{product.name}</span>
                  <span className="text-xs text-muted">{product.brand_name}</span>
                </span>
                <span className="shrink-0 text-xs font-bold">{formatKES(product.selling_price)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
