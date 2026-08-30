/**
 * Imara Tech — dedicated Product API server.
 *
 *   node server.mjs
 *
 * Runs the REST API on port 3000 (configurable via PORT) and binds to ALL
 * network interfaces, so it answers identically on:
 *
 *     http://localhost:3000/api/products
 *     http://<LAN-IP>:3000/api/products        ← e.g. http://192.168.0.107:3000/api/products
 *
 * The Vite storefront runs SEPARATELY (`npm run dev`, port 5173) — the two
 * never share a port, so there is no ambiguity about which process answers.
 *
 * Secrets: PRODUCTS_API_KEY lives only in server/.env.local (gitignored) or
 * the real environment — it is never exposed to the browser bundle.
 */
import http from "node:http";
import { networkInterfaces } from "node:os";
import { loadEnvFile } from "./server/env.mjs";
import { resolveApiKey, handleApi } from "./server/api.mjs";
import { initDb, dbPath } from "./server/db.mjs";

loadEnvFile(); // server/.env.local
resolveApiKey();

// Database: load, or migrate from src/data/products.ts on first boot
// (self-contained — spins a headless, port-less Vite instance internally).
await initDb();

const PORT = Number(process.env.PORT || 3000);

const SERVICE_CARD = {
  service: "Imara Tech · Product API",
  version: 1,
  endpoints: [
    "GET    /api/health",
    "GET    /api/products                (public: PUBLISHED only · with X-Api-Key: ALL)",
    "GET    /api/products/check          (duplicate check for the scraper)",
    "GET    /api/products/:id",
    "POST   /api/products                (X-Api-Key · forced PENDING_REVIEW)",
    "PUT    /api/products/:id            (X-Api-Key)",
    "PATCH  /api/products/:id            (X-Api-Key)",
    "DELETE /api/products/:id            (X-Api-Key)",
  ],
  website: "Run the storefront separately: npm run dev → http://localhost:5173",
};

const httpServer = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  // ---- the API ----
  if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
    try {
      return await handleApi(req, res, url);
    } catch {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
      return;
    }
  }

  // ---- everything else: a small JSON service card (helps debugging) ----
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(SERVICE_CARD, null, 2));
});

const lanIp =
  Object.values(networkInterfaces())
    .flat()
    .find((i) => i && (i.family === "IPv4" || i.family === 4) && !i.internal)?.address ?? "127.0.0.1";

httpServer.listen(PORT, () => {
  const db = dbPath().replace(process.cwd(), ".");
  console.log("");
  console.log("  ┌─ Imara Tech · Product API ───────────────────────────────┐");
  console.log(`  │  Health           http://localhost:${PORT}/api/health       `);
  console.log(`  │  Products         http://localhost:${PORT}/api/products     `);
  console.log(`  │  Via LAN/scrapers http://${lanIp}:${PORT}/api/products  `);
  console.log(`  │  Database         ${db}`);
  console.log("  │                                                           │");
  console.log("  │  Storefront runs separately:  npm run dev  → :5173        │");
  console.log("  └──────────────────────────────────────────────────────────┘");
  console.log("");
});
