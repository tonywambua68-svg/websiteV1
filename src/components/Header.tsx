import { Link, useNavigate } from 'react-router-dom'
import { Heart, LayoutDashboard, LogOut, Menu, ShoppingCart, User, X } from 'lucide-react'
import { useState } from 'react'
import Logo from '@/components/Logo'
import SearchBox from '@/components/SearchBox'
import MegaMenu from '@/components/MegaMenu'
import CategoryDrawer from '@/components/CategoryDrawer'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { homeForRole } from '@/lib/permissions'

const FOUR_LINE_MENU = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
  >
    <line x1="3" y1="4" x2="17" y2="4" />
    <line x1="3" y1="7" x2="17" y2="7" />
    <line x1="3" y1="10" x2="17" y2="10" />
    <line x1="3" y1="13" x2="17" y2="13" />
    <line x1="3" y1="16" x2="17" y2="16" />
  </svg>
)

export default function Header() {
  const items = useCartStore((state) => state.items)
  const count = items.reduce((sum, item) => sum + item.quantity, 0)
  const { user, isAuthenticated, logout } = useAuthStore()
  const saved = useWishlistStore((state) => state.ids.length)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-ink text-center text-[11px] font-bold text-white/85">
        <p className="wrap flex h-8 items-center justify-center">Verified laptops in Kenya · Prices in KSh · Payment is confirmed only after a provider reference</p>
      </div>
      <div className="border-b border-line bg-card/95 backdrop-blur">
        <div className="wrap flex h-16 items-center gap-3">
          <Logo />
          <div className="hidden min-w-0 flex-1 md:block">
            <SearchBox />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/wishlist" className="relative hidden h-10 items-center gap-1 rounded-lg border border-line px-3 text-sm font-bold sm:flex" aria-label="Wishlist">
              <Heart className="h-4 w-4" />
              {saved > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-error px-1 text-[10px] text-white">{saved}</span>}
            </Link>
            {isAuthenticated ? (
              <>
                <Link to={homeForRole(user?.role)} className="hidden items-center gap-1 rounded-lg border border-line px-3 py-2 text-sm font-bold lg:flex">
                  <LayoutDashboard className="h-4 w-4" />
                  {user?.full_name?.split(' ')[0] || 'Account'}
                </Link>
                <button type="button" className="btn btn-dark btn-sm !h-10" onClick={() => logout().then(() => navigate('/'))} aria-label="Log out">
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <Link to="/login" className="hidden items-center gap-1 rounded-lg border border-line px-3 py-2 text-sm font-bold lg:flex">
                <User className="h-4 w-4" /> Login
              </Link>
            )}
            <Link to="/cart" className="btn btn-amber relative grid h-10 w-10 place-items-center" aria-label={`Cart, ${count} items`}>
              <ShoppingCart className="h-4 w-4" />
              {count > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-darkgreen px-1 text-[10px] font-extrabold text-white">{count}</span>}
            </Link>
            <button type="button" className="grid h-10 w-10 place-items-center rounded-lg border border-line lg:hidden" onClick={() => setOpen((value) => !value)} aria-label="Open menu">
              {open ? <X className="h-4 w-4" /> : FOUR_LINE_MENU}
            </button>
          </div>
        </div>
        <div className="wrap pb-3 md:hidden">
          <SearchBox onNavigate={() => setOpen(false)} />
        </div>
      </div>
      <MegaMenu />
      <CategoryDrawer isOpen={open} onClose={() => setOpen(false)} />
    </header>
  )
}
