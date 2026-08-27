/**
 * Kenya selling-price calculator.
 *
 *   supplier cost (→ KES)  +  shipping/import  +  other costs  =  landed cost
 *   landed cost × (1 + markup%)                                 = recommended KES
 *
 * Every input is admin-configurable (defaults in PricingSettings, per-product
 * overrides on each import). Internal costs are NEVER exposed to customers —
 * the storefront only ever receives `sellingPriceKes`.
 */

import type { PricingSettings } from "./types";

export const DEFAULT_PRICING: PricingSettings = {
  usdToKes: 129.5,
  cnyToKes: 17.9,
  defaultShippingKes: 2000,
  defaultOtherCostsKes: 500,
  defaultMarkupPct: 20,
  roundTo: 999,
};

export interface PriceBreakdown {
  supplierKes: number;
  shippingKes: number;
  otherCostsKes: number;
  landedCostKes: number;
  markupKes: number;
  recommendedKes: number;
  marginPct: number; // gross margin at the recommended price
}

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

export function calcPrice(
  input: {
    currency: "USD" | "CNY" | "KES";
    supplierPrice: number;
    shippingKes: number;
    otherCostsKes: number;
    markupPct: number;
  },
  settings: PricingSettings,
): PriceBreakdown {
  const supplierKes = input.supplierPrice * rateFor(input.currency, settings);
  const landedCostKes = supplierKes + input.shippingKes + input.otherCostsKes;
  const markupKes = landedCostKes * (input.markupPct / 100);
  const raw = landedCostKes + markupKes;
  const recommendedKes = roundPrice(raw, settings.roundTo);
  const marginPct = recommendedKes > 0 ? Math.round(((recommendedKes - landedCostKes) / recommendedKes) * 100) : 0;
  return {
    supplierKes: Math.round(supplierKes),
    shippingKes: input.shippingKes,
    otherCostsKes: input.otherCostsKes,
    landedCostKes: Math.round(landedCostKes),
    markupKes: Math.round(markupKes),
    recommendedKes,
    marginPct,
  };
}

export const fmtKes = (n: number) => `KSh ${Math.round(n).toLocaleString("en-KE")}`;
