/**
 * NOVA customer intelligence service (ADMIN ONLY).
 *
 * Implements RFM segmentation, churn-risk detection and outreach drafting
 * over the behaviour event stream. Reusable from the admin dashboard and
 * (later) scheduled jobs.
 *
 * Demo-grade note: customers are derived deterministically from order
 * events in this browser's analytics stream. In production this service
 * runs server-side against the PostgreSQL `orders` + `product_events`
 * tables — the interfaces below are already shaped for that.
 */

import { eventsInDays, type BehaviorEvent } from "./analytics";

/* ---------------- configuration (tune, don't hard-code elsewhere) ---------------- */
export const SEGMENTATION = {
  /** A "new" customer's first purchase happened within this many days. */
  newWindowDays: 21,
  /** VIP: at least this many purchases within the recency window. */
  vipMinFrequency: 3,
  vipMaxRecencyDays: 30,
  /** Loyal: purchased at least twice, active within this window. */
  loyalMinFrequency: 2,
  loyalMaxRecencyDays: 45,
  /** At-risk: previously purchased ≥ this often but silent for this long. */
  atRiskMinFrequency: 2,
  atRiskSilentDays: 60,
  /** Churn prediction: no purchase for this many days. */
  churnSilentDays: 60,
};

/* ---------------- types ---------------- */
export type SegmentName = "VIP" | "Loyal" | "New" | "At-Risk" | "Regular";

export interface Purchase { ts: number; total: number }
export interface CustomerRecord {
  id: string;
  purchases: Purchase[];
  recencyDays: number;
  frequency: number;
  monetary: number;
  segment: SegmentName;
  firstTs: number;
  lastTs: number;
}

export interface ChurnRisk {
  customerId: string;
  daysInactive: number;
  previousFrequency: number;
  monetary: number;
  reason: string;
}

export interface OutreachDraft {
  audience: SegmentName;
  channel: "WhatsApp" | "Email";
  subject: string;
  body: string;
}

/* ---------------- derive customers from events ---------------- */
const DAY = 24 * 60 * 60 * 1000;

/** Deterministic bucket per order event (demo stand-in for real customer IDs). */
function bucketFor(eventId: string): string {
  let h = 0;
  for (let i = 0; i < eventId.length; i++) h = (h * 31 + eventId.charCodeAt(i)) | 0;
  return `c${(Math.abs(h) % 14) + 1}`;
}

export function deriveCustomers(days = 90): CustomerRecord[] {
  const events = eventsInDays(days);
  const orders = events.filter((e) => e.kind === "order");
  const byCustomer = new Map<string, Purchase[]>();
  for (const o of orders) {
    const id = o.customerId ?? bucketFor(o.id);
    const list = byCustomer.get(id) ?? [];
    list.push({ ts: o.ts, total: o.meta?.total ?? 0 });
    byCustomer.set(id, list);
  }

  const now = Date.now();
  const records: CustomerRecord[] = [];
  for (const [id, purchases] of byCustomer) {
    purchases.sort((a, b) => a.ts - b.ts);
    const firstTs = purchases[0].ts;
    const lastTs = purchases[purchases.length - 1].ts;
    const recencyDays = Math.floor((now - lastTs) / DAY);
    const frequency = purchases.length;
    const monetary = purchases.reduce((s, p) => s + p.total, 0);
    const firstPurchaseDays = Math.floor((now - firstTs) / DAY);

    let segment: SegmentName = "Regular";
    if (firstPurchaseDays <= SEGMENTATION.newWindowDays && frequency === 1) segment = "New";
    else if (frequency >= SEGMENTATION.vipMinFrequency && recencyDays <= SEGMENTATION.vipMaxRecencyDays) segment = "VIP";
    else if (frequency >= SEGMENTATION.loyalMinFrequency && recencyDays <= SEGMENTATION.loyalMaxRecencyDays) segment = "Loyal";
    else if (frequency >= SEGMENTATION.atRiskMinFrequency && recencyDays > SEGMENTATION.atRiskSilentDays) segment = "At-Risk";

    records.push({ id, purchases, recencyDays, frequency, monetary, segment, firstTs, lastTs });
  }
  return records.sort((a, b) => b.monetary - a.monetary);
}

export interface SegmentSummary { segment: SegmentName; count: number; revenue: number; colour: string }
export const SEGMENT_COLOURS: Record<SegmentName, string> = {
  VIP: "#f5a31a",
  Loyal: "#0b7a63",
  New: "#0369a1",
  Regular: "#5c716c",
  "At-Risk": "#d64545",
};

export function segmentSummary(records: CustomerRecord[]): SegmentSummary[] {
  const order: SegmentName[] = ["VIP", "Loyal", "New", "Regular", "At-Risk"];
  return order.map((segment) => {
    const group = records.filter((r) => r.segment === segment);
    return {
      segment,
      count: group.length,
      revenue: group.reduce((s, r) => s + r.monetary, 0),
      colour: SEGMENT_COLOURS[segment],
    };
  });
}

/* ---------------- churn risk ---------------- */
export function churnRisks(records: CustomerRecord[]): ChurnRisk[] {
  return records
    .filter(
      (r) =>
        r.recencyDays >= SEGMENTATION.churnSilentDays &&
        r.frequency >= SEGMENTATION.atRiskMinFrequency,
    )
    .map((r) => ({
      customerId: r.id,
      daysInactive: r.recencyDays,
      previousFrequency: r.frequency,
      monetary: r.monetary,
      reason: `Bought ${r.frequency}× previously but no order in ${r.recencyDays} days — potentially at-risk.`,
    }))
    .sort((a, b) => b.daysInactive - a.daysInactive);
}

/* ---------------- aggregates for the insights dashboard ---------------- */
export interface InsightsSnapshot {
  records: CustomerRecord[];
  segments: SegmentSummary[];
  churn: ChurnRisk[];
  aov: number;
  totalOrders: number;
  totalRevenue: number;
  newCustomers: number;
}

export function insightsSnapshot(): InsightsSnapshot {
  const records = deriveCustomers();
  const segments = segmentSummary(records);
  const churn = churnRisks(records);
  const totalOrders = records.reduce((s, r) => s + r.frequency, 0);
  const totalRevenue = records.reduce((s, r) => s + r.monetary, 0);
  return {
    records,
    segments,
    churn,
    aov: totalOrders ? Math.round(totalRevenue / totalOrders) : 0,
    totalOrders,
    totalRevenue,
    newCustomers: segments.find((s) => s.segment === "New")?.count ?? 0,
  };
}

/* ---------------- outreach drafts (reviewed by a human before sending) ---------------- */
/**
 * Builds a DRAFT message from real data only. NOVA never invents discounts —
 * the only offer referenced is the store's configured IMARA5 code, and only
 * where it genuinely helps (win-back). Every draft must be reviewed and sent
 * by the owner through their own WhatsApp/email — NOVA never sends anything.
 */
export function generateOutreach(opts: {
  segment: SegmentName;
  productName?: string;
  productPrice?: string;
  businessName: string;
}): OutreachDraft {
  const { segment, productName, productPrice, businessName } = opts;
  const productLine = productName
    ? `${productName}${productPrice ? ` (listed at ${productPrice})` : ""}`
    : "the new stock that just landed";

  if (segment === "VIP") {
    return {
      audience: segment,
      channel: "WhatsApp",
      subject: "A thank-you from " + businessName,
      body:
        `Hi! You're one of our most frequent customers, and we don't take that for granted.\n\n` +
        `We've set ${productLine} aside in our records for you — when new stock in this line arrives, you'll hear it from us first.\n\n` +
        `No pressure, no expiry — just a heads-up from a real person. Reply here anytime.\n\n— ${businessName}`,
    };
  }
  if (segment === "At-Risk") {
    return {
      audience: segment,
      channel: "WhatsApp",
      subject: "We miss you at " + businessName,
      body:
        `Hi! It's been a while since your last order, so this is a quick, honest hello from ${businessName}.\n\n` +
        `If something didn't meet expectations last time, tell me — I'll fix it personally. And if you've been waiting for the right moment, ${productLine} is in stock now.\n\n` +
        `Our current published offer still applies: code IMARA5 (5% off at checkout) — that's the real one from the website, nothing invented.\n\n— ${businessName}`,
    };
  }
  if (segment === "New") {
    return {
      audience: segment,
      channel: "WhatsApp",
      subject: `Welcome to ${businessName}`,
      body:
        `Karibu! Thanks for your first order — here's what to expect: every dispatch is confirmed personally on WhatsApp, and delivery updates come to you directly.\n\n` +
        `Questions about setup, warranty or anything else? Just reply here; a technician answers.\n\n— ${businessName}`,
    };
  }
  if (segment === "Loyal") {
    return {
      audience: segment,
      channel: "WhatsApp",
      subject: `You might like this — ${businessName}`,
      body:
        `Hi! Based on your previous orders, ${productLine} looks like a natural next step.\n\n` +
        `It's listed on the website with full specs and warranty — same honest price you've come to expect from us. Want me to hold one?\n\n— ${businessName}`,
    };
  }
  return {
    audience: segment,
    channel: "WhatsApp",
    subject: `Hello from ${businessName}`,
    body:
      `Hi! A quick note from ${businessName}: ${productLine} is available now with the full website-listed specs and warranty.\n\n` +
      `Reply here and a real person will help you choose.\n\n— ${businessName}`,
  };
}
