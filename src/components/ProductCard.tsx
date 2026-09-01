import { useState } from "react";
import { Link } from "react-router-dom";
import { catName, discountOf, fmt, type Product } from "../data/products";
import { useStore } from "../lib/store";
import ProductArt from "./ProductArt";
import { Price } from "./ui";
import { IcCart, IcCheck, IcHeart, IcHeartFill, IcShield, IcSwap } from "./Icons";

export default function ProductCard({ p }: { p: Product }) {
  const { addToCart, wishlist, toggleWishlist, compare, toggleCompare } = useStore();
  const [added, setAdded] = useState(false);
  const wished = wishlist.includes(p.id);
  const compared = compare.includes(p.id);
  const d = discountOf(p);
  const out = p.stock === 0;

  const onAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (out) return;
    addToCart(p.id, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };

  return (
    <article
      className="group card relative flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-teal/40 hover:shadow-[0_18px_40px_-18px_rgba(10,31,28,0.28)]"
    >
      {/* Art tile */}
      <Link
        to={`/product/${p.id}`}
        className="relative block aspect-[4/3] overflow-hidden"
        style={{ background: `linear-gradient(150deg, ${p.hue}22, ${p.hue}06 70%)` }}
        aria-label={p.name}
      >
        <span className="dots-bg pointer-events-none absolute inset-0 opacity-60" />
        <ProductArt kind={p.art} accent={p.hue} className="absolute left-1/2 top-1/2 h-[86%] -translate-x-1/2 -translate-y-1/2 transition-transform duration-500 group-hover:scale-[1.06] group-hover:-rotate-1" />

        {/* Badges */}
        <span className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {d > 0 && (
            <span className="rounded-md bg-amber px-2 py-0.5 font-display text-[11px] font-bold text-ink shadow-sm">−{d}%</span>
          )}
          {p.tags.includes("new") && <span className="rounded-md bg-teal px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">New</span>}
          {p.tags.includes("bestseller") && <span className="rounded-md bg-ink px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber">Staff pick</span>}
          {p.condition !== "New" && <span className="rounded-md border border-line bg-card px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-muted">Renewed</span>}
        </span>

        {/* Compare (hover / touch always) */}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); toggleCompare(p.id); }}
          aria-label={compared ? "Remove from compare" : "Add to compare"}
          title="Compare"
          className={`absolute bottom-2.5 right-2.5 grid h-8 w-8 place-items-center rounded-lg border transition-all md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 ${
            compared ? "border-ink bg-ink text-amber" : "border-line bg-card/95 text-ink hover:border-teal hover:text-teal"
          }`}
        >
          <IcSwap className="h-4 w-4" />
        </button>

        {out && (
          <span className="absolute inset-x-0 bottom-0 bg-ink/85 py-1.5 text-center text-[11px] font-extrabold uppercase tracking-widest text-white/90">
            Out of stock
          </span>
        )}
      </Link>

      {/* Wishlist */}
      <button
        type="button"
        onClick={() => toggleWishlist(p.id)}
        aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
        className={`absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-lg border transition-all ${
          wished ? "border-error/30 bg-card text-error" : "border-line bg-card/95 text-muted hover:text-error"
        }`}
      >
        {wished ? <IcHeartFill className="h-4 w-4" /> : <IcHeart className="h-4 w-4" />}
      </button>

      {/* Body */}
      <div className="flex flex-1 flex-col p-3.5 md:p-4">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted">
          {p.brand} · {catName(p.category)}
        </p>
        <Link to={`/product/${p.id}`} className="mt-1 line-clamp-2 min-h-[2.5em] text-[15px] font-bold leading-snug transition hover:text-teal">
          {p.name}
        </Link>

        {/* Honest meta — no invented ratings */}
        <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-muted">
          <IcShield className="h-3.5 w-3.5 text-teal" /> {p.warranty}
        </p>

        <div className="mt-2.5">
          <Price p={p} />
        </div>

        <p className={`mt-1.5 flex items-center gap-1.5 text-[11px] font-bold ${out ? "text-error" : p.stock <= 5 ? "text-warning" : "text-success"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${out ? "bg-error" : p.stock <= 5 ? "bg-warning" : "bg-success"}`} />
          {out ? "Out of stock" : p.stock <= 5 ? `Only ${p.stock} left` : "In stock"}
        </p>

        <button
          type="button"
          onClick={onAdd}
          disabled={out}
          className={`btn btn-sm mt-3.5 w-full transition-all ${added ? "btn-teal" : "btn-amber"}`}
        >
          {added ? (<><IcCheck className="h-4 w-4" /> Added</>) : out ? "Sold out" : (<><IcCart className="h-4 w-4" /> Add to cart</>)}
        </button>
      </div>
    </article>
  );
}

export function MiniProduct({ p, note }: { p: Product; note?: string }) {
  return (
    <Link to={`/product/${p.id}`} className="group flex items-center gap-3 rounded-xl border border-line bg-card p-2.5 transition hover:border-teal/50 hover:shadow-md">
      <span className="grid h-14 w-16 shrink-0 place-items-center overflow-hidden rounded-lg" style={{ background: `linear-gradient(150deg, ${p.hue}22, ${p.hue}08)` }}>
        <ProductArt kind={p.art} accent={p.hue} className="h-[120%]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-bold transition group-hover:text-teal">{p.name}</span>
        <span className="block font-display text-[13px] font-bold text-teal">{fmt(p.price)}</span>
        {note && <span className="block truncate text-[11px] font-semibold text-muted">{note}</span>}
      </span>
    </Link>
  );
}
