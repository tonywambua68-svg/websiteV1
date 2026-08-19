import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fmt } from "../data/products";
import { useStore } from "../lib/store";
import ProductArt from "../components/ProductArt";
import { Crumbs, Empty, Qty } from "../components/ui";
import { cartWaMessage, WhatsAppButton } from "../components/Contact";
import { IcArrowR, IcCart, IcLock, IcTag, IcTrash, IcTruck } from "../components/Icons";

export const DELIVERY_FEE = 500;
export const FREE_AT = 30000;

export default function CartPage() {
  const { cartItems, cartSubtotal, cartSavings, setQty, removeFromCart, promo, applyPromo, clearPromo } = useStore();
  const nav = useNavigate();
  const [code, setCode] = useState("");
  const [codeErr, setCodeErr] = useState(false);

  if (cartItems.length === 0) {
    return (
      <div className="wrap py-20">
        <Empty title="Your cart is empty" sub="Good tech is waiting. Fill it up — delivery across Kenya starts at KSh 300.">
          <Link to="/shop" className="btn btn-amber btn-sm"><IcCart className="h-4 w-4" /> Start shopping</Link>
          <Link to="/deals" className="btn btn-outline btn-sm">See today's deals</Link>
        </Empty>
      </div>
    );
  }

  const discount = promo === "IMARA5" ? Math.round(cartSubtotal * 0.05) : 0;
  const delivery = cartSubtotal - discount >= FREE_AT ? 0 : DELIVERY_FEE;
  const total = cartSubtotal - discount + delivery;

  return (
    <div className="wrap py-8 md:py-12">
      <Crumbs items={[{ label: "Home", to: "/" }, { label: "Cart" }]} />
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl">Your cart <span className="text-muted">({cartItems.length} item{cartItems.length > 1 ? "s" : ""})</span></h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Items */}
        <div className="card divide-y divide-line overflow-hidden">
          {cartItems.map(({ p, qty }) => (
            <div key={p.id} className="flex gap-4 p-4 md:p-5">
              <Link to={`/product/${p.id}`} className="grid h-20 w-24 shrink-0 place-items-center overflow-hidden rounded-xl md:h-24 md:w-32" style={{ background: `linear-gradient(150deg, ${p.hue}22, ${p.hue}08)` }}>
                <ProductArt kind={p.art} accent={p.hue} className="h-[125%]" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link to={`/product/${p.id}`} className="block truncate text-[15px] font-bold hover:text-teal">{p.name}</Link>
                    <p className="text-xs font-bold text-muted">{p.brand} · {p.condition} · {fmt(p.price)} each</p>
                  </div>
                  <button type="button" onClick={() => removeFromCart(p.id)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-error/10 hover:text-error" aria-label={`Remove ${p.name}`}>
                    <IcTrash className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
                  <Qty small value={qty} onChange={(v) => setQty(p.id, v)} />
                  <p className="font-display text-base font-bold md:text-lg">{fmt(p.price * qty)}</p>
                </div>
                {p.stock <= 5 && <p className="mt-1.5 text-[11px] font-extrabold text-warning">Only {p.stock} left — quantity capped</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <aside className="h-fit space-y-4 lg:sticky lg:top-40">
          <div className="card p-5">
            <p className="flex items-center gap-2 font-display text-lg font-bold"><IcTag className="h-5 w-5 text-teal" /> Promo code</p>
            {promo ? (
              <div className="mt-3 flex items-center justify-between rounded-xl bg-mint px-4 py-3 text-[13px] font-extrabold text-teal">
                IMARA5 — 5% off applied
                <button type="button" onClick={clearPromo} className="text-error underline-offset-2 hover:underline">Remove</button>
              </div>
            ) : (
              <>
                <form
                  className={`mt-3 flex gap-2 ${codeErr ? "animate-shake" : ""}`}
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!applyPromo(code)) { setCodeErr(true); window.setTimeout(() => setCodeErr(false), 700); }
                  }}
                >
                  <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Try IMARA5" className="input !h-10 !text-[13px]" aria-label="Promo code" />
                  <button type="submit" className="btn btn-outline btn-sm !h-10">Apply</button>
                </form>
                {codeErr && <p className="mt-1.5 text-[11px] font-extrabold text-error">That code isn't valid. Psst — try IMARA5.</p>}
              </>
            )}
          </div>

          <div className="card p-5">
            <h2 className="font-display text-lg font-bold">Order summary</h2>
            <dl className="mt-3 space-y-2 text-sm font-semibold">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="font-extrabold">{fmt(cartSubtotal)}</dd></div>
              {cartSavings > 0 && (
                <div className="flex justify-between text-success"><dt>Deal savings</dt><dd className="font-extrabold">−{fmt(cartSavings)}</dd></div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-success"><dt>Promo (IMARA5)</dt><dd className="font-extrabold">−{fmt(discount)}</dd></div>
              )}
              <div className="flex justify-between">
                <dt className="flex items-center gap-1.5 text-muted"><IcTruck className="h-4 w-4" /> Delivery</dt>
                <dd className="font-extrabold">{delivery === 0 ? <span className="text-success">FREE</span> : fmt(delivery)}</dd>
              </div>
            </dl>
            {delivery > 0 && (
              <p className="mt-2.5 rounded-lg bg-mist px-3 py-2 text-[11px] font-bold text-muted">
                Add {fmt(FREE_AT - (cartSubtotal - discount))} more to unlock free delivery.
              </p>
            )}
            <div className="mt-4 flex justify-between border-t border-line pt-4">
              <span className="font-display text-base font-bold">Total</span>
              <span className="font-display text-xl font-bold">{fmt(total)}</span>
            </div>
            <p className="mt-1 text-right text-[11px] font-bold text-muted">VAT inclusive · KSh</p>
            <button type="button" className="btn btn-amber mt-4 w-full !h-12 !text-[15px]" onClick={() => nav("/checkout")}>
              Proceed to checkout <IcArrowR className="h-4.5 w-4.5" />
            </button>
            <WhatsAppButton message={cartWaMessage(cartItems, total)} className="mt-2.5 w-full !h-12 !text-[15px]">
              Order on WhatsApp
            </WhatsAppButton>
            <p className="mt-2 text-center text-[11px] font-bold text-muted">
              Prefer to talk it through? We'll confirm availability, delivery & M-PESA payment on WhatsApp.
            </p>
            <Link to="/shop" className="mt-2.5 block text-center text-xs font-extrabold text-teal underline-offset-2 hover:underline">Continue shopping</Link>
            <p className="mt-4 flex items-center justify-center gap-1.5 border-t border-line pt-3.5 text-[11px] font-bold text-muted">
              <IcLock className="h-3.5 w-3.5 text-teal" /> Secure demo checkout — no real payment
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
