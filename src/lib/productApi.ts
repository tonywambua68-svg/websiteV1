/**
 * Live product catalogue loader.
 *
 * On boot the storefront asks the Product API (GET /api/products, on port
 * 3000 — see `apiBase()` below) for the catalogue. When the API answers,
 * those records REPLACE the bundled seed data everywhere — Shop, Home, NOVA,
 * compare, search — through the existing `getAllProducts()` choke point.
 * When the API is offline (storefront-only `npm run dev`), the bundled
 * catalogue is used and nothing breaks.
 *
 * No secrets ever leave the server: this module only performs an
 * unauthenticated public GET (PUBLISHED products, internal costs stripped).
 */

import type { ArtKind, CategoryId, Product } from "../data/products";

/* API record → storefront Product (compatible with the existing interface,
   so every current component works unchanged). */
interface ApiRecord {
  id: string;
  name: string;
  brand?: string | null;
  category: string;
  price: number;
  oldPrice?: number | null;
  currency?: string;
  image?: string | null;
  productUrl?: string | null;
  sku?: string | null;
  stock?: number;
  condition?: string;
  specifications?: [string, string][] | Record<string, string>;
  status?: string;
}

const CAT_HUES: Record<string, string> = {
  laptops: "#0b7a63", phones: "#0e7490", gaming: "#b45309", audio: "#7c3aed",
  monitors: "#0369a1", networking: "#4d7c0f", accessories: "#be185d", smart: "#c2410c", tablets: "#0f766e",
};
const CAT_ART: Record<string, ArtKind> = {
  laptops: "laptop", phones: "phone", tablets: "tablet", gaming: "tower",
  audio: "headphones", monitors: "monitor", networking: "router",
  accessories: "ssd", smart: "webcam",
};
const NAME_ART: [RegExp, ArtKind][] = [
  [/earbud|earphone/i, "earbuds"], [/headphone/i, "headphones"], [/speaker/i, "speaker"],
  [/keyboard/i, "keyboard"], [/mouse(?!.*pad)/i, "mouse"], [/power\s?bank|charger/i, "powerbank"],
  [/ssd|hdd|storage/i, "ssd"], [/webcam|camera/i, "webcam"], [/watch/i, "watch"],
  [/tv|television/i, "tv"], [/phone/i, "phone"],
];

function toProduct(r: ApiRecord): Product {
  const specs: [string, string][] = Array.isArray(r.specifications)
    ? r.specifications.filter((s) => Array.isArray(s) && s.length >= 2)
    : r.specifications && typeof r.specifications === "object"
      ? Object.entries(r.specifications)
      : [];

  const cat = (r.category ?? "accessories") as CategoryId;
  let art: ArtKind = CAT_ART[cat] ?? "ssd";
  for (const [re, kind] of NAME_ART) if (re.test(r.name)) { art = kind; break; }

  const spec = (label: string) => specs.find(([k]) => k.toLowerCase().includes(label))?.[1];
  return {
    id: r.id,
    name: r.name,
    brand: r.brand || "Imported",
    category: cat,
    price: Math.round(r.price || 0),
    oldPrice: typeof r.oldPrice === "number" ? Math.round(r.oldPrice) : undefined,
    rating: 0,
    reviews: 0,
    art,
    hue: CAT_HUES[cat] ?? "#0b7a63",
    tagline: specs.length ? `${specs[0][0]}: ${specs[0][1]}` : "Fresh from the live catalogue.",
    description: `Listed live via the Imara product API${r.sku ? ` (SKU ${r.sku})` : ""}. Full specifications as supplied by the source.`,
    specs,
    stock: typeof r.stock === "number" ? r.stock : 10,
    condition: r.condition === "Certified Refurbished" ? "Certified Refurbished" : "New",
    tags: ["new"],
    sold: 0,
    ram: spec("ram") ?? spec("memory"),
    storage: spec("storage") ?? spec("capacity"),
    screen: spec("display") ?? spec("panel") ?? spec("screen"),
    processor: spec("processor") ?? spec("cpu"),
    graphics: spec("graphics") ?? spec("gpu"),
    battery: spec("battery"),
    warranty: "12-month Imara warranty",
    inBox: [r.name, "Standard accessories as per manufacturer"],
  };
}

/* ---------------- API base resolution ----------------
 * Dev:  the storefront runs on :5173 while the Product API owns :3000, so the
 *       base is derived from the CURRENT hostname (localhost OR a LAN IP) —
 *       e.g. http://localhost:5173 → http://localhost:3000/api
 *            http://192.168.0.107:5173 → http://192.168.0.107:3000/api
 * Prod: same-origin "/api" (assumes a reverse proxy), unless
 *       VITE_PRODUCTS_API_URL explicitly overrides it.
 */
function apiBase(): string {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
  const override = env.VITE_PRODUCTS_API_URL;
  if (override) return override.replace(/\/+$/, "");
  const dev = env.DEV;
  if (dev && typeof window !== "undefined") {
    const port = env.VITE_PRODUCTS_API_PORT ?? "3000";
    return `${window.location.protocol}//${window.location.hostname}:${port}/api`;
  }
  return "/api";
}

/* ---------------- live store ---------------- */

let apiProducts: Product[] | null = null;
let source: "local" | "api" = "local";
let version = 0;
const listeners = new Set<() => void>();

export function getApiProducts(): Product[] | null {
  return apiProducts;
}
export function catalogSource(): "local" | "api" {
  return source;
}
export function getCatalogVersion(): number {
  return version;
}
export function subscribeCatalog(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Fetch the live catalogue once. Safe to call multiple times. */
export async function initCatalog(): Promise<void> {
  if (apiProducts) return; // already live
  try {
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch(`${apiBase()}/products`, { signal: ctrl.signal });
    window.clearTimeout(timer);
    if (!res.ok) return;
    const data = (await res.json()) as { products?: ApiRecord[] };
    if (!Array.isArray(data.products) || data.products.length === 0) return; // empty DB → keep bundled data
    apiProducts = data.products.map(toProduct);
    source = "api";
    version += 1;
    listeners.forEach((fn) => fn());
    console.info(`[catalog] live — ${apiProducts.length} products from ${apiBase()}`);
  } catch {
    /* API offline or cross-origin blocked — keep the bundled catalogue. */
  }
}
