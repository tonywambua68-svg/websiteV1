import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProductStore } from '@/store/productStore'
import ProductCard from '@/components/ProductCard'
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
  CheckCircle2,
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
    subtitle: 'Core i5 & i7 EliteBooks, Latitudes & ThinkPads with verified RAM, SSD, and battery diagnostics.',
    cta: 'Explore Laptops',
    link: '/shop?category=laptops',
    badge: 'KENYA NATIONWIDE DELIVERY',
    bg: 'from-slate-900 via-[#101820] to-blue-950',
    accent: 'text-cyan',
  },
  {
    title: 'Certified Refurbished & Brand New',
    subtitle: 'Save up to 40% with physically inspected, warranty-backed business workstations.',
    cta: 'View Tech Deals',
    link: '/shop?offers=1',
    badge: 'PHYSICAL INSPECTION WARRANTY',
    bg: 'from-blue-950 via-slate-900 to-[#101820]',
    accent: 'text-amber',
  },
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
  const deals = products.filter((p) => p.comparison_price && p.comparison_price > p.selling_price).slice(0, 6)
  const featured = products.filter((p) => p.featured).slice(0, 8)
  const newArrivals = [...products]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 8)

  return (
    <div className="min-h-screen bg-page pb-16">
      {/* 1. MARKETPLACE HERO SECTION (Amazon / Jumia Centered Layout) */}
      <section className="wrap pt-4 md:pt-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          {/* Main Promotional Banner Carousel */}
          <div className="relative overflow-hidden rounded-xl border border-line bg-gradient-to-r shadow-sm">
            <div className={`p-6 sm:p-10 text-white min-h-[300px] sm:min-h-[360px] flex flex-col justify-center bg-gradient-to-r ${PROMO_SLIDES[slideIndex].bg}`}>
              <div className="max-w-xl">
                <span className={`inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider backdrop-blur ${PROMO_SLIDES[slideIndex].accent}`}>
                  <Sparkles className="h-3.5 w-3.5" />
                  {PROMO_SLIDES[slideIndex].badge}
                </span>

                <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight text-white sm:text-3xl lg:text-4xl">
                  {PROMO_SLIDES[slideIndex].title}
                </h1>

                <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {PROMO_SLIDES[slideIndex].subtitle}
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link
                    to={PROMO_SLIDES[slideIndex].link}
                    className="btn btn-primary !h-11 px-5 text-sm font-bold shadow-lg"
                  >
                    {PROMO_SLIDES[slideIndex].cta} <ArrowRight className="h-4 w-4" />
                  </Link>

                  <Link
                    to="/shop"
                    className="btn btn-light !h-11 px-5 text-sm font-semibold"
                  >
                    All Products
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

          {/* Side Promo Card (Amazon 4-in-1 / Jumia Quick Deal Widget) */}
          <div className="flex flex-col gap-4">
            {/* Card 1: Fast Tech Quicklinks */}
            <div className="flex-1 rounded-xl border border-line bg-white p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-extrabold uppercase tracking-wide text-ink">
                    Popular Categories
                  </h3>
                  <Link to="/shop" className="text-xs font-bold text-primary hover:underline">
                    Shop all →
                  </Link>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  <Link
                    to="/shop?category=laptops"
                    className="flex flex-col items-center justify-center rounded-lg border border-line bg-slate-50 p-2.5 text-center hover:border-primary hover:bg-blue-50/40 transition-colors"
                  >
                    <Laptop className="h-5 w-5 text-primary mb-1" />
                    <span className="text-[11px] font-bold text-ink">Laptops</span>
                    <span className="text-[9px] text-muted">Core i5 &amp; i7</span>
                  </Link>

                  <Link
                    to="/shop?category=desktops"
                    className="flex flex-col items-center justify-center rounded-lg border border-line bg-slate-50 p-2.5 text-center hover:border-primary hover:bg-blue-50/40 transition-colors"
                  >
                    <Briefcase className="h-5 w-5 text-indigo-600 mb-1" />
                    <span className="text-[11px] font-bold text-ink">Desktops</span>
                    <span className="text-[9px] text-muted">Workstations</span>
                  </Link>

                  <Link
                    to="/shop?category=storage-devices"
                    className="flex flex-col items-center justify-center rounded-lg border border-line bg-slate-50 p-2.5 text-center hover:border-primary hover:bg-blue-50/40 transition-colors"
                  >
                    <HardDrive className="h-5 w-5 text-cyan mb-1" />
                    <span className="text-[11px] font-bold text-ink">SSDs &amp; RAM</span>
                    <span className="text-[9px] text-muted">Fast Upgrades</span>
                  </Link>

                  <Link
                    to="/shop?category=monitors"
                    className="flex flex-col items-center justify-center rounded-lg border border-line bg-slate-50 p-2.5 text-center hover:border-primary hover:bg-blue-50/40 transition-colors"
                  >
                    <Monitor className="h-5 w-5 text-sky-600 mb-1" />
                    <span className="text-[11px] font-bold text-ink">Monitors</span>
                    <span className="text-[9px] text-muted">Displays</span>
                  </Link>
                </div>
              </div>

              {/* Card 2: Safe M-PESA & Verification Assurance */}
              <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  <span className="text-xs font-bold text-emerald-900">M-PESA &amp; Pay on Delivery</span>
                </div>
                <p className="mt-1 text-[11px] text-emerald-800 leading-snug">
                  Inspect hardware in Nairobi before paying; secure delivery countrywide.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SHOP BY CATEGORY (Amazon & Jumia Card Grid) */}
      <section className="wrap mt-8">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-ink">Shop by Category</h2>
            <p className="text-xs text-muted">Browse genuine computers, parts, and verified electronics.</p>
          </div>
          <Link to="/shop" className="text-xs font-bold text-primary hover:underline">
            All categories →
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORY_TILES.map((cat) => {
            const Icon = cat.icon
            return (
              <Link
                key={cat.label}
                to={cat.to}
                className="group flex flex-col items-center rounded-xl border border-line bg-white p-4 text-center shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-md"
              >
                <div className={`grid h-12 w-12 place-items-center rounded-xl ${cat.color} transition-transform group-hover:scale-110`}>
                  <Icon className="h-6 w-6" />
                </div>
                <span className="mt-3 font-display text-xs font-bold text-ink group-hover:text-primary">
                  {cat.label}
                </span>
                <span className="mt-0.5 text-[10px] text-muted line-clamp-1">
                  {cat.sub}
                </span>
              </Link>
            )
          })}
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
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {deals.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. FEATURED LAPTOPS & WORKSTATIONS */}
      {featured.length > 0 && (
        <section className="wrap mt-10">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-ink">Featured Laptops &amp; Computers</h2>
              <p className="text-xs text-muted">Tested hardware ready for immediate delivery.</p>
            </div>
            <Link to="/shop" className="text-xs font-bold text-primary hover:underline">
              View all ({featured.length}) →
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 5. NEW ARRIVALS */}
      {newArrivals.length > 0 && (
        <section className="wrap mt-10">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-ink">New Arrivals in Nairobi</h2>
              <p className="text-xs text-muted">Recently unboxed and added to our inventory.</p>
            </div>
            <Link to="/shop?sort=newest" className="text-xs font-bold text-primary hover:underline">
              View newest →
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
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
            <p className="text-xs text-muted">Leading enterprise manufacturers with authentic spare parts support.</p>
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
                <h3 className="font-display text-sm font-bold text-ink">Diagnostic Specification Testing</h3>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  Every laptop undergoes full diagnostic testing on battery health, display pixels, keyboard, and thermals before dispatch.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-ink">All 47 Counties Doorstep Delivery</h3>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  Same-day delivery within Nairobi and Kiambu; secure parcel dispatch to Mombasa, Nakuru, Kisumu, Eldoret, and all 47 counties.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-50 text-success">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-ink">Official Physical Inspection Warranty</h3>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  Verify the physical condition, ports, and operating system on delivery. Responsive local repair and replacement support.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
