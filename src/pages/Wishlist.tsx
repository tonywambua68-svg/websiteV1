import { Link } from "react-router-dom";
import { byId, fmt } from "../data/products";
import { useStore } from "../lib/store";
import ProductArt from "../components/ProductArt";
import { Crumbs, Empty, Price } from "../components/ui";
import { IcCart, IcCheck, IcHeart, IcTrash } from "../components/Icons";
import { useState } from "react";

export default function Wishlist() {
  const { wishlist, toggleWishlist, addToCart } = useStore();
  const items = wishlist.map(byId).filter(Boolean);
  const [moved, setMoved] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="wrap py-20">
        <Empty title="Your wishlist is empty" sub="Tap the heart on any product to save it here for later.">
          <Link to="/shop" className="btn btn-amber btn-sm"><IcHeart className="h-4 w-4" /> Discover products</Link>
        </Empty>
      </div>
    );
  }

  return (
    <div className="wrap py-8 md:py-12">
      <Crumbs items={[{ label: "Home", to: "/" }, { label: "Wishlist" }]} />
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl">Wishlist <span className="text-muted">({items.length})</span></h1>
      <p className="mt-2 text-sm font-semibold text-muted">Saved on this device — move items to your cart whenever you're ready.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => {
          if (!p) return null;
          const isMoved = moved === p.id;
          return (
            <div key={p.id} className="card group flex gap-4 p-4 transition hover:border-teal/40 hover:shadow-lg">
              <Link to={`/product/${p.id}`} className="grid h-24 w-28 shrink-0 place-items-center overflow-hidden rounded-xl" style={{ background: `linear-gradient(150deg, ${p.hue}22, ${p.hue}08)` }}>
                <ProductArt kind={p!.art} accent={p!.hue} className="h-[125%] transition-transform duration-500 group-hover:scale-105" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted">{p!.brand}</p>
                <Link to={`/product/${p.id}`} className="line-clamp-2 text-[14px] font-bold leading-snug hover:text-teal">{p!.name}</Link>
                <p className="mt-1 text-[11px] font-bold text-muted">{p!.warranty}</p>
                <div className="mt-1"><Price p={p!} /></div>
                <div className="mt-auto flex items-center gap-2 pt-2.5">
                  <button
                    type="button"
                    disabled={p!.stock === 0}
                    className={`btn btn-sm flex-1 ${isMoved ? "btn-teal" : "btn-amber"}`}
                    onClick={() => {
                      addToCart(p!.id, 1);
                      setMoved(p!.id);
                      window.setTimeout(() => setMoved(null), 1300);
                    }}
                  >
                    {isMoved ? <><IcCheck className="h-3.5 w-3.5" /> Moved</> : <><IcCart className="h-3.5 w-3.5" /> {p!.stock === 0 ? "Sold out" : "Move to cart"}</>}
                  </button>
                  <button type="button" onClick={() => toggleWishlist(p!.id)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-muted transition hover:border-error hover:text-error" aria-label={`Remove ${p!.name} from wishlist`}>
                    <IcTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs font-bold text-muted">
        Tip: prices drop? We'd flag it here in the real store. Total value saved: <b className="text-teal">{fmt(items.reduce((s, p) => s + (p?.price ?? 0), 0))}</b>
      </p>
    </div>
  );
}
