import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProductStore } from '@/store/productStore';
import ProductCard from '@/components/ProductCard';
import { ArrowRight, Truck, Shield, CreditCard, Headphones, Sparkles } from 'lucide-react';

export default function Home() {
  const { products, fetchProducts, loading } = useProductStore();

  useEffect(() => {
    fetchProducts({}, { limit: 8 });
  }, [fetchProducts]);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="grid-lines pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-teal/25 blur-[140px]" />
        <div className="pointer-events-none absolute -bottom-52 -right-32 h-[30rem] w-[30rem] rounded-full bg-amber/15 blur-[140px]" />
        
        <div className="wrap relative py-20 md:py-32">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.2em] text-amber mb-6">
              <Sparkles className="h-3.5 w-3.5" /> Powered by NOVA AI
            </p>
            <h1 className="font-display text-4xl md:text-6xl font-bold leading-[1.04] tracking-tight mb-6">
              Technology that
              <span className="relative inline-block px-2 text-amber">
                moves you
                <svg viewBox="0 0 220 12" className="absolute -bottom-1 left-0 w-full" aria-hidden="true">
                  <path d="M3 9c60-7 140-7 214-2" fill="none" stroke="#0b7a63" strokeWidth="5" strokeLinecap="round" />
                </svg>
              </span>
              forward.
            </h1>
            <p className="text-lg md:text-xl leading-relaxed text-white/65 mb-8 max-w-2xl">
              Kenya's modern electronics store. Laptops, phones, gaming rigs and everything between — 
              genuine products, honest prices in Kenya Shillings, and delivery to all 47 counties.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/shop"
                className="btn btn-amber !h-12 !px-7 !text-[15px]"
              >
                Shop Now <ArrowRight className="h-4.5 w-4.5" />
              </Link>
              <Link
                to="/shop"
                className="btn btn-light !h-12 !px-7 !text-[15px]"
              >
                Browse Categories
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap items-center gap-2.5 text-[10.5px] font-extrabold uppercase tracking-[0.12em]">
              <span className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-white/75">New store · honest prices</span>
              <span className="rounded-lg border border-[#3ddc84]/35 bg-[#1b9e4b]/15 px-3 py-1.5 text-[#7be3a8]">M-PESA PayBill</span>
              <span className="rounded-lg border border-[#3ddc84]/35 bg-[#25d366]/10 px-3 py-1.5 text-[#8ef0b6]">Order via WhatsApp</span>
              <span className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-white/75">Delivery · 47 counties</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-card border-b border-line">
        <div className="wrap">
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
            <div className="text-center">
              <div className="bg-mint w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-teal" />
              </div>
              <h3 className="text-[13px] font-extrabold mb-1">Free Shipping</h3>
              <p className="text-xs font-semibold text-muted">On orders over KSh 30,000</p>
            </div>
            <div className="text-center">
              <div className="bg-mint w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-teal" />
              </div>
              <h3 className="text-[13px] font-extrabold mb-1">Genuine Products</h3>
              <p className="text-xs font-semibold text-muted">Serial-verified & sealed</p>
            </div>
            <div className="text-center">
              <div className="bg-mint w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-teal" />
              </div>
              <h3 className="text-[13px] font-extrabold mb-1">M-PESA PayBill</h3>
              <p className="text-xs font-semibold text-muted">Secure & instant payment</p>
            </div>
            <div className="text-center">
              <div className="bg-mint w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Headphones className="w-8 h-8 text-teal" />
              </div>
              <h3 className="text-[13px] font-extrabold mb-1">WhatsApp Support</h3>
              <p className="text-xs font-semibold text-muted">Real humans, not bots</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="wrap py-14 md:py-20">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4 md:mb-9">
          <div className="max-w-xl">
            <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-teal">The shortlist</p>
            <h2 className="font-display text-2xl font-bold tracking-tight md:text-[2rem] md:leading-tight">Featured products</h2>
            <p className="mt-2 text-sm leading-relaxed md:text-[15px] text-muted">Bestsellers and new arrivals our customers keep coming back for.</p>
          </div>
          <Link to="/shop" className="btn btn-outline btn-sm">
            Browse the shop <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal mx-auto"></div>
            <p className="mt-4 text-muted">Loading products...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="wrap py-14">
        <div className="relative overflow-hidden rounded-2xl bg-ink p-8 text-center text-white md:p-14">
          <div className="grid-lines absolute inset-0" />
          <div className="relative">
            <h2 className="font-display text-2xl font-bold md:text-4xl">See the store in action</h2>
            <p className="mx-auto mt-3 max-w-md text-sm font-semibold text-white/60">
              Browse the catalogue, fill a cart, chat with NOVA AI, place a demo order — every button on this site works.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/shop" className="btn btn-amber !h-12 !px-7">
                Browse the shop <ArrowRight className="h-4.5 w-4.5" />
              </Link>
              <Link to="/shop" className="btn btn-light !h-12 !px-7">
                Today's deals
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
