import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProductStore } from '@/store/productStore'
import ProductCard from '@/components/ProductCard'
import SearchBox from '@/components/SearchBox'
import {
  Truck,
  CreditCard,
  ShieldCheck,
  Headphones,
  BadgeCheck,
  RotateCcw,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Laptop,
  Briefcase,
  Gamepad2,
  Monitor,
  HardDrive,
  Network,
} from 'lucide-react'

const CATEGORY_TILES = [
  { label: 'Laptops', icon: Laptop, to: '/shop?category=laptops' },
  { label: 'Desktops', icon: Briefcase, to: '/shop?category=desktops' },
  { label: 'Monitors', icon: Monitor, to: '/shop?category=monitors' },
  { label: 'Storage & SSDs', icon: HardDrive, to: '/shop?category=storage-devices' },
  { label: 'Accessories', icon: Network, to: '/shop?category=computer-accessories' },
  { label: 'Keyboards & Mice', icon: Gamepad2, to: '/shop?category=input-devices' },
  { label: 'Networking', icon: Network, to: '/shop?category=networking' },
  { label: 'Other Electronics', icon: HardDrive, to: '/shop?category=other-electronics' },
]

const TOP_BRANDS = [
  { name: 'HP', slug: 'hp', tag: 'EliteBook & ProBook' },
  { name: 'Dell', slug: 'dell', tag: 'Latitude & XPS' },
  { name: 'Lenovo', slug: 'lenovo', tag: 'ThinkPad & IdeaPad' },
  { name: 'Apple', slug: 'apple', tag: 'MacBook Air & Pro' },
  { name: 'ASUS', slug: 'asus', tag: 'ZenBook & ROG' },
  { name: 'Acer', slug: 'acer', tag: 'Swift & Aspire' },
]

export default function Home() {
  const { products, fetchProducts, loading } = useProductStore()

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const availableProducts = products.filter((p) => p.publication_status === 'published' || p.availability !== 'unavailable')
  const deals = products.filter((p) => p.comparison_price && p.comparison_price > p.selling_price).slice(0, 8)
  const featured = products.filter((p) => p.featured).slice(0, 8)
  const newArrivals = [...products].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).slice(0, 8)

  return (
    <div className="bg-mist pb-12">
      {/* Kenya Trust & Guarantee Bar */}
      <div className="bg-footer-bg">
        <div className="wrap flex items-center justify-between gap-4 overflow-x-auto py-2.5 text-[11px] font-bold text-white no-scrollbar">
          <span className="inline-flex shrink-0 items-center gap-1.5">
            <Truck className="h-4 w-4 text-amber" /> Delivery Across All 47 Kenya Counties
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5">
            <CreditCard className="h-4 w-4 text-amber" /> M-PESA & Bank Verification
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5">
            <BadgeCheck className="h-4 w-4 text-amber" /> 100% Verified Hardware Specs
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5">
            <RotateCcw className="h-4 w-4 text-amber" /> Physical Inspection Warranty
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5">
            <Headphones className="h-4 w-4 text-amber" /> Nairobi Phone & WhatsApp Support
          </span>
        </div>
      </div>

      {/* Above-the-fold: Search + Categories + Featured */}
      <section className="wrap pt-4 md:pt-6">
        {/* Compact Hero */}
        <div className="rounded-xl bg-footer-bg p-3 md:p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex-1 lg:w-1/2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber/20 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-amber">
                <Sparkles className="h-3.5 w-3.5 text-amber" /> Verified Hardware in Kenya
              </span>
              <h1 className="mt-2 font-display text-xl font-bold leading-tight text-white md:text-2xl lg:text-3xl">
                Verified Laptops & Computer Hardware
              </h1>
              <p className="mt-2 text-xs text-[#cbd5d1] md:text-sm">
                Shop HP, Dell, Lenovo, Apple workstations, monitors, storage, and accessories with authentic specifications and transparent KSh pricing.
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <Link to="/shop" className="btn btn-amber !h-11 text-sm font-bold flex-1 sm:flex-none">
                  Explore Products <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/shop?offers=1" className="btn btn-amber !h-11 text-sm font-bold flex-1 sm:flex-none">
                  View Deals
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Category Quick Tiles */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8 xl:grid-cols-8">
          {CATEGORY_TILES.map((cat) => {
            const Icon = cat.icon
            return (
              <Link
                key={cat.label}
                to={cat.to}
                className="group flex flex-col items-center rounded-xl border border-line bg-card p-3 text-center transition hover:-translate-y-0.5 hover:border-emerald hover:shadow-sm"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-mint text-emerald transition group-hover:bg-emerald group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="mt-2 line-clamp-1 text-xs font-bold text-ink group-hover:text-emerald">
                  {cat.label}
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Featured Products Section (immediately visible, no heavy hero) */}
      {featured.length > 0 && (
        <section className="wrap mt-10">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">Featured Products</h2>
              <p className="mt-0.5 text-xs text-muted">Hand-picked verified hardware ready to ship.</p>
            </div>
            <Link to="/shop" className="text-xs font-bold text-emerald hover:underline">
              View all ({featured.length}) →
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Genuine Deals Section */}
      {deals.length > 0 && (
        <section className="wrap mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-xl bg-ink p-4 text-white">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 rounded bg-amber px-2 py-0.5 text-xs font-extrabold uppercase text-ink">
                <ZapIcon className="h-3.5 w-3.5" /> Genuine Price Reductions
              </span>
              <h2 className="font-display text-base font-bold">Special Offers</h2>
            </div>
            <Link to="/shop?offers=1" className="text-xs font-bold text-amber/90 hover:text-white underline">
              View all deals →
            </Link>
          </div>
          <div className="rounded-b-xl border border-t-0 border-line bg-card p-4 shadow-xs">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {deals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals Section */}
      {newArrivals.length > 0 && (
        <section className="wrap mt-10">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">New Arrivals</h2>
              <p className="mt-0.5 text-xs text-muted">Recently verified and added to the catalogue.</p>
            </div>
            <Link to="/shop?sort=newest" className="text-xs font-bold text-emerald hover:underline">
              View all →
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Brand Fast-Filter Strip */}
      <section className="wrap mt-10">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <h2 className="font-display text-base font-bold text-ink">Shop by Brand</h2>
          <Link to="/shop" className="text-xs font-bold text-emerald hover:underline">
            All brands →
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {TOP_BRANDS.map((b) => (
            <Link
              key={b.slug}
              to={`/shop?brand=${b.slug}`}
              className="flex items-center justify-between rounded-xl border border-line bg-card p-3 shadow-xs hover:border-emerald"
            >
              <div>
                <p className="font-display text-sm font-bold text-ink">{b.name}</p>
                <p className="text-[10px] text-muted">{b.tag}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted" />
            </Link>
          ))}
        </div>
      </section>

      {/* Trust & Verification */}
      <section className="wrap mt-12">
        <div className="rounded-xl bg-footer-bg p-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex items-start gap-3.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber/20 text-amber">
                <BadgeCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-white">Physical Specification Testing</h3>
                <p className="mt-1 text-xs text-[#cbd5d1]">
                  Every laptop undergoes diagnostic testing on battery capacity, display pixels, keyboard, and thermal performance before dispatch.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber/20 text-amber">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-white">Nairobi & Countrywide Delivery</h3>
                <p className="mt-1 text-xs text-[#cbd5d1]">
                  Same-day delivery within Nairobi and Kiambu; secure parcel dispatch to Mombasa, Nakuru, Kisumu, Eldoret, and all 47 counties.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber/20 text-amber">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-white">Official Physical Warranty</h3>
                <p className="mt-1 text-xs text-[#cbd5d1]">
                  Clear warranty receipts with responsive local repair or replacement support. No hidden defects.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function ZapIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="13 2 3 14 12 14 2 20" />
    </svg>
  )
}
