/**
 * Product database — a JSON document store at server/data/products.json.
 *
 * Deliberately tiny and dependency-free. The storage layer is isolated here
 * (load / save / find / mutate) so it can later be swapped for PostgreSQL or
 * SQLite without touching the API routes.
 *
 * MIGRATION: on first boot, if the database file does not exist, the existing
 * catalogue is imported straight from the real source of truth —
 * src/data/products.ts — using Vite's ssrLoadModule. The original file is
 * never modified, and an existing database is never overwritten.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const DB_PATH = process.env.PRODUCTS_DB || join(process.cwd(), "server", "data", "products.json");

/** @type {{ version: number, migratedAt: string|null, products: object[] }} */
let state = { version: 1, migratedAt: null, products: [] };
let ready = false;

export function dbPath() {
  return DB_PATH;
}

export function allProducts() {
  return state.products;
}

export function findProduct(id) {
  return state.products.find((p) => p.id === id) ?? null;
}

export function upsertProduct(record) {
  const idx = state.products.findIndex((p) => p.id === record.id);
  if (idx === -1) state.products.unshift(record);
  else state.products[idx] = record;
  save();
  return record;
}

export function deleteProduct(id) {
  const before = state.products.length;
  state.products = state.products.filter((p) => p.id !== id);
  if (state.products.length !== before) save();
  return state.products.length !== before;
}

function save() {
  try {
    mkdirSync(dirname(DB_PATH), { recursive: true });
    const tmp = `${DB_PATH}.tmp`;
    writeFileSync(tmp, JSON.stringify(state, null, 2), "utf8");
    renameSync(tmp, DB_PATH); // atomic — a crash mid-write can't corrupt the db
  } catch (err) {
    console.error("[db] Failed to save:", err.message);
  }
}

/** Map a frontend Product (src/data/products.ts) to an API record. */
function toApiRecord(p, now) {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    model: null,
    category: p.category,
    price: p.price,
    oldPrice: p.oldPrice ?? null,
    currency: "KES",
    image: null,
    productUrl: null,
    sku: null,
    stock: p.stock,
    condition: p.condition ?? "New",
    specifications: Array.isArray(p.specs) ? p.specs : [],
    source: "seed",
    sourceProductId: null,
    status: "PUBLISHED",
    internal: {}, // supplier cost / markup / profit — admin-only, stripped from public reads
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Initialise the database.
 *
 * On first boot (no database file) the existing catalogue is migrated from
 * src/data/products.ts. A headless Vite instance — middleware mode, NO port
 * opened — is used purely to load the TypeScript module, then closed.
 */
export async function initDb() {
  if (ready) return;

  if (existsSync(DB_PATH)) {
    try {
      const parsed = JSON.parse(readFileSync(DB_PATH, "utf8"));
      if (parsed && Array.isArray(parsed.products)) {
        state = { version: parsed.version ?? 1, migratedAt: parsed.migratedAt ?? null, products: parsed.products };
        ready = true;
        console.log(`[db] Loaded ${state.products.length} products from ${DB_PATH}`);
        return;
      }
    } catch {
      console.warn("[db] Existing database unreadable — starting fresh (old file kept as-is).");
    }
  }

  // ---- one-time migration from the real catalogue ----
  const now = new Date().toISOString();
  let vite = null;
  try {
    const { createServer } = await import("vite");
    vite = await createServer({
      server: { middlewareMode: true }, // headless — never listens on a port
      appType: "custom",
      logLevel: "error",
    });
    const mod = await vite.ssrLoadModule("/src/data/products.ts");
    const seeded = (mod.PRODUCTS || []).map((p) => toApiRecord(p, now));
    state = { version: 1, migratedAt: now, products: seeded };
    save();
    ready = true;
    console.log(`[db] Migration complete — imported ${seeded.length} products from src/data/products.ts into ${DB_PATH}`);
    return;
  } catch (err) {
    console.warn("[db] Could not load src/data/products.ts for seeding:", err.message);
  } finally {
    if (vite) await vite.close().catch(() => {});
  }

  state = { version: 1, migratedAt: null, products: [] };
  save();
  ready = true;
  console.log(`[db] Started with an empty database at ${DB_PATH}`);
}
