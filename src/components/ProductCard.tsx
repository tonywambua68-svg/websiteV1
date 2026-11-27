import { Link } from 'react-router-dom'
import type { CatalogueProduct } from '@/lib/domain'
import { availabilityLabel, conditionLabel, formatKES, specSummary } from '@/lib/commerce'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useCompareStore } from '@/store/compareStore'
import { Heart, ShoppingCart, Check, ShieldCheck, Scale } from 'lucide-react'
import { useState } from 'react'

const PLACEHOLDER = '/images/products/laptop-placeholder.svg'

export default function ProductCard({ product }: { product: CatalogueProduct }) {
  const addItem = useCartStore((state) => state.addItem)
  const inWishlist = useWishlistStore((state) => state.ids.includes(product.id))
  const toggleWishlist = useWishlistStore((state) => state.toggle)
  const inCompare = useCompareStore((state) => state.has(product.id))
  const toggleCompare = useCompareStore((state) => state.toggle)
  const [added, setAdded] = useState(false)
  const available = product.owned_available + product.supplier_available > 0
  const specs = specSummary([product.processor_model, product.ram, product.storage_capacity, product.screen_size])

  // Calculate discount percentage if valid
  const discountPercent =
    product.comparison_price && product.comparison_price > product.selling_price
      ? Math.round(((product.comparison_price - product.selling_price) / product.comparison_price) * 100)
      : null

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const ok = await addItem(product, 1)
    if (ok) {
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    }
  }

  return (
    <article className="market-card group flex h-full flex-col bg-white border border-line rounded-lg overflow-hidden hover:border-slate-300 hover:shadow-lg transition-all duration-200">
      {/* Product Image & Badges */}
      <div className="relative aspect-square w-full bg-white p-3 overflow-hidden border-b border-slate-100 flex items-center justify-center">
        <Link to={`/product/${product.slug}`} className="block w-full h-full">
          <img
            src={product.image_url || PLACEHOLDER}
            alt={product.images[0]?.alt || product.name}
            loading="lazy"
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
            onError={(event) => {
              event.currentTarget.src = PLACEHOLDER
            }}
          />
        </Link>

        {/* Discount Badge */}
        {discountPercent && discountPercent > 0 && (
          <span className="absolute left-2 top-2 rounded bg-error px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-sm">
            -{discountPercent}%
          </span>
        )}

        {/* Condition Badge (if brand new or verified refurbished) */}
        {product.laptop_condition && (
          <span className="absolute left-2 bottom-2 rounded bg-slate-900/80 backdrop-blur px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
            {conditionLabel(product.laptop_condition)}
          </span>
        )}

        {/* Action icons: Wishlist & Compare */}
        <div className="absolute right-2 top-2 flex flex-col gap-1.5 z-10">
          <button
            type="button"
            aria-label={inWishlist ? 'Remove from wishlist' : 'Save product'}
            onClick={() => toggleWishlist(product.id)}
            className={`grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white/95 shadow-sm transition-colors ${
              inWishlist ? 'text-error border-error/30' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Heart className={`h-4 w-4 ${inWishlist ? 'fill-current' : ''}`} />
          </button>

          <button
            type="button"
            aria-label={inCompare ? 'Remove from comparison' : 'Compare product'}
            onClick={() => toggleCompare(product.id)}
            title={inCompare ? 'In Comparison' : 'Compare'}
            className={`grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white/95 shadow-sm transition-colors ${
              inCompare ? 'text-primary border-primary/40 bg-blue-50' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Scale className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Product Information */}
      <div className="flex flex-1 flex-col p-3 sm:p-4 gap-1.5">
        {/* Brand */}
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
          {product.brand_name || 'Generic'}
        </p>

        {/* Title */}
        <h3 className="line-clamp-2 text-xs sm:text-sm font-semibold text-ink leading-snug min-h-[2.5rem]">
          <Link to={`/product/${product.slug}`} className="hover:text-primary transition-colors">
            {product.name}
          </Link>
        </h3>

        {/* Hardware Specifications Snippet */}
        <p className="line-clamp-1 text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">
          {specs || product.category_name || 'Genuine Verified Specs'}
        </p>

        {/* Pricing */}
        <div className="mt-1 flex items-baseline gap-2 flex-wrap">
          <span className="text-base sm:text-lg font-extrabold text-ink">
            {formatKES(product.selling_price)}
          </span>
          {product.comparison_price && product.comparison_price > product.selling_price && (
            <span className="text-xs font-semibold text-slate-400 line-through">
              {formatKES(product.comparison_price)}
            </span>
          )}
        </div>

        {/* Functional In-Stock Indicator */}
        <div className="flex items-center gap-1 text-[11px] font-bold">
          {product.availability === 'unavailable' ? (
            <span className="text-error">Out of Stock</span>
          ) : (
            <span className="flex items-center gap-1 text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
              {availabilityLabel(product.availability)}
            </span>
          )}
        </div>

        {/* Action Buttons: Details and Add to Cart */}
        <div className="mt-auto grid grid-cols-2 gap-2 pt-2.5">
          <Link
            to={`/product/${product.slug}`}
            className="flex h-9 items-center justify-center rounded-md border border-line bg-white text-xs font-bold text-slate-700 hover:border-primary hover:text-primary hover:bg-blue-50/40 transition-colors"
          >
            Details
          </Link>

          <button
            type="button"
            disabled={!available}
            onClick={handleAddToCart}
            className={`flex h-9 items-center justify-center gap-1 rounded-md text-xs font-bold text-white transition-all shadow-sm ${
              added
                ? 'bg-success text-white'
                : 'bg-primary hover:bg-primary-hover shadow-primary/25'
            }`}
          >
            {added ? (
              <>
                <Check className="h-3.5 w-3.5" /> Added
              </>
            ) : (
              <>
                <ShoppingCart className="h-3.5 w-3.5" /> Add
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  )
}
