import { Link } from "react-router-dom";
import { byId, fmt } from "../data/products";
import { recentlyViewedIds } from "../lib/nova/analytics";
import ProductArt from "./ProductArt";
import { IcChevL, IcChevR } from "./Icons";
import { useRef } from "react";

/**
 * "Recently viewed" rail — the marketplace staple (Amazon/Jumia/AliExpress),
 * fed by the real behaviour log. Renders nothing until the customer has
 * actually browsed products.
 */
export default function RecentlyViewed({ excludeId, title = "Recently viewed" }: { excludeId?: string; title?: string }) {
  const ids = recentlyViewedIds(12).filter((id) => id !== excludeId);
  const scrollRef = useRef<HTMLDivElement>(null);
  if (ids.length === 0) return null;

  const nudge = (dir: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  return (
    <section aria-label={title} className="mt-14 md:mt-20">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="font-display text-xl font-bold tracking-tight md:text-2xl">{title}</h2>
        <div className="hidden gap-1.5 sm:flex">
          <button type="button" onClick={() => nudge(-1)} aria-label="Scroll left" className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted transition hover:border-teal hover:text-teal"><IcChevL className="h-4 w-4" /></button>
          <button type="button" onClick={() => nudge(1)} aria-label="Scroll right" className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted transition hover:border-teal hover:text-teal"><IcChevR className="h-4 w-4" /></button>
        </div>
      </div>
      <div ref={scrollRef} className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
        {ids.map((id) => {
          const p = byId(id);
          if (!p) return null;
          return (
            <Link
              key={id}
              to={`/product/${p.id}`}
              className="group w-44 shrink-0 overflow-hidden rounded-xl border border-line bg-card transition hover:-translate-y-0.5 hover:border-teal/40 hover:shadow-lg sm:w-52"
            >
              <span className="relative block aspect-[4/3] overflow-hidden" style={{ background: `linear-gradient(150deg, ${p.hue}22, ${p.hue}06 70%)` }}>
                <ProductArt kind={p.art} accent={p.hue} className="absolute left-1/2 top-1/2 h-[85%] -translate-x-1/2 -translate-y-1/2 transition-transform duration-500 group-hover:scale-105" />
                {p.stock === 0 && <span className="absolute inset-x-0 bottom-0 bg-ink/85 py-0.5 text-center text-[9px] font-extrabold uppercase tracking-widest text-white/90">Out of stock</span>}
              </span>
              <span className="block p-3">
                <span className="block truncate text-[12.5px] font-bold leading-snug transition group-hover:text-teal">{p.name}</span>
                <span className="mt-0.5 block font-display text-[13px] font-bold">{fmt(p.price)}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
