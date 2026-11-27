import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProductStore } from '@/store/productStore'
import ProductCard from '@/components/ProductCard'
import RecentlyViewed from '@/components/RecentlyViewed'
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
  Monitor,
  HardDrive,
  Network,
  Gamepad2,
  Flame,
  Clock,
  ChevronLeft,
} from 'lucide-react'
import { formatKES } from '@/lib/commerce'

const CATEGORY_TILES = [
  { label: 'Laptops', sub: 'HP, Dell, Lenovo, Mac', icon: Laptop, to: '/shop?category=laptops', color: 'bg-blue-50 text-primary' },
  { label: 'Desktops & PCs', sub: 'Towers & All-in-Ones', icon: Briefcase, to: '/shop?category=desktops', color: 'bg-indigo-50 text-indigo-600' },
  { label: 'Monitors', sub: 'FHD & 4K Displays', icon: Monitor, to: '/shop?category=monitors', color: 'bg-sky-50 text-sky-600' },
  { label: 'Storage & SSDs', sub: 'NVMe, SATA & External', icon: HardDrive, to: '/shop?category=storage-devices', color: 'bg-cyan-50 text-cyan' },
  { label: 'Accessories', sub: 'Chargers, Docks, Bags', icon: Network, to: '/shop?category=computer-accessories', color: 'bg-slate-100 text-slate-700' },
  { label: 'Keyboards & Mice', sub: 'Wireless & Mechanical', icon: Gamepad2, to: '/shop?category=input-devices', color: 'bg-amber-50 text-amber' },
]

const TOP_BRANDS = [
  { name: 'HP', slug: 'hp', tag: 'EliteBook, ProBook & ZBook' },
  { name: 'Dell', slug: 'dell', tag: 'Latitude, XPS & Precision' },
  { name: 'Lenovo', slug: 'lenovo', tag: 'ThinkPad & IdeaPad' },
  { name: 'Apple', slug: 'apple', tag: 'MacBook Air & MacBook Pro' },
  { name: 'ASUS', slug: 'asus', tag: 'ZenBook, VivoBook & ROG' },
  { name: 'Acer', slug: 'acer', tag: 'Swift, Aspire & TravelMate' },
]

const PROMO_SLIDES = [
  {
    title: 'High-Performance Laptops in Kenya',
    subtitle: 'Core i5 & i7 EliteBooks, Latitudes & ThinkPads from leading brands, with full specifications listed on every product.',
    cta: 'Explore Laptops',
    link: '/shop?category=laptops',
    badge: 'GENUINE LAPTOPS & ACCESSORIES',
    bg: 'from-slate-900 via-[#101820] to-blue-950',
    accent: 'text-cyan',
  },
  {
    title: 'Business & Student Workstations',
    subtitle: 'Browse brand-new and refurbished business workstations at competitive prices, clearly described before you buy.',
    cta: 'Shop All Products',
    link: '/shop',
    badge: 'BUY WITH CONFIDENCE',
    bg: 'from-blue-950 via-slate-900 to-[#101820]',
    accent: 'text-amber',
  },
]

// Consistent 6-per-row product grid on large desktops.
const PRODUCT_GRID = 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 min-[1400px]:grid-cols-6'
const PLACEHOLDER = '/images/products/laptop-placeholder.svg'

// Image-based category discovery (representative image pulled from live catalogue).
const CATEGORY_CARDS = [
  { slug: 'laptops', name: 'Laptops', desc: 'Business, student & gaming', to: '/shop?category=laptops' },
  { slug: 'desktops', name: 'Desktops & Workstations', desc: 'Towers & all-in-one PCs', to: '/shop?category=desktops' },
  { slug: 'monitors', name: 'Monitors & Displays', desc: 'Full HD, QHD & 4K', to: '/shop?category=monitors' },
  { slug: 'storage-devices', name: 'Storage & SSDs', desc: 'NVMe, SATA & external', to: '/shop?category=storage-devices' },
  { slug: 'computer-accessories', name: 'Accessories', desc: 'Chargers, bags & docks', to: '/shop?category=computer-accessories' },
  { slug: 'input-devices', name: 'Keyboards & Mice', desc: 'Wireless & mechanical', to: '/shop?category=input-devices' },
]

// Per-category product collections rendered on the homepage (only when non-empty).
const COLLECTIONS = [
  { slug: 'laptops', title: 'Featured Laptops', desc: 'Business, student and everyday laptops.', to: '/shop?category=laptops' },
  { slug: 'desktops', title: 'Desktop Computers & Workstations', desc: 'Towers and all-in-one PCs for work and study.', to: '/shop?category=desktops' },
  { slug: 'monitors', title: 'Monitors & Displays', desc: 'Full HD, QHD and 4K screens.', to: '/shop?category=monitors' },
  { slug: 'storage-devices', title: 'Storage & SSDs', desc: 'NVMe, SATA and external storage upgrades.', to: '/shop?category=storage-devices' },
  { slug: 'computer-accessories', title: 'Computer Accessories', desc: 'Chargers, bags, docks and peripherals.', to: '/shop?category=computer-accessories' },
]

export default function Home() {
  const { products, fetchProducts, loading } = useProductStore()
  const [slideIndex, setSlideIndex] = useState(0)

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Automatic hero slider rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % PROMO_SLIDES.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const published = products.filter((p) => p.publication_status === 'published' || p.availability !== 'unavailable')
  const deals = products.filter((p) => p.comparison_price && p.comparison_price > p.selling_price).slice(0, 12)
  const newArrivals = [...products]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 12)

  const byCategory = (slug: string) => published.filter((p) => p.category_slug === slug)
  const repImage = (slug: string) => byCategory(slug).find((p) => p.image_url)?.image_url || PLACEHOLDER

  return (
    <div className="min-h-screen bg-page pb-16">
      {/* 1. FULL-WIDTH HERO BANNER (centred, single column) */}
      <section className="wrap pt-4 md:pt-6">
        <div className="relative overflow-hidden rounded-xl border border-line shadow-sm">
          <div className={`p-6 sm:p-10 lg:p-12 text-white min-h-[300px] sm:min-h-[360px] lg:min-h-[400px] flex flex-col justify-center bg-gradient-to-r ${PROMO_SLIDES[slideIndex].bg}`}>
            <div className="max-w-2xl">
              <span className={`inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider backdrop-blur ${PROMO_SLIDES[slideIndex].accent}`}>
                <Sparkles className="h-3.5 w-3.5" />
                {PROMO_SLIDES[slideIndex].badge}
              </span>

              <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
                {PROMO_SLIDES[slideIndex].title}
              </h1>

              <p className="mt-3 max-w-xl text-sm sm:text-base text-slate-300 leading-relaxed">
                {PROMO_SLIDES[slideIndex].subtitle}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  to={PROMO_SLIDES[slideIndex].link}
                  className="btn btn-primary !h-11 px-6 text-sm font-bold shadow-lg"
                >
                  {PROMO_SLIDES[slideIndex].cta} <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  to="/shop"
                  className="btn btn-light !h-11 px-6 text-sm font-semibold"
                >
                  All Products
                </Link>

                <Link
                  to="/shop?offers=1"
                  className="btn btn-light !h-11 px-6 text-sm font-semibold"
                >
                  View Tech Deals
                </Link>
              </div>
            </div>

            {/* Slider Controls */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSlideIndex((prev) => (prev === 0 ? PROMO_SLIDES.length - 1 : prev - 1))}
                className="grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex gap-1.5">
                {PROMO_SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSlideIndex(idx)}
                    className={`h-2 rounded-full transition-all ${idx === slideIndex ? 'w-6 bg-primary' : 'w-2 bg-white/40'}`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setSlideIndex((prev) => (prev + 1) % PROMO_SLIDES.length)}
                className="grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                aria-label="Next slide"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Slim full-width assurance strip (replaces the old right-side panel) */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-lg border border-line bg-white px-4 py-3 shadow-xs">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-primary">
              <BadgeCheck className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="text-xs font-bold text-ink">Verified Specifications</p>
              <p className="text-[11px] text-muted">Clear details on every product</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-line bg-white px-4 py-3 shadow-xs">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
              <Truck className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="text-xs font-bold text-ink">Delivery at Checkout</p>
              <p className="text-[11px] text-muted">See options for your location</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-line bg-white px-4 py-3 shadow-xs">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-success">
              <Headphones className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="text-xs font-bold text-ink">Customer Support</p>
              <p className="text-[11px] text-muted">Helpful pre &amp; post-sale help</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. POPULAR CATEGORIES (repositioned below the hero) */}
      <section className="wrap mt-8">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-ink">Popular Categories</h2>
            <p className="text-xs text-muted">Browse computers, parts, and electronics by category.</p>
          </div>
          <Link to="/shop" className="text-xs font-bold text-primary hover:underline">
            All categories →
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORY_CARDS.map((cat) => (
            <Link
              key={cat.slug}
              to={cat.to}
              className="group flex flex-col overflow-hidden rounded-xl border border-line bg-white text-left shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-md"
            >
              <div className="aspect-[4/3] w-full overflow-hidden border-b border-line bg-slate-50">
                <img
                  src={repImage(cat.slug)}
                  alt={cat.name}
                  loading="lazy"
                  className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = PLACEHOLDER
                  }}
                />
              </div>
              <div className="p-3">
                <p className="font-display text-xs font-bold text-ink group-hover:text-primary">{cat.name}</p>
                <p className="mt-0.5 text-[10px] text-muted line-clamp-1">{cat.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. TODAY'S FLASH DEALS (Jumia / Amazon Explosive Deals Section) */}
      {deals.length > 0 && (
        <section className="wrap mt-10">
          <div className="rounded-xl border border-line bg-white shadow-sm overflow-hidden">
            {/* Header banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-red-600 to-amber-600 px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-white animate-pulse" />
                <h2 className="font-display text-base font-extrabold uppercase tracking-wide">
                  Today&rsquo;s Tech Deals &amp; Discounts
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold bg-black/20 px-2.5 py-1 rounded">
                  <Clock className="h-3.5 w-3.5" /> Verified Prices in KSh
                </span>
                <Link to="/shop?offers=1" className="text-xs font-bold text-white underline hover:text-amber-200">
                  See all deals →
                </Link>
              </div>
            </div>

            {/* Deals Grid */}
            <div className="p-4 bg-slate-50/50">
              <div className={PRODUCT_GRID}>
                {deals.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. CATEGORY COLLECTIONS (real published products, 6-col grid) */}
      {COLLECTIONS.map((col) => {
        const items = byCategory(col.slug).slice(0, 12)
        if (items.length === 0) return null
        return (
          <section key={col.slug} className="wrap mt-10">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-ink">{col.title}</h2>
                <p className="text-xs text-muted">{col.desc}</p>
              </div>
              <Link to={col.to} className="text-xs font-bold text-primary hover:underline">
                View all →
              </Link>
            </div>
            <div className={`mt-4 ${PRODUCT_GRID}`}>
              {items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )
      })}

      {/* 5. NEW ARRIVALS */}
      {newArrivals.length > 0 && (
        <section className="wrap mt-10">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-ink">New Arrivals</h2>
              <p className="text-xs text-muted">Recently added to our product catalogue.</p>
            </div>
            <Link to="/shop?sort=newest" className="text-xs font-bold text-primary hover:underline">
              View newest →
            </Link>
          </div>

          <div className={`mt-4 ${PRODUCT_GRID}`}>
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 6. SHOP BY TOP BRANDS */}
      <section className="wrap mt-12">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-ink">Shop by Brand</h2>
            <p className="text-xs text-muted">Leading enterprise and consumer electronics manufacturers.</p>
          </div>
          <Link to="/shop" className="text-xs font-bold text-primary hover:underline">
            All brands →
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {TOP_BRANDS.map((b) => (
            <Link
              key={b.slug}
              to={`/shop?brand=${b.slug}`}
              className="flex items-center justify-between rounded-xl border border-line bg-white p-3.5 shadow-xs transition hover:border-primary hover:shadow-sm"
            >
              <div>
                <p className="font-display text-sm font-bold text-ink">{b.name}</p>
                <p className="text-[10px] text-muted">{b.tag}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </Link>
          ))}
        </div>
      </section>

      {/* Recently Viewed Products */}
      <RecentlyViewed />

      {/* 7. WHY CHOOSE OREMITECH (Trust & Guarantee Cards) */}
      <section className="wrap mt-14">
        <div className="rounded-xl border border-line bg-white p-6 sm:p-8 shadow-sm">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="font-display text-xl font-bold text-ink">Why Buy From OREMITECH?</h2>
            <p className="text-xs text-muted mt-1">
              Kenyan technology marketplace committed to verified hardware specifications and transparent pricing.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-primary">
                <BadgeCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-ink">Verified Specifications</h3>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  Each listing shows the processor, memory, storage and other specifications provided for that product, so you can compare with confidence.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-ink">Delivery Options at Checkout</h3>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  Enter your county, town and address at checkout to see the delivery options and any applicable charges for your location before you pay.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-50 text-success">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-ink">Clear Order Tracking</h3>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  Follow your order from confirmation through to delivery using your order number and phone number on our order tracking page.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
