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
  console.log("");
  console.log("  ┌─ Imara Tech · full-stack dev server ─────────────────────┐");
  console.log(`  │  Website        http://localhost:${PORT}                    │`);
  console.log(`  │  Product API    http://localhost:${PORT}/api/products       │`);
  console.log(`  │  Health check   http://localhost:${PORT}/api/health         │`);
  console.log(`  │  Database       ${dbPath().replace(process.cwd(), ".")}  │`.slice(0, 64).padEnd(64) + "│");
  console.log("  └──────────────────────────────────────────────────────────┘");
  console.log("");
});
