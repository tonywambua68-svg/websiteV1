import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CATEGORIES, PRODUCTS, discountOf, type CategoryId, type Product } from "../data/products";
import ProductCard from "../components/ProductCard";
import { Crumbs, Empty, Reveal } from "../components/ui";
import { IcChevD, IcFilter, IcX } from "../components/Icons";

type SortKey = "featured" | "price-asc" | "price-desc" | "discount" | "newest";

interface Filters {
  cats: CategoryId[];
  brands: string[];
  min: string;
  max: string;
  rating: number; // 0 = any
  inStock: boolean;
  condition: string[]; // 'New' | 'Certified Refurbished'
  rams: string[];
  storages: string[];
  screens: string[];
}

const EMPTY: Filters = { cats: [], brands: [], min: "", max: "", rating: 0, inStock: false, condition: [], rams: [], storages: [], screens: [] };

const screenNum = (s?: string) => (s ? parseFloat(s.replace('"', "")) : NaN);

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const q = (params.get("q") ?? "").trim();
  const urlCat = params.get("cat") as CategoryId | null;
  const urlTag = params.get("tag");

  const [f, setF] = useState<Filters>(EMPTY);
  const [sort, setSort] = useState<SortKey>("featured");
  const [sheetOpen, setSheetOpen] = useState(false);

  // Sync URL category into filters
  useEffect(() => {
    setF((prev) => ({ ...prev, cats: urlCat ? [urlCat] : prev.cats }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCat, q, urlTag]);

  const set = (patch: Partial<Filters>) => setF((prev) => ({ ...prev, ...patch }));
  const toggleIn = <T,>(arr: T[], v: T): T[] => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const allBrands = useMemo(() => [...new Set(PRODUCTS.map((p) => p.brand))].sort(), []);
  const allRams = useMemo(() => [...new Set(PRODUCTS.map((p) => p.ram).filter(Boolean))] as string[], []);
  const allStorages = useMemo(() => [...new Set(PRODUCTS.map((p) => p.storage).filter(Boolean))] as string[], []);

  const filtered = useMemo(() => {
    let list = PRODUCTS.slice();
    const term = q.toLowerCase();
    if (term) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(term) || p.brand.toLowerCase().includes(term) ||
          p.category.includes(term) || p.tagline.toLowerCase().includes(term) ||
          p.specs.some(([k, v]) => `${k} ${v}`.toLowerCase().includes(term)),
      );
    }
    if (urlTag === "new") list = list.filter((p) => p.tags.includes("new"));
    if (urlTag === "deal") list = list.filter((p) => p.oldPrice);
    if (f.cats.length) list = list.filter((p) => f.cats.includes(p.category));
    if (f.brands.length) list = list.filter((p) => f.brands.includes(p.brand));
    const min = parseInt(f.min) || 0;
    const max = parseInt(f.max) || Infinity;
    list = list.filter((p) => p.price >= min && p.price <= max);

    if (f.inStock) list = list.filter((p) => p.stock > 0);
    if (f.condition.length) list = list.filter((p) => f.condition.includes(p.condition));
    if (f.rams.length) list = list.filter((p) => p.ram && f.rams.includes(p.ram));
    if (f.storages.length) list = list.filter((p) => p.storage && f.storages.includes(p.storage));
    if (f.screens.length) {
      list = list.filter((p) => {
        const n = screenNum(p.screen);
        if (Number.isNaN(n)) return false;
        return f.screens.some((s) => {
          if (s === "Under 14″") return n < 13.5;
          if (s === "14–16″") return n >= 13.5 && n <= 16.5;
          if (s === "Over 24″") return n > 24;
          return false;
        });
      });
    }
    switch (sort) {
      case "price-asc": list.sort((a, b) => a.price - b.price); break;
      case "price-desc": list.sort((a, b) => b.price - a.price); break;

      case "discount": list.sort((a, b) => discountOf(b) - discountOf(a)); break;
      case "newest": list.sort((a, b) => Number(b.tags.includes("new")) - Number(a.tags.includes("new"))); break;
      default: list.sort((a, b) => Number(b.tags.includes("bestseller")) - Number(a.tags.includes("bestseller")));
    }
    return list;
  }, [q, urlTag, f, sort]);

  const activeChips: { label: string; clear: () => void }[] = [
    ...f.cats.map((c) => ({ label: CATEGORIES.find((x) => x.id === c)?.name ?? c, clear: () => set({ cats: f.cats.filter((x) => x !== c) }) })),
    ...f.brands.map((b) => ({ label: b, clear: () => set({ brands: f.brands.filter((x) => x !== b) }) })),
    ...(f.min || f.max ? [{ label: `KSh ${f.min || "0"} – ${f.max || "∞"}`, clear: () => set({ min: "", max: "" }) }] : []),

    ...(f.inStock ? [{ label: "In stock", clear: () => set({ inStock: false }) }] : []),
    ...f.condition.map((c) => ({ label: c === "New" ? "New" : "Renewed", clear: () => set({ condition: f.condition.filter((x) => x !== c) }) })),
    ...f.rams.map((r) => ({ label: `${r} RAM`, clear: () => set({ rams: f.rams.filter((x) => x !== r) }) })),
    ...f.storages.map((s) => ({ label: s, clear: () => set({ storages: f.storages.filter((x) => x !== s) }) })),
    ...f.screens.map((s) => ({ label: s, clear: () => set({ screens: f.screens.filter((x) => x !== s) }) })),
  ];

  const title = q
    ? `Results for “${q}”`
    : urlTag === "new" ? "New Arrivals"
    : urlTag === "deal" ? "Deals & Offers"
    : f.cats.length === 1 ? CATEGORIES.find((c) => c.id === f.cats[0])?.name ?? "Shop"
    : "All Products";

  const subtitle = f.cats.length === 1 && !q
    ? CATEGORIES.find((c) => c.id === f.cats[0])?.short
    : q ? "Search matches names, brands and full spec sheets." : undefined;

  return (
    <div className="wrap py-8 md:py-12">
      <Crumbs items={[{ label: "Home", to: "/" }, { label: "Shop", to: "/shop" }, ...(title !== "All Products" ? [{ label: title }] : [])]} />

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
          {subtitle && <p className="mt-1.5 max-w-xl text-sm font-semibold text-muted">{subtitle}</p>}
          <p className="mt-2 text-[13px] font-bold text-teal">{filtered.length} product{filtered.length === 1 ? "" : "s"} · prices in KSh, VAT inclusive</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-outline btn-sm lg:hidden" onClick={() => setSheetOpen(true)}>
            <IcFilter className="h-4 w-4" /> Filters{activeChips.length > 0 && ` (${activeChips.length})`}
          </button>
          <label className="flex items-center gap-2 text-xs font-extrabold text-muted">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="input !h-10 !w-44 !text-[13px] font-bold"
              aria-label="Sort products"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: low → high</option>
              <option value="price-desc">Price: high → low</option>

              <option value="discount">Biggest discount</option>
              <option value="newest">Newest first</option>
            </select>
          </label>
        </div>
      </div>

      {activeChips.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {activeChips.map((c, i) => (
            <button key={i} type="button" onClick={c.clear} className="chip chip-on" title="Remove filter">
              {c.label} <IcX className="h-3 w-3" />
            </button>
          ))}
          <button type="button" onClick={() => setF(EMPTY)} className="text-xs font-extrabold text-error underline-offset-2 hover:underline">Clear all</button>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[250px_1fr]">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-40 max-h-[calc(100vh-11rem)] overflow-y-auto pr-1 no-scrollbar">
            <FilterPanel f={f} set={set} toggleIn={toggleIn} allBrands={allBrands} allRams={allRams} allStorages={allStorages} onClear={() => setF(EMPTY)} />
          </div>
        </aside>

        {/* Grid */}
        <div>
          {filtered.length === 0 ? (
            <Empty title="No products match those filters" sub="Try widening the price range or clearing a filter or two.">
              <button type="button" className="btn btn-amber btn-sm" onClick={() => setF(EMPTY)}>Clear all filters</button>
              <Link to="/shop" className="btn btn-outline btn-sm">Back to shop</Link>
            </Empty>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((p, i) => (
                <Reveal key={p.id} delay={(i % 3) * 60}>
                  <ProductCard p={p} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-[65] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button type="button" className="animate-fade absolute inset-0 bg-ink/60" onClick={() => setSheetOpen(false)} aria-label="Close filters" />
          <div className="animate-sheet absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-card p-5 pb-8 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Filters</h2>
              <button type="button" onClick={() => setSheetOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg border border-line" aria-label="Close filters"><IcX className="h-4 w-4" /></button>
            </div>
            <FilterPanel f={f} set={set} toggleIn={toggleIn} allBrands={allBrands} allRams={allRams} allStorages={allStorages} onClear={() => setF(EMPTY)} />
            <button type="button" className="btn btn-amber mt-5 w-full" onClick={() => setSheetOpen(false)}>
              Show {filtered.length} product{filtered.length === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Filter panel ---------------- */
function FSection({ id, title, collapsed, onToggle, children }: {
  id: string; title: string; collapsed: boolean; onToggle: (id: string) => void; children: React.ReactNode;
}) {
  return (
    <div className="border-b border-line py-4 first:pt-0">
      <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => onToggle(id)} aria-expanded={!collapsed}>
        <span className="text-[13px] font-extrabold">{title}</span>
        <IcChevD className={`h-4 w-4 text-muted transition-transform ${collapsed ? "-rotate-90" : ""}`} />
      </button>
      {!collapsed && <div className="mt-3">{children}</div>}
    </div>
  );
}

function FCheck({ on, label, onClick, count }: { on: boolean; label: string; onClick: () => void; count?: number }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1.5 text-[13px] font-semibold transition hover:bg-mist">
      <input type="checkbox" checked={on} onChange={onClick} className="peer sr-only" />
      <span className={`grid h-4.5 w-4.5 shrink-0 place-items-center rounded border transition ${on ? "border-teal bg-teal text-white" : "border-line bg-card"}`}>
        {on && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" className="h-3 w-3"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>}
      </span>
      <span className="flex-1">{label}</span>
      {typeof count === "number" && <span className="text-[11px] font-bold text-muted">{count}</span>}
    </label>
  );
}

function FilterPanel({ f, set, toggleIn, allBrands, allRams, allStorages, onClear }: {
  f: Filters;
  set: (p: Partial<Filters>) => void;
  toggleIn: <T,>(arr: T[], v: T) => T[];
  allBrands: string[]; allRams: string[]; allStorages: string[];
  onClear: () => void;
}) {
  const [collapsedId, setCollapsedId] = useState<string | null>(null);
  const onToggle = (id: string) => setCollapsedId((c) => (c === id ? null : id));
  const Check = FCheck;
  const sec = (id: string) => ({ collapsed: collapsedId === id, onToggle });

  return (
    <div>
      <FSection id="cat" title="Category" {...sec("cat")}>
        {CATEGORIES.map((c) => (
          <Check key={c.id} on={f.cats.includes(c.id)} label={c.name} count={PRODUCTS.filter((p) => p.category === c.id).length}
            onClick={() => set({ cats: toggleIn(f.cats, c.id) })} />
        ))}
      </FSection>

      <FSection id="price" title="Price (KSh)" {...sec("price")}>
        <div className="flex items-center gap-2">
          <input inputMode="numeric" placeholder="Min" value={f.min} onChange={(e) => set({ min: e.target.value.replace(/[^\d]/g, "") })} className="input !h-10 !text-[13px]" aria-label="Minimum price" />
          <span className="text-muted">–</span>
          <input inputMode="numeric" placeholder="Max" value={f.max} onChange={(e) => set({ max: e.target.value.replace(/[^\d]/g, "") })} className="input !h-10 !text-[13px]" aria-label="Maximum price" />
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {[["Under 10k", "", "10000"], ["10–50k", "10000", "50000"], ["50–100k", "50000", "100000"], ["100k+", "100000", ""]].map(([l, mn, mx]) => (
            <button key={l} type="button" onClick={() => set({ min: mn, max: mx })}
              className={`chip ${f.min === mn && f.max === mx ? "chip-on" : ""}`}>{l}</button>
          ))}
        </div>
      </FSection>

      <FSection id="brand" title="Brand" {...sec("brand")}>
        {allBrands.map((b) => (
          <Check key={b} on={f.brands.includes(b)} label={b} count={PRODUCTS.filter((p) => p.brand === b).length}
            onClick={() => set({ brands: toggleIn(f.brands, b) })} />
        ))}
      </FSection>

      <FSection id="avail" title="Availability & condition" {...sec("avail")}>
        <Check on={f.inStock} label="In stock only" onClick={() => set({ inStock: !f.inStock })} />
        <Check on={f.condition.includes("New")} label="New" onClick={() => set({ condition: toggleIn(f.condition, "New") })} />
        <Check on={f.condition.includes("Certified Refurbished")} label="Certified Refurbished" onClick={() => set({ condition: toggleIn(f.condition, "Certified Refurbished") })} />
      </FSection>

      {allRams.length > 0 && (
        <FSection id="ram" title="RAM" {...sec("ram")}>
          <div className="flex flex-wrap gap-1.5">
            {allRams.map((r) => (
              <button key={r} type="button" onClick={() => set({ rams: toggleIn(f.rams, r) })} className={`chip ${f.rams.includes(r) ? "chip-on" : ""}`}>{r}</button>
            ))}
          </div>
        </FSection>
      )}

      {allStorages.length > 0 && (
        <FSection id="storage" title="Storage" {...sec("storage")}>
          <div className="flex flex-wrap gap-1.5">
            {allStorages.map((s) => (
              <button key={s} type="button" onClick={() => set({ storages: toggleIn(f.storages, s) })} className={`chip ${f.storages.includes(s) ? "chip-on" : ""}`}>{s}</button>
            ))}
          </div>
        </FSection>
      )}

      <FSection id="screen" title="Screen size" {...sec("screen")}>
        {["Under 14″", "14–16″", "Over 24″"].map((s) => (
          <button key={s} type="button" onClick={() => set({ screens: toggleIn(f.screens, s) })}
            className={`chip mr-1.5 mb-1.5 ${f.screens.includes(s) ? "chip-on" : ""}`}>{s}</button>
        ))}
      </FSection>

      <button type="button" onClick={onClear} className="btn btn-outline btn-sm mt-4 w-full">Reset all filters</button>
    </div>
  );
}
