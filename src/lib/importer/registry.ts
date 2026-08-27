/**
 * Published-import registry.
 *
 * The single join point between the Product Importer and the live catalogue.
 * Products the admin APPROVES + PUBLISHES are registered here; `data/products.ts`
 * reads this registry so every consumer (Shop, search, NOVA, product pages,
 * cart, orders) sees published imports automatically.
 *
 * Kept dependency-free to avoid circular imports (data ⇄ lib).
 * Demo-grade storage: localStorage. In production this is the
 * `imported_products` PostgreSQL table (status = 'published').
 */

import { useSyncExternalStore } from "react";
import type { Product } from "../../data/products";

const KEY = "imara.importer.published.v1";

let cache: Product[] | null = null;
const listeners = new Set<() => void>();

function load(): Product[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Product[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache ?? []));
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((fn) => fn());
}

export function getPublished(): Product[] {
  return load();
}

export function registerPublished(p: Product): void {
  const list = load().filter((x) => x.id !== p.id);
  list.push(p);
  cache = list;
  persist();
}

export function unregisterPublished(id: string): void {
  cache = load().filter((x) => x.id !== id);
  persist();
}

/** React hook — re-renders consumers when the published set changes. */
export function usePublishedVersion(): number {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => load().length,
    () => 0,
  );
}
