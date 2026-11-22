import { Link } from 'react-router-dom'
import type { CatalogueProduct } from '@/lib/domain'
import { availabilityLabel, conditionLabel, formatKES, specSummary } from '@/lib/commerce'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { Heart } from 'lucide-react'
import { useState } from 'react'

const PLACEHOLDER = '/images/products/laptop-placeholder.svg'

export default function ProductCard({ product }: { product: CatalogueProduct }) {
  const addItem = useCartStore((state) => state.addItem)
  const inWishlist = useWishlistStore((state) => state.ids.includes(product.id))
  const toggleWishlist = useWishlistStore((state) => state.toggle)
  const [message, setMessage] = useState('')
  const available = product.owned_available + product.supplier_available > 0
  const specs = specSummary([product.processor_model, product.ram, product.storage_capacity, product.screen_size])

  return (
    <article className="market-card flex h-full flex-col">
      <div className="market-card-image">
        <Link to={`/product/${product.slug}`}>
          <img
            src={product.image_url || PLACEHOLDER}
            alt={product.images[0]?.alt || product.name}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.src = PLACEHOLDER
            }}
          />
        </Link>
        <button
          type="button"
          aria-label={inWishlist ? 'Remove from wishlist' : 'Save product'}
          onClick={() => toggleWishlist(product.id)}
          className={`absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full border bg-white/90 ${inWishlist ? 'text-error' : 'text-muted'}`}
        >
          <Heart className={`h-3.5 w-3.5 ${inWishlist ? 'fill-current' : ''}`} />
        </button>
      </div>
      <div className="market-card-info flex flex-1 flex-col">
        <p className="market-card-brand">{product.brand_name || 'Unbranded'}</p>
        <h3 className="market-card-title">
          <Link to={`/product/${product.slug}`}>{product.name}</Link>
        </h3>
        <p className="mt-1 min-h-8 text-[11px] leading-snug text-muted">{specs || product.category_name}</p>
        <div className="market-card-price mt-2">
          <span>{formatKES(product.selling_price)}</span>
          {product.comparison_price && product.comparison_price > product.selling_price && (
            <span className="market-card-oldprice">{formatKES(product.comparison_price)}</span>
          )}
        </div>
        <p className="mt-1 text-[11px] font-semibold text-muted">{conditionLabel(product.laptop_condition)}</p>
        <p className={`mt-1 text-[11px] font-bold ${product.availability === 'unavailable' ? 'text-error' : 'text-teal'}`}>
          {availabilityLabel(product.availability)}
        </p>
        <div className="mt-auto grid gap-2 pt-3 sm:grid-cols-2">
          <Link to={`/product/${product.slug}`} className="btn btn-emerald btn-sm !w-full text-center">
            Details
          </Link>
          <button
            type="button"
            className="btn btn-amber btn-sm !w-full text-center"
            disabled={!available}
            onClick={async () => {
              const ok = await addItem(product, 1)
              setMessage(ok ? 'Added to cart' : 'Could not add')
            }}
          >
            Add to cart
          </button>
        </div>
        {message && <p className="pt-1 text-[11px] font-semibold text-teal">{message}</p>}
      </div>
    </article>
  )
}
