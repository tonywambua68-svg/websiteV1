/**
 * Duplicate detection — SKU → model → source product id → source URL →
 * name+brand fallback. Checked against BOTH the import queue and the live
 * catalogue (so a product already in the store is never re-imported).
 */

import type { Product } from "../../data/products";
import type { ImportedProduct, RawFeedItem } from "./types";

const norm = (s?: string) => (s ?? "").trim().toLowerCase().replace(/\s+/g, "");
const normUrl = (s?: string) =>
  (s ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");

export interface DuplicateHit {
  where: "import-queue" | "live-catalogue";
  id: string;
  name: string;
  matchedOn: "SKU" | "Model" | "Source ID" | "Source URL" | "Name + brand";
}

export function findDuplicate(
  item: Pick<RawFeedItem, "sourceProductId" | "sourceUrl" | "sku" | "model" | "name" | "brand">,
  queue: ImportedProduct[],
  catalogue: Product[],
): DuplicateHit | null {
  const sku = norm(item.sku);
  const model = norm(item.model);
  const srcId = norm(item.sourceProductId);
  const url = normUrl(item.sourceUrl);
  const nameBrand = `${norm(item.brand)}|${norm(item.name)}`;

  const check = (
    cand: { sku?: string; model?: string; sourceProductId?: string; sourceUrl?: string; name?: string; brand?: string },
    where: DuplicateHit["where"],
    id: string,
    name: string,
  ): DuplicateHit | null => {
    if (sku && norm(cand.sku) === sku) return { where, id, name, matchedOn: "SKU" };
    if (model && norm(cand.model) === model) return { where, id, name, matchedOn: "Model" };
    if (srcId && norm(cand.sourceProductId) === srcId) return { where, id, name, matchedOn: "Source ID" };
    if (url && normUrl(cand.sourceUrl) === url) return { where, id, name, matchedOn: "Source URL" };
    return null;
  };

  for (const q of queue) {
    if (q.status === "rejected") continue;
    const hit = check(q, "import-queue", q.id, q.name);
    if (hit) return hit;
  }
  for (const p of catalogue) {
    const hit = check(p as unknown as { sku?: string; model?: string }, "live-catalogue", p.id, p.name);
    if (hit) return hit;
    if (nameBrand !== "|" && `${norm(p.brand)}|${norm(p.name)}` === nameBrand) {
      return { where: "live-catalogue", id: p.id, name: p.name, matchedOn: "Name + brand" };
    }
  }
  return null;
}
