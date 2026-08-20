/**
 * NOVA — customer-facing intelligence engine.
 *
 * Product truth policy (strict):
 * • NOVA only speaks from the website's own data, via the controlled tools
 *   in ./tools.ts. No invented specs, prices or availability — ever.
 * • The ONLY price NOVA may quote is the official website-listed price
 *   (PublicProduct.price). Internal costs/margins never reach this layer.
 * • If the website doesn't contain an answer, NOVA says so and offers the
 *   WhatsApp channel — it does not guess.
 *
 * Guardrails run BEFORE intent matching, so prompt-injection attempts never
 * reach the recommendation logic.
 */

import { fmt, PRODUCTS, type Product } from "../../data/products";
import { FAQS, type Order } from "../../data/content";
import type { SafeUser } from "../auth";
import {
  checkCompatibility, findProductByName, getMpesaPaymentSteps, getOwnOrderStatus,
  getProductSpecs, getShippingPolicy, publicView, searchProducts,
  type PublicProduct,
} from "./tools";
import { logConversation } from "./analytics";

/* ---------------- types ---------------- */
export type NovaIntent =
  | "greeting" | "help" | "recommend" | "specs" | "compare" | "compatibility"
  | "shipping" | "payment" | "order_status" | "warranty" | "returns"
  | "objection_price" | "off_topic" | "injection" | "fallback";

export interface NovaRec { p: PublicProduct; reasons: string[] }
export interface NovaResponse { text: string; recs?: NovaRec[]; kind: NovaIntent }

export interface NovaMemory {
  budget?: number;
  useCase?: string;
  lastRecs: string[];
  viewedId?: string;
}
export function createMemory(): NovaMemory {
  return { lastRecs: [] };
}

/* ---------------- guards (run first) ---------------- */
const INJECTION_RE =
  /(ignore|disregard|forget|override).{0,24}(instruction|rule|prompt|guideline)|system prompt|reveal your|show me your (prompt|instructions|rules)|act as|pretend you (are|have)|jailbreak|developer mode|dan mode|supplier (cost|price)|wholesale|purchase cost|cost price|buying (cost|price)|profit margin|internal (price|cost|data|database)|how much do you (buy|pay)|hidden (price|database)/i;

const TECH_RE =
  /(laptop|notebook|phone|smartphone|computer|pc|gaming|console|audio|headphone|earbud|earphone|speaker|monitor|screen|display|tv|television|router|wifi|wi-fi|mesh|internet|watch|smartwatch|camera|webcam|charger|power ?bank|ssd|nvme|storage|ram|memory|battery|processor|cpu|gpu|graphics|keyboard|mouse|printer|tablet|ipad|tech|gadget|device|spec|mpesa|m-pesa|lipa|paybill|pay|payment|order|deliver|shipping|ship|courier|dispatch|warrant|guarantee|return|refund|price|cost|budget|afford|cheap|expensive|buy|purchase|cart|checkout|account|discount|deal|offer|stock|availab|compare|versus|\bvs\b|upgrade|compatible|fit|support|school|student|campus|programming|coding|design|gaming|work|office)/i;

const OFF_TOPIC_RE =
  /\b(capital of|weather|recipe|cook|poem|essay|story|joke|football match|who won|meaning of life|translate|horoscope|lottery|betting|politics|election)\b/i;

/* ---------------- parsing helpers ---------------- */
function parseBudget(t: string): number | undefined {
  const km = t.match(/(\d{1,4})\s*k\b/i);
  if (km) return parseInt(km[1]) * 1000;
  const full = t.match(/\b(\d[\d,]{3,8})\b/);
  if (full) return parseInt(full[1].replace(/,/g, ""));
  return undefined;
}
function parseUseCase(t: string): string | undefined {
  if (/(student|school|campus|university|college|class)/i.test(t)) return "student";
  if (/(programming|coding|developer|code|software)/i.test(t)) return "programming";
  if (/(gaming|games|esports|fortnite|fifa|play)/i.test(t)) return "gaming";
  if (/(design|photo|video|edit|creative|content)/i.test(t)) return "creative";
  if (/(work|office|business|meetings)/i.test(t)) return "work";
  if (/(movie|netflix|films|entertainment)/i.test(t)) return "media";
  return undefined;
}
function findTwoProducts(t: string): [Product | null, Product | null] {
  const parts = t.split(/\b(?:vs\.?|versus|and|,|\+)\b/i).map((s) => s.trim());
  if (parts.length >= 2) {
    const a = findProductByName(parts[0]);
    const b = findProductByName(parts[1]);
    if (a && b && a.id !== b.id) return [a, b];
  }
  // fallback: first two distinct product-name matches anywhere in the text
  const found: Product[] = [];
  for (const p of PRODUCTS) {
    if (found.length === 2) break;
    const tokens = `${p.brand} ${p.name}`.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    if (tokens.filter((w) => t.includes(w)).length >= 2 && !found.some((f) => f.id === p.id)) {
      found.push(p);
    }
  }
  return [found[0] ?? null, found[1] ?? null];
}

/* ---------------- recommendation engine ---------------- */
const USE_SCORES: { use: string; label: string; score: (p: Product) => number }[] = [
  { use: "gaming", label: "Dedicated graphics for gaming", score: (p) => (p.graphics && /rx-\d/i.test(p.graphics) ? 60 : p.category === "gaming" ? 40 : 0) },
  { use: "programming", label: "16GB+ RAM for compiling & multitasking", score: (p) => (p.ram && parseInt(p.ram) >= 16 ? 45 : 10) },
  { use: "student", label: "Light with long battery for campus days", score: (p) => (p.battery && parseInt(p.battery) >= 10 ? 35 : 15) + (p.price < 60000 ? 20 : 0) },
  { use: "creative", label: "Colour-accurate display for creative work", score: (p) => (p.specs.some(([k, v]) => /display/i.test(k) && /(2\.2k|3k|4k|qhd|oled|dci)/i.test(v)) ? 45 : 0) },
  { use: "work", label: "Reliable all-day performance for work", score: () => 22 },
  { use: "media", label: "Big, vivid screen for movies", score: (p) => (p.art === "tv" || p.art === "monitor" || p.art === "tablet" ? 40 : 5) },
];

function recommend(input: string, mem: NovaMemory): NovaResponse {
  const budget = mem.budget;
  const use = mem.useCase;

  // which categories make sense?
  const cats = new Set<string>();
  if (/laptop|notebook|computer|pc|school|student|programming|coding/i.test(input) || use === "student" || use === "programming") cats.add("laptops");
  if (/gaming|games|esports/i.test(input) || use === "gaming") { cats.add("gaming"); cats.add("laptops"); }
  if (/phone|smartphone|simu/i.test(input)) cats.add("phones");
  if (/tablet/i.test(input)) cats.add("tablets");
  if (/headphone|earbud|audio|music|speaker/i.test(input)) cats.add("audio");
  if (/monitor|screen|display|tv/i.test(input) || use === "creative" || use === "media") cats.add("monitors");
  if (/router|wifi|mesh|internet/i.test(input)) cats.add("networking");
  if (/watch|camera|webcam/i.test(input)) cats.add("smart");
  if (/charger|power ?bank|ssd|storage|keyboard|mouse|accessor/i.test(input)) cats.add("accessories");
  if (cats.size === 0) { cats.add("laptops"); cats.add("phones"); }

  const pool = PRODUCTS.filter((p) => cats.has(p.category) && p.stock > 0);
  const scored = pool.map((p) => {
    let s = 30;
    const labels: string[] = [];
    for (const u of USE_SCORES) {
      if (use === u.use) {
        const v = u.score(p);
        if (v > 0) { s += v; labels.push(u.label); }
      }
    }
    if (budget !== undefined) {
      if (p.price > budget) s -= 90;
      else {
        s += 15;
        if (budget - p.price <= budget * 0.3) s += 18; // strong value near the ceiling
      }
    }
    if (p.oldPrice) s += 6; // genuine markdowns only — already on the website
    return { p, s, labels };
  }).sort((a, b) => b.s - a.s).slice(0, 3);

  if (scored.length === 0) {
    return {
      kind: "recommend",
      text: "I checked our live catalogue and nothing in that category is in stock right now. I won't guess at alternatives — but message us on WhatsApp and a technician will find you the closest match.",
    };
  }

  const recs: NovaRec[] = scored.map(({ p, labels }) => {
    const reasons: string[] = [];
    if (budget !== undefined) {
      reasons.push(
        p.price <= budget
          ? `Listed at ${fmt(p.price)} — ${fmt(budget - p.price)} under your budget`
          : `Slightly above budget, included because it's the closest match`,
      );
    }
    reasons.push(...labels.slice(0, 2));
    reasons.push(`${p.warranty} · genuine, sealed stock`);
    if (p.stock <= 5) reasons.push(`Only ${p.stock} left in stock`);
    return { p: publicView(p), reasons: [...new Set(reasons)].slice(0, 3) };
  });

  mem.lastRecs = recs.map((r) => r.p.id);
  const head =
    budget !== undefined
      ? `Here are ${recs.length} options from our live catalogue that fit ${fmt(budget)}${use ? ` and ${use} use` : ""}. Every price below is our official website price:`
      : `Here are my top ${recs.length} picks from the website's current stock${use ? ` for ${use}` : ""}:`;
  return { kind: "recommend", text: head, recs };
}

/* ---------------- answer builders ---------------- */
function specsAnswer(input: string, mem: NovaMemory): NovaResponse | null {
  const named = findProductByName(input);
  const p = named ? publicView(named) : mem.viewedId ? getProductSpecs(mem.viewedId) : null;
  if (!p) return null;
  mem.viewedId = p.id;
  const lines = p.specs.slice(0, 8).map(([k, v]) => `• ${k}: ${v}`).join("\n");
  return {
    kind: "specs",
    recs: [{ p, reasons: [`Website price: ${p.price}`, p.warranty] }],
    text: `Here's exactly what our website lists for the ${p.name} (${p.condition}):\n\n${lines}\n\nWarranty: ${p.warranty}. If a spec you need isn't listed here, I don't have it — ask us on WhatsApp and we'll confirm with the distributor before you buy.`,
  };
}

function compareAnswer(input: string, mem: NovaMemory): NovaResponse | null {
  const [a, b] = findTwoProducts(input);
  if (!a || !b) return null;
  mem.viewedId = a.id;
  mem.lastRecs = [a.id, b.id];
  const pa = publicView(a);
  const pb = publicView(b);
  const row = (label: string, va: string | undefined, vb: string | undefined) => `• ${label}: ${pa.name.split(" ")[0]} — ${va ?? "not listed"} · ${pb.name.split(" ")[0]} — ${vb ?? "not listed"}`;
  const cheaper = pa.priceNum <= pb.priceNum ? pa : pb;
  const pricier = cheaper === pa ? pb : pa;
  return {
    kind: "compare",
    recs: [{ p: pa, reasons: [`${pa.price} listed`] }, { p: pb, reasons: [`${pb.price} listed`] }],
    text:
      `Comparing from our live listings:\n\n` +
      row("Price", pa.price, pb.price) + "\n" +
      row("Processor", pa.processor, pb.processor) + "\n" +
      row("RAM", pa.ram, pb.ram) + "\n" +
      row("Storage", pa.storage, pb.storage) + "\n" +
      row("Graphics", pa.graphics, pb.graphics) + "\n" +
      row("Battery", pa.battery, pb.battery) + "\n\n" +
      `Bottom line: the ${pricier.name} is the stronger machine on paper; the ${cheaper.name} (${cheaper.price}) is the better value. Tell me your budget and what you'll use it for, and I'll tell you which one I'd actually pick.`,
  };
}

function compatibilityAnswer(input: string, mem: NovaMemory): NovaResponse | null {
  const isRam = /\bram\b|memory|ddr/i.test(input);
  const isSsd = /ssd|nvme|\bstorage\b/i.test(input);
  if (!isRam && !isSsd) return null;
  const namedTarget = findProductByName(input);
  const targetProduct = namedTarget
    ? publicView(namedTarget)
    : mem.viewedId
      ? getProductSpecs(mem.viewedId)
      : mem.lastRecs[0]
        ? getProductSpecs(mem.lastRecs[0])
        : null;
  if (!targetProduct) {
    return {
      kind: "compatibility",
      text: "I can check that — but I need to know which device you're upgrading. Tell me the exact laptop or product name (or open its page and ask me there), and I'll check against what our website lists. If the listing doesn't confirm it, I'll say so honestly instead of guessing.",
    };
  }
  const sizeMatch = input.match(/(\d+)\s*gb/i);
  const typeMatch = input.match(/ddr\s?(\d)/i);
  const result = checkCompatibility(
    { kind: isRam ? "ram" : "storage", sizeGb: sizeMatch ? parseInt(sizeMatch[1]) : undefined, type: typeMatch ? `ddr${typeMatch[1]}` : undefined },
    targetProduct,
  );
  const icon = result.verdict === "compatible" ? "✅" : result.verdict === "incompatible" ? "⛔" : "⚠️";
  return {
    kind: "compatibility",
    recs: [{ p: targetProduct, reasons: [`Website price: ${targetProduct.price}`] }],
    text: `${icon} ${result.explanation}`,
  };
}

function shippingAnswer(): NovaResponse {
  const s = getShippingPolicy();
  const opts = s.options.map((o) => `• ${o.label} — ${o.eta} · ${o.fee === 0 ? "FREE" : fmt(o.fee)}`).join("\n");
  return {
    kind: "shipping",
    text:
      `Here's our delivery setup, straight from the website:\n\n${opts}\n\n` +
      (s.freeDeliveryAt > 0 ? `Orders above ${fmt(s.freeDeliveryAt)} get free delivery. ` : "") +
      `Everything is confirmed personally on WhatsApp before dispatch, and you'll get updates as your order moves.`,
  };
}

function paymentAnswer(): NovaResponse {
  const m = getMpesaPaymentSteps();
  const steps = m.steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
  return {
    kind: "payment",
    text:
      `We take M-PESA PayBill — here's the official process:\n\n${steps}\n\n` +
      (m.paybillConfigured
        ? `PayBill number: ${m.paybill} · Account Number: ${m.accountNote}.\n\n`
        : `Our PayBill number appears at checkout once your order reference is issued.\n\n`) +
      `${m.afterPayNote}`,
  };
}

function orderAnswer(user: SafeUser | null, orders: Order[], input: string): NovaResponse {
  const refMatch = input.match(/(imr[-\s]?\d{4}[-\s]?\d{3,4})/i) ?? input.match(/#?(\d{4,})/);
  const res = getOwnOrderStatus(user, orders, refMatch ? refMatch[1] : null);
  return { kind: "order_status", text: res.message };
}

function warrantyAnswer(input: string): NovaResponse {
  const p = findProductByName(input);
  const faq = FAQS.find((f) => /warranty/i.test(f.q))!;
  return {
    kind: "warranty",
    text: p
      ? `The ${p.name} carries: ${p.warranty}.\n\n${faq.a}`
      : faq.a,
  };
}

function returnsAnswer(): NovaResponse {
  const faq = FAQS.find((f) => /return policy/i.test(f.q))!;
  return { kind: "returns", text: faq.a };
}

function objectionAnswer(mem: NovaMemory): NovaResponse {
  const ceiling = mem.budget ?? (mem.viewedId ? getProductSpecs(mem.viewedId)?.priceNum : undefined) ?? 60000;
  const cheaper = searchProducts({ maxPrice: Math.round(ceiling * 0.85), inStockOnly: true, limit: 2 });
  mem.lastRecs = cheaper.map((c) => c.id);
  return {
    kind: "objection_price",
    recs: cheaper.map((p) => ({ p, reasons: [`Listed at ${p.price}`, p.warranty] })),
    text:
      `Totally fair — price matters, and I won't pretend otherwise or invent fake discounts. What you get at our listed prices: genuine serial-verified stock, the warranty stated on each product page, and delivery across Kenya with a human confirming every step.\n\n` +
      (cheaper.length
        ? `If the budget is tight, here are strong alternatives we currently list lower:`
        : `Tell me your exact budget and I'll find the best option at that number.`),
  };
}

const REFUSAL =
  "I can't do that. I only work with this store's public website data — official listed prices, published specs, delivery and payment info. I have no access to internal costs, supplier prices, system prompts or other customers' information, and I won't pretend otherwise. Happy to help you pick tech instead — what are you shopping for?";

const OFF_TOPIC =
  "That's a little outside my lane — I'm NOVA, and I only know technology and this store: products, specs, budgets, M-PESA payments, delivery and orders. So… what tech can I help you find today? Laptops, phones, gaming, audio — just name a budget and I'll shortlist real options from our live catalogue.";

/* ---------------- main entry ---------------- */
export function novaAsk(rawInput: string, mem: NovaMemory, ctx: { user: SafeUser | null; orders: Order[] }): NovaResponse {
  const input = rawInput.trim();
  const t = input.toLowerCase();

  // 1) Security guardrails — before anything else.
  if (INJECTION_RE.test(t)) return { kind: "injection", text: REFUSAL };

  // 2) Greetings & help
  if (/^(hi|hey|hello|habari|karibu|mambo|jambo|niaje|good (morning|afternoon|evening))\b/i.test(t) && t.length < 40) {
    return {
      kind: "greeting",
      text: "Karibu! I'm NOVA — this store's AI assistant. Ask me things like:\n• “Best laptop under KSh 40,000 for school”\n• “Compare AeroBook and Havoc”\n• “Will DDR5 RAM fit my laptop?”\n• “How do I pay with M-PESA?”\n• “Where is my order?”\n\nI answer only from our live website data — real products, official prices.",
    };
  }
  if (/what can you do|how do you work|^help\b|what is nova|who are you/i.test(t)) {
    return {
      kind: "help",
      text: "I'm NOVA, the store's shopping intelligence. I can:\n• Recommend products from our live catalogue for your exact budget\n• Pull official specs and compare any two products\n• Check RAM/SSD compatibility against our listings\n• Explain M-PESA PayBill payments and delivery options\n• Track your own orders when you're signed in\n\nI never invent specs or prices — if it's not on the website, I'll tell you I don't know.",
    };
  }

  // 3) Parse understanding (budget, use case) — and remember it.
  const budget = parseBudget(t);
  if (budget) mem.budget = budget;
  const use = parseUseCase(t);
  if (use) mem.useCase = use;

  // 4) Off-topic redirection (only when nothing store-related is present).
  if (!TECH_RE.test(t) && (OFF_TOPIC_RE.test(t) || /\?$/.test(input))) {
    logConversation({ text: input, intent: "off_topic" });
    return { kind: "off_topic", text: OFF_TOPIC };
  }

  // 5) Intent routing
  let res: NovaResponse | null = null;
  let intent: NovaIntent = "fallback";

  if (/expensive|too much|cheaper|afford|pricey|costly|reduce the price|negotiat/i.test(t)) {
    res = objectionAnswer(mem);
  } else if (/mpesa|m-pesa|lipa|paybill|how do i pay|payment|pay with/i.test(t)) {
    res = paymentAnswer();
  } else if (/where.*order|my order|order status|track|delayed|when will.*arrive|order.*late/i.test(t)) {
    res = orderAnswer(ctx.user, ctx.orders, input);
  } else if (/deliver|shipping|ship to|courier|dispatch|how long.*take|arrive|pickup/i.test(t)) {
    res = shippingAnswer();
  } else if (/warranty|guarantee/i.test(t)) {
    res = warrantyAnswer(input);
  } else if (/return|refund/i.test(t)) {
    res = returnsAnswer();
  } else if (/compare|\bvs\b|versus|which is better|difference between/i.test(t)) {
    res = compareAnswer(t, mem);
  } else if (/fit|compatible|compatib|upgrade|support.*ram|ram.*support/i.test(t)) {
    res = compatibilityAnswer(t, mem);
  } else if (/spec|specification|details of|tell me about/i.test(t)) {
    res = specsAnswer(t, mem);
  } else if (budget || /recommend|which (laptop|phone|one)|what should i (buy|get)|suggest|best (laptop|phone|option)|looking for/i.test(t)) {
    res = recommend(input, mem);
  }

  if (!res) {
    // last resort: a product name alone → specs; otherwise fallback
    const named = findProductByName(input);
    res = named ? specsAnswer(named.name, mem) : null;
    if (!res) {
      intent = "fallback";
      res = {
        kind: "fallback",
        text: "I want to get this right rather than guess. Could you rephrase with a product, budget or topic? For example “laptop under 45k for school”, “specs of the Nova X5”, or “how long does delivery to Mombasa take?”. If it's something specific, our WhatsApp team answers within minutes.",
      };
    }
  }
  intent = res.kind;

  logConversation({
    text: input,
    budget,
    intent,
    objection: intent === "objection_price" ? "price" : undefined,
  });
  return res;
}
