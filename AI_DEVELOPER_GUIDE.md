# AI Developer Guide — OREMITECH

**MANDATORY RULES FOR ALL FUTURE AI ASSISTANTS**

This document contains permanent instructions that MUST be followed by every AI developer working on this project. Violations will cause bugs, security issues, and design drift.

---

## 🔴 NON-NEGOTIABLE RULES (Enforced)

### 1. BRAND IDENTITY — NEVER CHANGE
- **Primary colour**: `--color-emerald` (#156b45) - Dark forest green
- **Secondary**: `--color-amber` (#f5a31a) - Gold/yellow accent
- **NEVER** introduce new brand colours (no blue, purple, red themes)
- **NEVER** replace green theme with another colour
- **ALWAYS** use CSS variables (`var(--color-emerald)`) not hardcoded hex
- Reference: `DESIGN_SYSTEM.md` for complete palette

### 2. NO UNNECESSARY REDESIGNS
- Do NOT redesign working layouts
- Do NOT change component structures without explicit request
- Do NOT "modernize" UI that works
- Preserve existing visual personality and spacing

### 3. INSPECT BEFORE CREATING
Before ANY new component/file:
```bash
# 1. Search for existing similar components
grep -r "PatternName" src/components/

# 2. Check store for existing state logic
cat src/store/relevantStore.ts

# 3. Review domain types
cat src/lib/domain.ts

# 4. Check for duplicate database tables
# (Read DATABASE_DOCUMENTATION.md first)
```

### 4. DATABASE — ZERO DUPLICATION
- **NEVER** create duplicate tables or columns
- **ALWAYS** check `DATABASE_DOCUMENTATION.md` first
- **NEVER** delete customer, product, or order data
- Use existing RPC functions (`place_order`, `adjust_stock`, etc.)
- Service role key **must never** appear in frontend code

### 5. SECURITY FIRST
- All database changes via Supabase migrations only
- RLS policies must exist for every new table
- Validate all inputs in PostgreSQL functions
- Use `SECURITY DEFINER` for privileged operations
- Lock rows with `FOR UPDATE` in stock operations

### 6. TEST BEFORE COMPLETION
```bash
# ALWAYS run before declaring done:
npm run build          # Production build
npm run lint           # ESLint
npm run typecheck      # TypeScript (if configured)
```
Fix ALL errors before reporting complete.

### 7. MOBILE RESPONSIVENESS MANDATORY
- Mobile-first Tailwind classes only
- Test at: 375px, 768px, 1024px, 1440px
- Minimum 44×44px touch targets
- Use `.wrap` container for horizontal padding

### 8. BUSINESS FUNCTIONALITY PRIORITY
Priority order:
1. **Security** - Data protection, auth, payments
2. **Customer Experience** - Speed, clarity, trust
3. **Business Operations** - Inventory, orders, suppliers
4. **Code Quality** - Types, tests, docs

---

## 📋 BEFORE YOU START — INSPECTION CHECKLIST

### Files to ALWAYS read first:
```
DESIGN_SYSTEM.md          # Colours, spacing, components
PROJECT_ARCHITECTURE.md   # Data flows, patterns
DATABASE_DOCUMENTATION.md # Tables, RLS, functions
src/index.css             # Design tokens + utilities
src/lib/domain.ts         # Type definitions
src/lib/permissions.ts    # Role matrix
src/store/*.ts            # State patterns
```

### Component patterns to FOLLOW:
| Pattern | Example | Rule |
|---------|---------|------|
| Button | `.btn-emerald`, `.btn-amber` | NEVER raw `<button className="bg-green-500">` |
| Card | `.card`, `.market-card` | NEVER custom card CSS |
| Input | `.input` | NEVER custom input CSS |
| Container | `.wrap` | NEVER custom max-width |
| State | Zustand stores | NEVER localStorage directly |

### State Management:
- **Server state** → Zustand store with Supabase fallback
- **Client state** → Zustand (cart, wishlist, UI)
- **NEVER** use React Context for global state
- **NEVER** put business logic in components

### Routing:
- Admin routes → `AdminLayout` + `Guard`
- Employee routes → `EmployeeLayout` + `Guard`
- Public routes → `Layout`
- Check `src/lib/permissions.ts` for role redirects

---

## 🛠️ COMMON TASKS — CORRECT PATTERNS

### Adding a New Page
1. Create `src/pages/NewPage.tsx`
2. Add route in `src/App.tsx` (inside correct layout)
3. Use `.wrap` container
4. Follow mobile-first responsive grid
5. Use design system colours only

### Adding Database Column
1. Create migration in `supabase/migrations/`
2. Add RLS policy
3. Update `DATABASE_DOCUMENTATION.md`
4. Update TypeScript types in `src/lib/domain.ts`
5. Update `catalogue_products` view if public

### Adding Product Field
1. Migration → `products` table
2. Update `catalogue_products` view
3. Update `CatalogueProduct` type
4. Update `ProductCard` + `ProductDetail`
5. Admin form in `AdminProductForm.tsx`

### New Admin Feature
1. Add page in `src/pages/admin/`
2. Add route in `App.tsx` under `/admin`
3. Wrap in `AdminLayout` (already protected)
4. Use existing stores or create focused store

### Modifying Orders
- **ALWAYS** use `place_order()` RPC
- **NEVER** insert into `orders` directly
- Status changes → `update_order_status()`
- Stock changes → `adjust_stock()`

---

## 🚫 FORBIDDEN PATTERNS

| Forbidden | Correct Alternative |
|-----------|---------------------|
| `bg-green-500`, `text-teal-600` | `.btn-emerald`, `text-emerald` |
| `className="rounded-lg p-4 bg-white"` | `.card` |
| `localStorage.setItem('cart', ...)` | `useCartStore.getState().addItem()` |
| `supabase.from('orders').insert(...)` | `await place_order(payload)` |
| `CREATE TABLE new_products ...` | Extend existing `products` table |
| `DELETE FROM customers ...` | Soft delete (`deleted_at`) |
| `const supabase = createClient(..., service_key)` | `getSupabase()` (anon only) |
| `npm run dev` for testing | `npm run build` + preview |

---

## 🔍 DEBUGGING CHECKLIST

When something breaks:
1. **Build first**: `npm run build` - catches 90% of issues
2. **Console errors**: Check browser devtools
3. **Network tab**: Failed Supabase calls?
4. **RLS**: Is user role correct? `current_profile_role()`
5. **State**: Is Zustand store updated? React DevTools
6. **Types**: TypeScript errors = source of truth

---

## 📦 DEPLOYMENT RULES

- **NEVER** commit `.env` or secrets
- **NEVER** deploy without successful `npm run build`
- Environment variables only via hosting platform
- Preview deployments for every PR
- Production only from `main` branch

---

## 📝 DOCUMENTATION MAINTENANCE

After ANY significant change, update:
| Change | Update Files |
|--------|--------------|
| Design token | `DESIGN_SYSTEM.md`, `src/index.css` |
| New component | `DESIGN_SYSTEM.md` (if reusable) |
| Database schema | `DATABASE_DOCUMENTATION.md` |
| New feature | `FEATURES_AND_STATUS.md` |
| Architecture | `PROJECT_ARCHITECTION.md` |
| AI rules | `AI_DEVELOPER_GUIDE.md` |

---

## ⚡ QUICK REFERENCE

### Design Tokens (from `src/index.css`)
```css
--color-emerald: #156b45;       /* Primary green */
--color-emeralddeep: #0e5335;   /* Hover */
--color-forest: #0d4a34;        /* Mid */
--color-forestdeep: #083624;    /* Dark */
--color-mint: #d8e8df;          /* Light bg */
--color-amber: #f5a31a;         /* Accent */
--color-ink: #061512;           /* Text/dark */
--color-mist: #eef3f1;          /* Page bg */
```

### Component Classes
```css
.btn-emerald      /* Primary CTA */
.btn-amber        /* Secondary CTA */
.btn-outline      /* Ghost */
.market-card      /* Product grid */
.category-tile    /* Category pill */
.chip             /* Filter tag */
.input            /* Form input */
.wrap             /* Container */
```

### Key Stores
```typescript
useProductStore()     // Catalogue, search, filters
useCartStore()        // Cart items, totals
useAuthStore()        // User, roles, login
useWishlistStore()    // Saved products
useOrderStore()       // Order history
```

### Permissions
```typescript
homeForRole(role)     // Redirect after login
canManageProducts()   // Owner/Manager
canManageOrders()     // Owner/Manager/Sales
```

---

## 🎯 FINAL REMINDER

> **"Preserve OREMITECH's original dark green visual identity. Document everything. Test before completion. Never compromise security or customer trust."**

If uncertain: **STOP and read the documentation files first.** They exist to prevent rework.

---

*This guide is binding for all AI assistants. Last updated: 2026-11-16*