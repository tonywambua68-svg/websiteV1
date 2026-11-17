# OREMITECH Features & Status

Living document tracking all features, development status, and production readiness.

---

## ✅ Completed Features

### Core E-Commerce
| Feature | Status | Notes |
|---------|--------|-------|
| Product Catalogue | ✅ Complete | Filtering by category, brand, price, specs, condition |
| Product Detail Page | ✅ Complete | Images, specs, variants, condition, warranty |
| Shopping Cart | ✅ Complete | Persistent (Zustand + Supabase), quantity controls |
| Guest Checkout | ✅ Complete | No account required, phone/email only |
| Order Tracking | ✅ Complete | Public lookup by order# + phone |
| Order History | ✅ Complete | Authenticated users |
| Coupon/Discount System | ✅ Complete | Percent/fixed, usage limits, date ranges |

### Authentication & Accounts
| Feature | Status | Notes |
|---------|--------|-------|
| Email/Password Auth | ✅ Complete | Supabase Auth |
| Email Confirmation | ✅ Complete | Required before login |
| Password Reset | ✅ Complete | Email link flow |
| Customer Profiles | ✅ Complete | Name, phone, addresses |
| Role-Based Access | ✅ Complete | 6 roles with RLS |

### Product Management (Admin)
| Feature | Status | Notes |
|---------|--------|-------|
| Product CRUD | ✅ Complete | Draft → Approve → Publish workflow |
| Variant Management | ✅ Complete | RAM/Storage variants with pricing |
| Image Gallery | ✅ Complete | Multi-upload, primary selection |
| Category/Brand Admin | ✅ Complete | Hierarchical categories |
| Bulk Import/Export | ✅ Complete | CSV with validation |
| SEO Fields | ✅ Complete | Title, description per product |

### Inventory & Suppliers
| Feature | Status | Notes |
|---------|--------|-------|
| Dual Stock Tracking | ✅ Complete | Owned + Supplier quantities |
| Stock Reservations | ✅ Complete | Automatic on order |
| Stock Movements Log | ✅ Complete | Full audit trail |
| Supplier Directory | ✅ Complete | Nairobi areas, reliability rating |
| Supplier Price History | ✅ Complete | Market tracking |

### Research & Verification
| Feature | Status | Notes |
|---------|--------|-------|
| Research Listings | ✅ Complete | External marketplace data |
| Sourcing Tasks | ✅ Complete | Assignment workflow |
| Physical Verification | ✅ Complete | Inspection + photos |
| Research → Product Pipeline | ✅ Complete | Status sync automation |

### Orders & Finance
| Feature | Status | Notes |
|---------|--------|-------|
| State Machine Orders | ✅ Complete | 10 statuses with enforced transitions |
| M-Pesa Daraja Ready | ✅ Complete | Payment record structure |
| Manual Payment Entry | ✅ Complete | Staff confirmation |
| Profit Calculation | ✅ Complete | Per-order-item costs |
| Expense Tracking | ✅ Complete | Categories + entries |
| Refund/Return System | ✅ Complete | Restock option |

### Frontend UX
| Feature | Status | Notes |
|---------|--------|-------|
| Mega Menu | ✅ Complete | Brands, categories, accessories |
| Search with Filters | ✅ Complete | Server + client fallback |
| Product Comparison | ✅ Complete | Side-by-side modal |
| Wishlist | ✅ Complete | Persistent |
| Recently Viewed | ✅ Complete | Auto-tracked |
| Responsive Design | ✅ Complete | Mobile-first, 2-6 col grids |
| Design System | ✅ Complete | Documented in DESIGN_SYSTEM.md |

---

## 🚧 In Progress

### High Priority
| Feature | Status | Target | Blockers |
|---------|--------|--------|----------|
| M-Pesa Daraja Integration | 🚧 Backend ready | 2026-12-01 | Safaricom sandbox credentials |
| Email Notifications | 🚧 Templates done | 2026-11-25 | Supabase SMTP config |
| Order SMS Updates | 🚧 DB ready | 2026-12-15 | Africa's Talking integration |

### Medium Priority
| Feature | Status | Target | Blockers |
|---------|--------|--------|----------|
| Product Reviews Display | 🚧 Backend done | 2026-11-30 | Frontend components |
| Advanced Search (full-text) | 🚧 Design done | 2027-01-15 | Meilisearch or pg_trgm |
| Customer Portal Enhancements | 🚧 API ready | 2027-01-15 | Saved carts, reorder |
| Admin Analytics Dashboard | 🚧 Data exists | 2027-01-31 | Chart components |

### Low Priority
| Feature | Status | Target | Blockers |
|---------|--------|--------|----------|
| Loyalty/Referral Program | 🚧 Schema done | 2027-02-28 | Business rules |
| Multi-currency (USD) | 🚧 DB supports | 2027-03-31 | Exchange rate service |
| PWA / Offline Cart | 🚧 Service worker | 2027-04-30 | Vite PWA plugin |

---

## ❌ Not Yet Implemented

### Post-MVP Features
| Feature | Priority | Dependencies |
|---------|----------|--------------|
| Subscriptions (recurring) | Low | Payment provider |
| B2B Bulk Pricing | Medium | Customer groups |
| Dropship Automation | High | Supplier API access |
| AI Chat Assistant (Nova) | Low | LLM integration |
| Multi-warehouse | Low | Inventory locations |
| Franchise/Reseller Portal | Low | Role system ready |
| Advanced Promotions (BOGO, bundles) | Medium | Coupon engine ready |

### Technical Debt
| Item | Priority | Effort |
|------|----------|--------|
| Code-split admin routes | Medium | 1 day |
- Virtualize large product lists | Low | 2 days |
| Add OpenAPI/Swagger docs | Low | 1 day |
| E2E test suite (Playwright) | High | 3 days |
| Storybook for components | Low | 2 days |

---

## 🐛 Known Bugs

| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| BUG-001 | Low | Category tile icon hover background uses hardcoded color | 🚧 Fixing via design system |
| BUG-002 | Medium | Cart quantity > available shows confusing error | 🚧 Better validation needed |
| BUG-003 | Low | Mega menu closes too fast on diagonal mouse move | 🚧 Add hover delay |
| BUG-004 | Medium | Order confirmation email not sent | 🚧 Awaiting SMTP config |
| BUG-005 | Low | Product image upload fails >5MB | 🚧 Supabase Storage policy |

---

## 🚀 Production Requirements Checklist

### Security
- [x] RLS enabled on all tables
- [x] Service role key not in frontend
- [x] Input validation on all RPC functions
- [x] Rate limiting (via Cloudflare WAF)
- [ ] CSP headers configured
- [ ] CORS restricted to production domains
- [ ] Audit logs immutable

### Performance
- [x] Database indexes on query columns
- [x] Pagination (24 items/page)
- [x] Lazy loading images
- [ ] CDN for product images (Cloudflare Images)
- [ ] Query result caching (stale-while-revalidate)
- [ ] Code splitting for admin routes

### Reliability
- [x] Graceful Supabase fallback (local seed data)
- [x] Optimistic UI with rollback
- [ ] Health check endpoint
- [ ] Automated backup verification
- [ ] Disaster recovery plan documented

### Compliance (Kenya)
- [x] KSh currency only
- [x] M-Pesa Daraja integration ready
- [x] Kenya phone normalization
- [x] 47 counties delivery logic
- [ ] Data protection (Data Protection Act 2019)
- [ ] Consumer protection refund policy

### Monitoring
- [ ] Error tracking (Sentry)
- [ ] Uptime monitoring
- [ ] Database performance alerts
- [ ] Order conversion funnel
- [ ] Stock level alerts

---

## Release History

| Version | Date | Key Features |
|---------|------|--------------|
| 1.0.0 | 2026-11-16 | Full MVP: catalogue, cart, checkout, admin, inventory, research |

---

## Next Sprint Priorities

1. **M-Pesa Daraja sandbox integration** - Critical for live payments
2. **Email/SMS notifications** - Order confirmations, status updates
3. **Admin analytics** - Sales, stock, conversion metrics
4. **Product reviews frontend** - Trust signals
5. **Performance optimization** - Code splitting, image CDN

---

*Update this document at sprint boundaries and major releases.*