import { Link, useLocation, useNavigate } from "react-router-dom";
import { fmt, PRODUCTS } from "../data/products";
import { useStore } from "../lib/store";
import { waHref } from "../config";
import { cartWaMessage } from "./Contact";
import ProductArt from "./ProductArt";
import { Qty } from "./ui";
import {
  IcArrowR, IcCart, IcCheck, IcGrid, IcHome, IcBolt, IcTrash, IcUser, IcX,
} from "./Icons";

/* ---------------- Toasts ---------------- */
export function Toasts() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[80] flex w-[min(92vw,22rem)] flex-col gap-2" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`animate-toast pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-[0_16px_40px_-16px_rgba(10,31,28,0.45)] ${
          t.kind === "error" ? "border-error/30 bg-card" : "border-white/10 bg-ink text-white"
        }`}>
          <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${
            t.kind === "error" ? "bg-error/15 text-error" : t.kind === "info" ? "bg-amber/20 text-amber" : "bg-teal text-white"
          }`}>
            {t.kind === "error" ? <IcX className="h-3.5 w-3.5" /> : t.kind === "info" ? <IcBolt className="h-3.5 w-3.5" /> : <IcCheck className="h-3.5 w-3.5" />}
          </span>
          <p className="flex-1 text-[13px] font-bold leading-snug">{t.msg}</p>
          <button type="button" onClick={() => dismissToast(t.id)} className="text-white/40 transition hover:text-white" aria-label="Dismiss notification">
            <IcX className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Cart drawer ---------------- */
const FREE_DELIVERY_AT = 30000;

export function CartDrawer() {
  const { drawerOpen, setDrawerOpen, cartItems, cartSubtotal, setQty, removeFromCart, cartSavings, toast } = useStore();
  const nav = useNavigate();
  const loc = useLocation();
  if (!drawerOpen) return null;

  const go = (to: string) => { setDrawerOpen(false); nav(to); };
  const progress = Math.min(100, Math.round((cartSubtotal / FREE_DELIVERY_AT) * 100));

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <button type="button" className="animate-fade absolute inset-0 w-full bg-ink/60" onClick={() => setDrawerOpen(false)} aria-label="Close cart" />
      <aside className="animate-drawer absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-card shadow-2xl">
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-lg font-bold">Your cart <span className="text-muted">({cartItems.length})</span></h2>
          <button type="button" onClick={() => setDrawerOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg border border-line transition hover:border-error hover:text-error" aria-label="Close cart">
            <IcX className="h-4.5 w-4.5" />
          </button>
        </header>

        {cartItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-mint text-teal"><IcCart className="h-8 w-8" /></span>
            <p className="font-display text-lg font-bold">Your cart is empty</p>
            <p className="text-sm text-muted">Add something brilliant — delivery across Kenya from KSh 300.</p>
            <button type="button" className="btn btn-amber mt-2" onClick={() => go("/shop")}>Start shopping</button>
          </div>
        ) : (
          <>
            <div className="border-b border-line bg-mint/60 px-5 py-3">
              {cartSubtotal >= FREE_DELIVERY_AT ? (
                <p className="flex items-center gap-2 text-xs font-extrabold text-success"><IcCheck className="h-4 w-4" /> You've unlocked FREE Nairobi delivery!</p>
              ) : (
                <p className="text-xs font-bold text-ink">Add <span className="text-teal">{fmt(FREE_DELIVERY_AT - cartSubtotal)}</span> more for free Nairobi delivery</p>
              )}
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line/70">
                <div className="h-full rounded-full bg-gradient-to-r from-teal to-amber transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {cartItems.map(({ p, qty }) => (
                <li key={p.id} className="flex gap-3.5 py-4">
                  <Link to={`/product/${p.id}`} onClick={() => setDrawerOpen(false)} className="grid h-16 w-20 shrink-0 place-items-center overflow-hidden rounded-lg" style={{ background: `linear-gradient(150deg, ${p.hue}22, ${p.hue}08)` }}>
                    <ProductArt kind={p.art} accent={p.hue} className="h-[125%]" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/product/${p.id}`} onClick={() => setDrawerOpen(false)} className="truncate text-[13px] font-bold hover:text-teal">{p.name}</Link>
                      <button type="button" onClick={() => removeFromCart(p.id)} className="text-muted transition hover:text-error" aria-label={`Remove ${p.name}`}>
                        <IcTrash className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs font-semibold text-muted">{p.brand} · {p.condition}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <Qty small value={qty} onChange={(v) => setQty(p.id, v)} />
                      <span className="font-display text-sm font-bold">{fmt(p.price * qty)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="border-t border-line p-5">
              {cartSavings > 0 && (
                <p className="mb-1.5 flex justify-between text-xs font-bold text-success"><span>You're saving</span><span>−{fmt(cartSavings)}</span></p>
              )}
              <p className="flex justify-between font-display text-lg font-bold"><span>Subtotal</span><span>{fmt(cartSubtotal)}</span></p>
              <p className="mt-1 text-xs font-semibold text-muted">Delivery & promo codes calculated at checkout.</p>
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <button type="button" className="btn btn-outline" onClick={() => go("/cart")}>View cart</button>
                <button type="button" className="btn btn-amber" onClick={() => go("/checkout")}>Checkout <IcArrowR className="h-4 w-4" /></button>
              </div>
              <button
                type="button"
                onClick={() => {
                  const href = waHref(cartWaMessage(cartItems, cartSubtotal));
                  if (href) window.open(href, "_blank", "noopener");
                  else toast("WhatsApp ordering isn't configured yet — add your number in src/config.ts", "info");
                }}
                className="mt-2.5 w-full text-center text-xs font-extrabold text-[#128C7E] underline-offset-2 hover:underline"
              >
                …or order the whole cart via WhatsApp →
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}

/* ---------------- Compare tray ---------------- */
export function CompareTray() {
  const { compare, clearCompare, toggleCompare } = useStore();
  const loc = useLocation();
  const nav = useNavigate();
  if (compare.length === 0 || loc.pathname === "/compare" || loc.pathname === "/checkout") return null;
  return (
    <div className="fixed inset-x-0 bottom-20 z-[60] flex justify-center px-4 md:bottom-6">
      <div className="animate-pop flex items-center gap-3 rounded-2xl border border-white/10 bg-ink py-2.5 pl-3 pr-2 text-white shadow-[0_20px_50px_-15px_rgba(10,31,28,0.7)]">
        <div className="flex -space-x-2">
          {compare.map((id) => {
            const p = PRODUCTS.find((x) => x.id === id);
            return p ? (
              <span key={id} className="grid h-9 w-11 place-items-center overflow-hidden rounded-lg border border-white/15" style={{ background: `linear-gradient(150deg, ${p.hue}55, ${p.hue}22)` }} title={p.name}>
                <ProductArt kind={p.art} accent={p.hue} className="h-[130%]" />
              </span>
            ) : null;
          })}
        </div>
        <span className="text-[13px] font-bold text-white/80">{compare.length} selected</span>
        <button type="button" className="btn btn-amber btn-sm" onClick={() => nav("/compare")}>Compare <IcArrowR className="h-3.5 w-3.5" /></button>
        <button type="button" className="grid h-8 w-8 place-items-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white" onClick={clearCompare} aria-label="Clear comparison">
          <IcX className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ---------------- Mobile bottom nav ---------------- */
export function BottomNav() {
  const { cartCount } = useStore();
  const loc = useLocation();
  const items = [
    { label: "Home", to: "/", icon: IcHome, end: true },
    { label: "Shop", to: "/shop", icon: IcGrid },
    { label: "Deals", to: "/deals", icon: IcBolt },
    { label: "Cart", to: "/cart", icon: IcCart, badge: cartCount },
    { label: "Account", to: "/account", icon: IcUser },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-[55] border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Mobile">
      <div className="grid grid-cols-5">
        {items.map((it) => {
          const active = it.end ? loc.pathname === it.to : loc.pathname.startsWith(it.to);
          const Icon = it.icon;
          return (
            <Link key={it.label} to={it.to}
              className={`relative flex flex-col items-center gap-0.5 py-2 text-[10px] font-extrabold transition ${active ? "text-teal" : "text-muted"}`}>
              <span className={`grid h-6 w-10 place-items-center rounded-full transition ${active ? "bg-mint" : ""}`}>
                <Icon className="h-5 w-5" />
              </span>
              {it.label}
              {typeof it.badge === "number" && it.badge > 0 && (
                <span className="absolute right-1/2 top-0.5 grid h-4 min-w-4 -translate-x-[-14px] place-items-center rounded-full bg-amber px-1 text-[9px] font-extrabold text-ink">{it.badge}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
