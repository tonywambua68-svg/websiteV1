/**
 * NOVA analytics — the customer behaviour event stream.
 *
 * Demo-grade storage: localStorage on this device. Real browsing on this
 * device (product views, compares, cart adds, orders) is appended on top of
 * a deterministic seeded sample so the admin dashboard is meaningful from
 * day one. In production these events would POST to `/api/events` and land
 * in a PostgreSQL `product_events` table — the event shape below is already
 * designed for that.
 */

export type EventKind =
  | "view" | "compare" | "cart_add" | "checkout" | "order"
  | "abandon" | "conversation" | "search";

export interface BehaviorEvent {
  id: string;
  ts: number;
  kind: EventKind;
  productId?: string;
  secondProductId?: string;
  query?: string;
  customerId?: string;
  meta?: {
    budget?: number;
    intent?: string;
    objection?: string;
    stage?: string; // for abandons: where the shopper dropped off
    total?: number;
  };
}

const KEY = "imara.nova.events.v1";
const SEED_KEY = "imara.nova.seeded.v1";
const MAX_EVENTS = 900;
const DAY = 24 * 60 * 60 * 1000;

/* ---------------- storage ---------------- */
function load(): BehaviorEvent[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as BehaviorEvent[]) : [];
  } catch {
    return [];
  }
}
function save(events: BehaviorEvent[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
  } catch {
    /* storage unavailable — analytics degrades silently */
  }
}

export function track(e: Omit<BehaviorEvent, "id" | "ts"> & { ts?: number }): void {
  const events = load();
  events.push({ ...e, id: `e_${Date.now()}_${events.length}`, ts: e.ts ?? Date.now() });
  save(events);
}

/* ---------------- public loggers (used across the app) ---------------- */
export const logView = (productId: string) => track({ kind: "view", productId });
export const logCompare = (productId: string, secondProductId?: string) =>
  track({ kind: "compare", productId, secondProductId });
export const logCartAdd = (productId: string) => track({ kind: "cart_add", productId });
export const logCheckout = (total: number) => track({ kind: "checkout", meta: { total } });
export const logOrder = (total: number) => track({ kind: "order", meta: { total } });
export const logSearch = (query: string) => track({ kind: "search", query });
export function logConversation(c: { text: string; budget?: number; intent?: string; objection?: string }) {
  track({
    kind: "conversation",
    query: c.text.slice(0, 120),
    meta: { budget: c.budget, intent: c.intent, objection: c.objection },
  });
}

/* ---------------- deterministic demo seed ---------------- */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pick<T>(rnd: () => number, arr: T[], weights?: number[]): T {
  if (!weights) return arr[Math.floor(rnd() * arr.length)];
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rnd() * total;
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i];
    if (r <= 0) return arr[i];
  }
  return arr[arr.length - 1];
}

const QUERY_POOL: [string, number][] = [
  ["laptop under 40k", 9], ["best laptop for programming and school", 7],
  ["gaming laptop", 6], ["phone under 20,000", 6], ["laptop under 30k", 5],
  ["RAM upgrade for my laptop", 4], ["SSD to speed up laptop", 4],
  ["ANC headphones", 3], ["power bank for blackouts", 3], ["4K monitor for design", 3],
  ["mesh wifi for a maisonette", 2], ["which laptop has the best battery", 3],
  ["is the AeroBook good for engineering students", 2], ["compare Havoc and AeroBook", 2],
];
const OBJECTIONS: [string, number][] = [
  ["price", 18], ["delivery time", 9], ["warranty doubts", 7],
  ["genuineness doubts", 5], ["none", 61],
];
const HEAVY_PRODUCTS: [string, number][] = [
  ["p1", 12], ["p4", 11], ["p2", 9], ["p6", 8], ["p11", 8], ["p12", 8],
  ["p26", 7], ["p27", 6], ["p18", 5], ["p10", 4], ["p3", 4], ["p33", 3],
  ["p8", 3], ["p21", 2], ["p24", 2],
];
const COMPARE_PAIRS: [string, string, number][] = [
  ["p1", "p2", 9], ["p1", "p4", 8], ["p6", "p7", 6], ["p11", "p12", 6],
  ["p1", "p33", 5], ["p1", "p3", 4], ["p21", "p10", 3],
];
// Budget distribution (KSh) — the 30–40k bucket is deliberately dominant.
const BUDGETS: [number, number][] = [
  [18000, 4], [25000, 10], [32000, 17], [38000, 26], [45000, 9],
  [55000, 7], [70000, 6], [85000, 8], [120000, 7], [160000, 6],
];

export function seedIfEmpty(): void {
  try {
    if (localStorage.getItem(SEED_KEY)) return;
  } catch {
    return;
  }
  const rnd = mulberry32(20260214);
  const now = Date.now();
  const events: BehaviorEvent[] = [];
  let id = 0;
  const push = (e: Omit<BehaviorEvent, "id">) => events.push({ ...e, id: `s_${id++}` });

  for (let day = 59; day >= 0; day--) {
    const base = now - day * DAY;
    const activity = Math.round(3 + rnd() * 6 + (day < 14 ? 2 : 0)); // slight upward trend

    // conversations
    for (let i = 0; i < activity; i++) {
      const ts = base - Math.floor(rnd() * 14) * 3600_000;
      const [q] = [pick(rnd, QUERY_POOL.map((x) => x[0]), QUERY_POOL.map((x) => x[1]))];
      const budget = pick(rnd, BUDGETS.map((b) => b[0]), BUDGETS.map((b) => b[1]));
      const objection = pick(rnd, OBJECTIONS.map((o) => o[0]), OBJECTIONS.map((o) => o[1]));
      push({
        ts, kind: "conversation", query: q,
        meta: { budget, intent: q.includes("compare") ? "compare" : q.includes("under") ? "budget" : "advice", objection: objection === "none" ? undefined : objection },
      });
    }

    // product views
    const views = activity * 4 + Math.floor(rnd() * 8);
    for (let i = 0; i < views; i++) {
      push({ ts: base - Math.floor(rnd() * 16) * 3600_000, kind: "view", productId: pick(rnd, HEAVY_PRODUCTS.map((p) => p[0]), HEAVY_PRODUCTS.map((p) => p[1])) });
    }

    // compares
    const compares = 1 + Math.floor(rnd() * 3);
    for (let i = 0; i < compares; i++) {
      const pair = pick(rnd, COMPARE_PAIRS.map((c) => `${c[0]}|${c[1]}`), COMPARE_PAIRS.map((c) => c[2]));
      const [a, b] = pair.split("|");
      push({ ts: base - Math.floor(rnd() * 12) * 3600_000, kind: "compare", productId: a, secondProductId: b });
    }

    // funnel: cart adds → checkouts → orders / abandons
    const carts = 2 + Math.floor(rnd() * 4);
    for (let i = 0; i < carts; i++) {
      const pid = pick(rnd, HEAVY_PRODUCTS.map((p) => p[0]), HEAVY_PRODUCTS.map((p) => p[1]));
      push({ ts: base - Math.floor(rnd() * 10) * 3600_000, kind: "cart_add", productId: pid });
    }
    const checkouts = Math.max(1, Math.round(carts * (0.45 + rnd() * 0.25)));
    for (let i = 0; i < checkouts; i++) {
      const completes = rnd() < 0.62;
      if (completes) {
        push({ ts: base - Math.floor(rnd() * 8) * 3600_000, kind: "checkout", meta: { total: 20000 + Math.floor(rnd() * 90000) } });
        if (rnd() < 0.8) push({ ts: base - Math.floor(rnd() * 6) * 3600_000, kind: "order", meta: { total: 20000 + Math.floor(rnd() * 90000) } });
      } else {
        push({
          ts: base - Math.floor(rnd() * 8) * 3600_000, kind: "abandon",
          productId: pick(rnd, HEAVY_PRODUCTS.map((p) => p[0])),
          meta: { stage: rnd() < 0.55 ? "shipping" : "payment" },
        });
      }
    }
  }

  events.sort((a, b) => a.ts - b.ts);
  save(events);
  try {
    localStorage.setItem(SEED_KEY, String(now));
  } catch {
    /* noop */
  }
}
seedIfEmpty();

/* ---------------- aggregates (admin NOVA + dashboard) ---------------- */
export function eventsInDays(days: number): BehaviorEvent[] {
  const cutoff = Date.now() - days * DAY;
  return load().filter((e) => e.ts >= cutoff);
}
export function countKind(events: BehaviorEvent[], kind: EventKind): number {
  return events.filter((e) => e.kind === kind).length;
}

export function topQueries(events: BehaviorEvent[], n = 6): { query: string; count: number }[] {
  const map = new Map<string, number>();
  events.filter((e) => (e.kind === "conversation" || e.kind === "search") && e.query).forEach((e) => {
    const q = e.query!.trim().toLowerCase();
    map.set(q, (map.get(q) ?? 0) + 1);
  });
  return [...map.entries()].map(([query, count]) => ({ query, count })).sort((a, b) => b.count - a.count).slice(0, n);
}

export interface BudgetBucket { label: string; count: number; pct: number }
export function budgetHistogram(events: BehaviorEvent[]): BudgetBucket[] {
  const defs: { label: string; min: number; max: number }[] = [
    { label: "Under 20k", min: 0, max: 20000 },
    { label: "20–40k", min: 20000, max: 40000 },
    { label: "40–60k", min: 40000, max: 60000 },
    { label: "60–100k", min: 60000, max: 100000 },
    { label: "Over 100k", min: 100000, max: Infinity },
  ];
  const budgets = events.filter((e) => e.kind === "conversation" && e.meta?.budget).map((e) => e.meta!.budget!);
  const counts = defs.map((d) => budgets.filter((b) => b >= d.min && b < d.max).length);
  const total = budgets.length || 1;
  return defs.map((d, i) => ({ label: d.label, count: counts[i], pct: Math.round((counts[i] / total) * 100) }));
}

export function topProducts(events: BehaviorEvent[], kind: EventKind, n = 5): { id: string; count: number }[] {
  const map = new Map<string, number>();
  events.filter((e) => e.kind === kind && e.productId).forEach((e) => {
    map.set(e.productId!, (map.get(e.productId!) ?? 0) + 1);
  });
  return [...map.entries()].map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count).slice(0, n);
}

export function topComparePairs(events: BehaviorEvent[], n = 5): { a: string; b: string; count: number }[] {
  const map = new Map<string, number>();
  events.filter((e) => e.kind === "compare" && e.productId).forEach((e) => {
    const pair = [e.productId!, e.secondProductId ?? e.productId!].sort().join("|");
    map.set(pair, (map.get(pair) ?? 0) + 1);
  });
  return [...map.entries()]
    .map(([pair, count]) => {
      const [a, b] = pair.split("|");
      return { a, b, count };
    })
    .sort((x, y) => y.count - x.count)
    .slice(0, n);
}

export function objectionCounts(events: BehaviorEvent[]): { objection: string; count: number }[] {
  const map = new Map<string, number>();
  events.filter((e) => e.kind === "conversation" && e.meta?.objection).forEach((e) => {
    map.set(e.meta!.objection!, (map.get(e.meta!.objection!) ?? 0) + 1);
  });
  return [...map.entries()].map(([objection, count]) => ({ objection, count })).sort((a, b) => b.count - a.count);
}

export interface Funnel { views: number; carts: number; checkouts: number; orders: number; convPct: number; cartDropPct: number }
export function funnel(events: BehaviorEvent[]): Funnel {
  const views = countKind(events, "view");
  const carts = countKind(events, "cart_add");
  const checkouts = countKind(events, "checkout");
  const orders = countKind(events, "order");
  return {
    views, carts, checkouts, orders,
    convPct: views ? Math.round((orders / views) * 1000) / 10 : 0,
    cartDropPct: carts ? Math.round(((carts - checkouts) / carts) * 100) : 0,
  };
}

export function shippingDropoffs(events: BehaviorEvent[]): number {
  return events.filter((e) => e.kind === "abandon" && e.meta?.stage === "shipping").length;
}

/** Weekly purchase totals for the trend sparkline. */
export function weeklyOrderTrend(events: BehaviorEvent[], weeks = 8): { week: string; total: number; count: number }[] {
  const out: { week: string; total: number; count: number }[] = [];
  const now = Date.now();
  for (let w = weeks - 1; w >= 0; w--) {
    const start = now - (w + 1) * 7 * DAY;
    const end = now - w * 7 * DAY;
    const orders = events.filter((e) => e.kind === "order" && e.ts >= start && e.ts < end);
    out.push({
      week: new Date(end).toLocaleDateString("en-KE", { day: "numeric", month: "short" }),
      total: orders.reduce((s, e) => s + (e.meta?.total ?? 0), 0),
      count: orders.length,
    });
  }
  return out;
}
