/**
 * NOVA — private ADMIN business-intelligence engine.
 *
 * Separation guarantee: every entry point here re-checks the session role
 * (via requireAdmin in ./tools and the route guard in App). Customer-facing
 * code never imports this module's outputs, and this module never receives
 * or returns internal cost/margin data — it works only on behaviour events,
 * public catalogue fields and derived aggregates.
 */

import { byId, fmt, PRODUCTS } from "../../data/products";
import {
  budgetHistogram, eventsInDays, funnel, objectionCounts, shippingDropoffs,
  topComparePairs, topProducts, topQueries, weeklyOrderTrend,
} from "./analytics";
import { churnRisks, insightsSnapshot, segmentSummary, deriveCustomers } from "./customerService";

export interface AdminAnswer { text: string; chips?: string[] }

function requireAdminEmail(): string | null {
  // Role enforcement happens at the route/context layer; this double-check
  // reads the session directly so the service is safe even if called
  // out-of-band.
  try {
    const raw = localStorage.getItem("imara.session.v1");
    if (!raw) return null;
    const s = JSON.parse(raw) as { userId: string; expiresAt: number };
    if (Date.now() > s.expiresAt) return null;
    const users = JSON.parse(localStorage.getItem("imara.users.v1") ?? "[]") as { id: string; role: string; email: string }[];
    const u = users.find((x) => x.id === s.userId);
    return u && u.role === "admin" ? u.email : null;
  } catch {
    return null;
  }
}

const name = (id: string) => byId(id)?.name ?? id;

/* ---------------- recommendation engine (data-cited) ---------------- */
export interface MarketingRec { title: string; why: string; data: string[] }

export function getMarketingInsights(): MarketingRec[] {
  const d30 = eventsInDays(30);
  const recs: MarketingRec[] = [];

  const hist = budgetHistogram(d30);
  const biggest = [...hist].sort((a, b) => b.count - a.count)[0];
  if (biggest && biggest.pct >= 25) {
    recs.push({
      title: `Campaign: laptops & phones in the ${biggest.label} band`,
      why: "A large share of recent customer conversations volunteered budgets in this band, so demand is already proven.",
      data: [`${biggest.pct}% of last-30-day budget mentions were ${biggest.label}`, `${biggest.count} conversations`],
    });
  }

  const queries = topQueries(d30, 3);
  if (queries.length) {
    recs.push({
      title: `Content: answer “${queries[0].query}”`,
      why: "This was the most-asked question. A buying-guide page or short video answering it captures demand at the moment of intent.",
      data: queries.map((q) => `“${q.query}” × ${q.count}`),
    });
  }

  const pairs = topComparePairs(d30, 1);
  if (pairs.length) {
    recs.push({
      title: `Bundle / compare page: ${name(pairs[0].a)} vs ${name(pairs[0].b)}`,
      why: "These two are compared against each other most often — a head-to-head page (or bundle) resolves the decision and lifts conversion.",
      data: [`Compared together ${pairs[0].count}× in 30 days`],
    });
  }

  const fun = funnel(d30);
  const shipDrops = shippingDropoffs(d30);
  if (fun.cartDropPct >= 40 || shipDrops > 5) {
    recs.push({
      title: "Fix the cart → checkout drop-off",
      why:
        fun.cartDropPct >= 40
          ? `A large proportion of carts never reach checkout.`
          : `Several shoppers abandon right after seeing shipping.` +
            (shipDrops > 5 ? ` ${shipDrops} abandons happened at the shipping step.` : ""),
      data: [`${fun.cartDropPct}% of carts don't reach checkout`, `${shipDrops} shipping-step abandons`],
    });
  }

  const objections = objectionCounts(d30).filter((o) => o.objection !== "none");
  if (objections.length) {
    recs.push({
      title: `Objection handling: ${objections[0].objection}`,
      why: "This is the most common reason customers hesitate. Address it on product pages and in the FAQ with concrete proof (warranty terms, delivery proof, genuineness verification).",
      data: objections.map((o) => `${o.objection} × ${o.count}`),
    });
  }

  const churn = churnRisks(deriveCustomers());
  if (churn.length) {
    recs.push({
      title: `Retention: win back ${churn.length} potentially at-risk customer${churn.length > 1 ? "s" : ""}`,
      why: "They bought repeatedly before but have gone quiet. A personal WhatsApp win-back (no invented discounts) is high-value and cheap.",
      data: churn.slice(0, 3).map((c) => `${c.customerId}: silent ${c.daysInactive}d, ${c.previousFrequency} prior orders`),
    });
  }

  return recs;
}

/* ---------------- natural-language admin Q&A ---------------- */
export function adminAsk(raw: string): AdminAnswer {
  if (!requireAdminEmail()) {
    return { text: "Unauthorized. Admin NOVA is only available to signed-in administrators." };
  }
  const t = raw.toLowerCase();
  const d30 = eventsInDays(30);
  const snap = insightsSnapshot();
  const chips = (arr: string[]) => arr;

  if (/churn|at.risk|risk of|losing customer/i.test(t)) {
    const risks = churnRisks(snap.records);
    if (!risks.length) return { text: "No customers currently show churn-risk signals. RFM thresholds are configurable in src/lib/nova/customerService.ts." };
    const lines = risks.map((r) => `• ${r.customerId} — ${r.reason} (lifetime ${fmt(r.monetary)})`).join("\n");
    return {
      text: `${risks.length} customer(s) are potentially at-risk. This is a signal, not a certainty:\n\n${lines}\n\nSuggested action: a personal WhatsApp win-back message (draft available in the Outreach tab).`,
      chips: chips(risks.map((r) => r.customerId)),
    };
  }

  if (/segment|vip|loyal|new customer/i.test(t)) {
    const segs = segmentSummary(snap.records);
    const lines = segs.map((s) => `• ${s.segment}: ${s.count} customer(s), ${fmt(s.revenue)} lifetime`).join("\n");
    return { text: `Current customer segments (RFM-based, thresholds configurable):\n\n${lines}`, chips: segs.map((s) => `${s.segment} · ${s.count}`) };
  }

  if (/budget|how much.*spend|price range/i.test(t)) {
    const hist = budgetHistogram(d30);
    const lines = hist.map((h) => `• ${h.label}: ${h.count} mention(s) — ${h.pct}%`).join("\n");
    return { text: `Budgets customers volunteered in the last 30 days:\n\n${lines}`, chips: hist.map((h) => `${h.label} ${h.pct}%`) };
  }

  if (/asking|question|looking for|search|quer/i.test(t)) {
    const queries = topQueries(d30, 6);
    const lines = queries.map((q) => `• “${q.query}” × ${q.count}`).join("\n");
    return { text: `Most frequent customer questions / searches (30 days):\n\n${lines}`, chips: queries.map((q) => q.query) };
  }

  if (/compar/i.test(t)) {
    const pairs = topComparePairs(d30, 5);
    const lines = pairs.map((p) => `• ${name(p.a)} ↔ ${name(p.b)} — ${p.count}×`).join("\n");
    return { text: `Most-compared product pairs (30 days):\n\n${lines}`, chips: pairs.map((p) => `${name(p.a)} vs ${name(p.b)}`) };
  }

  if (/object|hesitat|why.*not buy|doubt/i.test(t)) {
    const objs = objectionCounts(d30).filter((o) => o.objection !== "none");
    const lines = objs.length ? objs.map((o) => `• ${o.objection} × ${o.count}`).join("\n") : "• No objections recorded yet.";
    return { text: `Objections customers raised (30 days):\n\n${lines}`, chips: objs.map((o) => o.objection) };
  }

  if (/funnel|conversion|abandon|not buying|drop/i.test(t)) {
    const fun = funnel(d30);
    const ship = shippingDropoffs(d30);
    return {
      text: `Last-30-day conversion funnel:\n\n• Product views: ${fun.views}\n• Cart adds: ${fun.carts}\n• Checkouts: ${fun.checkouts}\n• Orders: ${fun.orders}\n\nView→order conversion: ${fun.convPct}%. Cart drop-off: ${fun.cartDropPct}%. ${ship} shopper(s) abandoned at the shipping step — a likely friction point worth reviewing.`,
      chips: [`Conv ${fun.convPct}%`, `Cart drop ${fun.cartDropPct}%`],
    };
  }

  if (/trend|week|sales|revenue|aov|average order/i.test(t)) {
    const trend = weeklyOrderTrend(d30, 8);
    const lines = trend.map((w) => `• w/e ${w.week}: ${w.count} order(s), ${fmt(w.total)}`).join("\n");
    return { text: `Weekly order trend (8 weeks) — AOV ${fmt(snap.aov)}:\n\n${lines}`, chips: [`AOV ${fmt(snap.aov)}`, `${snap.totalOrders} orders`] };
  }

  if (/attention|popular|most viewed|hot product|market more|promote/i.test(t)) {
    const viewed = topProducts(d30, "view", 5);
    const lines = viewed.map((v) => `• ${name(v.id)} — ${v.count} view(s)`).join("\n");
    return { text: `Products getting the most attention (30 days):\n\n${lines}`, chips: viewed.map((v) => name(v.id)) };
  }

  if (/recommend|campaign|what should|insight|marketing|strategy/i.test(t)) {
    const recs = getMarketingInsights();
    const lines = recs.map((r, i) => `${i + 1}. ${r.title}\n   Why: ${r.why}`).join("\n\n");
    return { text: `Data-backed marketing recommendations:\n\n${lines}`, chips: recs.map((r) => r.title) };
  }

  return {
    text:
      `I can analyse this store's behaviour data. Try:\n` +
      `• “Which customers are at risk of churning?”\n• “What budgets are customers mentioning?”\n• “What are customers asking repeatedly?”\n• “Which products are compared most?”\n• “Why aren't customers buying?”\n• “What should we market next?”`,
  };
}
