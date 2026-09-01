import { useMemo } from "react";
import { Link } from "react-router-dom";
import { CATEGORIES, PRODUCTS, type CategoryId } from "../data/products";
import ProductCard from "../components/ProductCard";
import { Crumbs, Reveal, useCountdown } from "../components/ui";
import { IcBolt, IcTag } from "../components/Icons";
import { useSearchParams } from "react-router-dom";

export default function Deals() {
  const t = useCountdown();
  const [params, setParams] = useSearchParams();
  const cat = params.get("cat") as CategoryId | null;

  const deals = useMemo(() => {
    let list = PRODUCTS.filter((p) => p.oldPrice && p.oldPrice > p.price);
    if (cat) list = list.filter((p) => p.category === cat);
    return list.sort((a, b) => (1 - b.price / b.oldPrice!) - (1 - a.price / a.oldPrice!));
  }, [cat]);

  const activeCats = CATEGORIES.filter((c) => PRODUCTS.some((p) => p.category === c.id && p.oldPrice));

  return (
    <div className="pb-4">
      {/* Deal header */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="grid-lines pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-amber/15 blur-[110px]" />
        <div className="wrap relative flex flex-wrap items-center justify-between gap-6 py-12 md:py-16">
          <div>
            <Crumbs items={[{ label: "Home", to: "/" }, { label: "Deals" }]} />
            <h1 className="mt-3 flex items-center gap-3 font-display text-3xl font-bold tracking-tight md:text-5xl">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber text-ink md:h-14 md:w-14"><IcBolt className="h-6 w-6 md:h-8 md:w-8" /></span>
              Today's Top Deals
            </h1>
            <p className="mt-3 max-w-lg text-sm font-semibold leading-relaxed text-white/60 md:text-[15px]">
              Genuine products at their lowest prices — refreshed daily at midnight.
              Stack code <b className="text-amber">IMARA5</b> at checkout for an extra 5% off.
            </p>
          </div>
          <div className="rounded-2xl border border-amber/30 bg-amber/10 px-6 py-4 text-center">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-white/50">Ends in</p>
            <p className="tabular font-display text-4xl font-bold tracking-widest text-amber" aria-live="off">{t}</p>
          </div>
        </div>
      </section>

      <div className="wrap pt-8">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setParams({})} className={`chip ${!cat ? "chip-on" : ""}`}>All deals</button>
          {activeCats.map((c) => (
            <button key={c.id} type="button" onClick={() => setParams({ cat: c.id })} className={`chip ${cat === c.id ? "chip-on" : ""}`}>{c.name}</button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {deals.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 60}>
              <ProductCard p={p} />
            </Reveal>
          ))}
        </div>

        <div className="card mt-10 flex flex-col items-center gap-4 p-6 text-center md:flex-row md:text-left">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-mint text-teal"><IcTag className="h-6 w-6" /></span>
          <div className="flex-1">
            <p className="font-display text-lg font-bold">Deal alert, weekly</p>
            <p className="text-sm font-semibold text-muted">Join the newsletter and get Monday's deal list before anyone else. No spam — one email a week.</p>
          </div>
          <Link to="/#finder" className="btn btn-teal">Get deal alerts</Link>
        </div>
      </div>
    </div>
  );
}
