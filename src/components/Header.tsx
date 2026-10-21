import { Link } from 'react-router-dom';
import { useCartStore } from '@/store/cartStore';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const { itemCount } = useCartStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

          {/* Desktop Navigation */}
          <div className="hidden ml-auto md:flex items-center gap-1">
            <Link to="/" className="relative px-3.5 py-2.5 text-[13px] font-bold transition hover:text-teal text-ink/80">
              Home
            </Link>
            <Link to="/shop" className="relative px-3.5 py-2.5 text-[13px] font-bold transition hover:text-teal text-ink/80">
              Shop
            </Link>
            <Link to="/shop" className="relative px-3.5 py-2.5 text-[13px] font-bold transition hover:text-teal text-ink/80">
              Laptops
            </Link>
            <Link to="/shop" className="relative px-3.5 py-2.5 text-[13px] font-bold transition hover:text-teal text-ink/80">
              Phones
            </Link>
            <Link to="/shop" className="relative px-3.5 py-2.5 text-[13px] font-bold transition hover:text-teal text-ink/80">
              Gaming
            </Link>
            <Link to="/shop" className="ml-auto flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-extrabold transition hover:text-amberdeep text-amberdeep/90">
              Deals
            </Link>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
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

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-line bg-card">
            <div className="wrap py-4 flex flex-col gap-2">
              <Link to="/" className="rounded-xl px-4 py-3 text-[15px] font-bold transition hover:bg-mist" onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
              <Link to="/shop" className="rounded-xl px-4 py-3 text-[15px] font-bold transition hover:bg-mist" onClick={() => setMobileMenuOpen(false)}>
                Shop
              </Link>
              <Link to="/shop" className="rounded-xl px-4 py-3 text-[15px] font-bold transition hover:bg-mist" onClick={() => setMobileMenuOpen(false)}>
                Laptops
              </Link>
              <Link to="/shop" className="rounded-xl px-4 py-3 text-[15px] font-bold transition hover:bg-mist" onClick={() => setMobileMenuOpen(false)}>
                Phones
              </Link>
              <Link to="/shop" className="rounded-xl px-4 py-3 text-[15px] font-bold transition hover:bg-mist" onClick={() => setMobileMenuOpen(false)}>
                Gaming
              </Link>
              <Link to="/shop" className="rounded-xl px-4 py-3 text-[15px] font-bold transition hover:bg-mist text-amberdeep" onClick={() => setMobileMenuOpen(false)}>
                Deals
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
