import { Link } from 'react-router-dom';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import MegaMenu from '@/components/MegaMenu';
import { megaMenu } from '@/data/megaMenu';
import { ShoppingCart, Menu, X, ChevronDown, User, LogOut, Search, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const { itemCount } = useCartStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [mobileSearch, setMobileSearch] = useState('');

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40">
      {/* Announcement Bar */}
      <div className="bg-ink text-center text-[11px] font-bold tracking-wide text-white/85 md:text-xs">
        <p className="wrap flex h-8 items-center justify-center gap-2">
          <span>Fast delivery across Kenya · Pay with M-PESA PayBill · Order via WhatsApp</span>
        </p>
      </div>

      {/* Main Navigation */}
      <div className="border-b border-line bg-card/95 backdrop-blur">
        <nav className="wrap flex h-16 items-center gap-3 md:gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5" aria-label="Imara Tech home">
            <svg viewBox="0 0 32 32" className="h-9 w-9 shrink-0" aria-hidden="true">
              <rect width="32" height="32" rx="7" fill="#0a1f1c" />
              <path d="M10 22V10h4v12z" fill="#f5a31a" />
              <path d="M18 10l6 12h-4.5L15 13z" fill="#0b7a63" />
            </svg>
            <span className="leading-none">
              <span className="block font-display text-[1.35rem] font-bold tracking-tight text-ink">
                Imara<span className="text-teal">.</span>
              </span>
              <span className="block text-[9px] font-extrabold uppercase tracking-[0.32em] text-muted">
                Tech · Kenya
              </span>
            </span>
          </Link>

          {/* Desktop search box (WooCommerce style) */}
          <form
            className="relative hidden min-w-0 max-w-md flex-1 lg:block"
            onSubmit={(e) => {
              e.preventDefault();
              const q = (new FormData(e.currentTarget).get('q') as string || '').trim();
              if (q) window.location.href = `/shop?search=${encodeURIComponent(q)}`;
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              name="q"
              placeholder="Search laptops, phones, gaming gear…"
              className="h-10 w-full rounded-lg border border-line bg-mist pl-9 pr-20 text-sm font-medium text-ink outline-none transition placeholder:text-muted/70 focus:border-teal focus:bg-card"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 h-8 -translate-y-1/2 rounded-md bg-teal px-3 text-[12px] font-extrabold text-white transition hover:bg-tealdeep"
            >
              Search
            </button>
          </form>

          {/* Primary page links */}
          <div className="hidden items-center gap-1 lg:ml-auto lg:flex">
            <Link to="/" className="relative px-3 py-2.5 text-[13px] font-bold text-ink/80 transition hover:text-teal">
              Home
            </Link>
            <Link to="/shop" className="relative px-3 py-2.5 text-[13px] font-bold text-ink/80 transition hover:text-teal">
              Shop
            </Link>
            <Link to="/order-tracking" className="relative px-3 py-2.5 text-[13px] font-bold text-ink/80 transition hover:text-teal">
              Track Order
            </Link>
            <Link to="/admin" className="flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-extrabold text-amberdeep/90 transition hover:text-amberdeep">
              <LayoutDashboard className="h-4 w-4" />
              Admin
            </Link>
          </div>

          {/* Right side actions */}
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            {/* Account / login */}
            {isAuthenticated ? (
              <div className="hidden items-center gap-1.5 sm:flex">
                <span className="hidden max-w-[120px] truncate text-[12px] font-bold text-ink/80 xl:inline">
                  Hi, {user?.name?.split(' ')[0] || 'there'}
                </span>
                <button
                  onClick={handleLogout}
                  className="btn btn-outline btn-sm !h-9 !px-2.5"
                  title="Log out"
                  aria-label="Log out"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden xl:inline">Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-[13px] font-bold text-ink/80 transition hover:border-teal hover:text-teal sm:flex"
              >
                <User className="h-4 w-4" />
                Login
              </Link>
            )}

            {/* Cart */}
            <Link to="/cart" className="relative flex h-10 items-center gap-2 rounded-lg bg-amber px-3 font-display text-sm font-bold text-ink transition hover:bg-[#ffb538]">
              <ShoppingCart className="h-5 w-5" />
              <span className="hidden sm:inline">Cart</span>
              {itemCount > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[10px] font-extrabold text-amber">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Mobile menu button */}
            <button
              className="btn btn-sm btn-outline !px-2.5 md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </div>

      {/* WooCommerce-style category bar with mega menu (desktop) */}
      <MegaMenu />

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto border-t border-line bg-card md:hidden">
          <div className="wrap py-4">
            {/* Mobile search */}
            <form
              className="relative mb-4"
              onSubmit={(e) => {
                e.preventDefault();
                const q = mobileSearch.trim();
                if (q) {
                  window.location.href = `/shop?search=${encodeURIComponent(q)}`;
                }
              }}
            >
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="search"
                value={mobileSearch}
                onChange={(e) => setMobileSearch(e.target.value)}
                placeholder="Search products…"
                className="h-11 w-full rounded-lg border border-line bg-mist pl-9 pr-3 text-sm font-medium outline-none focus:border-teal"
              />
            </form>

            {/* Quick page links */}
            <div className="mb-3 grid grid-cols-2 gap-2">
              {[
                { label: 'Home', to: '/' },
                { label: 'Shop All', to: '/shop' },
                { label: 'Track Order', to: '/order-tracking' },
                { label: 'Admin', to: '/admin' },
              ].map((l) => (
                <Link
                  key={l.label}
                  to={l.to}
                  className="rounded-lg border border-line bg-mist px-3 py-2.5 text-[13px] font-bold text-ink"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
            </div>

            {/* Accordion mega categories */}
            <div className="divide-y divide-line rounded-xl border border-line">
              {megaMenu.map((item) => {
                const Icon = item.icon;
                const isOpen = openSection === item.label;
                return (
                  <div key={item.label}>
                    <div className="flex items-stretch">
                      <Link
                        to={item.to}
                        className="flex flex-1 items-center gap-2.5 px-4 py-3.5 text-[14px] font-bold text-ink"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className="h-4 w-4 text-teal" />
                        {item.label}
                      </Link>
                      <button
                        className="flex w-12 items-center justify-center text-muted"
                        onClick={() => setOpenSection(isOpen ? null : item.label)}
                        aria-label={`Toggle ${item.label} submenu`}
                        aria-expanded={isOpen}
                      >
                        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                    {isOpen && (
                      <div className="bg-mist px-4 pb-4 pt-1">
                        {item.columns.map((col) => (
                          <div key={col.title} className="mt-2">
                            <p className="py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-amberdeep">
                              {col.title}
                            </p>
                            <ul className="space-y-0.5">
                              {col.links.map((link) => (
                                <li key={link.label}>
                                  <Link
                                    to={link.to}
                                    className="block rounded-md px-2 py-1.5 text-[13px] font-medium text-muted hover:bg-card hover:text-teal"
                                    onClick={() => setMobileMenuOpen(false)}
                                  >
                                    {link.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Account actions */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {isAuthenticated ? (
                <>
                  <span className="col-span-2 rounded-lg bg-mist px-3 py-2.5 text-[13px] font-bold text-ink">
                    Signed in as {user?.email}
                  </span>
                  <button onClick={handleLogout} className="btn btn-outline btn-sm col-span-2">
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="btn btn-teal btn-sm col-span-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-4 w-4" /> Login / Register
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
