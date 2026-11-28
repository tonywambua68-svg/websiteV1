import { Link, useNavigate } from 'react-router-dom'
import {
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  ShoppingCart,
  User,
  X,
  MapPin,
  ChevronDown,
  Phone,
  Flame,
  Truck,
  ShieldCheck,
  Search,
  HelpCircle,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Logo from '@/components/Logo'
import SearchBox from '@/components/SearchBox'
import MegaMenu from '@/components/MegaMenu'
import CategoryDrawer from '@/components/CategoryDrawer'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useSettingsStore } from '@/store/settingsStore'
import { homeForRole } from '@/lib/permissions'
import { formatKES } from '@/lib/commerce'

export default function Header() {
  const items = useCartStore((state) => state.items)
  const count = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
  const { user, isAuthenticated, logout } = useAuthStore()
  const saved = useWishlistStore((state) => state.ids.length)
  const supportPhone = useSettingsStore((state) => state.settings.whatsapp_e164) || '+254 700 000 000'
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const navigate = useNavigate()

  // Support opening category drawer from MobileBottomNav
  useEffect(() => {
    const handler = () => setDrawerOpen(true)
    window.addEventListener('open-category-drawer', handler)
    return () => window.removeEventListener('open-category-drawer', handler)
  }, [])

  return (
    <header className="sticky top-0 z-40 w-full shadow-md">
      {/* 1. TOP INFORMATION BAR (Marketplace Announcements & Trust) */}
      <div className="bg-[#0b1117] text-white/90 text-[11px] font-medium border-b border-white/10">
        <div className="wrap flex h-8 items-center justify-between gap-4">
          <div className="flex items-center gap-4 truncate">
            <span className="flex items-center gap-1.5 text-cyan">
              <Truck className="h-3.5 w-3.5 text-cyan" />
              <span className="text-white/90 font-semibold">Secure Shopping Across Kenya</span>
            </span>
            <span className="hidden sm:inline-block text-white/40">|</span>
            <span className="hidden sm:flex items-center gap-1.5 text-white/80">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              <span>Verified Product Specifications</span>
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link to="/order-tracking" className="hover:text-cyan transition-colors">
              Track Order
            </Link>
            <span className="text-white/30">|</span>
            <a
              href={`https://wa.me/${supportPhone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-cyan transition-colors"
            >
              <Phone className="h-3 w-3 text-success" />
              <span>WhatsApp Support</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. MAIN MARKETPLACE NAVIGATION BAR (Amazon/Jumia Style) */}
      <div className="bg-ink text-white py-2.5">
        <div className="wrap flex items-center gap-3 sm:gap-6">
          {/* Mobile Menu Button */}
          <button
            type="button"
            className="flex items-center justify-center p-1.5 text-white lg:hidden rounded hover:bg-white/10"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open mobile menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* OREMITECH Logo */}
          <div className="shrink-0">
            <Logo light />
          </div>

          {/* Location Delivery Indicator (Amazon-style) */}
          <div className="hidden xl:flex items-center gap-1.5 text-left cursor-pointer hover:border hover:border-white/20 p-1.5 rounded">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <div className="leading-tight">
              <span className="block text-[10px] text-slate-400 font-medium">Deliver to</span>
              <span className="block text-xs font-bold text-white">Kenya (Nairobi)</span>
            </div>
          </div>

          {/* Prominent Search Bar */}
          <div className="hidden md:flex flex-1 max-w-3xl min-w-0">
            <SearchBox />
          </div>

          {/* Right Action Icons: Account, Wishlist, Cart */}
          <div className="ml-auto flex items-center gap-1 sm:gap-3 shrink-0">
            {/* Account / Login */}
            {isAuthenticated ? (
              <div className="flex items-center gap-1">
                <Link
                  to={homeForRole(user?.role)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-left hover:bg-white/10 transition-colors"
                >
                  <User className="h-4 w-4 text-cyan" />
                  <div className="hidden sm:block leading-tight">
                    <span className="block text-[10px] text-slate-400">Hello, {user?.full_name?.split(' ')[0] || 'User'}</span>
                    <span className="block text-xs font-bold text-white">My Account</span>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => logout().then(() => navigate('/'))}
                  className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/10"
                  aria-label="Log out"
                  title="Log out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-left hover:bg-white/10 transition-colors"
              >
                <User className="h-4 w-4 text-slate-300" />
                <div className="hidden sm:block leading-tight">
                  <span className="block text-[10px] text-slate-400">Sign In</span>
                  <span className="block text-xs font-bold text-white">Account</span>
                </div>
              </Link>
            )}

            {/* Help dropdown (hover) — links to help, policies & support */}
            <div className="group relative">
              <Link
                to="/help"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-left hover:bg-white/10 transition-colors"
                aria-haspopup="true"
              >
                <HelpCircle className="h-4 w-4 text-cyan" />
                <div className="hidden sm:block leading-tight">
                  <span className="block text-[10px] text-slate-400">Support</span>
                  <span className="block text-xs font-bold text-white">Help</span>
                </div>
              </Link>
              <div className="invisible absolute right-0 z-50 mt-1 w-60 translate-y-1 rounded-lg border border-line bg-white p-2 text-ink opacity-0 shadow-xl transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                <p className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-muted">Help &amp; Support</p>
                <Link to="/help" className="block rounded px-3 py-2 text-xs font-semibold hover:bg-blue-50 hover:text-primary">Help Centre</Link>
                <Link to="/how-to-order" className="block rounded px-3 py-2 text-xs font-semibold hover:bg-blue-50 hover:text-primary">How to Order</Link>
                <Link to="/policies/delivery" className="block rounded px-3 py-2 text-xs font-semibold hover:bg-blue-50 hover:text-primary">Delivery Information</Link>
                <Link to="/policies/returns" className="block rounded px-3 py-2 text-xs font-semibold hover:bg-blue-50 hover:text-primary">Returns &amp; Refunds</Link>
                <Link to="/policies/warranty" className="block rounded px-3 py-2 text-xs font-semibold hover:bg-blue-50 hover:text-primary">Warranty</Link>
                <Link to="/policies/payment" className="block rounded px-3 py-2 text-xs font-semibold hover:bg-blue-50 hover:text-primary">Payment Information</Link>
                <Link to="/faq" className="block rounded px-3 py-2 text-xs font-semibold hover:bg-blue-50 hover:text-primary">FAQs</Link>
                <Link to="/contact" className="block rounded px-3 py-2 text-xs font-semibold hover:bg-blue-50 hover:text-primary">Contact Us</Link>
              </div>
            </div>

            {/* Saved / Wishlist */}
            <Link
              to="/wishlist"
              className="relative hidden sm:flex items-center justify-center p-2 rounded text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Wishlist"
              title="Saved items"
            >
              <Heart className="h-5 w-5" />
              {saved > 0 && (
                <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-error px-1 text-[10px] font-bold text-white">
                  {saved}
                </span>
              )}
            </Link>

            {/* Shopping Cart (Amazon / Jumia Badge Style) */}
            <Link
              to="/cart"
              className="flex items-center gap-2 px-3 py-1.5 rounded bg-primary text-white hover:bg-primary-hover shadow-sm transition-all"
              aria-label={`Shopping cart with ${count} items`}
            >
              <div className="relative">
                <ShoppingCart className="h-5 w-5" />
                {count > 0 && (
                  <span className="absolute -top-2 -right-2 grid h-4 min-w-4 place-items-center rounded-full bg-amber text-[10px] font-extrabold text-ink px-1">
                    {count}
                  </span>
                )}
              </div>
              <div className="hidden md:block leading-tight">
                <span className="block text-[10px] text-blue-100 font-semibold uppercase">Cart</span>
                <span className="block text-xs font-extrabold text-white">
                  {count > 0 ? formatKES(subtotal) : 'KES 0'}
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* Mobile Search Bar below header */}
        <div className="wrap pt-2.5 md:hidden">
          <SearchBox onNavigate={() => setDrawerOpen(false)} />
        </div>
      </div>

      {/* 3. MARKETPLACE SUB-NAVIGATION BAR (Amazon / Jumia Secondary Nav) */}
      <nav className="bg-[#1e293b] text-white/90 text-xs font-semibold border-b border-white/10">
        <div className="wrap flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center gap-1 shrink-0">
            {/* All Categories Toggle */}
            <button
              type="button"
              onClick={() => setMegaOpen(!megaOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-white/10 transition-colors text-white font-bold"
            >
              <Menu className="h-4 w-4 text-cyan" />
              <span>All Categories</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${megaOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Category Quick Links */}
            <Link to="/shop?category=laptops" className="px-2.5 py-1.5 rounded hover:bg-white/10 transition-colors whitespace-nowrap">
              Laptops
            </Link>
            <Link to="/shop?category=desktops" className="px-2.5 py-1.5 rounded hover:bg-white/10 transition-colors whitespace-nowrap">
              Desktops &amp; Workstations
            </Link>
            <Link to="/shop?category=storage-devices" className="px-2.5 py-1.5 rounded hover:bg-white/10 transition-colors whitespace-nowrap">
              Storage &amp; SSDs
            </Link>
            <Link to="/shop?category=monitors" className="px-2.5 py-1.5 rounded hover:bg-white/10 transition-colors whitespace-nowrap">
              Monitors
            </Link>
            <Link to="/shop?category=computer-accessories" className="px-2.5 py-1.5 rounded hover:bg-white/10 transition-colors whitespace-nowrap">
              Accessories
            </Link>
            <Link to="/shop" className="px-2.5 py-1.5 rounded hover:bg-white/10 transition-colors whitespace-nowrap">
              All Products
            </Link>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Deals Link */}
            <Link
              to="/shop?offers=1"
              className="flex items-center gap-1 px-3 py-1 rounded bg-amber/20 text-amber hover:bg-amber hover:text-ink font-bold transition-all whitespace-nowrap"
            >
              <Flame className="h-3.5 w-3.5 text-amber" />
              <span>Today&rsquo;s Tech Deals</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Mega Menu Dropdown */}
      <MegaMenu isOpen={megaOpen} onClose={() => setMegaOpen(false)} />

      {/* Mobile Drawer */}
      <CategoryDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </header>
  )
}
