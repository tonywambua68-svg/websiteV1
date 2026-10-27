import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProductStore } from '@/store/productStore';
import type { ProductFilters, Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import CompareBar from '@/components/CompareBar';
import { Search, X, SlidersHorizontal, Star } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'discount', label: 'Biggest discount' },
  { value: 'rating', label: 'Top rated' },
  { value: 'name', label: 'Name A–Z' },
];

const PRICE_BANDS = [
  { label: 'Under KSh 60,000', min: undefined as number | undefined, max: 60000 },
  { label: 'KSh 60,000 – 90,000', min: 60000, max: 90000 },
  { label: 'KSh 90,000 – 130,000', min: 90000, max: 130000 },
  { label: 'Above KSh 130,000', min: 130000, max: undefined as number | undefined },
];

export default function Shop() {
  const navigate = useNavigate();
  const { products, fetchProducts, loading, filters, setFilters, allProducts } = useProductStore();
  const [urlParams, setUrlParams] = useSearchParams();

  // URL is the single source of truth for filters — shareable & back-button safe.
  const [searchInput, setSearchInput] = useState(urlParams.get('search') ?? '');
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(24);

  useEffect(() => {
    setSearchInput(urlParams.get('search') ?? '');
  }, [urlParams]);

  useEffect(() => {
    const next: ProductFilters = {};
    if (urlParams.get('category')) next.category = urlParams.get('category')!;
    if (urlParams.get('brand')) next.brand = urlParams.get('brand')!;
    if (urlParams.get('sub')) next.subcategory = urlParams.get('sub')!;
    if (urlParams.get('search')) next.search = urlParams.get('search')!;
    if (urlParams.get('minPrice')) next.minPrice = Number(urlParams.get('minPrice'));
    if (urlParams.get('maxPrice')) next.maxPrice = Number(urlParams.get('maxPrice'));
    if (urlParams.get('stock') === '1') next.inStock = true;
    setFilters({ ...next });
    setVisibleCount(24);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlParams.toString()]);

  useEffect(() => {
    const sort = urlParams.get('sort') ?? 'featured';
    const map: Record<string, { sort?: any; order?: any }> = {
      featured: {},
      'price-asc': { sort: 'price', order: 'asc' },
      'price-desc': { sort: 'price', order: 'desc' },
      discount: { sort: 'discount' },
      rating: { sort: 'rating' },
      name: { sort: 'name', order: 'asc' },
    };
    fetchProducts(filters, { ...(map[sort] ?? {}) });
  }, [filters, urlParams.get('sort'), fetchProducts]);

  /** Patch the URL (which drives the store). */
  const patch = (changes: Record<string, string | number | null>) => {
    const p = new URLSearchParams(urlParams);
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === '' || v === undefined) p.delete(k);
      else p.set(k, String(v));
    }
    setUrlParams(p, { replace: false });
  };

  const category = urlParams.get('category');
  const selectedBrands = (urlParams.get('brand') ?? '').split(',').filter(Boolean);

  // Facets computed from catalogue within the current category
  const brands = useMemo(() => {
    const pool = category ? allProducts.filter((p) => p.category === category) : allProducts;
    return Array.from(new Set(pool.map((p) => p.brand))).sort();
  }, [allProducts, category]);

  const subcategories = useMemo(() => {
    const pool = category ? allProducts.filter((p) => p.category === category) : [];
    return Array.from(new Set(pool.map((p) => p.subcategory).filter(Boolean) as string[])).sort();
  }, [allProducts, category]);

  const toggleBrand = (b: string) => {
    const next = selectedBrands.includes(b)
      ? selectedBrands.filter((x) => x !== b)
      : [...selectedBrands, b];
    patch({ brand: next.join(',') || null });
  };

  const activeChips: Array<{ label: string; clear: () => void }> = [];
  if (category) activeChips.push({ label: category, clear: () => patch({ category: null, sub: null }) });
  if (urlParams.get('sub'))
    activeChips.push({ label: urlParams.get('sub')!, clear: () => patch({ sub: null }) });
  for (const b of selectedBrands) activeChips.push({ label: b, clear: () => toggleBrand(b) });
  if (urlParams.get('search'))
    activeChips.push({ label: `“${urlParams.get('search')}”`, clear: () => patch({ search: null }) });
  if (urlParams.get('minPrice') || urlParams.get('maxPrice'))
    activeChips.push({
      label: `KSh ${Number(urlParams.get('minPrice') || 0).toLocaleString()} – ${
        urlParams.get('maxPrice') ? Number(urlParams.get('maxPrice')).toLocaleString() : 'any'
      }`,
      clear: () => patch({ minPrice: null, maxPrice: null }),
    });
  if (urlParams.get('stock') === '1')
    activeChips.push({ label: 'In stock', clear: () => patch({ stock: null }) });

  const visible = products.slice(0, visibleCount);

  return (
    <div className="wrap py-6 md:py-8">
      {/* Breadcrumb / header */}
      <div className="mb-5">
        <p className="text-[12px] font-bold text-muted">
          <button onClick={() => navigate('/')} className="hover:text-teal">Home</button>
          {' / '}
          <button onClick={() => navigate('/shop')} className="hover:text-teal">Shop</button>
          {category && <> / <span className="text-ink">{category}</span></>}
        </p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
              {category ?? 'All Products'}
            </h1>
            <p className="mt-0.5 text-sm text-muted">
              {loading ? 'Loading…' : `${products.length} product${products.length === 1 ? '' : 's'}`}
              {!loading && products.length > 0 && ' · genuine stock, verified availability'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn btn-sm lg:hidden ${showFilters ? 'btn-teal' : 'btn-outline'}`}
            >
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </button>
            <label className="sr-only" htmlFor="sort">Sort by</label>
            <select
              id="sort"
              value={urlParams.get('sort') ?? 'featured'}
              onChange={(e) => patch({ sort: e.target.value === 'featured' ? null : e.target.value })}
              className="input !h-9 !w-auto !py-0 text-[13px] font-bold"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[250px_1fr]">
        {/* ---------- Sidebar filters ---------- */}
        <aside className={`${showFilters ? 'block' : 'hidden'} space-y-5 lg:block`}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              patch({ search: searchInput.trim() || null });
            }}
            className="relative"
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search in shop…"
              className="input !pl-9"
              aria-label="Search within shop"
            />
          </form>

          <FilterGroup title="Category">
            <div className="flex flex-wrap gap-1.5">
              <button className={`chip ${!category ? 'chip-on' : ''}`} onClick={() => patch({ category: null, sub: null })}>
                All
              </button>
              {Array.from(new Set(allProducts.map((p) => p.category)))
                .sort()
                .map((c) => (
                  <button key={c} className={`chip ${category === c ? 'chip-on' : ''}`} onClick={() => patch({ category: c, sub: null })}>
                    {c}
                  </button>
                ))}
            </div>
          </FilterGroup>

          {category && subcategories.length > 0 && (
            <FilterGroup title="Type">
              <div className="flex flex-wrap gap-1.5">
                {subcategories.map((s) => (
                  <button
                    key={s}
                    className={`chip ${urlParams.get('sub') === s ? 'chip-on' : ''}`}
                    onClick={() => patch({ sub: urlParams.get('sub') === s ? null : s })}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </FilterGroup>
          )}

          <FilterGroup title={`Brand${selectedBrands.length ? ` (${selectedBrands.length})` : ''}`}>
            <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
              {brands.map((b) => {
                const count = allProducts.filter(
                  (p) => p.brand === b && (!category || p.category === category)
                ).length;
                return (
                  <label
                    key={b}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-[13px] font-semibold text-ink/80 hover:bg-mist"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(b)}
                      onChange={() => toggleBrand(b)}
                      className="h-4 w-4 rounded border-line accent-[#0b7a63]"
                    />
                    <span className="flex-1 truncate">{b}</span>
                    <span className="text-[11px] font-bold text-muted">{count}</span>
                  </label>
                );
              })}
            </div>
          </FilterGroup>

          <FilterGroup title="Price">
            <div className="space-y-1.5">
              {PRICE_BANDS.map((band) => {
                const on =
                  String(urlParams.get('minPrice') ?? '') === String(band.min ?? '') &&
                  String(urlParams.get('maxPrice') ?? '') === String(band.max ?? '');
                return (
                  <button
                    key={band.label}
                    onClick={() =>
                      patch(
                        on
                          ? { minPrice: null, maxPrice: null }
                          : { minPrice: band.min ?? null, maxPrice: band.max ?? null }
                      )
                    }
                    className={`chip w-full justify-start ${on ? 'chip-on' : ''}`}
                  >
                    {band.label}
                  </button>
                );
              })}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  placeholder="Min"
                  defaultValue={urlParams.get('minPrice') ?? ''}
                  onBlur={(e) => patch({ minPrice: e.target.value ? Number(e.target.value) : null })}
                  className="input !h-9 text-[13px]"
                  aria-label="Minimum price"
                />
                <input
                  type="number"
                  placeholder="Max"
                  defaultValue={urlParams.get('maxPrice') ?? ''}
                  onBlur={(e) => patch({ maxPrice: e.target.value ? Number(e.target.value) : null })}
                  className="input !h-9 text-[13px]"
                  aria-label="Maximum price"
                />
              </div>
            </div>
          </FilterGroup>

          <FilterGroup title="Availability">
            <label className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-ink/80">
              <input
                type="checkbox"
                checked={urlParams.get('stock') === '1'}
                onChange={(e) => patch({ stock: e.target.checked ? '1' : null })}
                className="h-4 w-4 rounded border-line accent-[#0b7a63]"
              />
              In stock only
            </label>
          </FilterGroup>

          {activeChips.length > 0 && (
            <button onClick={() => setUrlParams(new URLSearchParams())} className="btn btn-outline btn-sm w-full">
              <X className="h-4 w-4" /> Clear all filters
            </button>
          )}
        </aside>

        {/* ---------- Results ---------- */}
        <section>
          {activeChips.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {activeChips.map((chip) => (
                <button key={chip.label} onClick={chip.clear} className="chip chip-on">
                  {chip.label} <X className="h-3 w-3" />
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card animate-pulse p-4">
                  <div className="aspect-[4/3] rounded-lg bg-line/50" />
                  <div className="mt-3 h-3 w-2/3 rounded bg-line/60" />
                  <div className="mt-2 h-4 w-full rounded bg-line/50" />
                  <div className="mt-2 h-4 w-1/2 rounded bg-line/50" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <NoResults search={urlParams.get('search')} onReset={() => setUrlParams(new URLSearchParams())} />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {visible.map((product: Product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {products.length > visibleCount && (
                <div className="mt-8 text-center">
                  <button onClick={() => setVisibleCount((c) => c + 24)} className="btn btn-outline">
                    Show more ({products.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <CompareBar />
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <p className="mb-2.5 border-b-2 border-amber pb-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink">
        {title}
      </p>
      {children}
    </div>
  );
}

function NoResults({ search, onReset }: { search: string | null; onReset: () => void }) {
  const allProducts = useProductStore((s) => s.allProducts);
  const suggestions = useMemo(() => {
    if (!search) return [];
    const words = search.toLowerCase().split(/\s+/);
    return allProducts
      .filter((p) =>
        words.some((w) => p.name.toLowerCase().includes(w) || p.brand.toLowerCase().includes(w))
      )
      .slice(0, 4);
  }, [allProducts, search]);

  return (
    <div className="card p-10 text-center">
      <Star className="mx-auto h-10 w-10 text-muted/50" />
      <h2 className="mt-4 font-display text-xl font-bold text-ink">No products matched</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted">
        Try fewer words, check spelling, or browse a category. Popular searches: laptops, MacBook,
        gaming, SSD.
      </p>
      {suggestions.length > 0 && (
        <div className="mx-auto mt-6 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
          {suggestions.map((p) => (
            <a key={p.id} href={`/product/${p.id}`} className="group block">
              <img
                src={p.image}
                alt=""
                className="mx-auto h-20 w-20 rounded-lg border border-line bg-mist object-contain p-1 group-hover:border-teal"
              />
              <p className="mt-1.5 line-clamp-2 text-[12px] font-bold text-ink group-hover:text-teal">
                {p.name}
              </p>
            </a>
          ))}
        </div>
      )}
      <button onClick={onReset} className="btn btn-teal mt-6">
        Clear filters & see everything
      </button>
    </div>
  );
}
