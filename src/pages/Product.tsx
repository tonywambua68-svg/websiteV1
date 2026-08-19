import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { byId, catName, fmt, PRODUCTS, type Product as TProduct } from "../data/products";
import { useStore } from "../lib/store";
import ProductArt from "../components/ProductArt";
import ProductCard from "../components/ProductCard";
import { Crumbs, Empty, Price, Qty, Reveal } from "../components/ui";
import { productWaMessage, WhatsAppButton } from "../components/Contact";
import {
  IcBox, IcCart, IcCheck, IcHeart, IcHeartFill, IcLock, IcRefresh, IcShield, IcSwap, IcTruck, IcWallet,
} from "../components/Icons";

const VIEWS = [
  { id: "tint", label: "Tinted studio" },
  { id: "mist", label: "Light studio" },
  { id: "dark", label: "Dark studio" },
  { id: "mint", label: "Mint studio" },
];

export default function ProductPage() {
  const { id } = useParams();
  const p = byId(id ?? "");
  const nav = useNavigate();
  const { addToCart, wishlist, toggleWishlist, compare, toggleCompare, setDrawerOpen } = useStore();
  const [qty, setQtyState] = useState(1);
  const [view, setView] = useState("tint");
  const [tab, setTab] = useState<"desc" | "specs" | "reviews" | "warranty">("desc");
  const [added, setAdded] = useState(false);

  const related = useMemo(
    () => (p ? PRODUCTS.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4) : []),
    [p],
  );
  const fbt = useMemo(() => {
    if (!p) return [];
    const picks = ["p27", "p26", "p18"].filter((x) => x !== p.id).slice(0, 2);
    return picks.map(byId).filter(Boolean) as TProduct[];
  }, [p]);
  const [fbtOn, setFbtOn] = useState<Record<string, boolean>>({ p27: true, p26: true });

  if (!p) {
    return (
      <div className="wrap py-20">
        <Empty title="Product not found" sub="This product may have sold out or the link is broken.">
          <Link to="/shop" className="btn btn-amber btn-sm">Back to shop</Link>
        </Empty>
      </div>
    );
  }

  const wished = wishlist.includes(p.id);
  const compared = compare.includes(p.id);
  const out = p.stock === 0;

  const onAdd = () => {
    if (out) return;
    addToCart(p.id, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };
  const buyNow = () => {
    if (out) return;
    addToCart(p.id, qty, true);
    nav("/checkout");
  };

  const fbtTotal = p.price * qty + fbt.filter((x) => fbtOn[x.id]).reduce((s, x) => s + x.price, 0);

  const bgFor = (v: string) =>
    v === "tint" ? `linear-gradient(150deg, ${p.hue}26, ${p.hue}08 70%)`
    : v === "mist" ? "linear-gradient(150deg, #eef3f1, #e2eae7)"
    : v === "dark" ? "linear-gradient(150deg, #10312c, #0a1f1c)"
    : "linear-gradient(150deg, #dff0ea, #cfe7df)";

  return (
    <div className="wrap pb-24 pt-6 md:pb-8 md:pt-10">
      <Crumbs items={[{ label: "Home", to: "/" }, { label: "Shop", to: "/shop" }, { label: catName(p.category), to: `/shop?cat=${p.category}` }, { label: p.name }]} />

      <div className="mt-5 grid gap-8 lg:grid-cols-12">
        {/* ---------- Gallery ---------- */}
        <div className="lg:col-span-5">
          <div className="relative overflow-hidden rounded-2xl border border-line transition-colors duration-500" style={{ background: bgFor(view) }}>
            <span className={`dots-bg pointer-events-none absolute inset-0 ${view === "dark" ? "opacity-20" : "opacity-60"}`} />
            <ProductArt key={view} kind={p.art} accent={view === "dark" ? "#f5a31a" : p.hue} className="animate-pop relative mx-auto h-72 w-full max-w-md md:h-96" />
            {p.oldPrice && (
              <span className="absolute left-4 top-4 rounded-lg bg-amber px-2.5 py-1 font-display text-sm font-bold text-ink">
                Save {fmt(p.oldPrice - p.price)}
              </span>
            )}
            <div className="absolute right-4 top-4 flex flex-col gap-2">
              <button type="button" onClick={() => toggleWishlist(p.id)} aria-label="Toggle wishlist"
                className={`grid h-10 w-10 place-items-center rounded-xl border transition ${wished ? "border-error/30 bg-card text-error" : "border-line bg-card/95 text-muted hover:text-error"}`}>
                {wished ? <IcHeartFill className="h-4.5 w-4.5" /> : <IcHeart className="h-4.5 w-4.5" />}
              </button>
              <button type="button" onClick={() => toggleCompare(p.id)} aria-label="Toggle compare"
                className={`grid h-10 w-10 place-items-center rounded-xl border transition ${compared ? "border-ink bg-ink text-amber" : "border-line bg-card/95 text-muted hover:text-teal"}`}>
                <IcSwap className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2.5">
            {VIEWS.map((v) => (
              <button key={v.id} type="button" onClick={() => setView(v.id)} aria-label={`View: ${v.label}`}
                className={`overflow-hidden rounded-xl border-2 p-1.5 transition ${view === v.id ? "border-teal" : "border-line hover:border-teal/50"}`}
                style={{ background: bgFor(v.id) }}>
                <ProductArt kind={p.art} accent={v.id === "dark" ? "#f5a31a" : p.hue} className="mx-auto h-12 w-full" />
              </button>
            ))}
          </div>
        </div>

        {/* ---------- Info ---------- */}
        <div className="lg:col-span-4">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/shop?q=${encodeURIComponent(p.brand)}`} className="rounded-md bg-mint px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-teal">{p.brand}</Link>
            <span className={`rounded-md px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider ${p.condition === "New" ? "bg-mist text-muted" : "bg-amber/15 text-amberdeep"}`}>{p.condition}</span>
          </div>
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight md:text-3xl">{p.name}</h1>
          <p className="mt-1 text-sm font-semibold text-muted">{p.tagline}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] font-bold">
            <span className="rounded-md bg-mint px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-teal">No reviews yet</span>
            <button type="button" onClick={() => setTab("reviews")} className="text-teal underline-offset-2 hover:underline">Be the first to review</button>
          </div>

          <div className="mt-5 rounded-2xl border border-line bg-card p-5">
            <Price p={p} big />
            <p className={`mt-2 flex items-center gap-1.5 text-[13px] font-bold ${out ? "text-error" : p.stock <= 5 ? "text-warning" : "text-success"}`}>
              <span className={`h-2 w-2 rounded-full ${out ? "bg-error" : p.stock <= 5 ? "bg-warning" : "bg-success"}`} />
              {out ? "Out of stock — back soon" : p.stock <= 5 ? `Hurry — only ${p.stock} left in stock` : `In stock · ${p.stock} available`}
            </p>
            <ul className="mt-4 space-y-2 border-t border-line pt-4">
              {p.specs.slice(0, 5).map(([k, v]) => (
                <li key={k} className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="font-bold text-muted">{k}</span>
                  <span className="text-right font-extrabold">{v}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-4 flex items-center gap-2 text-xs font-bold text-muted">
            <IcBox className="h-4 w-4 text-teal" /> In the box: {p.inBox.join(" · ")}
          </p>
        </div>

        {/* ---------- Buy box ---------- */}
        <aside className="lg:col-span-3">
          <div className="card sticky top-40 p-5">
            <p className="text-xs font-extrabold uppercase tracking-wider text-muted">Quantity</p>
            <div className="mt-2"><Qty value={qty} onChange={(v) => setQtyState(Math.max(1, v))} /></div>

            <button type="button" onClick={onAdd} disabled={out} className={`btn mt-4 w-full !h-12 !text-[15px] ${added ? "btn-teal" : "btn-amber"}`}>
              {added ? <><IcCheck className="h-5 w-5" /> Added to cart</> : <><IcCart className="h-5 w-5" /> Add to cart</>}
            </button>
            <button type="button" onClick={buyNow} disabled={out} className="btn btn-dark mt-2.5 w-full !h-12 !text-[15px]">Buy now</button>

            <WhatsAppButton message={productWaMessage(p, qty)} disabled={out} className="mt-2.5 w-full !h-12 !text-[15px]">
              Order via WhatsApp
            </WhatsAppButton>

            <button type="button" onClick={() => setDrawerOpen(true)} className="mt-2.5 w-full text-center text-xs font-extrabold text-teal underline-offset-2 hover:underline">
              View cart & checkout
            </button>

            <div className="mt-5 space-y-3 border-t border-line pt-4 text-[12.5px] font-semibold text-ink/80">
              <p className="flex gap-2.5"><IcTruck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-teal" /><span><b>Nairobi:</b> same-day (order before 2 PM) · KSh 300<br /><b>Nationwide:</b> 1–3 working days · from KSh 500</span></p>
              <p className="flex gap-2.5"><IcWallet className="mt-0.5 h-4.5 w-4.5 shrink-0 text-teal" /><span><b>Pay with M-PESA PayBill</b> — clear instructions at checkout, verified on WhatsApp</span></p>
              <p className="flex gap-2.5"><IcShield className="mt-0.5 h-4.5 w-4.5 shrink-0 text-teal" /><span><b>{p.warranty}</b>, honoured in Kenya</span></p>
              <p className="flex gap-2.5"><IcRefresh className="mt-0.5 h-4.5 w-4.5 shrink-0 text-teal" /><span><b>7-day returns</b> — sealed items, no questions asked</span></p>
              <p className="flex gap-2.5"><IcLock className="mt-0.5 h-4.5 w-4.5 shrink-0 text-teal" /><span>Secure checkout · this is a design demo, no payment is processed</span></p>
            </div>
          </div>
        </aside>
      </div>

      {/* ---------- Tabs ---------- */}
      <div className="mt-12">
        <div className="flex flex-wrap gap-1.5 border-b border-line" role="tablist" aria-label="Product information">
          {([["desc", "Description"], ["specs", "Specifications"], ["reviews", "Reviews"], ["warranty", "Warranty & Delivery"]] as const).map(([key, label]) => (
            <button key={key} role="tab" aria-selected={tab === key} type="button" onClick={() => setTab(key)}
              className={`rounded-t-xl px-4 py-2.5 text-[13px] font-extrabold transition ${tab === key ? "border border-b-0 border-line bg-card text-teal" : "text-muted hover:text-ink"}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="card rounded-tl-none p-5 md:p-7">
          {tab === "desc" && (
            <div className="max-w-3xl">
              <p className="text-[15px] font-semibold leading-relaxed text-ink/85">{p.description}</p>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Every product we list is sourced from authorised distributors, tested before dispatch
                and delivered sealed with its warranty documentation. If anything looks off,
                our WhatsApp support team makes it right.
              </p>
            </div>
          )}
          {tab === "specs" && (
            <dl className="grid max-w-3xl gap-x-10 sm:grid-cols-2">
              {p.specs.map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 text-sm">
                  <dt className="font-bold text-muted">{k}</dt>
                  <dd className="text-right font-extrabold">{v}</dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 text-sm">
                <dt className="font-bold text-muted">Warranty</dt><dd className="text-right font-extrabold">{p.warranty}</dd>
              </div>
            </dl>
          )}
          {tab === "reviews" && (
            <div className="max-w-3xl">
              <div className="rounded-xl bg-mist p-6 text-center">
                <p className="font-display text-lg font-bold">No reviews yet — be the first</p>
                <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-relaxed text-muted">
                  We're a new store, and we only publish reviews from real, verified customers —
                  never invented ones. Once you've ordered and used this product, we'll invite you
                  to share your experience here.
                </p>
                <WhatsAppButton message={`Hello! I'd like to order the ${p.name} (${fmt(p.price)}). Please confirm availability.`} className="mt-4">
                  Order now & review later
                </WhatsAppButton>
              </div>
              <p className="mt-4 text-[11.5px] font-bold text-muted">
                Reviews will appear on this page as soon as verified customers share them. Until then,
                our specs, warranty and policies speak for the product.
              </p>
            </div>
          )}
          {tab === "warranty" && (
            <div className="grid max-w-3xl gap-5 sm:grid-cols-2">
              <div className="rounded-xl border border-line p-5">
                <p className="flex items-center gap-2 font-display text-[15px] font-bold"><IcShield className="h-5 w-5 text-teal" /> {p.warranty}</p>
                <p className="mt-2 text-[13px] font-semibold leading-relaxed text-muted">Covers manufacturing defects. Claims are coordinated over WhatsApp — we arrange courier pickup from anywhere in Kenya and keep you updated at every step.</p>
              </div>
              <div className="rounded-xl border border-line p-5">
                <p className="flex items-center gap-2 font-display text-[15px] font-bold"><IcRefresh className="h-5 w-5 text-teal" /> 7-day returns</p>
                <p className="mt-2 text-[13px] font-semibold leading-relaxed text-muted">Sealed products return free within 7 days. Opened items qualify if faulty. M-Pesa refunds land within 24 hours of approval.</p>
              </div>
              <div className="rounded-xl border border-line p-5 sm:col-span-2">
                <p className="flex items-center gap-2 font-display text-[15px] font-bold"><IcTruck className="h-5 w-5 text-teal" /> Delivery estimates</p>
                <ul className="mt-2 grid gap-1.5 text-[13px] font-semibold text-muted sm:grid-cols-3">
                  <li>Nairobi CBD & environs — <b className="text-ink">same day</b></li>
                  <li>Mombasa · Kisumu · Nakuru — <b className="text-ink">1–2 days</b></li>
                  <li>Rest of Kenya — <b className="text-ink">2–3 days</b></li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---------- Frequently bought together ---------- */}
      <Reveal className="mt-12">
        <h2 className="font-display text-xl font-bold md:text-2xl">Frequently bought together</h2>
        <div className="card mt-4 flex flex-col gap-4 p-5 md:flex-row md:items-center">
          <div className="flex flex-1 flex-col gap-3">
            {[p, ...fbt].map((x, i) => (
              <div key={x.id} className="flex items-center gap-3">
                {i > 0 ? (
                  <label className="flex flex-1 cursor-pointer items-center gap-3">
                    <input type="checkbox" checked={!!fbtOn[x.id]} onChange={() => setFbtOn((s) => ({ ...s, [x.id]: !s[x.id] }))} className="sr-only" />
                    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded border transition ${fbtOn[x.id] ? "border-teal bg-teal text-white" : "border-line"}`}>
                      {fbtOn[x.id] && <IcCheck className="h-3 w-3" />}
                    </span>
                    <ComboRow x={x} />
                  </label>
                ) : (
                  <div className="flex flex-1 items-center gap-3">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded border border-teal bg-teal text-white"><IcCheck className="h-3 w-3" /></span>
                    <ComboRow x={x} />
                  </div>
                )}
                {i === 0 && fbt.length > 0 && <span className="hidden font-display text-xl font-bold text-muted sm:block">+</span>}
              </div>
            ))}
          </div>
          <div className="border-t border-line pt-4 md:w-64 md:border-l md:border-t-0 md:pl-6 md:pt-0">
            <p className="text-xs font-extrabold uppercase tracking-wider text-muted">Total for selected</p>
            <p className="mt-1 font-display text-2xl font-bold">{fmt(fbtTotal)}</p>
            <button type="button" className="btn btn-amber mt-3 w-full" onClick={() => {
              addToCart(p.id, qty, true);
              fbt.filter((x) => fbtOn[x.id]).forEach((x) => addToCart(x.id, 1, true));
            }}>
              <IcCart className="h-4.5 w-4.5" /> Add bundle to cart
            </button>
          </div>
        </div>
      </Reveal>

      {/* ---------- Related ---------- */}
      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display text-xl font-bold md:text-2xl">More in {catName(p.category)}</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((x, i) => (
              <Reveal key={x.id} delay={i * 60}><ProductCard p={x} /></Reveal>
            ))}
          </div>
        </div>
      )}

      {/* ---------- Mobile sticky buy bar ---------- */}
      <div className="fixed inset-x-0 bottom-14 z-[54] border-t border-line bg-card/95 p-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-bold text-muted">{p.name}</p>
            <p className="font-display text-lg font-bold leading-tight">{fmt(p.price)}</p>
          </div>
          <button type="button" onClick={onAdd} disabled={out} className={`btn !h-11 !px-5 ${added ? "btn-teal" : "btn-amber"}`}>
            {added ? "Added ✓" : "Add to cart"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ComboRow({ x }: { x: TProduct }) {
  return (
    <>
      <span className="grid h-12 w-16 shrink-0 place-items-center overflow-hidden rounded-lg" style={{ background: `linear-gradient(150deg, ${x.hue}22, ${x.hue}08)` }}>
        <ProductArt kind={x.art} accent={x.hue} className="h-[130%]" />
      </span>
      <span className="min-w-0">
        <Link to={`/product/${x.id}`} className="block truncate text-[13px] font-bold hover:text-teal">{x.name}</Link>
        <span className="block font-display text-[13px] font-bold text-teal">{fmt(x.price)}</span>
      </span>
    </>
  );
}
