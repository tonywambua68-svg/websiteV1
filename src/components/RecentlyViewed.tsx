import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProductStore } from '@/store/productStore'
import type { CatalogueProduct } from '@/lib/domain'
import { formatKES } from '@/lib/commerce'
import { Clock } from 'lucide-react'

const RECENT_KEY = 'oremitech_recently_viewed'
const PLACEHOLDER = '/images/products/laptop-placeholder.svg'

export function recordRecentlyViewed(productId: string) {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    let list: string[] = raw ? JSON.parse(raw) : []
    list = [productId, ...list.filter((id) => id !== productId)].slice(0, 10)
    localStorage.setItem(RECENT_KEY, JSON.stringify(list))
  } catch {}
}

export default function RecentlyViewed({ currentProductId }: { currentProductId?: string }) {
  const allProducts = useProductStore((s) => s.allProducts)
  const [recentItems, setRecentItems] = useState<CatalogueProduct[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY)
      if (!raw) return
      const ids: string[] = JSON.parse(raw)
      const filtered = ids
        .filter((id) => id !== currentProductId)
        .map((id) => allProducts.find((p) => p.id === id || p.slug === id))
        .filter((p): p is CatalogueProduct => Boolean(p))
        .slice(0, 6)
      setRecentItems(filtered)
    } catch {}
  }, [allProducts, currentProductId])

  if (recentItems.length === 0) return null

  return (
    <section className="wrap mt-12 border-t border-line pt-8">
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h2 className="font-display text-base sm:text-lg font-bold text-ink">
            Recently Viewed
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {recentItems.map((p) => (
          <Link
            key={p.id}
            to={`/product/${p.slug}`}
            className="group flex flex-col rounded-lg border border-line bg-white p-2.5 shadow-xs transition hover:border-primary hover:shadow-sm"
          >
            <div className="aspect-square w-full overflow-hidden rounded bg-white p-1">
              <img
                src={p.image_url || PLACEHOLDER}
                alt={p.name}
                className="h-full w-full object-contain transition-transform group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = PLACEHOLDER
                }}
              />
            </div>
            <p className="mt-2 line-clamp-1 text-xs font-semibold text-ink group-hover:text-primary">
              {p.name}
            </p>
            <p className="mt-0.5 text-xs font-extrabold text-primary">
              {formatKES(p.selling_price)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
