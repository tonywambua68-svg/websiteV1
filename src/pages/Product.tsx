import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { byId, catName, fmt, PRODUCTS, type Product as TProduct } from "../data/products";
import { useStore } from "../lib/store";
import { useAuth } from "../lib/AuthContext";
import { logView } from "../lib/nova/analytics";
import { addReview, getReviews, qualifyingOrder, type Review } from "../lib/reviews";
import ProductArt from "../components/ProductArt";
import ProductCard from "../components/ProductCard";
import RecentlyViewed from "../components/RecentlyViewed";
import { Crumbs, Empty, Price, Qty, Reveal, Stars } from "../components/ui";
import { productUrl, productWaMessage, WhatsAppButton } from "../components/Contact";
import { IcShare } from "../components/Icons";
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
  const { addToCart, wishlist, toggleWishlist, compare, toggleCompare, setDrawerOpen, toast } = useStore();
  const { user } = useAuth();
  const [qty, setQtyState] = useState(1);
  const [view, setView] = useState("tint");
  const [tab, setTab] = useState<"desc" | "specs" | "reviews" | "warranty">("desc");
  const [added, setAdded] = useState(false);

  // NOVA behaviour log — powers "Recently viewed" and admin insights.
  useEffect(() => {
    if (p) logView(p.id);
  }, [p?.id]);

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
            {getReviews(p.id).length > 0 ? (
              <button type="button" onClick={() => setTab("reviews")} className="flex items-center gap-1.5 underline-offset-2 hover:underline">
                <Stars value={getReviews(p.id).reduce((s, r) => s + r.rating, 0) / getReviews(p.id).length} size={14} />
                <span className="text-teal">{getReviews(p.id).length} verified review{getReviews(p.id).length > 1 ? "s" : ""}</span>
              </button>
            ) : (
              <>
                <span className="rounded-md bg-mint px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-teal">No reviews yet</span>
                <button type="button" onClick={() => setTab("reviews")} className="text-teal underline-offset-2 hover:underline">Be the first to review</button>
              </>
            )}
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

          {/* Share — social commerce, the Jumia/AliExpress way */}
          <ShareRow name={p.name} price={fmt(p.price)} id={p.id} onCopied={() => toast("Product link copied — share it anywhere.")} />
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

            {out && (
              <WhatsAppButton
                message={`Hello! The ${p.name} is out of stock on the website. Please notify me on WhatsApp as soon as it's back.`}
                className="mt-2.5 w-full !h-12 !text-[15px] !bg-teal hover:!bg-tealdeep"
              >
                Notify me when back in stock
              </WhatsAppButton>
            )}

            <button type="button" onClick={() => setDrawerOpen(true)} className="mt-2.5 w-full text-center text-xs font-extrabold text-teal underline-offset-2 hover:underline">
              View cart & checkout
            </button>

            <div className="mt-5 space-y-3 border-t border-line pt-4 text-[12.5px] font-semibold text-ink/80">
              <DeliveryEta />
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
          {tab === "reviews" && <ReviewsTab p={p} />}
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

      {/* ---------- Recently viewed ---------- */}
      <RecentlyViewed excludeId={p.id} />

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

/* ---------- Share (WhatsApp · Telegram · X · copy) ---------- */
function ShareRow({ name, price, id, onCopied }: { name: string; price: string; id: string; onCopied: () => void }) {
  const [srcP] = useState(() => byId(id));
  const msg = `${name} — ${price} · Imara Tech`;
  const url = srcP ? productUrl(srcP) : window.location.href;
  const enc = encodeURIComponent;
  const share = (href: string) => window.open(href, "_blank", "noopener");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${msg}\n${url}`);
      onCopied();
    } catch {
      onCopied();
    }
  };
  const btn = "grid h-9 w-9 place-items-center rounded-lg border border-line text-muted transition hover:-translate-y-0.5 hover:border-teal hover:text-teal";
  return (
    <div className="mt-4 flex items-center gap-2">
      <span className="mr-1 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-muted"><IcShare className="h-4 w-4 text-teal" /> Share</span>
      <button type="button" aria-label="Share on WhatsApp" className={`${btn} hover:!border-[#1b9e4b] hover:!text-[#1b9e4b]`} onClick={() => share(`https://wa.me/?text=${enc(msg + "\n" + url)}`)}>
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true"><path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.96L2 22l5.18-1.5A9.93 9.93 0 1 0 12.04 2Zm5.84 14.13c-.25.7-1.45 1.33-2 1.38-.53.05-1.03.24-3.47-.72-2.93-1.15-4.78-4.16-4.92-4.35-.14-.2-1.16-1.55-1.16-2.96 0-1.4.74-2.1 1-2.38.26-.29.57-.36.76-.36h.55c.18 0 .42-.07.66.5.25.6.84 2.07.91 2.22.07.14.12.31.02.5-.09.2-.14.31-.28.48-.14.17-.3.38-.42.51-.14.14-.29.3-.12.58.16.29.73 1.2 1.57 1.95 1.08.96 1.99 1.26 2.27 1.4.29.14.45.12.62-.07.16-.19.7-.82.89-1.1.19-.29.38-.24.64-.14.26.09 1.65.78 1.93.92.29.14.48.22.55.34.07.12.07.7-.18 1.4Z" /></svg>
      </button>
      <button type="button" aria-label="Share on Telegram" className={`${btn} hover:!border-[#0369a1] hover:!text-[#0369a1]`} onClick={() => share(`https://t.me/share/url?url=${enc(url)}&text=${enc(msg)}`)}>
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true"><path d="M21.9 4.6 19 19.3c-.2 1-.8 1.2-1.6.8l-4.5-3.3-2.2 2.1c-.24.24-.44.44-.9.44l.32-4.6L18.6 7c.37-.33-.08-.52-.57-.2L7.6 13.4l-4.5-1.4c-1-.3-1-1 .2-1.4l17-6.6c.8-.3 1.5.2 1.6 1.6Z" /></svg>
      </button>
      <button type="button" aria-label="Share on X" className={`${btn} hover:!border-ink hover:!text-ink`} onClick={() => share(`https://twitter.com/intent/tweet?text=${enc(msg)}&url=${enc(url)}`)}>
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true"><path d="M17.7 3H21l-7.3 8.3L22.2 21h-6.7l-5.2-6.2L4.3 21H1l7.8-8.9L1.8 3h6.9l4.7 5.7L17.7 3Zm-1.2 16h1.9L7.3 4.9H5.3L16.5 19Z" /></svg>
      </button>
      <button type="button" aria-label="Copy product link" className={btn} onClick={copy}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="h-4 w-4" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
      </button>
    </div>
  );
}

/* ---------- Live delivery estimate ---------- */
function DeliveryEta() {
  const [, force] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => force((n) => n + 1), 60000);
    return () => window.clearInterval(id);
  }, []);
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setHours(14, 0, 0, 0);
  const sameDay = now < cutoff;
  const fmtDay = (d: Date) => d.toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" });
  const nairobi = new Date(now);
  if (!sameDay) nairobi.setDate(nairobi.getDate() + 1);
  const country = new Date(now);
  country.setDate(country.getDate() + 2);
  const countryEnd = new Date(now);
  countryEnd.setDate(countryEnd.getDate() + 3);
  return (
    <p className="flex gap-2.5">
      <IcTruck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-teal" />
      <span>
        <b>Nairobi:</b>{" "}
        {sameDay ? (
          <>order within <b className="text-amberdeep">{Math.max(0, Math.floor((cutoff.getTime() - now.getTime()) / 3600000))}h {Math.floor(((cutoff.getTime() - now.getTime()) % 3600000) / 60000)}m</b> for <b>same-day delivery today</b></>
        ) : (
          <>order now → delivered <b>{fmtDay(nairobi)}</b></>
        )}
        <br />
        <b>Nationwide:</b> {fmtDay(country)} – {fmtDay(countryEnd)}
      </span>
    </p>
  );
}

/* ---------- Verified-purchase reviews (honesty-first) ---------- */
function ReviewsTab({ p }: { p: TProduct }) {
  const { orders, toast } = useStore();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>(() => getReviews(p.id));
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const qualifying = user ? qualifyingOrder(user, orders, p.id) : null;
  const alreadyReviewed = !!qualifying && reviews.some((r) => r.orderId === qualifying.id);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !qualifying) return;
    if (rating < 1) { setErr("Tap a star to rate the product."); return; }
    if (text.trim().length < 15) { setErr("Tell other shoppers a little more — at least 15 characters."); return; }
    setErr(null);
    addReview({ user, order: qualifying, productId: p.id, rating, title, text });
    setReviews(getReviews(p.id));
    setRating(0); setTitle(""); setText("");
    toast("Asante! Your verified review is live.");
  };

  return (
    <div className="max-w-3xl">
      {reviews.length > 0 ? (
        <>
          <div className="flex items-center gap-3">
            <p className="font-display text-4xl font-bold">
              {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
            </p>
            <div>
              <Stars value={reviews.reduce((s, r) => s + r.rating, 0) / reviews.length} size={16} />
              <p className="text-xs font-bold text-muted">{reviews.length} verified review{reviews.length > 1 ? "s" : ""} — all from real orders</p>
            </div>
          </div>
          <ul className="mt-5 space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-xl border border-line p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Stars value={r.rating} size={13} />
                  <span className="rounded bg-mint px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider text-success">✓ Verified purchase · {r.orderId}</span>
                </div>
                {r.title && <p className="mt-1.5 text-[14px] font-extrabold">{r.title}</p>}
                <p className="mt-1 text-[13.5px] font-semibold leading-relaxed text-muted">{r.text}</p>
                <p className="mt-2 text-[11px] font-bold text-muted">{r.userName} · {new Date(r.date).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}</p>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="rounded-xl bg-mist p-6 text-center">
          <p className="font-display text-lg font-bold">No reviews yet — every review here is earned, not invented</p>
          <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-relaxed text-muted">
            We only publish reviews from customers who actually ordered this product. Once it's in your order history, you can review it right here.
          </p>
        </div>
      )}

      {/* Write-a-review (verified purchase only) */}
      <div className="mt-6 rounded-xl border border-line p-5">
        <p className="font-display text-[15px] font-bold">Review this product</p>
        {!user ? (
          <p className="mt-2 text-[13px] font-semibold text-muted">
            <Link to="/auth?mode=login&redirect=%2Faccount" className="font-extrabold text-teal underline-offset-2 hover:underline">Sign in</Link> to review — only customers who ordered this product can write a review.
          </p>
        ) : !qualifying ? (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] font-semibold text-muted">Reviews unlock after this product appears in your orders — no fake five-stars, ever.</p>
            <Link to="/deals" className="btn btn-outline btn-sm">Browse deals</Link>
          </div>
        ) : alreadyReviewed ? (
          <p className="mt-2 flex items-center gap-2 text-[13px] font-extrabold text-success"><IcCheck className="h-4 w-4" /> You've already reviewed this order — asante!</p>
        ) : (
          <form className="mt-4 space-y-3.5" onSubmit={submit}>
            <div>
              <span className="mb-1.5 block text-xs font-extrabold text-muted">Your rating</span>
              <div className="flex gap-1" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    onClick={() => setRating(n)}
                    className={`transition hover:scale-110 ${n <= rating ? "text-amber" : "text-line"}`}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7" aria-hidden="true"><path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9Z" /></svg>
                  </button>
                ))}
              </div>
            </div>
            <input className="input" placeholder="Headline (optional), e.g. “Perfect for campus”" value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea className="input !h-28 !py-2.5" placeholder={`What should other shoppers know about the ${p.name}?`} value={text} onChange={(e) => setText(e.target.value)} />
            {err && <p className="animate-pop text-[12px] font-extrabold text-error">{err}</p>}
            <button type="submit" className="btn btn-amber">Publish verified review</button>
            <p className="text-[11px] font-bold text-muted">Linked to order {qualifying.id} · stored in this browser until a live backend is connected.</p>
          </form>
        )}
      </div>
    </div>
  );
}
