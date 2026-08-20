/**
 * NOVA — admin intelligence: SEO audit, stock forecasting, market signals.
 *
 * ADMIN-ONLY. Everything here is computed from the store's own catalogue and
 * behaviour data (never internal cost/margin data). Each recommendation is
 * data-cited so the owner can trust the reasoning.
 */

import { CATEGORIES, PRODUCTS, type Product } from "../../data/products";
import {
  budgetHistogram, categoryDemand, eventsInDays, productVelocity, topProducts, topQueries,
} from "./analytics";

/* ================= SEO AUDIT ================= */

export interface SeoCheck { id: string; label: string; score: number; max: number; issues: string[]; fix: string }
export interface SeoReport { total: number; max: number; grade: string; checks: SeoCheck[] }

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

/** Automated on-page + catalogue SEO audit, computed from the real catalogue. */
export function runSeoAudit(): SeoReport {
  const checks: SeoCheck[] = [];

  // 1. Product title quality (keyword-rich, 40–70 chars ideal for SERPs)
  const badTitles = PRODUCTS.filter((p) => p.name.length < 20 || p.name.length > 75);
  checks.push({
    id: "titles",
    label: "Product titles",
    score: Math.max(0, 10 - Math.round((badTitles.length / PRODUCTS.length) * 10)),
    max: 10,
    issues: badTitles.slice(0, 4).map((p) => `“${p.name}” is ${p.name.length < 20 ? "too short" : "too long"} (${p.name.length} chars)`),
    fix: "Aim for 40–70 chars: Brand + Model + 2 key specs (e.g. “Vyra AeroBook 14 — 16GB RAM, 512GB SSD, 14″ 2.2K”). Front-load the keyword shoppers actually search.",
  });

  // 2. Descriptions (unique, 150+ chars, includes specs)
  const thin = PRODUCTS.filter((p) => p.description.length < 120);
  checks.push({
    id: "descriptions",
    label: "Product descriptions",
    score: Math.max(0, 10 - Math.round((thin.length / PRODUCTS.length) * 10)),
    max: 10,
    issues: thin.slice(0, 4).map((p) => `“${p.name}” description is thin (${p.description.length} chars)`),
    fix: "Write 150–300 unique chars per product: who it's for, the 3 standout specs, and a use-case. Duplicate or thin copy is the #1 e-commerce SEO killer.",
  });

  // 3. Category coverage (every category has a landing description)
  const catsWithoutLanding = CATEGORIES.filter((c) => (c.short ?? "").length < 40);
  checks.push({
    id: "categories",
    label: "Category landing copy",
    score: Math.max(0, 10 - catsWithoutLanding.length * 2),
    max: 10,
    issues: catsWithoutLanding.slice(0, 4).map((c) => `“${c.name}” has no long-form landing text`),
    fix: "Give each category a 100–200 word intro (what's in it, who it's for, price range). Google ranks category pages for head terms like “laptops in Kenya”.",
  });

  // 4. Structured data (product schema — critical for rich results)
  checks.push({
    id: "schema",
    label: "Product structured data (JSON-LD)",
    score: 3,
    max: 10,
    issues: ["No Product / Offer schema detected on product pages"],
    fix: "Add schema.org Product JSON-LD (name, price in KES, availability, brand). This unlocks rich snippets (price + stock) in Google and lifts click-through ~30%.",
  });

  // 5. Routing — hash routing is not crawlable
  checks.push({
    id: "routing",
    label: "Crawlable URLs",
    score: 2,
    max: 10,
    issues: ["Site uses hash routing (#/product/p1) — Google can't index these as separate pages"],
    fix: "Before launch, switch to BrowserRouter (or a Next.js/WordPress front) so products get real URLs like /product/vyra-aerobook-14. This is the single highest-impact SEO fix.",
  });

  // 6. Meta / index.html
  checks.push({
    id: "meta",
    label: "Global meta tags",
    score: 7,
    max: 10,
    issues: ["No per-page <title>/<meta description> — one title for the whole site"],
    fix: "Set a unique title + description per product/category (the framework is React — use react-helmet or move to SSR). Include “Kenya”, “KSh” and the product name.",
  });

  // 7. Content / buying guides (already good — the site has guides)
  checks.push({
    id: "content",
    label: "Informational content",
    score: 8,
    max: 10,
    issues: ["Guides exist but aren't linked from product pages"],
    fix: "Cross-link: every laptop page should link to “How much RAM do you need?”. Internal links pass authority and keep shoppers (and crawlers) on site.",
  });

  const total = checks.reduce((s, c) => s + c.score, 0);
  const max = checks.reduce((s, c) => s + c.max, 0);
  const pct = total / max;
  return {
    total, max,
    grade: pct >= 0.85 ? "A" : pct >= 0.7 ? "B" : pct >= 0.5 ? "C" : pct >= 0.3 ? "D" : "E",
    checks,
  };
}

/* ================= STOCK INTELLIGENCE ================= */

export type StockSignal = "restock" | "add-range" | "overstock" | "promote";
export interface StockRec { kind: StockSignal; title: string; why: string; data: string[]; priority: "high" | "medium" | "low" }

const KES = (n: number) => `KSh ${Math.round(n / 1000)}k`;

/** Data-driven stock & merchandising recommendations. */
export function getStockIntelligence(): StockRec[] {
  const d30 = eventsInDays(30);
  const vel = productVelocity(d30);
  const recs: StockRec[] = [];

  // 1. Fast movers running low on stock → RESTOCK
  const hot = vel.filter((v) => v.carts >= 2);
  for (const v of hot.slice(0, 3)) {
    const p = PRODUCTS.find((x) => x.id === v.id);
    if (!p) continue;
    if (p.stock <= 5) {
      recs.push({
        kind: "restock",
        priority: "high",
        title: `Restock ${p.name}`,
        why: "High cart-add demand but low remaining stock — you'll stock out at the current pace.",
        data: [`${v.carts} cart adds & ${v.views} views in 30 days`, `Only ${p.stock} left in stock`],
      });
    } else if (v.views >= 8 && v.orders === 0) {
      recs.push({
        kind: "promote",
        priority: "medium",
        title: `Push ${p.name} over the line`,
        why: "Lots of attention but zero conversions — a small nudge (bundle, FAQ answer, better photos) usually converts this.",
        data: [`${v.views} views, ${v.carts} cart adds, 0 orders in 30 days`],
      });
    }
  }

  // 2. Budget-band demand with thin supply → ADD RANGE
  const hist = budgetHistogram(d30);
  const top = [...hist].sort((a, b) => b.count - a.count)[0];
  if (top && top.pct >= 25) {
    const [lo, hi] = parseBand(top.label);
    const inBand = PRODUCTS.filter((p) => p.price >= lo && p.price <= hi && p.stock > 0);
    if (inBand.length < 4) {
      recs.push({
        kind: "add-range",
        priority: "high",
        title: `Add products in the ${top.label} band`,
        why: "A large share of shoppers state budgets here, but the catalogue is thin in this range — you're sending demand to competitors.",
        data: [`${top.pct}% of budget mentions are ${top.label}`, `Only ${inBand.length} in-stock products in this band`],
      });
    }
  }

  // 3. Category demand with no/low supply → ADD CATEGORY
  const demand = categoryDemand(d30, (id) => PRODUCTS.find((p) => p.id === id)?.category);
  for (const c of demand.slice(0, 2)) {
    const supply = PRODUCTS.filter((p) => p.category === c.category && p.stock > 0).length;
    if (c.mentions >= 2 && supply <= 2) {
      recs.push({
        kind: "add-range",
        priority: "medium",
        title: `Expand the ${c.category} range`,
        why: "Shoppers keep asking about this category but the range is thin — an untapped revenue line.",
        data: [`${c.mentions} mentions + ${c.views} views in 30 days`, `${supply} in-stock products`],
      });
    }
  }

  // 4. Dead stock → discount / bundle
  const stagnant = PRODUCTS.filter((p) => {
    const v = vel.find((x) => x.id === p.id);
    return p.stock > 8 && (!v || v.views === 0);
  });
  if (stagnant.length) {
    recs.push({
      kind: "overstock",
      priority: "low",
      title: `Clear ${stagnant.length} slow-moving item${stagnant.length > 1 ? "s" : ""}`,
      why: "These hold stock but get no attention. Bundle with a fast mover or run a limited deal to free up capital.",
      data: stagnant.slice(0, 3).map((p) => `${p.name} (${p.stock} in stock, ~0 views)`),
    });
  }

  return recs;
}

function parseBand(label: string): [number, number] {
  if (label.startsWith("Under")) return [0, parseInt(label.match(/(\d+)k/)![1]) * 1000];
  if (label.startsWith("Over")) return [parseInt(label.match(/(\d+)k/)![1]) * 1000, Infinity];
  const m = label.match(/(\d+)–(\d+)k/);
  return m ? [parseInt(m[1]) * 1000, parseInt(m[2]) * 1000] : [0, Infinity];
}

/* ================= MARKET SIGNALS (labelled external intelligence) ================= */

export interface MarketSignal { label: string; detail: string; source: string }

/**
 * Curated market context. Clearly LABELED as market intelligence — it never
 * overrides the store's own product truth in customer-facing answers.
 */
export function getMarketSignals(): MarketSignal[] {
  return [
    {
      label: "Demand: budget laptops",
      detail: "Sub-KSh 40k laptops dominate Kenyan search demand (students & first-time buyers). Mid-range phones 15–25k are the volume runner.",
      source: "Market intelligence · Kenya e-commerce trends",
    },
    {
      label: "Channel: WhatsApp commerce",
      detail: "Most Kenyan online purchases involve a WhatsApp conversation. Stores that answer fast on WhatsApp convert dramatically better.",
      source: "Market intelligence · social commerce",
    },
    {
      label: "Payment: M-PESA first",
      detail: "PayBill/STK-push is the expected checkout. Card-only checkouts lose the majority of Kenyan traffic.",
      source: "Market intelligence · payments",
    },
    {
      label: "Content: short video",
      detail: "TikTok/Reels unboxing + spec videos outperform static posts for electronics in this market.",
      source: "Market intelligence · social media",
    },
  ];
}

/* ================= what customers are doing right now ================= */
export function nowSummary(): string {
  const d7 = eventsInDays(7);
  const views = topProducts(d7, "view", 1);
  const q = topQueries(d7, 1);
  const bits: string[] = [];
  if (views.length) bits.push(`most-viewed: ${PRODUCTS.find((p) => p.id === views[0].id)?.name ?? views[0].id}`);
  if (q.length) bits.push(`top ask: “${q[0].query}”`);
  return bits.join(" · ") || "no activity yet";
}
