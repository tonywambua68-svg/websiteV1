/**
 * Imara Tech — full-stack dev server.
 *
 *   node server.mjs
 *
 * Serves BOTH on http://localhost:3000 :
 *   • /api/*   → the Product API (server/api.mjs)
 *   • /*       → the Vite-powered storefront (exactly as `npm run dev` does)
 *
 * The React frontend is untouched — when /api/products responds, the Shop
 * automatically upgrades from the bundled catalogue to the live database.
 *
 * Secrets: PRODUCTS_API_KEY lives only in server/.env.local (gitignored) or
 * the real environment — it is never exposed to the browser bundle.
 */
import http from "node:http";
import { networkInterfaces } from "node:os";
import { createServer as createViteServer } from "vite";
import { loadEnvFile } from "./server/env.mjs";
import { resolveApiKey, handleApi } from "./server/api.mjs";
import { initDb, dbPath } from "./server/db.mjs";

loadEnvFile(); // server/.env.local
resolveApiKey();

const PORT = Number(process.env.PORT || 3000);

// 1) HTTP server: API first, everything else falls through to Vite.
const httpServer = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      return await handleApi(req, res, url);
    }
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal server error" }));
    return;
  }
  vite.middlewares(req, res);
});

// 2) Vite in middleware mode — same plugins/config as `npm run dev`,
//    with HMR attached to our HTTP server so hot reload keeps working.
const vite = await createViteServer({
  server: { middlewareMode: true, hmr: { server: httpServer } },
  appType: "spa",
});

// 3) Database: load, or migrate from src/data/products.ts on first boot.
await initDb(vite);

httpServer.listen(PORT, () => {
  // First non-internal IPv4 address — the one a LAN scraper should target.
  const lanIp = Object.values(networkInterfaces())
    .flat()
    .find((i) => i && (i.family === "IPv4" || i.family === 4) && !i.internal)?.address ?? "127.0.0.1";
  const line = (label, value) => `  │  ${label.padEnd(15)}${value.padEnd(42)}│`;
  console.log("");
  console.log("  ┌─ Imara Tech · full-stack dev server ─────────────────────┐");
  console.log(line("Website", `http://localhost:${PORT}`));
  console.log(line("Product API", `http://localhost:${PORT}/api/products`));
  console.log(line("Health check", `http://localhost:${PORT}/api/health`));
  console.log(line("LAN (scraper)", `http://${lanIp}:${PORT}/api/products`));
  console.log(`  │  ${"Database".padEnd(15)}${dbPath().replace(process.cwd(), ".").slice(0, 42).padEnd(42)}│`);
  console.log("  └──────────────────────────────────────────────────────────┘");
  console.log("");
});
