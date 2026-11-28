import { Link } from 'react-router-dom'
import { Plus, Star } from 'lucide-react'

export interface ProductRowItem {
  id?: string
  name: string
  price: number
  old_price: number
  rating: number
  reviews: number
  image: string
  link: string
}

const PLACEHOLDER = '/images/products/laptop-placeholder.svg'

export function discountPercent(price: number, oldPrice: number): number {
  if (!Number.isFinite(price) || !Number.isFinite(oldPrice) || oldPrice <= 0 || price >= oldPrice) return 0
  return Math.round((1 - price / oldPrice) * 100)
}

export function formatKES(value: number): string {
  const hasCents = Math.round(value * 100) % 100 !== 0
  return `KSh ${value.toLocaleString('en-KE', {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  })}`
}

export default function ProductCard({
  product,
  onQuickAdd,
}: {
  product: ProductRowItem
  onQuickAdd?: (product: ProductRowItem) => void
}) {
  const off = discountPercent(product.price, product.old_price)
  const hasRating = product.reviews > 0 && product.rating > 0

  return (
    <article className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-line bg-white shadow-xs transition-shadow hover:shadow-md">
      <div className="relative aspect-square w-full bg-slate-50">
        <Link to={product.link} aria-label={product.name}>
          <img
            src={product.image || PLACEHOLDER}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain p-2"
            onError={(e) => {
              e.currentTarget.src = PLACEHOLDER
            }}
          />
        </Link>
        <button
          type="button"
          aria-label={`Quick add ${product.name}`}
          onClick={() => onQuickAdd?.(product)}
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-ink text-white shadow-md transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-ink">
          <Link to={product.link} className="hover:text-primary transition-colors">
            {product.name}
          </Link>
        </h3>

        {hasRating && (
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber text-amber" />
            <span className="text-xs font-bold text-ink">{product.rating.toFixed(1)}</span>
            <span className="text-xs text-muted">({product.reviews})</span>
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-1">
          <span className="text-base font-extrabold text-ink">{formatKES(product.price)}</span>
          {product.old_price > product.price && (
            <span className="text-xs text-muted line-through">{formatKES(product.old_price)}</span>
          )}
          {off > 0 && (
            <span className="rounded bg-success/10 px-1.5 py-0.5 text-[10px] font-extrabold text-success">
              -{off}%
            </span>
          )}
        </div>
      </div>
    </article>
  )
}