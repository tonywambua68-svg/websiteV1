/**
 * Product Importer — pipeline store.
 *
 *   IMPORTED → REVIEW → (EDIT) → APPROVE → PUBLISH
 *                                        ↘ REJECT
 *
 * Demo-grade persistence: localStorage (keys below). In production these map
 * 1:1 to PostgreSQL tables: imported_products, import_logs, category_mappings,
 * and pricing settings move to server-side config.
 */

import { useCallback, useEffect, useState } from "react";
import { CATEGORIES, PRODUCTS, type ArtKind, type CategoryId, type Product } from "../../data/products";
import { getAllProducts } from "../../data/products";
import { currentUser } from "../auth";
import { registerPublished, unregisterPublished } from "./registry";
import { calcPrice, DEFAULT_PRICING } from "./pricing";
import { cleanProduct } from "./clean";
import { findDuplicate, type DuplicateHit } from "./dedupe";
import { SAMPLE_FEED } from "./adapters";
import type {
  CategoryMapping, ImportedProduct, ImportLogEntry, ImportSourceId, PricingSettings, RawFeedItem,
} from "./types";

const P_KEY = "imara.importer.products.v1";
const L_KEY = "imara.importer.logs.v1";
const M_KEY = "imara.importer.maps.v1";
const S_KEY = "imara.importer.settings.v1";

/* ---------------- default category mappings ---------------- */
const DEFAULT_MAPPINGS: CategoryMapping[] = [
  { sourceCategory: "laptop computers", storeCategory: "laptops" },
  { sourceCategory: "gaming laptops", storeCategory: "gaming" },
  { sourceCategory: "mini pc", storeCategory: "laptops" },
  { sourceCategory: "desktops", storeCategory: "gaming" },
  { sourceCategory: "monitors & accessories", storeCategory: "monitors" },
  { sourceCategory: "smartphones", storeCategory: "phones" },
  { sourceCategory: "tablets & e-readers", storeCategory: "tablets" },
  { sourceCategory: "computer storage", storeCategory: "accessories" },
  { sourceCategory: "memory / ram", storeCategory: "accessories" },
  { sourceCategory: "computer peripherals", storeCategory: "accessories" },
  { sourceCategory: "earphones & headphones", storeCategory: "audio" },
  { sourceCategory: "networking", storeCategory: "networking" },
  { sourceCategory: "chargers & power", storeCategory: "accessories" },
  { sourceCategory: "webcams", storeCategory: "smart" },
  { sourceCategory: "hubs & adapters", storeCategory: "accessories" },
];

/** Category → vector art + hue used when publishing (brand-consistent visuals). */
const ART_BY_CATEGORY: Record<CategoryId, ArtKind> = {
  laptops: "laptop", phones: "phone", tablets: "tablet", gaming: "tower",
  audio: "headphones", monitors: "monitor", networking: "router",
  accessories: "ssd", smart: "webcam",
};
const ART_BY_NAME: [RegExp, ArtKind][] = [
  [/earbud|earphone/i, "earbuds"], [/headphone/i, "headphones"], [/speaker/i, "speaker"],
  [/keyboard/i, "keyboard"], [/mouse/i, "mouse"], [/power\s?bank|charger/i, "powerbank"],
  [/monitor|screen/i, "monitor"], [/mini pc|desktop|gaming/i, "tower"], [/ssd|hdd|storage/i, "ssd"],
  [/webcam|camera/i, "webcam"], [/router|wifi|mesh/i, "router"], [/watch/i, "watch"], [/phone/i, "phone"],
];

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch { /* ignore */ }
}

const newId = () => `imp_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;

export function useImporter() {
  const [items, setItems] = useState<ImportedProduct[]>(() => read(P_KEY, []));
  const [logs, setLogs] = useState<ImportLogEntry[]>(() => read(L_KEY, []));
  const [mappings, setMappings] = useState<CategoryMapping[]>(() => read(M_KEY, DEFAULT_MAPPINGS));
  const [settings, setSettings] = useState<PricingSettings>(() => ({ ...DEFAULT_PRICING, ...read<Partial<PricingSettings>>(S_KEY, {}) }));

  useEffect(() => write(P_KEY, items), [items]);
  useEffect(() => write(L_KEY, logs.slice(0, 300)), [logs]);
  useEffect(() => write(M_KEY, mappings), [mappings]);
  useEffect(() => write(S_KEY, settings), [settings]);

  const actor = () => currentUser()?.email ?? "unknown";
  const log = useCallback((source: ImportLogEntry["source"], ref: string, status: ImportLogEntry["status"], message: string) => {
    setLogs((l) => [{ id: newId(), ts: new Date().toISOString(), source, ref, status, message, actor: actor() }, ...l].slice(0, 300));
  }, []);

  const mapCategory = useCallback(
    (sourceCategory: string): { cat: CategoryId | null; automatic: boolean } => {
      const hit = mappings.find((m) => m.sourceCategory === sourceCategory.trim().toLowerCase());
      return hit ? { cat: hit.storeCategory, automatic: true } : { cat: null, automatic: false };
    },
    [mappings],
  );

  /** Build an ImportedProduct from a raw feed item (clean + price + dedupe). */
  const buildFromRaw = useCallback(
    (raw: RawFeedItem, source: ImportSourceId): { item?: ImportedProduct; duplicate?: DuplicateHit; errors: string[] } => {
      const errors: string[] = [];
      if (!raw.name?.trim()) errors.push("Missing product name");
      if (!raw.price || raw.price <= 0) errors.push("Missing/invalid price");
      const dup = findDuplicate(raw, items, getAllProducts());
      if (dup) return { duplicate: dup, errors };

      const cleaned = cleanProduct({ name: raw.name, description: raw.description, specs: raw.specs });
      const { cat, automatic } = mapCategory(raw.sourceCategory);
      const flags = [...cleaned.flags];
      if (!cat) flags.push("Unmapped category — assign before publishing");
      if (!raw.imageUrls?.length) flags.push("No source images (reference) — store art will be used");

      const base = {
        currency: raw.currency, supplierPrice: raw.price,
        shippingKes: settings.defaultShippingKes, otherCostsKes: settings.defaultOtherCostsKes,
        markupPct: settings.defaultMarkupPct, exchangeRate: raw.currency === "USD" ? settings.usdToKes : raw.currency === "CNY" ? settings.cnyToKes : 1,
      };
      const calc = calcPrice(base, settings);
      const stock = raw.stock ?? 20;

      const item: ImportedProduct = {
        id: newId(), status: "imported", source,
        sourceProductId: raw.sourceProductId, sourceUrl: raw.sourceUrl, seller: raw.seller,
        importedAt: new Date().toISOString(),
        rawName: raw.name, name: cleaned.name, brand: raw.brand ?? "Unknown", model: raw.model, sku: raw.sku,
        rawDescription: raw.description ?? "", description: cleaned.description,
        specs: cleaned.specs, sourceCategory: raw.sourceCategory, storeCategory: cat, mappedAutomatically: automatic,
        ...base, recommendedKes: calc.recommendedKes, sellingPriceKes: calc.recommendedKes,
        moq: raw.moq ?? 1, stock, stockStatus: stock === 0 ? "out" : stock <= 10 ? "low" : "in_stock",
        shippingInfo: raw.shippingInfo, etaDays: raw.etaDays,
        images: (raw.imageUrls ?? []).map((url) => ({ url, selected: false, note: "Reference only — not republished without permission" })),
        flags,
      };
      return { item, errors };
    },
    [items, mapCategory, settings],
  );

  /** Import a batch of raw items. Returns a summary (never throws). */
  const importBatch = useCallback(
    (raws: RawFeedItem[], source: ImportSourceId) => {
      const summary = { imported: 0, duplicates: 0, invalid: 0 };
      const next: ImportedProduct[] = [];
      for (const raw of raws) {
        const { item, duplicate, errors } = buildFromRaw(raw, source);
        if (duplicate) {
          summary.duplicates++;
          log(source, raw.name || raw.sourceProductId, "duplicate", `Product already imported (matched on ${duplicate.matchedOn}: ${duplicate.name})`);
          continue;
        }
        if (!item) {
          summary.invalid++;
          log(source, raw.name || raw.sourceProductId, "error", `Invalid row — ${errors.join("; ")}`);
          continue;
        }
        next.push(item);
        summary.imported++;
        log(source, item.name, "imported", `Imported from ${source} · ${item.sourceProductId} · supplier ${item.currency} ${item.supplierPrice}`);
      }
      if (next.length) setItems((prev) => [...next, ...prev]);
      return summary;
    },
    [buildFromRaw, log],
  );

  const importSamples = useCallback(() => {
    const summary = importBatch(SAMPLE_FEED, "sample");
    log("sample", `${SAMPLE_FEED.length} sample products`, "info", `Sample feed run complete — ${summary.imported} imported, ${summary.duplicates} duplicates skipped`);
    return summary;
  }, [importBatch, log]);

  const update = useCallback((id: string, patch: Partial<ImportedProduct>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  /** Recalculate recommended price for an item from its cost inputs. */
  const recalc = useCallback(
    (it: ImportedProduct): ImportedProduct => {
      const calc = calcPrice(it, settings);
      return { ...it, recommendedKes: calc.recommendedKes, exchangeRate: it.currency === "USD" ? settings.usdToKes : it.currency === "CNY" ? settings.cnyToKes : 1 };
    },
    [settings],
  );

  const setStatus = useCallback((id: string, status: ImportedProduct["status"], note?: string) => {
    setItems((prev) => {
      const it = prev.find((x) => x.id === id);
      if (it) log(it.source, it.name, status, note ?? `Status → ${status}`);
      return prev.map((x) => (x.id === id ? { ...x, status } : x));
    });
  }, [log]);

  /** Convert an approved import into a storefront Product & register it. */
  const toProduct = useCallback((it: ImportedProduct): Product => {
    const cat = it.storeCategory ?? "accessories";
    let art: ArtKind = ART_BY_CATEGORY[cat];
    for (const [re, kind] of ART_BY_NAME) if (re.test(it.name)) { art = kind; break; }
    const hue = CATEGORIES.find((c) => c.id === cat)?.hue ?? "#0b7a63";
    const spec = (label: string) => it.specs.find(([k]) => k.toLowerCase().includes(label))?.[1];
    return {
      id: `ip_${it.id}`, name: it.name, brand: it.brand, category: cat,
      price: it.sellingPriceKes, rating: 0, reviews: 0, art, hue,
      tagline: it.specs.length ? `${it.specs[0][0]}: ${it.specs[0][1]}` : "New arrival — just landed.",
      description:
        (it.description || `${it.name} by ${it.brand}.`) +
        `\n\nSourced via the Imara Product Importer from ${it.source} (product ${it.sourceProductId}). ` +
        `Original listing preserved for review. Selling price includes import logistics.`,
      specs: [...it.specs, ["Warranty", "12-month Imara warranty"] as [string, string]],
      stock: it.stock, condition: "New", tags: ["new"], sold: 0,
      ram: spec("ram") ?? spec("memory"), storage: spec("storage") ?? spec("capacity"),
      screen: spec("display") ?? spec("panel"), processor: spec("processor") ?? spec("cpu"),
      graphics: spec("graphics"), battery: spec("battery"),
      warranty: "12-month Imara warranty",
      inBox: [it.name, "Standard accessories as per manufacturer"],
    };
  }, []);

  const publish = useCallback((id: string): string | null => {
    const it = items.find((x) => x.id === id);
    if (!it) return "Import not found.";
    if (!it.storeCategory) return "Assign a store category before publishing.";
    if (it.sellingPriceKes <= 0) return "Set a selling price before publishing.";
    const p = toProduct(it);
    registerPublished(p);
    setStatus(id, "published", `Published to storefront as ${p.id} at KSh ${it.sellingPriceKes.toLocaleString()}`);
    return null;
  }, [items, toProduct, setStatus]);

  const unpublish = useCallback((id: string) => {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    unregisterPublished(`ip_${it.id}`);
    setStatus(id, "approved", "Unpublished — removed from storefront, kept as approved");
  }, [items, setStatus]);

  const reject = useCallback((id: string, reason?: string) => {
    setStatus(id, "rejected", reason ? `Rejected — ${reason}` : undefined);
  }, [setStatus]);

  const remove = useCallback((id: string) => {
    const it = items.find((x) => x.id === id);
    if (it?.status === "published") unregisterPublished(`ip_${it.id}`);
    if (it) log(it.source, it.name, "info", "Import record deleted");
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, [items, log]);

  const setMapping = useCallback((sourceCategory: string, storeCategory: CategoryId) => {
    setMappings((prev) => {
      const key = sourceCategory.trim().toLowerCase();
      const rest = prev.filter((m) => m.sourceCategory !== key);
      return [...rest, { sourceCategory: key, storeCategory }];
    });
  }, []);

  const reapplyMappings = useCallback(() => {
    let changed = 0;
    setItems((prev) => prev.map((it) => {
      if (it.storeCategory) return it;
      const { cat, automatic } = mapCategory(it.sourceCategory);
      if (cat) { changed++; return { ...it, storeCategory: cat, mappedAutomatically: automatic }; }
      return it;
    }));
    log("system", "Category mappings", "info", "Re-applied mappings to unmapped imports");
    return changed;
  }, [mapCategory, log]);

  return {
    items, logs, mappings, settings,
    setSettings, update, recalc, importBatch, importSamples,
    setStatus, publish, unpublish, reject, remove, setMapping, reapplyMappings, log,
  };
}

export type ImporterApi = ReturnType<typeof useImporter>;

/** Quick stats for the dashboard header. */
export function importerStats(items: ImportedProduct[]) {
  const by = (s: ImportedProduct["status"]) => items.filter((i) => i.status === s).length;
  return {
    total: items.length, imported: by("imported"), review: by("review"),
    approved: by("approved"), published: by("published"), rejected: by("rejected"),
  };
}

/** Convenience re-export so pages can show the live catalogue size. */
export const catalogueSize = () => PRODUCTS.length;
