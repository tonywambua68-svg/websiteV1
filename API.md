# Imara Tech — Product API

A dependency-free REST API on **port 3000**, bound to **all interfaces** — it answers
identically on `localhost:3000` and on the machine's LAN IP (e.g. `192.168.0.107:3000`),
which is how scrapers on other machines reach it.

The Vite storefront runs **separately on port 5173** (`npm run dev`). The two processes
never share a port, so there is never any ambiguity about which one answers. The React
frontend is unchanged — when the API is online the Shop transparently switches from the
bundled catalogue to the live database (see the "Live API / Local data" badge on the
Shop page), resolving the API on the *same hostname* it was opened with, port 3000.

## Run it — two terminals

```bash
# Terminal 1 — the Product API (port 3000)
node server.mjs

# Terminal 2 — the storefront (port 5173)
npm run dev
```

- Storefront:  http://localhost:5173
- API:         http://localhost:3000/api/products
- Health:      http://localhost:3000/api/health
- From a scraper on another machine: `http://<website-machine-LAN-IP>:3000/api/products`

(`npm run dev` also works alone — the site then uses the bundled catalogue.)

## Database

A JSON document store at `server/data/products.json` (atomic writes, isolated in
`server/db.mjs` so it can be swapped for PostgreSQL/SQLite later).

**Migration:** on first boot, if the file doesn't exist, the existing catalogue is
imported from `src/data/products.ts` via Vite's `ssrLoadModule`. The source file is
never modified and an existing database is never overwritten.

## Endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/products` | optional | Public → only `PUBLISHED`, `internal` stripped. With key → ALL records + `internal`. |
| GET | `/api/products/check` | optional | Duplicate check: `?sku&sourceProductId&url&brand&model&name` → `{ exists, matches }` |
| GET | `/api/products/:id` | optional | Single record (public view unless keyed). |
| POST | `/api/products` | **key** | Create. `status` is **forced to `PENDING_REVIEW`**. |
| PUT | `/api/products/:id` | **key** | Replace. |
| PATCH | `/api/products/:id` | **key** | Partial update (e.g. `{"status":"PUBLISHED"}`). |
| DELETE | `/api/products/:id` | **key** | Remove. |
| GET | `/api/health` | — | Liveness + counts. |

**Auth:** `X-Api-Key` header, compared server-side against `PRODUCTS_API_KEY`.
Mutating routes are rate-limited (60/min/IP) and bodies are size-capped (1 MB).

## Product fields

```
id, name, brand, model, category, price, oldPrice, currency, image, productUrl,
sku, stock, condition, specifications, source, sourceProductId, status,
description, internal, createdAt, updatedAt
```

`status` ∈ `PENDING_REVIEW | APPROVED | PUBLISHED | REJECTED`.
`specifications` accepts an array of `[key, value]` pairs **or** an object.
`internal` (supplier cost, markup, profit, notes) is admin-only and **always
stripped from public responses** — customers never see it.

## Environment variables (server side)

Set in `server/.env.local` (gitignored) — see `server/.env.example`.

| Variable | Required | Purpose |
|---|---|---|
| `PRODUCTS_API_KEY` | yes (for writes) | Shared secret for POST/PUT/PATCH/DELETE. Random one printed at boot if unset. |
| `CORS_ORIGIN` | no | Browser origin allowed cross-origin (default `*`). |
| `PRODUCTS_DB` | no | Override database path. |
| `PORT` | no | API port (default `3000`). |

**Frontend overrides** (root `.env` — addresses only, never secrets):

| Variable | Purpose |
|---|---|
| `VITE_PRODUCTS_API_URL` | Full API base, e.g. `http://192.168.0.107:3000/api` — overrides auto-detection. |
| `VITE_PRODUCTS_API_PORT` | API port used in dev when auto-detecting (default `3000`). |

By default the dev storefront derives the API base from its own hostname
(`localhost` → `http://localhost:3000/api`, LAN IP → `http://<same-IP>:3000/api`),
so opening the site from any machine on the network just works.

## Scraper

See `scraper-client/README.md` and `scraper-client/client.example.mjs` for the
exact request shapes and the required scraper-side env vars.
