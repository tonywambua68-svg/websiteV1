import { Link } from 'react-router-dom'
import { useWishlistStore } from '@/store/wishlistStore'
import { useProductStore } from '@/store/productStore'
import ProductCard from '@/components/ProductCard'
import { Heart, Trash2, ArrowRight } from 'lucide-react'

export default function Wishlist() {
  const { ids, clear } = useWishlistStore()
  const { allProducts } = useProductStore()

  const savedProducts = allProducts.filter((p) => ids.includes(p.id) || ids.includes(p.slug))

  return (
    <div className="wrap py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink md:text-3xl">Saved Products</h1>
          <p className="mt-1 text-xs text-muted">
            {savedProducts.length} {savedProducts.length === 1 ? 'laptop' : 'laptops'} saved to your wishlist
          </p>
        </div>

        {savedProducts.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-error"
          >
            <Trash2 className="h-4 w-4" /> Clear wishlist
          </button>
        )}
      </div>

      {savedProducts.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-mist text-muted">
            <Heart className="h-8 w-8" />
          </div>
          <h2 className="mt-4 font-display text-lg font-bold text-ink">Your wishlist is empty</h2>
          <p className="mt-1 text-xs text-muted">
            Click the heart icon on any product card to save it for quick access later.
          </p>
          <Link to="/shop" className="btn btn-emerald mt-6 text-xs font-bold">
            Explore Laptops & Accessories
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {savedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
