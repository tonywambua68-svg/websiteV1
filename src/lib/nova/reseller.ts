/**
 * NOVA Reseller Intelligence — ADMIN ONLY.
 *
 * The owner buys stock and resells it; this module calculates buying price →
 * selling price with margin analysis. SECURITY: buying prices, costs and
 * margins are internal data. Everything here is role-guarded, persists only
 * to this browser, and must NEVER reach the customer-facing AI or pages.
 */

import { PRODUCTS, type CategoryId } from "../../data/products";

const BOOK_KEY = "imara.nova.pricebook.v1";

function isAdmin(): boolean {
  try {
    const raw = localStorage.getItem("imara.session.v1");
    if (!raw) return false;
    const s = JSON.parse(raw) as { userId: string; expiresAt: number };
    if (Date.now() > s.expiresAt) return false;
    const users = JSON.parse(localStorage.getItem("imara.users.v1") ?? "[]") as { id: string; role: string }[];
    return users.some((u) => u.id === s.userId && u.role === "admin");
  } catch {
    return false;
  }
}

/* ---------------- calculation ---------------- */

export type PricingMode = "markup" | "profit" | "margin";

export interface PricingInput {
  buyPrice: number;      // per unit, KSh
  units: number;
  extraCosts: number;    // shipping, clearance, packaging — total
  mode: PricingMode;
  value: number;         // markup % | fixed profit per unit | target gross margin %
}

export interface PricingResult {
  unitCost: number;
  totalCost: number;
  sellPrice: number;       // recommended, psychologically rounded
  rawPrice: number;        // unrounded
  profitPerUnit: number;
  totalProfit: number;
  marginPct: number;       // gross margin on selling price
  roiPct: number;          // return on total cost
  breakevenUnits: number;
}

/** Round to a Kenyan-retail-friendly price (…999 / …950 / …500). */
export function psychologicalPrice(n: number): number {
  if (n <= 0) return 0;
  if (n < 5000) return Math.ceil(n / 50) * 50 - 1;            // e.g. 1,499
  if (n < 20000) return Math.ceil(n / 100) * 100 - 1;          // e.g. 12,999
  if (n < 100000) return Math.ceil(n / 500) * 500 - 1;         // e.g. 34,999
  return Math.ceil(n / 1000) * 1000 - 1;                       // e.g. 129,999
}

export function calculatePrice(input: PricingInput): PricingResult {
  const units = Math.max(1, Math.round(input.units));
  const totalCost = input.buyPrice * units + Math.max(0, input.extraCosts);
  const unitCost = totalCost / units;

  let raw = unitCost;
  if (input.mode === "markup") raw = unitCost * (1 + Math.max(0, input.value) / 100);
  else if (input.mode === "profit") raw = unitCost + Math.max(0, input.value);
  else {
    // target gross margin % → price = cost / (1 - margin)
    const m = Math.min(90, Math.max(0, input.value)) / 100;
    raw = unitCost / (1 - m);
  }

  const sellPrice = psychologicalPrice(raw);
  const profitPerUnit = sellPrice - unitCost;
  const totalProfit = profitPerUnit * units;
  const marginPct = sellPrice > 0 ? (profitPerUnit / sellPrice) * 100 : 0;
  const roiPct = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
  const breakevenUnits = profitPerUnit > 0 ? Math.ceil((Math.max(0, input.extraCosts)) / profitPerUnit + 0) : units;

  return { unitCost, totalCost, sellPrice, rawPrice: raw, profitPerUnit, totalProfit, marginPct, roiPct, breakevenUnits: Math.min(units, breakevenUnits) };
}

/** Market context: median listed price of in-stock products in a category. */
export function marketMedian(category?: CategoryId): number | null {
  const pool = PRODUCTS.filter((p) => p.stock > 0 && (!category || p.category === category)).map((p) => p.price).sort((a, b) => a - b);
  if (!pool.length) return null;
  return pool[Math.floor(pool.length / 2)];
}

export function priceVerdict(sellPrice: number, category?: CategoryId): { tone: "good" | "warn" | "hot"; text: string } {
  const med = marketMedian(category);
  if (!med) return { tone: "good", text: "No comparable market data in the catalogue." };
  const ratio = sellPrice / med;
  if (ratio < 0.85) return { tone: "hot", text: `≈${Math.round((1 - ratio) * 100)}% below the market median (${med.toLocaleString()}) — aggressive, fast-mover pricing. You may have room to increase.` };
  if (ratio <= 1.1) return { tone: "good", text: `Sits right in the market band (median ${med.toLocaleString()}) — competitive and credible.` };
  return { tone: "warn", text: `≈${Math.round((ratio - 1) * 100)}% above the market median (${med.toLocaleString()}) — you'll need strong proof (warranty, extras, brand trust) or a bundle to justify it.` };
}

/* ---------------- the price book (internal ledger) ---------------- */

export interface PriceBookEntry {
  id: string;
  name: string;
  buyPrice: number;
  sellPrice: number;
  note?: string;
  addedAt: string;
}

export function loadPriceBook(): PriceBookEntry[] {
  if (!isAdmin()) return [];
  try {
    return JSON.parse(localStorage.getItem(BOOK_KEY) ?? "[]") as PriceBookEntry[];
  } catch {
    return [];
  }
}

export function savePriceBookEntry(entry: Omit<PriceBookEntry, "id" | "addedAt">): boolean {
  if (!isAdmin()) return false;
  const list = loadPriceBook();
  list.unshift({ ...entry, id: `pb_${Date.now()}`, addedAt: new Date().toISOString().slice(0, 10) });
  try {
    localStorage.setItem(BOOK_KEY, JSON.stringify(list.slice(0, 100)));
  } catch {
    return false;
  }
  return true;
}

export function removePriceBookEntry(id: string): boolean {
  if (!isAdmin()) return false;
  try {
    localStorage.setItem(BOOK_KEY, JSON.stringify(loadPriceBook().filter((e) => e.id !== id)));
  } catch {
    return false;
  }
  return true;
}

export function entryMargin(e: PriceBookEntry): number {
  return e.sellPrice > 0 ? ((e.sellPrice - e.buyPrice) / e.sellPrice) * 100 : 0;
}

export function priceBookStats(list: PriceBookEntry[]) {
  const margins = list.map(entryMargin);
  return {
    count: list.length,
    avgMargin: margins.length ? margins.reduce((s, m) => s + m, 0) / margins.length : 0,
    totalPotential: list.reduce((s, e) => s + (e.sellPrice - e.buyPrice), 0),
    thin: list.filter((e) => entryMargin(e) < 15).length,
  };
}
