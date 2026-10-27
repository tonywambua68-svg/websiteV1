// Shared search utilities — used by the header live-search, the shop page
// and NOVA. Kept dependency-free so every surface behaves identically.

import type { Product } from '@/types';

/** Normalise for matching: lowercase, strip accents & non-alphanumerics. */
export const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Build one searchable haystack per product (cached on the object). */
const HAYSTACK_KEY = '__hay' as const;
export function haystack(p: Product): string {
  const cached = (p as unknown as Record<string, string>)[HAYSTACK_KEY];
  if (cached) return cached;
  const parts = [
    p.name,
    p.brand,
    p.category,
    p.subcategory ?? '',
    p.description,
    p.sku ?? '',
    ...Object.entries(p.specs ?? {}).map(([k, v]) => `${k} ${v}`),
  ];
  const hay = norm(parts.join(' '));
  Object.defineProperty(p, HAYSTACK_KEY, { value: hay, enumerable: false });
  return hay;
}

/** Levenshtein distance with an early-exit cap (cheap typo tolerance). */
export function editDistance(a: string, b: string, cap = 2): number {
  if (Math.abs(a.length - b.length) > cap) return cap + 1;
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      rowMin = Math.min(rowMin, cur[j]);
    }
    if (rowMin > cap) return cap + 1;
    prev = cur;
  }
  return prev[b.length];
}

const STOPWORDS = new Set(['the', 'a', 'an', 'of', 'and', 'or', 'in', 'for', 'with', 'to']);

/** Score a product against a query. Higher is better; 0 means no match. */
export function scoreProduct(p: Product, query: string): number {
  const q = norm(query);
  if (!q) return 1;
  const words = q.split(' ').filter((w) => w && !STOPWORDS.has(w));
  if (words.length === 0) return 1;

  const name = norm(p.name);
  const brand = norm(p.brand);
  const cat = norm(`${p.category} ${p.subcategory ?? ''}`);
  const specs = norm(Object.values(p.specs ?? {}).join(' '));
  const hay = haystack(p);

  let total = 0;
  for (const w of words) {
    let best = 0;
    if (name.startsWith(w)) best = 100;
    else if (name.includes(w)) best = 80;
    else if (brand.startsWith(w)) best = 70;
    else if (brand.includes(w)) best = 60;
    else if (cat.includes(w)) best = 45;
    else if (specs.includes(w)) best = 40;
    else if (hay.includes(w)) best = 25;
    else {
      // Typo tolerance only for longer words, checked against key tokens.
      if (w.length >= 4) {
        const tokens = new Set([...name.split(' '), ...brand.split(' '), ...specs.split(' ')]);
        let dmin = 3;
        for (const t of tokens) {
          if (Math.abs(t.length - w.length) > 2) continue;
          const d = editDistance(t, w, 2);
          if (d < dmin) dmin = d;
          if (dmin <= 1) break;
        }
        if (dmin <= 2) best = dmin === 1 ? 20 : 12;
      }
    }
    if (best === 0) return 0; // every word must match something
    total += best;
  }
  // Small boost so cheaper products win ties within equal relevance
  return total - Math.min(8, p.price / 20000);
}

/** Rank products by relevance to a free-text query. */
export function searchProducts(products: Product[], query: string): Product[] {
  if (!norm(query)) return products;
  return products
    .map((p) => ({ p, s: scoreProduct(p, query) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.p);
}

/** Lightweight fuzzy suggestions for the header dropdown (names, brands, categories). */
export interface Suggestion {
  label: string;
  to: string;
  kind: 'product' | 'brand' | 'category';
  image?: string;
  price?: number;
}

export function buildSuggestions(products: Product[], query: string, max = 8): Suggestion[] {
  const q = norm(query);
  if (!q) return [];
  const out: Suggestion[] = [];

  const ranked = searchProducts(products, query).slice(0, max - 2);
  for (const p of ranked) {
    out.push({
      label: p.name,
      to: `/product/${p.id}`,
      kind: 'product',
      image: p.image || p.images?.[0],
      price: p.price,
    });
  }

  const brands = Array.from(new Set(products.map((p) => p.brand)))
    .filter((b) => norm(b).includes(q))
    .slice(0, 2);
  for (const b of brands) {
    out.push({ label: `${b} products`, to: `/shop?brand=${encodeURIComponent(b)}`, kind: 'brand' });
  }

  const cats = Array.from(new Set(products.map((p) => p.category)))
    .filter((c) => norm(c).includes(q))
    .slice(0, 1);
  for (const c of cats) {
    out.push({ label: `All ${c}`, to: `/shop?category=${encodeURIComponent(c)}`, kind: 'category' });
  }

  return out.slice(0, max);
}
