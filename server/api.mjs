/**
 * Product API — mounted at /api/* on the SAME server as the website (:3000).
 *
 *   GET    /api/products            list (public: PUBLISHED only · with key: ALL)
 *   GET    /api/products/check      duplicate check for the scraper (?sku&sourceProductId&url&brand&model&name)
 *   GET    /api/products/:id        single record
 *   POST   /api/products            create — requires x-api-key · status is FORCED to PENDING_REVIEW
 *   PUT    /api/products/:id        replace — requires x-api-key
 *   PATCH  /api/products/:id        partial update (e.g. status transitions) — requires x-api-key
 *   DELETE /api/products/:id        remove — requires x-api-key
 *   GET    /api/health              liveness + counts
 *
 * SECURITY
 * • The API key lives ONLY in the server environment (PRODUCTS_API_KEY in
 *   server/.env.local or the real env). It is never sent to or readable by
 *   the React frontend. If unset, a random key is generated and printed to
 *   the server console at boot.
 * • Public responses are sanitised — `internal` (costs, margins, supplier
 *   data) is stripped before it leaves the server.
 * • Mutating routes are rate-limited per IP.
 */
import { randomBytes } from "node:crypto";
import { allProducts, findProduct, upsertProduct, deleteProduct } from "./db.mjs";

const VALID_STATUS = ["PENDING_REVIEW", "APPROVED", "PUBLISHED", "REJECTED"];
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

/** Resolved at boot (see resolveApiKey). */
let API_KEY = "";
export function resolveApiKey() {
  if (process.env.PRODUCTS_API_KEY) {
    API_KEY = process.env.PRODUCTS_API_KEY;
    console.log("[api] Using PRODUCTS_API_KEY from the server environment.");
  } else {
    API_KEY = randomBytes(24).toString("hex");
    console.log("────────────────────────────────────────────────────────────");
    console.log("[api] No PRODUCTS_API_KEY set — generated a development key:");
    console.log(`      ${API_KEY}`);
    console.log("      Put it in server/.env.local as PRODUCTS_API_KEY=... to keep it stable.");
    console.log("────────────────────────────────────────────────────────────");
  }
  return API_KEY;
}

/* ---------------- helpers ---------------- */

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function readBody(req, limit = 1_000_000) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) {
        reject(new Error("Payload too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {});
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function authorized(req) {
  const key = req.headers["x-api-key"];
  return typeof key === "string" && key.length > 0 && key === API_KEY;
}

/** Strip internal fields before anything leaves the server unauthenticated. */
function sanitize(record) {
  const { internal, ...rest } = record;
  return rest;
}

const str = (v, max) => (typeof v === "string" ? v.slice(0, max) : undefined);
const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

/** Validate + normalise an incoming product payload. Returns { record?, errors }. */
function validateProduct(body, { partial = false, existing = null } = {}) {
  const errors = [];
  const need = (cond, msg) => { if (!cond) errors.push(msg); };

  const now = new Date().toISOString();
  const record = { ...(existing ?? {}), updatedAt: now };

  if (!partial || body.name !== undefined) {
    const name = str(body.name, 200)?.trim();
    need(!!name && name.length >= 2, "name: required string (2–200 chars)");
    if (name) record.name = name;
  }
  if (!partial || body.price !== undefined) {
    const price = num(body.price);
    need(price !== undefined && price >= 0, "price: required number ≥ 0 (KES selling price)");
    if (price !== undefined) record.price = Math.round(price);
  }
  if (!partial || body.category !== undefined) {
    const category = str(body.category, 60)?.trim();
    need(!!category, "category: required string");
    if (category) record.category = category;
  }

  // optional fields
  if (body.brand !== undefined) record.brand = str(body.brand, 80) ?? null;
  if (body.model !== undefined) record.model = str(body.model, 80) ?? null;
  if (body.oldPrice !== undefined) record.oldPrice = body.oldPrice === null ? null : num(body.oldPrice) ?? null;
  if (body.currency !== undefined) record.currency = ["KES", "USD", "CNY"].includes(body.currency) ? body.currency : "KES";
  if (body.image !== undefined) record.image = str(body.image, 1000) ?? null;
  if (body.productUrl !== undefined) record.productUrl = str(body.productUrl, 1000) ?? null;
  if (body.sku !== undefined) record.sku = str(body.sku, 80) ?? null;
  if (body.sourceProductId !== undefined) record.sourceProductId = str(body.sourceProductId, 120) ?? null;
  if (body.source !== undefined) record.source = str(body.source, 60) ?? null;
  if (body.condition !== undefined) record.condition = ["New", "Certified Refurbished"].includes(body.condition) ? body.condition : "New";
  if (body.stock !== undefined) record.stock = Math.max(0, Math.round(num(body.stock) ?? 0));

  if (body.specifications !== undefined) {
    if (Array.isArray(body.specifications)) {
      record.specifications = body.specifications
        .filter((s) => Array.isArray(s) && s.length >= 2)
        .slice(0, 60)
        .map(([k, v]) => [String(k).slice(0, 80), String(v).slice(0, 300)]);
    } else if (body.specifications && typeof body.specifications === "object") {
      record.specifications = Object.entries(body.specifications)
        .slice(0, 60)
        .map(([k, v]) => [String(k).slice(0, 80), String(v).slice(0, 300)]);
    } else {
      record.specifications = [];
    }
  }

  if (body.description !== undefined) record.description = str(body.description, 5000) ?? "";
  if (body.internal !== undefined && typeof body.internal === "object" && body.internal) {
    record.internal = body.internal; // opaque, admin-only ledger (costs, markup, notes)
  }

  if (body.status !== undefined) {
    need(VALID_STATUS.includes(body.status), `status: must be one of ${VALID_STATUS.join(", ")}`);
    if (VALID_STATUS.includes(body.status)) record.status = body.status;
  }

  if (!record.status) record.status = "PENDING_REVIEW";
  if (!record.createdAt) record.createdAt = now;
  record.id = existing?.id ?? str(body.id, 80) ?? `api_${Date.now().toString(36)}_${randomBytes(3).toString("hex")}`;

  return { record, errors };
}

/* ---------------- duplicate detection (scraper-facing) ---------------- */

const norm = (s) => (s ?? "").toString().trim().toLowerCase().replace(/\s+/g, "");
const normUrl = (s) => (s ?? "").toString().trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");

export function findMatches({ sku, sourceProductId, url, brand, model, name }, pool) {
  const matches = [];
  for (const p of pool) {
    let matchedOn = null;
    if (sku && norm(p.sku) === norm(sku)) matchedOn = "sku";
    else if (sourceProductId && norm(p.sourceProductId) === norm(sourceProductId)) matchedOn = "sourceProductId";
    else if (url && normUrl(p.productUrl) === normUrl(url)) matchedOn = "productUrl";
    else if (brand && model && norm(p.brand) === norm(brand) && norm(p.model) === norm(model)) matchedOn = "brand+model";
    else if (name && norm(p.name) === norm(name)) matchedOn = "name";
    if (matchedOn) matches.push({ id: p.id, name: p.name, sku: p.sku, status: p.status, matchedOn });
  }
  return matches;
}

/* ---------------- rate limiting (mutating routes) ---------------- */

const hits = new Map(); // ip → { count, reset }
function rateLimited(ip) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || h.reset < now) {
    hits.set(ip, { count: 1, reset: now + 60_000 });
    return false;
  }
  h.count += 1;
  return h.count > 60; // 60 writes / minute / IP
}

/* ---------------- router ---------------- */

export async function handleApi(req, res, url) {
  res.setHeader("Access-Control-Allow-Origin", CORS_ORIGIN);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Api-Key");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const path = url.pathname.replace(/^\/api/, "") || "/";
  const parts = path.split("/").filter(Boolean); // e.g. ["products", ":id"]

  try {
    /* ---- health ---- */
    if (path === "/health" && req.method === "GET") {
      const all = allProducts();
      return json(res, 200, {
        ok: true,
        products: all.length,
        published: all.filter((p) => p.status === "PUBLISHED").length,
        pending: all.filter((p) => p.status === "PENDING_REVIEW").length,
        time: new Date().toISOString(),
      });
    }

    /* ---- duplicate check ---- */
    if (path === "/products/check" && req.method === "GET") {
      const q = url.searchParams;
      const pool = authorized(req) ? allProducts() : allProducts().filter((p) => p.status === "PUBLISHED");
      const matches = findMatches(
        {
          sku: q.get("sku"), sourceProductId: q.get("sourceProductId"), url: q.get("url"),
          brand: q.get("brand"), model: q.get("model"), name: q.get("name"),
        },
        pool,
      );
      return json(res, 200, { exists: matches.length > 0, matches });
    }

    /* ---- collection ---- */
    if (path === "/products" && req.method === "GET") {
      const authed = authorized(req);
      const list = authed ? allProducts() : allProducts().filter((p) => p.status === "PUBLISHED");
      return json(res, 200, { count: list.length, products: authed ? list : list.map(sanitize) });
    }

    if (path === "/products" && req.method === "POST") {
      if (!authorized(req)) return json(res, 401, { error: "Unauthorized — provide a valid X-Api-Key header." });
      if (rateLimited(req.socket.remoteAddress)) return json(res, 429, { error: "Rate limit exceeded — slow down." });
      const body = await readBody(req);
      const { record, errors } = validateProduct(body);
      if (errors.length) return json(res, 422, { error: "Validation failed", details: errors });
      if (findProduct(record.id)) return json(res, 409, { error: `Product id "${record.id}" already exists.` });

      // Scraped/created products NEVER go straight to the storefront.
      record.status = "PENDING_REVIEW";
      upsertProduct(record);
      return json(res, 201, { ok: true, product: record, note: "Created as PENDING_REVIEW — admin approval required before publishing." });
    }

    /* ---- single record ---- */
    if (parts[0] === "products" && parts.length === 2) {
      const existing = findProduct(decodeURIComponent(parts[1]));
      if (!existing) return json(res, 404, { error: "Product not found." });

      if (req.method === "GET") {
        return json(res, 200, authorized(req) ? existing : sanitize(existing));
      }
      if (req.method === "PUT" || req.method === "PATCH") {
        if (!authorized(req)) return json(res, 401, { error: "Unauthorized — provide a valid X-Api-Key header." });
        if (rateLimited(req.socket.remoteAddress)) return json(res, 429, { error: "Rate limit exceeded — slow down." });
        const body = await readBody(req);
        const { record, errors } = validateProduct(body, { partial: req.method === "PATCH", existing });
        if (errors.length) return json(res, 422, { error: "Validation failed", details: errors });
        upsertProduct(record);
        return json(res, 200, { ok: true, product: record });
      }
      if (req.method === "DELETE") {
        if (!authorized(req)) return json(res, 401, { error: "Unauthorized — provide a valid X-Api-Key header." });
        if (rateLimited(req.socket.remoteAddress)) return json(res, 429, { error: "Rate limit exceeded — slow down." });
        deleteProduct(existing.id);
        return json(res, 200, { ok: true, deleted: existing.id });
      }
    }

    return json(res, 404, { error: `Unknown API route: ${req.method} ${path}` });
  } catch (err) {
    return json(res, err.message === "Payload too large" ? 413 : 400, { error: err.message || "Bad request" });
  }
}
