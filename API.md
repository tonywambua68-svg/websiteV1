# Imara Tech — Product API

A dependency-free REST API that runs **on the same port as the website** (`:3000`),
so the storefront and the API share one origin. The React frontend is unchanged —
when the API is online the Shop transparently switches from the bundled catalogue
to the live database (see the "Live API / Local data" badge on the Shop page).

## Run it

```bash
node server.mjs
```

- Website:  http://localhost:3000
- API:      http://localhost:3000/api/products
- Health:   http://localhost:3000/api/health

(`npm run dev` still works on its own — the site just uses the bundled catalogue.)

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
| `PORT` | no | Server port (default `3000`). |

## Scraper

See `scraper-client/README.md` and `scraper-client/client.example.mjs` for the
exact request shapes and the required scraper-side env vars.
