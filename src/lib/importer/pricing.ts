/**
 * Flexible reseller pricing engine.
 *
 * Supports FOUR ways to price a product (per product, overridable):
 *
 *   1. category-rule  — inherit the rule set for the product's store category
 *   2. fixed          — Selling = Supplier cost + fixed markup (KSh)
 *   3. percent        — Selling = Supplier cost × (1 + markup%)
 *   4. custom         — Selling = admin-entered price (no rounding)
 *
 * PROFIT MATH
 *   Gross profit = Selling − Supplier cost
 *   Net profit   = Selling − Supplier cost − Delivery − Payment fees − Ads − Other
 *
 * SECURITY: supplier cost, markup and profit are INTERNAL. The storefront only
 * ever receives `sellingPriceKes` (see store.toProduct). None of the fields
 * here reach the customer-facing AI or pages.
 */

import type { CategoryId } from "../../data/products";
import type { PricingMethod, PricingSettings } from "./types";

export const DEFAULT_PRICING: PricingSettings = {
  usdToKes: 129.5,
  cnyToKes: 17.9,
  defaultShippingKes: 2000,
  defaultOtherCostsKes: 500,
  defaultPaymentFeesKes: 300,
  defaultAdCostKes: 0,
  defaultMarkupPct: 20,
  defaultPricingMethod: "category-rule",
  roundTo: 999,
};

export function rateFor(currency: "USD" | "CNY" | "KES", s: PricingSettings): number {
  return currency === "USD" ? s.usdToKes : currency === "CNY" ? s.cnyToKes : 1;
}

export function roundPrice(n: number, strategy: PricingSettings["roundTo"]): number {
  if (strategy === 999) {
    // classic retail: round up to the next ...999
    const base = Math.ceil(n / 1000) * 1000;
    return n >= base - 1 ? base + 999 : base - 1;
  }
  return Math.ceil(n / strategy) * strategy;
}

/* ---------------- category pricing rules ---------------- */

export interface CategoryPricingRule {
  categoryId: CategoryId;
  method: "fixed" | "percent";
  value: number; // KSh when fixed, % when percent
}

/** Default rules across the electronics range — all editable in the admin UI. */
export const DEFAULT_CATEGORY_RULES: CategoryPricingRule[] = [
  { categoryId: "laptops", method: "percent", value: 10 },
  { categoryId: "phones", method: "percent", value: 8 },
  { categoryId: "tablets", method: "percent", value: 10 },
  { categoryId: "gaming", method: "percent", value: 15 },
  { categoryId: "monitors", method: "percent", value: 12 },
  { categoryId: "audio", method: "percent", value: 20 },
  { categoryId: "networking", method: "percent", value: 20 },
  { categoryId: "smart", method: "percent", value: 18 },
  { categoryId: "accessories", method: "percent", value: 30 },
];

export function ruleFor(
  rules: CategoryPricingRule[],
  categoryId: CategoryId | null,
): CategoryPricingRule | null {
  if (!categoryId) return null;
  return rules.find((r) => r.categoryId === categoryId) ?? null;
}

/* ---------------- the per-product calculation ---------------- */

export interface ProductPricingInput {
  supplierCostKes: number;
  pricingMethod: PricingMethod;
  fixedMarkupKes: number;
  markupPct: number;
  customPriceKes: number;
  categoryRule: CategoryPricingRule | null; // resolved from the store category
  // per-unit costs (KSh)
  deliveryCostKes: number;
  paymentFeesKes: number;
  adCostKes: number;
  otherCostsKes: number;
  roundTo: PricingSettings["roundTo"];
}

export interface ProductPricingResult {
  supplierCostKes: number;
  /** The method actually used after resolving `category-rule`. */
  effectiveMethod: "fixed" | "percent" | "custom";
  /** KSh added on top of supplier cost (selling − supplier). */
  markupKes: number;
  sellingPriceKes: number;
  grossProfitKes: number;
  grossMarginPct: number;
  totalCostsKes: number;
  netProfitKes: number;
  netMarginPct: number;
}

export function calcProductPricing(input: ProductPricingInput): ProductPricingResult {
  const supplier = Math.max(0, input.supplierCostKes);

  // 1. Resolve method + markup value (category-rule falls back to % default).
  let method: ProductPricingResult["effectiveMethod"];
  let fixed = input.fixedMarkupKes;
  let pct = input.markupPct;

  if (input.pricingMethod === "custom") {
    method = "custom";
  } else if (input.pricingMethod === "fixed") {
    method = "fixed";
  } else if (input.pricingMethod === "percent") {
    method = "percent";
  } else {
    // category-rule → inherit from the category, else fall back to % markup
    if (input.categoryRule) {
      method = input.categoryRule.method;
      if (input.categoryRule.method === "fixed") fixed = input.categoryRule.value;
      else pct = input.categoryRule.value;
    } else {
      method = "percent";
    }
  }

  // 2. Raw selling price.
  let raw: number;
  if (method === "custom") raw = Math.max(0, input.customPriceKes);
  else if (method === "fixed") raw = supplier + Math.max(0, fixed);
  else raw = supplier * (1 + Math.max(0, pct) / 100);

  // 3. Round (never for custom — admin's exact number wins).
  const selling = method === "custom" ? Math.round(raw) : roundPrice(raw, input.roundTo);

  // 4. Profit math.
  const grossProfitKes = selling - supplier;
  const totalCostsKes =
    Math.max(0, input.deliveryCostKes) +
    Math.max(0, input.paymentFeesKes) +
    Math.max(0, input.adCostKes) +
    Math.max(0, input.otherCostsKes);
  const netProfitKes = selling - supplier - totalCostsKes;

  return {
    supplierCostKes: Math.round(supplier),
    effectiveMethod: method,
    markupKes: Math.round(grossProfitKes),
    sellingPriceKes: selling,
    grossProfitKes: Math.round(grossProfitKes),
    grossMarginPct: selling > 0 ? Math.round((grossProfitKes / selling) * 100) : 0,
    totalCostsKes: Math.round(totalCostsKes),
    netProfitKes: Math.round(netProfitKes),
    netMarginPct: selling > 0 ? Math.round((netProfitKes / selling) * 100) : 0,
  };
}

export const fmtKes = (n: number) => `KSh ${Math.round(n).toLocaleString("en-KE")}`;
