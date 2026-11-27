import { Link, useLocation } from 'react-router-dom'
import { Home, Layers, Heart, ShoppingCart, Scale } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useCompareStore } from '@/store/compareStore'

export default function MobileBottomNav({ onOpenCategories }: { onOpenCategories?: () => void }) {
  const location = useLocation()
  const cartCount = useCartStore((s) => s.items.reduce((sum, item) => sum + item.quantity, 0))
  const wishlistCount = useWishlistStore((s) => s.ids.length)
  const compareCount = useCompareStore((s) => s.ids.length)

  // Hide on checkout to avoid distraction
  if (location.pathname.startsWith('/checkout') || location.pathname.startsWith('/admin')) {
    return null
  }

  const handleOpenCategories = () => {
    if (onOpenCategories) {
      onOpenCategories()
    } else {
      window.dispatchEvent(new CustomEvent('open-category-drawer'))
    }
  }

  const isHome = location.pathname === '/'
  const isWishlist = location.pathname === '/wishlist'
  const isCart = location.pathname === '/cart'
  const isCompare = location.pathname === '/compare'

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur-md lg:hidden shadow-lg" aria-label="Mobile Bottom Navigation">
      <div className="grid h-14 grid-cols-5 items-center">
        {/* Home */}
        <Link
          to="/"
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors ${
            isHome ? 'text-primary' : 'text-slate-500 hover:text-ink'
          }`}
        >
          <Home className="h-5 w-5" />
          <span>Home</span>
        </Link>

        {/* Categories Drawer Trigger */}
        <button
          type="button"
          onClick={handleOpenCategories}
          className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold text-slate-500 hover:text-ink transition-colors"
        >
          <Layers className="h-5 w-5" />
          <span>Categories</span>
        </button>

        {/* Compare */}
        <Link
          to="/compare"
          className={`relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors ${
            isCompare ? 'text-primary' : 'text-slate-500 hover:text-ink'
          }`}
        >
          <Scale className="h-5 w-5" />
          <span>Compare</span>
          {compareCount > 0 && (
            <span className="absolute top-1 right-3 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-primary px-1 text-[9px] font-extrabold text-white">
              {compareCount}
            </span>
          )}
        </Link>

        {/* Wishlist */}
        <Link
          to="/wishlist"
          className={`relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors ${
            isWishlist ? 'text-primary' : 'text-slate-500 hover:text-ink'
          }`}
        >
          <Heart className="h-5 w-5" />
          <span>Saved</span>
          {wishlistCount > 0 && (
            <span className="absolute top-1 right-3 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-error px-1 text-[9px] font-extrabold text-white">
              {wishlistCount}
            </span>
          )}
        </Link>

        {/* Cart */}
        <Link
          to="/cart"
          className={`relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors ${
            isCart ? 'text-primary' : 'text-slate-500 hover:text-ink'
          }`}
        >
          <ShoppingCart className="h-5 w-5" />
          <span>Cart</span>
          {cartCount > 0 && (
            <span className="absolute top-1 right-3 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-amber text-ink px-1 text-[9px] font-black">
              {cartCount}
            </span>
          )}
        </Link>
      </div>
    </nav>
  )
}
