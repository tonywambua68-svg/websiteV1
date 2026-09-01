# Scraper ↔ Website integration

Your scraper (on `:4100`) talks to the website's Product API (on `:3000`).

```
SCRAPER :4100
   ↓  HTTP + X-Api-Key
WEBSITE PRODUCT API :3000   (GET/POST/PUT/PATCH/DELETE /api/products)
   ↓
PRODUCT DATABASE            (server/data/products.json)
   ↓
SHOP FRONTEND               (reads /api/products automatically)
```

## Environment variables (scraper side only)

| Variable | Example | Purpose |
|---|---|---|
| `PRODUCTS_API_URL` | `http://localhost:3000/api` | Base URL of the website API |
| `PRODUCTS_API_KEY` | *(long random string)* | Auth for POST/PUT/PATCH/DELETE |

> The key is set on the **website server** (`server/.env.local` → `PRODUCTS_API_KEY`)
> and mirrored into your **scraper's** environment. It is never in the frontend and
> never committed to Git.

## The flow your scraper must follow

1. **Extract** the product from the external source.
2. **Normalize** to the API's field names (see `API.md`).
3. **Check** for duplicates: `GET /api/products/check?sku=…&sourceProductId=…&url=…`
   → if `exists: true`, skip (or update instead of insert).
4. **Calculate** the KES selling price with your pricing rules.
5. **Create**: `POST /api/products` → stored as `PENDING_REVIEW` (the API forces
   this — a scraper can never publish directly).
6. **Admin reviews** in the dashboard → `APPROVED` → `PUBLISHED`.
7. Once `PUBLISHED`, the product appears on the live shop automatically.

## Test the connection

```bash
# no key needed for reads
curl http://localhost:3000/api/health
curl http://localhost:3000/api/products

# key needed for the duplicate-check to also see pending items
curl -H "X-Api-Key: $PRODUCTS_API_KEY" \
  "http://localhost:3000/api/products/check?sku=NB14-U7-16512"
```

A working example client is in `client.example.mjs`:

```bash
PRODUCTS_API_KEY=<key> node scraper-client/client.example.mjs
```
