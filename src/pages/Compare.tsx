import { useMemo } from "react";
import { Link } from "react-router-dom";
import { byId, fmt, PRODUCTS, type Product } from "../data/products";
import { useStore } from "../lib/store";
import ProductArt from "../components/ProductArt";
import { Crumbs, Empty } from "../components/ui";
import { IcCheck, IcPlus, IcSwap, IcX } from "../components/Icons";

const ROWS: { label: string; get: (p: Product) => string }[] = [
  { label: "Price", get: (p) => fmt(p.price) },
  { label: "Processor", get: (p) => p.processor ?? "—" },
  { label: "RAM", get: (p) => p.ram ?? "—" },
  { label: "Storage", get: (p) => p.storage ?? "—" },
  { label: "Display", get: (p) => p.screen ? p.specs.find(([k]) => /display/i.test(k))?.[1] ?? p.screen : p.specs.find(([k]) => /display/i.test(k))?.[1] ?? "—" },
  { label: "Graphics", get: (p) => p.graphics ?? "—" },
  { label: "Battery", get: (p) => p.battery ?? "—" },
  { label: "Condition", get: (p) => p.condition },
  { label: "Warranty", get: (p) => p.warranty },
];

export default function Compare() {
  const { compare, toggleCompare, clearCompare, addToCart } = useStore();
  const items = compare.map(byId).filter(Boolean) as Product[];

  const suggestions = useMemo(
    () => (items.length < 3 ? PRODUCTS.filter((p) => !compare.includes(p.id) && ["laptops", "phones", "gaming"].includes(p.category)).slice(0, 3) : []),
    [compare, items.length],
  );

  if (items.length === 0) {
    return (
      <div className="wrap py-20">
        <Empty title="Nothing to compare yet" sub="Use the ⇄ button on any product card to add it here — up to three, side by side.">
          {PRODUCTS.slice(0, 3).map((p) => (
            <button key={p.id} type="button" className="btn btn-outline btn-sm" onClick={() => toggleCompare(p.id)}>
              <IcPlus className="h-3.5 w-3.5" /> {p.name}
            </button>
          ))}
        </Empty>
      </div>
    );
  }

  const bestPrice = Math.min(...items.map((p) => p.price));

  return (
    <div className="wrap py-8 md:py-12">
      <Crumbs items={[{ label: "Home", to: "/" }, { label: "Compare" }]} />
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
            <IcSwap className="h-8 w-8 text-teal" /> Compare ({items.length}/3)
          </h1>
          <p className="mt-2 text-sm font-semibold text-muted">Green ticks mark the strongest spec in each row.</p>
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={clearCompare}>Clear all</button>
      </div>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-mist/60">
              <th className="w-32 p-4 text-left align-bottom text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted md:w-40">Product</th>
              {items.map((p) => (
                <th key={p.id} className="p-4 text-center align-top">
                  <button type="button" onClick={() => toggleCompare(p.id)} className="absolute right-2 top-2 hidden" aria-hidden="true" tabIndex={-1} />
                  <div className="relative">
                    <button type="button" onClick={() => toggleCompare(p.id)} className="absolute -top-1 right-0 grid h-7 w-7 place-items-center rounded-lg border border-line bg-card text-muted transition hover:border-error hover:text-error" aria-label={`Remove ${p.name}`}>
                      <IcX className="h-3.5 w-3.5" />
                    </button>
                    <Link to={`/product/${p.id}`} className="block rounded-xl p-2 transition hover:bg-card" style={{ background: `linear-gradient(150deg, ${p.hue}1c, transparent)` }}>
                      <ProductArt kind={p.art} accent={p.hue} className="mx-auto h-24 md:h-32" />
                      <p className="mt-1.5 font-display text-[14px] font-bold leading-snug">{p.name}</p>
                      <p className="text-xs font-bold text-muted">{p.brand}</p>
                    </Link>
                    <p className="mt-1.5 text-[11px] font-bold text-muted">{p.warranty}</p>
                    <button type="button" className="btn btn-sm btn-amber mt-2.5 w-full" onClick={() => addToCart(p.id)}>Add to cart</button>
                  </div>
                </th>
              ))}
              {items.length < 3 && (
                <th className="w-44 p-4 align-top">
                  <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line p-3">
                    <p className="text-xs font-extrabold text-muted">Add another</p>
                    {suggestions.map((s) => (
                      <button key={s.id} type="button" onClick={() => toggleCompare(s.id)} className="w-full rounded-lg border border-line px-2 py-1.5 text-[11px] font-bold transition hover:border-teal hover:text-teal">
                        + {s.name}
                      </button>
                    ))}
                  </div>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, ri) => {
              const vals = items.map(row.get);
              const numVals = vals.map((v) => parseInt(v.replace(/[^\d]/g, "")));
              const isPrice = row.label === "Price";
              const best = isPrice ? Math.min(...numVals) : null;
              return (
                <tr key={row.label} className={ri % 2 ? "bg-mist/40" : ""}>
                  <td className="p-4 text-xs font-extrabold text-muted">{row.label}</td>
                  {items.map((p, i) => {
                    const isBest = best !== null && numVals[i] === best;
                    return (
                      <td key={p.id} className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 text-[13px] font-bold ${isBest ? "text-teal" : ""}`}>
                          {isBest && <span className="grid h-4.5 w-4.5 place-items-center rounded-full bg-teal text-white"><IcCheck className="h-2.5 w-2.5" /></span>}
                          {vals[i]}
                          {isPrice && p.price === bestPrice && items.length > 1 && <span className="rounded bg-mint px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-success">Best price</span>}
                        </span>
                      </td>
                    );
                  })}
                  {items.length < 3 && <td />}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-center text-xs font-bold text-muted">
        Compare runs fully in your browser — selections persist between visits on this device.
      </p>
    </div>
  );
}
