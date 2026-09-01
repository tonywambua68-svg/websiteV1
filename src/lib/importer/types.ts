/**
 * Product Importer — shared types.
 * Shaped for the future pipeline:  Supplier/API/feed → Importer → Product DB →
 * Admin approval → WooCommerce → Customer.
 */

import type { CategoryId } from "../../data/products";

export type ImportSourceId = "aliexpress" | "alibaba" | "csv" | "sample";
export type ImportStatus = "imported" | "review" | "approved" | "published" | "rejected";

/** How a product's selling price is derived. */
export type PricingMethod = "category-rule" | "fixed" | "percent" | "custom";

export interface SourceImage {
  url: string;
  /** Kept for attribution/review only — never auto-republished. */
  note?: string;
  selected: boolean;
}

/** A product as pulled from a marketplace feed, before admin review. */
export interface ImportedProduct {
  id: string; // internal import id
  status: ImportStatus;
  source: ImportSourceId;
  sourceProductId: string; // marketplace product id
  sourceUrl: string; // preserved so EVERY product can be reviewed at its origin
  seller?: string;
  importedAt: string; // ISO

  // raw + cleaned fields
  rawName: string;
  name: string;
  brand: string;
  model?: string;
  sku?: string;
  rawDescription: string;
  description: string;
  specs: [string, string][];
  sourceCategory: string; // marketplace's own category label
  storeCategory: CategoryId | null; // mapped (or manually chosen) store category
  mappedAutomatically: boolean;

  // pricing (supplier side — INTERNAL, never shown to customers)
  currency: "USD" | "CNY" | "KES";
  supplierPrice: number; // in `currency`
  exchangeRate: number; // KES per 1 unit of `currency`
  moq: number; // minimum order quantity
  pricingMethod: PricingMethod; // per-product override (default: category-rule)
  fixedMarkupKes: number; // used when method = fixed
  markupPct: number; // used when method = percent (and as category-rule fallback)
  customPriceKes: number; // used when method = custom
  // per-unit costs (KSh) feeding the net-profit calculation
  deliveryCostKes: number; // inbound shipping / logistics
  paymentFeesKes: number; // M-PESA / gateway fees
  adCostKes: number; // marketing allocation per unit
  otherCostsKes: number;
  sellingPriceKes: number; // engine output / admin's final decision

  stock: number;
  stockStatus: "in_stock" | "low" | "out";
  shippingInfo?: string;
  etaDays?: string;
  images: SourceImage[];
  flags: string[]; // cleaning/validation notes ("unmapped category", "marketing text removed"…)
}

export interface ImportLogEntry {
  id: string;
  ts: string; // ISO
  source: ImportSourceId | "system";
  ref: string; // product name / url / id
  status: ImportStatus | "duplicate" | "error" | "info";
  message: string;
  actor: string; // admin email
}

export interface CategoryMapping {
  sourceCategory: string; // marketplace label (case-insensitive match)
  storeCategory: CategoryId;
}

export interface PricingSettings {
  usdToKes: number;
  cnyToKes: number;
  defaultShippingKes: number; // default delivery/inbound cost per unit
  defaultOtherCostsKes: number;
  defaultPaymentFeesKes: number;
  defaultAdCostKes: number;
  defaultMarkupPct: number; // fallback % when no category rule matches
  defaultPricingMethod: PricingMethod;
  roundTo: 50 | 100 | 500 | 999; // price rounding strategy
}

/**
 * Marketplace adapter contract — modular by design.
 * Add `OtherSupplierAdapter implements MarketplaceAdapter` later without
 * touching the pipeline.
 *
 * COMPLIANCE: adapters NEVER scrape, bypass CAPTCHAs/logins/rate-limits, or
 * fetch pages directly from the browser. They consume data the admin is
 * permitted to use: official API/feed exports (pasted JSON) or CSV downloads
 * from authorised affiliate programmes.
 */
export interface MarketplaceAdapter {
  id: ImportSourceId;
  label: string;
  /** Human description of the permitted intake method. */
  intake: string;
  /** Parse an official API/feed JSON payload into raw items. Throws on invalid data. */
  parseFeed(json: string): RawFeedItem[];
  /** Validate a single product URL (recorded for review — never fetched). */
  isValidUrl(url: string): boolean;
}

export interface RawFeedItem {
  sourceProductId: string;
  sourceUrl: string;
  name: string;
  brand?: string;
  model?: string;
  sku?: string;
  description?: string;
  specs?: [string, string][];
  sourceCategory: string;
  currency: "USD" | "CNY" | "KES";
  price: number;
  moq?: number;
  stock?: number;
  seller?: string;
  shippingInfo?: string;
  etaDays?: string;
  imageUrls?: string[];
}
