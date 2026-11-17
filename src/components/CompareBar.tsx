import { Link, useLocation } from 'react-router-dom'
import { useCompareStore } from '@/store/compareStore'
import { useProductStore } from '@/store/productStore'
import type { CatalogueProduct } from '@/lib/domain'
import { X, Scale } from 'lucide-react'

const PLACEHOLDER = '/images/products/laptop-placeholder.svg'

/** Floating bar shown whenever products are selected for comparison. */
export default function CompareBar() {
  const ids = useCompareStore((s) => s.ids)
  const remove = useCompareStore((s) => s.remove)
  const clear = useCompareStore((s) => s.clear)
  const allProducts = useProductStore((s) => s.allProducts)
  const location = useLocation()

  if (ids.length === 0 || location.pathname.startsWith('/compare')) return null
  const items = ids
    .map((id) => allProducts.find((p: CatalogueProduct) => p.id === id || p.slug === id))
    .filter((p): p is CatalogueProduct => Boolean(p))

  if (items.length === 0) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3">
      <div className="mx-auto flex max-w-4xl items-center gap-3 rounded-xl border border-line bg-card p-3 shadow-lg backdrop-blur">
        <span className="hidden shrink-0 items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-ink sm:flex">
          <Scale className="h-4 w-4 text-teal" /> Compare
        </span>
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto no-scrollbar">
          {items.map((p) => (
            <div
              key={p.id}
              className="relative flex shrink-0 items-center gap-2 rounded-lg border border-line bg-mist py-1 pl-1.5 pr-6"
            >
              <img
                src={p.image_url || PLACEHOLDER}
                alt=""
                className="h-8 w-8 rounded object-contain"
                onError={(e) => {
                  e.currentTarget.src = PLACEHOLDER
                }}
              />
              <span className="max-w-[120px] truncate text-xs font-bold text-ink">{p.name}</span>
              <button
                type="button"
                onClick={() => remove(p.id)}
                aria-label={`Remove ${p.name} from comparison`}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-muted hover:text-error"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={clear} className="btn btn-outline !h-8 px-2.5 text-xs shrink-0">
          Clear
        </button>
        <Link
          to={`/compare?ids=${ids.join(',')}`}
          className={`btn btn-emerald !h-8 px-3 text-xs shrink-0 ${ids.length < 2 ? 'pointer-events-none opacity-50' : ''}`}
        >
          Compare ({ids.length})
        </Link>
      </div>
    </div>
  )
}

