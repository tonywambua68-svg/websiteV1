/**
 * NOVA tool layer — the ONLY channel the AI may use to touch data.
 *
 * Security model:
 * • Customer tools return `PublicProduct` — a whitelist of fields that are
 *   officially listed on the website. Internal pricing (supplier cost,
 *   wholesale, margins) must never reach the frontend bundle at all; if it
 *   ever does, this whitelist keeps it out of every AI answer.
 * • `get_order_status` only ever receives the signed-in customer's OWN
 *   orders; one customer can never query another's.
 * • Admin tools re-check the session role on every call — authorization is
 *   enforced in the service layer, not by hiding UI buttons.
 *
 * Backend mapping (production): each function here becomes a server-side
 * tool callable via OpenAI function-calling from `POST /api/chatbot/ask`,
 * running against PostgreSQL instead of the local catalogue.
 */

import { PRODUCTS, byId, discountOf, fmt, type Product } from "../../data/products";
import {
  DELIVERY_OPTIONS, FREE_DELIVERY_AT, MPESA_ACCOUNT_NOTE, MPESA_PAYBILL_NUMBER,
  MPESA_PAYMENT_STEPS, PAYMENT_WORDS,
} from "../../config";
import { POLICIES } from "../../data/policies";
import { currentUser, type SafeUser } from "../auth";
import type { Order } from "../../data/content";
import { statusLabel } from "../../data/content";

/* ---------------- public product view (whitelist) ---------------- */
export interface PublicProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: string;        // website-listed selling price — the ONLY price NOVA may quote
  priceNum: number;
  oldPrice?: string;
  discountPct: number;
  stock: number;
  condition: string;
  warranty: string;
  tagline: string;
  ram?: string;
  storage?: string;
  screen?: string;
  processor?: string;
  graphics?: string;
  battery?: string;
  specs: [string, string][];
}

export function publicView(p: Product): PublicProduct {
  return {
    id: p.id, name: p.name, brand: p.brand, category: p.category,
    price: fmt(p.price), priceNum: p.price,
    oldPrice: p.oldPrice ? fmt(p.oldPrice) : undefined,
    discountPct: discountOf(p),
    stock: p.stock, condition: p.condition, warranty: p.warranty, tagline: p.tagline,
    ram: p.ram, storage: p.storage, screen: p.screen, processor: p.processor,
    graphics: p.graphics, battery: p.battery,
    specs: p.specs,
  };
}

/* ---------------- tool: search_products ---------------- */
export interface SearchOpts {
  category?: string;
  query?: string;
  maxPrice?: number;
  minRamGb?: number;
  inStockOnly?: boolean;
  limit?: number;
}
export function searchProducts(opts: SearchOpts): PublicProduct[] {
  let list = PRODUCTS.slice();
  if (opts.inStockOnly !== false) list = list.filter((p) => p.stock > 0);
  if (opts.category) list = list.filter((p) => p.category === opts.category);
  if (typeof opts.maxPrice === "number") list = list.filter((p) => p.price <= opts.maxPrice!);
  if (typeof opts.minRamGb === "number") {
    list = list.filter((p) => p.ram && parseInt(p.ram) >= opts.minRamGb!);
  }
  if (opts.query) {
    const q = opts.query.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) || p.category.includes(q),
    );
  }
  return list.slice(0, opts.limit ?? 6).map(publicView);
}

/* ---------------- tool: get_product_specs ---------------- */
export function getProductSpecs(idOrName: string): PublicProduct | null {
  const p = byId(idOrName) ?? findProductByName(idOrName);
  return p ? publicView(p) : null;
}

export function findProductByName(text: string): Product | null {
  const t = text.toLowerCase();
  // exact-ish name match first, then token overlap
  const exact = PRODUCTS.find((p) => t.includes(p.name.toLowerCase()));
  if (exact) return exact;
  let best: Product | null = null;
  let bestScore = 0;
  for (const p of PRODUCTS) {
    const tokens = `${p.brand} ${p.name}`.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    const score = tokens.filter((w) => t.includes(w)).length;
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return bestScore >= 2 ? best : null;
}

/* ---------------- tool: check_compatibility ---------------- */
export type CompatVerdict = "compatible" | "incompatible" | "unverifiable";
export interface CompatResult { verdict: CompatVerdict; explanation: string }

export function checkCompatibility(
  subject: { kind: "ram" | "storage" | "general"; sizeGb?: number; type?: string },
  target: PublicProduct,
): CompatResult {
  const specStr = target.specs.map(([k, v]) => `${k}: ${v}`).join(" · ").toLowerCase();

  if (subject.kind === "ram") {
    const memLine = target.specs.find(([k]) => /memory|ram/i.test(k))?.[1] ?? "";
    const genMatch = memLine.match(/lp?ddr(\d)/i);
    const expandable = /expand/i.test(memLine);
    const wantsType = subject.type?.match(/ddr(\d)/i)?.[1];

    if (!genMatch) {
      return {
        verdict: "unverifiable",
        explanation: `Our listing for the ${target.name} doesn't state its RAM generation, so I can't confirm a fit. The spec sheet says: “${memLine || "Memory details not listed"}”. I'd rather tell you that than guess — send us the exact laptop model on WhatsApp and we'll verify before you buy.`,
      };
    }
    if (wantsType && wantsType !== genMatch[1]) {
      return {
        verdict: "incompatible",
        explanation: `The ${target.name} uses DDR${genMatch[1]} memory (listing: “${memLine}”), so a DDR${wantsType} module will not fit. Look for DDR${genMatch[1]} instead.`,
      };
    }
    if (subject.sizeGb && !expandable && target.ram && parseInt(target.ram) >= subject.sizeGb) {
      return {
        verdict: "unverifiable",
        explanation: `The ${target.name} ships with ${target.ram} and the listing doesn't say the memory is expandable, so I can't confirm adding ${subject.sizeGb}GB. Ask us on WhatsApp with the exact model and we'll check.`,
      };
    }
    return {
      verdict: "compatible",
      explanation: `Based on our listing, the ${target.name} uses ${memLine}${expandable ? " and is expandable" : ""}. A DDR${genMatch[1]} module of the right capacity is the correct type${subject.sizeGb ? ` — ${subject.sizeGb}GB fits that generation` : ""}. Note: I can only confirm what's published on the website; if your unit is a special variant, we'll double-check on WhatsApp before dispatch.`,
    };
  }

  if (subject.kind === "storage") {
    const hasNvme = /nvme|m\.2/i.test(specStr);
    if (hasNvme) {
      return {
        verdict: "compatible",
        explanation: `Yes — the ${target.name} listing includes NVMe/M.2 storage (${target.storage ?? "see spec sheet"}), so an M.2 NVMe SSD like the Kore NV1 will work. As always, we confirm against your exact unit on WhatsApp if you'd like.`,
      };
    }
    return {
      verdict: "unverifiable",
      explanation: `The ${target.name} listing doesn't specify its storage interface, so I can't confirm an SSD upgrade. Share the model on WhatsApp and we'll verify before you order.`,
    };
  }

  return {
    verdict: "unverifiable",
    explanation: `I only confirm compatibility when our website data supports it, and there isn't enough detail here. Tell me the exact two products and I'll check what's listed.`,
  };
}

/* ---------------- tool: get_shipping_policy ---------------- */
export function getShippingPolicy() {
  const policy = POLICIES.find((p) => p.slug === "delivery");
  return {
    options: DELIVERY_OPTIONS,
    freeDeliveryAt: FREE_DELIVERY_AT,
    intro: policy?.intro ?? "",
  };
}

/* ---------------- tool: get_mpesa_payment_steps ---------------- */
export function getMpesaPaymentSteps() {
  return {
    steps: MPESA_PAYMENT_STEPS,
    paybillConfigured: MPESA_PAYBILL_NUMBER.trim() !== "",
    paybill: MPESA_PAYBILL_NUMBER.trim() || undefined,
    accountNote: MPESA_ACCOUNT_NOTE,
    afterPayNote: PAYMENT_WORDS.afterPayNote,
    verifyNote: PAYMENT_WORDS.verifyNote,
  };
}

/* ---------------- tool: get_order_status (own orders only) ---------------- */
export interface OrderStatusResult {
  found: boolean;
  message: string;
  order?: { id: string; date: string; status: string; statusLabel: string; total: string; itemCount: number };
}

/**
 * `orders` must be the signed-in customer's OWN order list — the engine
 * passes only the session owner's records. There is no parameter to request
 * someone else's data.
 */
export function getOwnOrderStatus(user: SafeUser | null, orders: Order[], ref: string | null): OrderStatusResult {
  if (!user) {
    return {
      found: false,
      message:
        "Sign in first (Account → Sign in) and I'll happily check your order. For privacy, I only ever look at the signed-in customer's own orders — never anyone else's.",
    };
  }
  if (orders.length === 0) {
    return { found: false, message: `I don't see any orders on your account yet, ${user.name.split(" ")[0]}. Once you place one, I can track it here.` };
  }
  let order: Order | undefined;
  if (ref) {
    const norm = ref.trim().toUpperCase().replace(/\s+/g, "");
    order = orders.find((o) => o.id.toUpperCase().replace(/\s+/g, "").includes(norm.replace(/^#/, "")));
    if (!order) {
      return { found: false, message: `I couldn't find an order matching “${ref}” on your account. Double-check the reference — it looks like IMR-2026-0148.` };
    }
  } else {
    order = orders[0]; // most recent
  }
  const label = statusLabel(order.status);
  const hint =
    order.status === "payment-pending"
      ? " Next step: pay via M-PESA PayBill, then send us the confirmation message on WhatsApp so we can verify it."
      : order.status === "delivered"
        ? " Enjoy your tech — and karibu back anytime!"
        : order.status === "out-for-delivery"
          ? " Keep your phone close — the courier will call you."
          : "";
  return {
    found: true,
    order: {
      id: order.id, date: order.date, status: order.status, statusLabel: label,
      total: fmt(order.total), itemCount: order.items.reduce((s, i) => s + i.qty, 0),
    },
    message: `Order ${order.id} (${order.itemCount} item${order.itemCount > 1 ? "s" : ""}, ${order.total}) is currently: ${label}.${hint}`,
  };
}

/* ---------------- admin-only tools (role-checked) ---------------- */
function requireAdmin(): SafeUser | null {
  const u = currentUser();
  return u && u.role === "admin" ? u : null;
}

export const adminTools = {
  /** ADMIN ONLY — customer behaviour analytics. */
  canAccessAnalytics(): boolean {
    return requireAdmin() !== null;
  },
};
