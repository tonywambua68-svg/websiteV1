/**
 * Example scraper client for the Imara Tech Product API.
 *
 * This shows the EXACT shape of requests your scraper (running on :4100)
 * should make against the website API (on :3000). It is deliberately a plain
 * Node script with zero dependencies — copy the functions into your scraper.
 *
 * SECURITY: the API key is read from the SCRAPER's environment only. It is
 * never part of the website frontend and must never be committed to Git.
 *
 *   PRODUCTS_API_URL=http://localhost:3000/api  node client.example.mjs
 *   PRODUCTS_API_KEY=<your key>                 (set this too)
 */

const API = process.env.PRODUCTS_API_URL || "http://localhost:3000/api";
const KEY = process.env.PRODUCTS_API_KEY || "";

const headers = { "Content-Type": "application/json", "X-Api-Key": KEY };

async function request(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status}: ${data.error || res.statusText}${data.details ? " — " + data.details.join("; ") : ""}`);
  return data;
}

/** 1) Ask the website: "does this product already exist?" (no key needed for
 *    published-only matching; with a key it also matches pending items). */
export function checkDuplicate({ sku, sourceProductId, url, brand, model, name }) {
  const q = new URLSearchParams();
  if (sku) q.set("sku", sku);
  if (sourceProductId) q.set("sourceProductId", sourceProductId);
  if (url) q.set("url", url);
  if (brand) q.set("brand", brand);
  if (model) q.set("model", model);
  if (name) q.set("name", name);
  return request("GET", `/products/check?${q.toString()}`);
}

/** 2) Create the product. It is ALWAYS stored as PENDING_REVIEW — the API
 *    refuses to publish directly, so scraped items can never reach customers
 *    without admin approval. */
export function createProduct(product) {
  return request("POST", "/products", product);
}

/** 3) Update / move through the review workflow (admin action). */
export function updateProduct(id, patch) {
  return request("PATCH", `/products/${encodeURIComponent(id)}`, patch);
}
export const approve = (id) => updateProduct(id, { status: "APPROVED" });
export const publish = (id) => updateProduct(id, { status: "PUBLISHED" });
export const reject = (id) => updateProduct(id, { status: "REJECTED" });

export const listProducts = () => request("GET", "/products");
export const health = () => request("GET", "/health");

/* ---------------- demo run ---------------- */
if (import.meta.url === `file://${process.argv[1]}`) {
  const h = await health();
  console.log("API health:", h);

  const dup = await checkDuplicate({ sku: "NB14-U7-16512" });
  console.log("Duplicate check (sku NB14-U7-16512):", dup);

  if (!dup.exists && KEY) {
    const created = await createProduct({
      name: "NBook 14 Ultrabook",
      brand: "NBook",
      model: "NB14-U7",
      sku: "NB14-U7-16512",
      category: "laptops",
      price: 89999, // KES selling price YOUR pricing rules computed
      currency: "KES",
      stock: 12,
      condition: "New",
      source: "aliexpress",
      sourceProductId: "AE-100231",
      productUrl: "https://aliexpress.example/item/100231.html",
      specifications: [["RAM", "16GB LPDDR5"], ["Storage", "512GB NVMe"]],
      internal: { supplierCostKes: 60000, markupKes: 29999 }, // admin-only, stripped from public reads
    });
    console.log("Created:", created.product.id, created.product.status);
  }
}
