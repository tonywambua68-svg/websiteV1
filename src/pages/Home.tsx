import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { byId, CATEGORIES, discountOf, fmt, minPriceIn, PRODUCTS } from "../data/products";
import { BRANDS, COMPARE_ROWS, TRUST_ITEMS, GUIDES } from "../data/content";
import { WhatsAppButton } from "../components/Contact";
import { useStore } from "../lib/store";
import ProductArt from "../components/ProductArt";
import ProductCard from "../components/ProductCard";
import RecentlyViewed from "../components/RecentlyViewed";
import AIFinder from "../components/AIFinder";
import { Price, Reveal, SectionHead, useCountdown } from "../components/ui";
import { CAT_ICONS, TRUST_ICONS, IcArrowR, IcBolt, IcCheck, IcChevD, IcSwap } from "../components/Icons";

export default function Home() {
  const deals = useMemo(() => PRODUCTS.filter((p) => p.tags.includes("deal")).slice(0, 4), []);
  const featured = useMemo(
    () => PRODUCTS.filter((p) => p.tags.includes("bestseller") || p.tags.includes("new")).slice(0, 8),
    [],
  );
  const fresh = useMemo(() => {
    const tagged = PRODUCTS.filter((p) => p.tags.includes("new"));
    const rest = PRODUCTS.filter((p) => !p.tags.includes("new"));
    return [...tagged, ...rest].slice(0, 4);
  }, []);

  return (
    <>
      <Hero />
      <BrandStrip />
      <Categories />
      <DealsSection deals={deals} />
      <FeaturedSection items={featured} />
      <FinderSection />
      <TrustBand />
      <div className="wrap">
        <RecentlyViewed />
      </div>
      <FreshSection items={fresh} />
      <CompareTeaser />
      <GuidesSection />
      <TransparencySection />
      <Newsletter />
    </>
  );
}

/* ================= 1. HERO ================= */
function Hero() {
  const heroLaptop = byId("p3")!;
  const phone = byId("p11")!;
  const buds = byId("p18")!;

  return (
    <section className="noise relative overflow-hidden bg-ink text-white">
      <div className="grid-lines pointer-events-none absolute inset-0" />
      <div className="animate-drift pointer-events-none absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-teal/25 blur-[140px]" />
      <div className="animate-drift pointer-events-none absolute -bottom-52 -right-32 h-[30rem] w-[30rem] rounded-full bg-amber/15 blur-[140px]" style={{ animationDelay: "-5s" }} />

      <div className="wrap relative grid items-center gap-12 py-14 md:py-20 lg:grid-cols-12 lg:gap-8">
        {/* Left */}
        <div className="lg:col-span-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.2em] text-amber">
            <IcBolt className="h-3.5 w-3.5" /> Next-generation technology · Kenya
          </p>
          <h1 className="mt-6 font-display text-[2.6rem] font-bold leading-[1.04] tracking-tight md:text-6xl">
            Technology that
            <span className="relative inline-block px-2 text-amber">
              moves you
              <svg viewBox="0 0 220 12" className="absolute -bottom-1 left-0 w-full" aria-hidden="true"><path d="M3 9c60-7 140-7 214-2" fill="none" stroke="#0b7a63" strokeWidth="5" strokeLinecap="round" /></svg>
            </span>
            forward.
          </h1>
          <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-white/65 md:text-base">
            Kenya's modern electronics store. Laptops, phones, gaming rigs and
            everything between — genuine products, honest prices in Kenya
            Shillings, and delivery to all 47 counties.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/shop" className="btn btn-amber !h-12 !px-7 !text-[15px]">Shop now <IcArrowR className="h-4.5 w-4.5" /></Link>
            <Link to="/deals" className="btn btn-light !h-12 !px-7 !text-[15px]">Explore deals</Link>
          </div>
          <div className="stagger mt-9 flex flex-wrap items-center gap-2.5 text-[10.5px] font-extrabold uppercase tracking-[0.12em]">
            <span className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-white/75">New store · honest prices</span>
            <span className="rounded-lg border border-[#3ddc84]/35 bg-[#1b9e4b]/15 px-3 py-1.5 text-[#7be3a8]">M-PESA PayBill</span>
            <span className="rounded-lg border border-[#3ddc84]/35 bg-[#25d366]/10 px-3 py-1.5 text-[#8ef0b6]">Order via WhatsApp</span>
            <span className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-white/75">Delivery · 47 counties</span>
          </div>
        </div>

        {/* Right — product composition */}
        <div className="relative lg:col-span-6">
          <div className="relative mx-auto max-w-md lg:max-w-none">
            {/* Featured product card */}
            <Reveal>
              <Link to={`/product/${heroLaptop.id}`}
                className="group relative block overflow-hidden rounded-2xl border border-white/12 bg-pine/70 p-5 transition hover:border-teal/60 md:p-6"
                style={{ background: `linear-gradient(150deg, ${heroLaptop.hue}66, #10312c 55%)` }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-amber">Just landed</p>
                    <h2 className="mt-1 font-display text-xl font-bold md:text-2xl">{heroLaptop.name}</h2>
                    <p className="mt-1 text-[13px] font-semibold text-white/55">{heroLaptop.tagline}</p>
                  </div>
                  {heroLaptop.oldPrice && (
                    <span className="rounded-lg bg-amber px-2 py-1 font-display text-xs font-bold text-ink">−{discountOf(heroLaptop)}%</span>
                  )}
                </div>
                <ProductArt kind="laptop" accent="#f5a31a" className="mx-auto mt-2 h-52 w-full max-w-sm transition-transform duration-700 group-hover:scale-[1.05] md:h-64" />
                <div className="flex items-end justify-between">
                  <Price p={heroLaptop} big light />
                  <span className="mb-1 grid h-11 w-11 place-items-center rounded-xl bg-amber text-ink transition group-hover:translate-x-1">
                    <IcArrowR className="h-5 w-5" />
                  </span>
                </div>
              </Link>
            </Reveal>

            {/* Floating spec chips */}
            <span className="animate-floaty absolute -left-3 top-24 hidden rounded-xl border border-white/15 bg-ink/85 px-3.5 py-2 text-xs font-extrabold shadow-xl backdrop-blur sm:block" style={{ animationDelay: "0.4s" }}>
              32GB RAM
            </span>
            <span className="animate-floaty absolute -right-2 top-44 hidden rounded-xl border border-white/15 bg-ink/85 px-3.5 py-2 text-xs font-extrabold shadow-xl backdrop-blur sm:block" style={{ animationDelay: "1.2s" }}>
              1TB NVMe SSD
            </span>
            <span className="animate-floaty absolute -left-6 bottom-10 hidden rounded-xl border border-teal/40 bg-ink/85 px-3.5 py-2 text-xs font-extrabold text-amber shadow-xl backdrop-blur lg:block" style={{ animationDelay: "2s" }}>
              3K · 120Hz display
            </span>

            {/* Floating mini tiles */}
            <Reveal delay={200}>
              <Link to={`/product/${phone.id}`}
                className="animate-floaty absolute -right-4 -top-8 hidden w-36 rounded-2xl border border-white/12 bg-ink/90 p-3 shadow-2xl backdrop-blur transition hover:border-amber/60 md:block lg:-right-10"
                style={{ ["--rot" as string]: "3deg" }}>
                <ProductArt kind={phone.art} accent={phone.hue} className="h-16 w-full" />
                <p className="mt-1 truncate text-[11px] font-bold">{phone.name}</p>
                <p className="font-display text-[12px] font-bold text-amber">{fmt(phone.price)}</p>
              </Link>
            </Reveal>
            <Reveal delay={350}>
              <Link to={`/product/${buds.id}`}
                className="animate-floaty absolute -bottom-7 -left-4 hidden w-36 rounded-2xl border border-white/12 bg-ink/90 p-3 shadow-2xl backdrop-blur transition hover:border-amber/60 md:block lg:-left-12"
                style={{ ["--rot" as string]: "-3deg", animationDelay: "1.6s" }}>
                <ProductArt kind={buds.art} accent={buds.hue} className="h-16 w-full" />
                <p className="mt-1 truncate text-[11px] font-bold">{buds.name}</p>
                <p className="font-display text-[12px] font-bold text-amber">{fmt(buds.price)}</p>
              </Link>
            </Reveal>
          </div>
        </div>
      </div>

      {/* bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-mist/0 to-transparent" />
    </section>
  );
}

/* ================= 2. BRAND STRIP ================= */
function BrandStrip() {
  return (
    <div className="marquee-paused overflow-hidden border-b border-line bg-card py-4">
      <div className="animate-marquee flex w-max items-center gap-12">
        {[...BRANDS, ...BRANDS].map((b, i) => (
          <span key={i} className="flex items-center gap-12 font-display text-lg font-bold tracking-wide text-muted/70">
            {b} <span className="h-1.5 w-1.5 rounded-full bg-teal/50" />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ================= 3. CATEGORIES ================= */
function Categories() {
  const cats = CATEGORIES.filter((c) => c.id !== "tablets").concat(CATEGORIES.filter((c) => c.id === "tablets"));
  return (
    <section className="wrap py-14 md:py-20">
      <SectionHead
        eyebrow="Browse the range"
        title="Shop by category"
        sub="Nine departments, one standard: genuine products with real Kenyan warranty."
        right={<Link to="/shop" className="btn btn-outline btn-sm">View all products <IcArrowR className="h-3.5 w-3.5" /></Link>}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
        {cats.map((c, i) => {
          const Icon = CAT_ICONS[c.id];
          const count = PRODUCTS.filter((p) => p.category === c.id).length;
          return (
            <Reveal key={c.id} delay={i * 40}>
              <Link to={`/shop?cat=${c.id}`}
                className="group card flex h-full flex-col p-4 transition-all duration-300 hover:-translate-y-1 hover:border-teal/50 hover:shadow-[0_16px_36px_-16px_rgba(10,31,28,0.25)] md:p-5">
                <span className="grid h-12 w-12 place-items-center rounded-xl transition-colors duration-300" style={{ background: `${c.hue}1a`, color: c.hue }}>
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-3.5 font-display text-[15px] font-bold md:text-base">{c.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs font-semibold leading-relaxed text-muted">{c.short}</p>
                <p className="mt-auto flex items-center justify-between pt-3 text-[11px] font-extrabold text-teal">
                  {count} products · from {fmt(minPriceIn(c.id))}
                  <IcArrowR className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </p>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ================= 4. DEALS ================= */
function DealsSection({ deals }: { deals: ReturnType<typeof PRODUCTS.filter> }) {
  const t = useCountdown();
  return (
    <section className="noise relative overflow-hidden bg-ink py-14 text-white md:py-20">
      <div className="grid-lines pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-amber/12 blur-[120px]" />
      <div className="wrap relative">
        <SectionHead
          light
          eyebrow="Limited stock · prices already dropped"
          title="Today's Top Deals"
          sub="Hand-picked discounts, refreshed daily at midnight. When they're gone, they're gone."
          right={
            <div className="flex flex-wrap items-center gap-3">
              <span className="tabular flex items-center gap-2 rounded-xl border border-amber/30 bg-amber/10 px-4 py-2 font-display text-lg font-bold tracking-widest text-amber" aria-label={`Deals end in ${t}`}>
                <IcBolt className="h-5 w-5" /> {t}
              </span>
              <Link to="/deals" className="btn btn-amber btn-sm">All deals <IcArrowR className="h-3.5 w-3.5" /></Link>
            </div>
          }
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {deals.map((p, i) => (
            <Reveal key={p.id} delay={i * 70}>
              <div className="flex h-full flex-col">
                <ProductCard p={p} />
                {/* Live stock-pressure bar — a real marketplace signal */}
                <div className="mt-2 rounded-xl border border-white/10 bg-pine/70 px-3.5 py-2.5 backdrop-blur">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber to-[#ff7a3d] transition-all duration-700"
                      style={{ width: p.stock === 0 ? "100%" : `${Math.min(92, 100 - p.stock * 3)}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[10px] font-extrabold uppercase tracking-wider text-amber">
                    {p.stock === 0 ? "Sold out — deal claimed" : p.stock <= 5 ? `Only ${p.stock} left — going fast` : `${p.stock} still available`}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================= 5. FEATURED ================= */
function FeaturedSection({ items }: { items: typeof PRODUCTS }) {
  return (
    <section className="wrap py-14 md:py-20">
      <SectionHead
        eyebrow="The shortlist"
        title="Featured products"
        sub="A rotating shortlist of machines and gadgets we would buy ourselves."
        right={<Link to="/shop" className="btn btn-outline btn-sm">Browse the shop <IcArrowR className="h-3.5 w-3.5" /></Link>}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((p, i) => (
          <Reveal key={p.id} delay={i * 70}>
            <ProductCard p={p} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ================= 6. AI FINDER ================= */
function FinderSection() {
  return (
    <section id="finder" className="noise relative overflow-hidden bg-ink py-14 text-white md:py-20">
      <div className="grid-lines pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-teal/20 blur-[130px]" />
      <div className="wrap relative grid items-center gap-10 lg:grid-cols-2">
        <Reveal>
          <div>
            <SectionHead
              light
              eyebrow="Meet NOVA · demo AI"
              title="Not sure what to buy?"
              sub="Tell NOVA what you need and roughly what you want to spend — it shortlists the best real matches from our live catalogue, with clear reasons, in seconds."
            />
            <ul className="space-y-3">
              {["Understands Kenyan budgets — “under 80k” just works", "Explains why each pick fits, spec by spec", "Recommendations link straight to the product page"].map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-teal text-white"><IcCheck className="h-3 w-3" /></span>{f}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <AIFinder />
        </Reveal>
      </div>
    </section>
  );
}

/* ================= 7. TRUST ================= */
function TrustBand() {
  return (
    <section className="border-b border-line bg-card">
      <div className="wrap grid grid-cols-2 gap-x-6 gap-y-8 py-12 md:grid-cols-3 lg:grid-cols-6">
        {TRUST_ITEMS.map((t, i) => {
          const Icon = TRUST_ICONS[t.icon];
          return (
            <Reveal key={t.title} delay={i * 50} className={i > 0 ? "lg:border-l lg:border-line lg:pl-6" : ""}>
              <div className="flex h-full flex-col">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-mint text-teal"><Icon className="h-5 w-5" /></span>
                <h3 className="mt-3 text-[13px] font-extrabold">{t.title}</h3>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-muted">{t.text}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ================= 8. FRESH ARRIVALS ================= */
function FreshSection({ items }: { items: typeof PRODUCTS }) {
  return (
    <section className="wrap py-14 md:py-20">
      <SectionHead
        eyebrow="Just unpacked"
        title="Fresh arrivals"
        sub="New stock as it lands — sealed, serial-verified and ready to ship anywhere in Kenya."
        right={<Link to="/shop?tag=new" className="btn btn-outline btn-sm">All new arrivals <IcArrowR className="h-3.5 w-3.5" /></Link>}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((p, i) => (
          <Reveal key={p.id} delay={i * 70}>
            <ProductCard p={p} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ================= 9. COMPARISON TEASER ================= */
function CompareTeaser() {
  const a = byId("p1")!;
  const b = byId("p6")!;
  const { addToCart } = useStore();
  return (
    <section className="border-y border-line bg-card py-14 md:py-20">
      <div className="wrap">
        <SectionHead
          eyebrow="Side-by-side, decided"
          title="Compare before you commit"
          sub="Two of our most-asked-about laptops, broken down spec by spec. Build your own comparison with up to three products."
          right={<Link to="/compare" className="btn btn-dark btn-sm"><IcSwap className="h-4 w-4" /> Build your own</Link>}
        />
        <Reveal>
          <div className="card overflow-hidden">
            {/* column headers */}
            <div className="grid grid-cols-[88px_1fr_1fr] gap-3 border-b border-line bg-mist/60 p-4 md:grid-cols-[160px_1fr_1fr] md:gap-6 md:p-6">
              <span className="self-end text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted">Spec</span>
              {[a, b].map((p) => (
                <div key={p.id} className="flex flex-col items-center text-center">
                  <Link to={`/product/${p.id}`} className="block w-full rounded-xl p-2 transition hover:bg-card" style={{ background: `linear-gradient(150deg, ${p.hue}1a, transparent)` }}>
                    <ProductArt kind={p.art} accent={p.hue} className="mx-auto h-20 md:h-28" />
                    <p className="mt-1 font-display text-[13px] font-bold md:text-[15px]">{p.name}</p>
                    <p className="text-xs font-bold text-teal">{fmt(p.price)}</p>
                  </Link>
                  <button type="button" className="btn btn-sm btn-outline mt-2.5 hidden md:inline-flex" onClick={() => addToCart(p.id)}>Add to cart</button>
                </div>
              ))}
            </div>
            {/* rows */}
            {COMPARE_ROWS.map((row, i) => {
              const winA = row.a.pct >= row.b.pct;
              return (
                <div key={row.label} className={`grid grid-cols-[88px_1fr_1fr] items-center gap-3 px-4 py-3 md:grid-cols-[160px_1fr_1fr] md:gap-6 md:px-6 ${i % 2 ? "bg-mist/40" : ""}`}>
                  <span className="text-xs font-extrabold text-muted">{row.label}</span>
                  {[{ side: row.a, win: winA, p: a }, { side: row.b, win: !winA, p: b }].map(({ side, win, p }, j) => (
                    <div key={j} className="min-w-0">
                      <p className={`flex items-center gap-1.5 truncate text-[12.5px] font-bold ${win ? "text-ink" : "text-muted"}`}>
                        {win && <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-teal text-white"><IcCheck className="h-2.5 w-2.5" /></span>}
                        {side.v}
                      </p>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line/60">
                        <div className={`h-full rounded-full ${win ? "bg-teal" : "bg-line"}`} style={{ width: `${side.pct}%` }} />
                      </div>
                      <span className="sr-only">{p.name}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= 10. GUIDES ================= */
function GuidesSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="guides" className="wrap py-14 md:py-20">
      <SectionHead
        eyebrow="Imara Knows"
        title="Buying guides & tech explainers"
        sub="We sell technology for a living — here's what we've learned, free of charge."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {GUIDES.map((g, i) => (
          <Reveal key={g.title} delay={i * 60}>
            <article className={`card overflow-hidden transition-all ${open === i ? "border-teal/50 shadow-[0_16px_40px_-20px_rgba(11,122,99,0.35)]" : ""}`}>
              <button type="button" onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-start gap-4 p-5 text-left" aria-expanded={open === i}>
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl font-display text-lg font-bold ${i % 2 ? "bg-amber/15 text-amberdeep" : "bg-mint text-teal"}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted">
                    <span className="rounded bg-mist px-2 py-0.5 text-teal">{g.tag}</span> {g.mins} min read
                  </span>
                  <span className="mt-1.5 block font-display text-[15px] font-bold leading-snug md:text-base">{g.title}</span>
                  <span className="mt-1 block text-[13px] font-semibold text-muted">{g.excerpt}</span>
                  {open === i && (
                    <span className="animate-pop mt-3 block space-y-2 border-t border-line pt-3">
                      {g.tips.map((t) => (
                        <span key={t} className="flex items-start gap-2 text-[13px] font-semibold text-ink/80">
                          <IcCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal" /> {t}
                        </span>
                      ))}
                    </span>
                  )}
                </span>
                <IcChevD className={`mt-1 h-4.5 w-4.5 shrink-0 text-muted transition-transform duration-300 ${open === i ? "rotate-180 text-teal" : ""}`} />
              </button>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ================= 11. TRANSPARENCY ================= */
function TransparencySection() {
  const pillars = [
    { title: "No fake reviews", text: "We're a new business, so we don't show invented stars. Every review published here will come from a real, verified customer." },
    { title: "Clear M-PESA process", text: "PayBill instructions with every order, verified personally on WhatsApp before dispatch. No hidden steps, no surprises." },
    { title: "Honest policies", text: "Delivery, returns, warranty and privacy — written in plain language and linked from every page of this store." },
  ];
  return (
    <section className="border-t border-line bg-card py-14 md:py-20">
      <div className="wrap">
        <SectionHead
          eyebrow="New store · built on trust"
          title="A new business, honest about it"
          sub="We don't pretend to have thousands of reviews yet. We earn trust the slower, better way — with transparency at every step."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((x, i) => (
            <Reveal key={x.title} delay={i * 80}>
              <div className="card flex h-full flex-col p-6">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-mint font-display text-sm font-bold text-teal">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3.5 font-display text-[15px] font-bold">{x.title}</h3>
                <p className="mt-1.5 text-[13px] font-semibold leading-relaxed text-muted">{x.text}</p>
              </div>
            </Reveal>
          ))}
          <Reveal delay={240}>
            <div className="flex h-full flex-col justify-center rounded-xl bg-ink p-6 text-white">
              <p className="font-display text-lg font-bold leading-snug">Questions before you order?</p>
              <p className="mt-1.5 text-[13px] font-semibold text-white/60">Talk to a real technician on WhatsApp — no bots, no scripts.</p>
              <WhatsAppButton message="Hello! I have a question before placing an order." className="mt-4 w-full">
                Chat with us on WhatsApp
              </WhatsAppButton>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ================= 12. NEWSLETTER ================= */
function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState(false);
  return (
    <section className="wrap py-14 md:py-20">
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl bg-teal px-6 py-12 text-white md:px-14 md:py-16">
          <div className="dots-bg pointer-events-none absolute inset-0 opacity-20" style={{ filter: "invert(1)" }} />
          <svg viewBox="0 0 200 200" className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 opacity-10" aria-hidden="true">
            <circle cx="100" cy="100" r="90" fill="none" stroke="white" strokeWidth="2" />
            <circle cx="100" cy="100" r="60" fill="none" stroke="white" strokeWidth="2" />
            <circle cx="100" cy="100" r="30" fill="none" stroke="white" strokeWidth="2" />
          </svg>
          <div className="relative grid items-center gap-8 md:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Stay ahead of the tech.</h2>
              <p className="mt-3 max-w-md text-[15px] font-semibold leading-relaxed text-white/75">
                Get new arrivals, member-only deals and useful technology tips —
                one email a week, no spam, unsubscribe anytime.
              </p>
            </div>
            {done ? (
              <p className="animate-pop flex items-center gap-3 rounded-xl border border-white/25 bg-white/10 px-5 py-4 text-[15px] font-bold">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-amber text-ink"><IcCheck className="h-4.5 w-4.5" /></span>
                Karibu aboard! Check your inbox to confirm. (Demo — no email sent.)
              </p>
            ) : (
              <form
                className={`flex flex-col gap-2.5 sm:flex-row ${err ? "animate-shake" : ""}`}
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setErr(true); window.setTimeout(() => setErr(false), 700); return; }
                  setDone(true);
                }}
              >
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.co.ke" aria-label="Email address"
                  className="h-12 flex-1 rounded-xl border border-white/25 bg-ink/20 px-4 text-sm font-semibold text-white outline-none placeholder:text-white/45 focus:border-amber"
                />
                <button type="submit" className="btn btn-amber !h-12 !px-6">Subscribe</button>
              </form>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
