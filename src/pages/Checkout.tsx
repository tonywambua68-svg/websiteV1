import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { byId, fmt, type ArtKind } from "../data/products";
import { KENYA_COUNTIES, type Order } from "../data/content";
import { useStore } from "../lib/store";
import { useAuth } from "../lib/AuthContext";
import { DELIVERY_OPTIONS, FREE_DELIVERY_AT } from "../config";
import ProductArt from "../components/ProductArt";
import { Crumbs, DemoPill, Empty } from "../components/ui";
import { HowToPay, PayBillBox, WhatsAppButton } from "../components/Contact";
import { logCheckout } from "../lib/nova/analytics";
import { IcCart, IcCheck, IcChevD, IcPhone, IcTruck } from "../components/Icons";

export default function Checkout() {
  const { cartItems, cartSubtotal, promo, placeOrder, addresses } = useStore();
  const { user } = useAuth();
  const nav = useNavigate();
  const [done, setDone] = useState<Order | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [county, setCounty] = useState("Nairobi");
  const [details, setDetails] = useState(addresses[0]?.details ?? "");
  const [deliveryId, setDeliveryId] = useState(DELIVERY_OPTIONS[0]?.id ?? "standard");
  const [note, setNote] = useState("");
  const [errs, setErrs] = useState<string[]>([]);

  const discount = promo === "IMARA5" ? Math.round(cartSubtotal * 0.05) : 0;
  const deliveryFee = useMemo(() => {
    const opt = DELIVERY_OPTIONS.find((d) => d.id === deliveryId);
    if (!opt) return 0;
    if (cartSubtotal - discount >= FREE_DELIVERY_AT && FREE_DELIVERY_AT > 0) return 0;
    return opt.fee;
  }, [deliveryId, cartSubtotal, discount]);
  const total = cartSubtotal - discount + deliveryFee;

  if (done) return <Confirmation order={done} totalPaid={total} onContinue={() => nav("/")} onTrack={() => nav("/account?tab=orders")} />;

  if (cartItems.length === 0) {
    return (
      <div className="wrap py-20">
        <Empty title="Nothing to check out" sub="Your cart is empty. Add a product first — the checkout will be right here.">
          <Link to="/shop" className="btn btn-amber btn-sm"><IcCart className="h-4 w-4" /> Go to shop</Link>
        </Empty>
      </div>
    );
  }

  const validate = (): string[] => {
    const e: string[] = [];
    if (name.trim().length < 2) e.push("Enter your full name.");
    if (phone.replace(/\D/g, "").length < 10) e.push("Enter a valid Kenyan phone number — we confirm orders on WhatsApp.");
    if (details.trim().length < 4) e.push("Enter your delivery address / estate.");
    return e;
  };

  const next = () => {
    if (step === 1) {
      const e = validate();
      if (e.length) { setErrs(e); return; }
      setErrs([]); setStep(2);
    } else if (step === 2) { setErrs([]); setStep(3); }
  };

  const submit = () => {
    const e = validate();
    if (e.length) { setErrs(e); return; }
    logCheckout(total); // NOVA behaviour log
    const order = placeOrder({
      delivery: deliveryFee,
      payment: "M-PESA PayBill",
      address: `${name} · ${details}, ${county}`,
      discount,
      note,
    });
    setDone(order);
    window.scrollTo({ top: 0 });
  };

  const StepHead = ({ n, title, sub }: { n: 1 | 2 | 3; title: string; sub: string }) => (
    <button type="button" onClick={() => setStep(n)} className="flex w-full items-center gap-3.5 text-left">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-sm font-bold transition ${step === n ? "bg-teal text-white" : step > n ? "bg-mint text-teal" : "bg-mist text-muted"}`}>
        {step > n ? <IcCheck className="h-4 w-4" /> : n}
      </span>
      <span className="flex-1">
        <span className="block font-display text-[15px] font-bold">{title}</span>
        <span className="block text-xs font-semibold text-muted">{sub}</span>
      </span>
      <IcChevD className={`h-4.5 w-4.5 text-muted transition-transform ${step === n ? "rotate-180" : ""}`} />
    </button>
  );

  return (
    <div className="wrap py-8 md:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Crumbs items={[{ label: "Home", to: "/" }, { label: "Cart", to: "/cart" }, { label: "Checkout" }]} />
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">Checkout</h1>
        </div>
        <DemoPill />
      </div>

      {errs.length > 0 && (
        <div className="animate-pop mt-5 rounded-xl border border-error/30 bg-error/5 p-4">
          <p className="text-[13px] font-extrabold text-error">Please fix the following:</p>
          <ul className="mt-1 list-inside list-disc text-[13px] font-semibold text-error/80">
            {errs.map((e) => <li key={e}>{e}</li>)}
          </ul>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {/* Step 1 */}
          <section className={`card p-5 ${step !== 1 ? "opacity-80" : ""}`}>
            <StepHead n={1} title="Contact & delivery address" sub={`${name} · ${county}`} />
            {step === 1 && (
              <div className="animate-pop mt-5 grid gap-3.5 sm:grid-cols-2">
                {user && (
                  <p className="rounded-lg bg-mint px-3.5 py-2.5 text-[12px] font-extrabold text-teal sm:col-span-2">
                    Ordering as {user.name} ({user.email}) — details pre-filled from your account.
                  </p>
                )}
                <Field label="Full name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></Field>
                <Field label="Phone / WhatsApp (for order confirmation)"><input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" /></Field>
                <Field label="Email (receipt)"><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></Field>
                <Field label="County">
                  <select className="input" value={county} onChange={(e) => setCounty(e.target.value)}>
                    {KENYA_COUNTIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Estate / street / building" wide>
                  <input className="input" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="e.g. Rosecourt Apartments, Gitanga Rd, Lavington" />
                </Field>
                <Field label="Note to seller (optional)" wide>
                  <textarea className="input !h-20 !py-2.5" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Call before delivery · gift-wrap it · deliver after 5 PM" />
                </Field>
                <div className="flex justify-end sm:col-span-2">
                  <button type="button" className="btn btn-amber" onClick={next}>Continue to delivery</button>
                </div>
              </div>
            )}
          </section>

          {/* Step 2 */}
          <section className={`card p-5 ${step < 2 ? "opacity-60" : ""}`}>
            <StepHead n={2} title="Delivery method" sub={DELIVERY_OPTIONS.find((d) => d.id === deliveryId)?.label ?? ""} />
            {step === 2 && (
              <div className="animate-pop mt-5 space-y-2.5">
                {DELIVERY_OPTIONS.map((d) => {
                  const free = FREE_DELIVERY_AT > 0 && cartSubtotal - discount >= FREE_DELIVERY_AT;
                  return (
                    <label key={d.id} className={`flex cursor-pointer items-center gap-3.5 rounded-xl border-2 p-4 transition ${deliveryId === d.id ? "border-teal bg-mint/50" : "border-line hover:border-teal/40"}`}>
                      <input type="radio" name="delivery" checked={deliveryId === d.id} onChange={() => setDeliveryId(d.id)} className="sr-only" />
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${deliveryId === d.id ? "bg-teal text-white" : "bg-mist text-muted"}`}><IcTruck className="h-5 w-5" /></span>
                      <span className="flex-1">
                        <span className="block text-[14px] font-extrabold">{d.label}</span>
                        <span className="block text-xs font-bold text-muted">{d.eta}</span>
                      </span>
                      <span className={`font-display text-sm font-bold ${free && d.fee > 0 ? "text-success" : ""}`}>{free && d.fee > 0 ? "FREE" : d.fee === 0 ? "FREE" : fmt(d.fee)}</span>
                    </label>
                  );
                })}
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>Back</button>
                  <button type="button" className="btn btn-amber" onClick={next}>Continue to payment</button>
                </div>
              </div>
            )}
          </section>

          {/* Step 3 — M-PESA PayBill only */}
          <section className={`card p-5 ${step < 3 ? "opacity-60" : ""}`}>
            <StepHead n={3} title="Payment — M-PESA PayBill" sub="The only payment method we currently accept" />
            {step === 3 && (
              <div className="animate-pop mt-5 space-y-4">
                <div className="rounded-xl border-2 border-teal bg-mint/40 p-4">
                  <div className="flex items-center gap-3.5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal text-white"><IcPhone className="h-5 w-5" /></span>
                    <div className="flex-1">
                      <p className="text-[14px] font-extrabold">M-PESA PayBill</p>
                      <p className="text-xs font-bold text-muted">Pay now, then confirm on WhatsApp — we verify it personally before dispatch.</p>
                    </div>
                    <span className="rounded bg-[#1b9e4b] px-1.5 py-0.5 text-[10px] font-extrabold text-white">M-PESA</span>
                  </div>
                  <div className="mt-4">
                    <PayBillBox amount={total} compact />
                  </div>
                  <p className="mt-3 text-[11.5px] font-bold text-muted">
                    Your Account Number (order reference) is issued when you place the order — it appears on the next screen.
                  </p>
                </div>

                {/* Coming soon — clearly not available */}
                <div className="flex items-center gap-3.5 rounded-xl border border-dashed border-line p-4 opacity-60" aria-disabled="true">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-mist text-muted"><IcCart className="h-5 w-5" /></span>
                  <div className="flex-1">
                    <p className="text-[14px] font-extrabold text-muted">Card, PayPal & others</p>
                    <p className="text-xs font-bold text-muted">Not available yet — we currently accept M-PESA only.</p>
                  </div>
                  <span className="rounded bg-mist px-1.5 py-0.5 text-[10px] font-extrabold text-muted">COMING SOON</span>
                </div>

                <div className="rounded-xl border border-line p-4">
                  <HowToPay />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" className="btn btn-outline" onClick={() => setStep(2)}>Back</button>
                  <button type="button" className="btn btn-amber !h-12 !px-7 !text-[15px]" onClick={submit}>Place order · {fmt(total)}</button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Summary */}
        <aside className="h-fit lg:sticky lg:top-40">
          <div className="card p-5">
            <h2 className="font-display text-lg font-bold">Your order</h2>
            <ul className="mt-3 space-y-3">
              {cartItems.map(({ p, qty }) => (
                <li key={p.id} className="flex items-center gap-3">
                  <span className="relative grid h-12 w-14 shrink-0 place-items-center overflow-hidden rounded-lg" style={{ background: `linear-gradient(150deg, ${p.hue}22, ${p.hue}08)` }}>
                    <ProductArt kind={p.art as ArtKind} accent={p.hue} className="h-[130%]" />
                    <span className="absolute -right-0 -top-0 grid h-4.5 min-w-4.5 place-items-center rounded-bl-lg bg-ink px-1 text-[10px] font-extrabold text-white">×{qty}</span>
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-bold">{p.name}</span>
                  <span className="font-display text-[13px] font-bold">{fmt(p.price * qty)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm font-semibold">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="font-extrabold">{fmt(cartSubtotal)}</dd></div>
              {discount > 0 && <div className="flex justify-between text-success"><dt className="text-success">Promo IMARA5</dt><dd className="font-extrabold">−{fmt(discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd className="font-extrabold">{deliveryFee === 0 ? "FREE" : fmt(deliveryFee)}</dd></div>
              <div className="flex justify-between border-t border-line pt-3"><dt className="font-display text-base font-bold">Total</dt><dd className="font-display text-xl font-bold">{fmt(total)}</dd></div>
            </dl>
            <p className="mt-3 rounded-lg bg-mist px-3 py-2 text-[11px] font-bold text-muted">
              Demo checkout — no payment is processed here. In the live store this step issues your real order reference.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 block text-xs font-extrabold text-muted">{label}</span>
      {children}
    </label>
  );
}

function Confirmation({ order, totalPaid, onContinue, onTrack }: { order: Order; totalPaid: number; onContinue: () => void; onTrack: () => void }) {
  return (
    <div className="wrap py-12 md:py-16">
      <div className="card animate-pop mx-auto max-w-xl overflow-hidden">
        <div className="relative bg-ink p-8 text-center text-white">
          <div className="grid-lines absolute inset-0" />
          <span className="relative mx-auto grid h-16 w-16 place-items-center rounded-full bg-amber text-ink">
            <IcCheck className="h-8 w-8" />
          </span>
          <h1 className="relative mt-4 font-display text-2xl font-bold">Asante! Order received.</h1>
          <p className="relative mt-1.5 text-sm font-semibold text-white/60">
            Reference <b className="text-amber">{order.id}</b> · {order.date} · status: <b className="text-amber">Payment Pending</b>
          </p>
        </div>
        <div className="p-6">
          <p className="text-center text-sm font-semibold leading-relaxed text-muted">
            Your order is in. Next: pay the total below via <b className="text-ink">M-PESA PayBill</b>, then send us
            the confirmation message on WhatsApp. We verify it personally and start processing right away.
          </p>

          <div className="mt-5">
            <PayBillBox reference={order.id} amount={totalPaid} />
          </div>

          {order.note && (
            <p className="mt-3 rounded-lg bg-mist px-3.5 py-2.5 text-[12.5px] font-semibold text-ink/80">
              <b>Your note to us:</b> {order.note}
            </p>
          )}

          <div className="mt-4 rounded-xl border border-line p-4">
            <HowToPay />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <WhatsAppButton message={`Hello! I've just paid for order ${order.id} (${fmt(totalPaid)}) via M-PESA PayBill. Here is my confirmation message:`} className="w-full">
              I've paid — confirm it
            </WhatsAppButton>
            <button type="button" className="btn btn-outline" onClick={onTrack}>Track order</button>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="mt-2.5 flex w-full items-center justify-center gap-2 text-center text-xs font-extrabold text-ink underline-offset-2 hover:underline"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
            Print / save receipt
          </button>
          <button type="button" className="mt-2.5 w-full text-center text-xs font-extrabold text-teal underline-offset-2 hover:underline" onClick={onContinue}>
            Continue shopping
          </button>

          <p className="mt-5 rounded-lg border border-amber/40 bg-amber/10 px-3 py-2.5 text-center text-[11.5px] font-extrabold leading-relaxed text-amberdeep">
            Demo checkout — no payment was processed and this order isn't real.
            Tracking becomes live once orders run through the real backend (WooCommerce).
          </p>
        </div>
      </div>

      {/* Printable receipt — only visible when printing */}
      <div id="print-receipt">
        <p style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 20, fontWeight: 700 }}>Imara Tech — Order receipt (demo)</p>
        <p>Reference: {order.id} · Date: {order.date} · Status: Payment Pending</p>
        <p>Deliver to: {order.address}</p>
        {order.note && <p>Note: {order.note}</p>}
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #999" }}>
              <th>Item</th><th>Qty</th><th style={{ textAlign: "right" }}>Price</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it) => {
              const prod = byId(it.id);
              return (
                <tr key={it.id} style={{ borderBottom: "1px solid #ddd" }}>
                  <td>{prod ? prod.name : it.id}</td>
                  <td>{it.qty}</td>
                  <td style={{ textAlign: "right" }}>{fmt(it.price * it.qty)}</td>
                </tr>
              );
            })}
            <tr><td colSpan={2}>Delivery</td><td style={{ textAlign: "right" }}>{order.delivery === 0 ? "FREE" : fmt(order.delivery)}</td></tr>
            {order.discount > 0 && <tr><td colSpan={2}>Discount</td><td style={{ textAlign: "right" }}>−{fmt(order.discount)}</td></tr>}
            <tr style={{ fontWeight: 700 }}><td colSpan={2}>Total (pay via M-PESA PayBill)</td><td style={{ textAlign: "right" }}>{fmt(order.total)}</td></tr>
          </tbody>
        </table>
        <p style={{ marginTop: 12, fontSize: 11 }}>Design demo — not a tax invoice. No payment was processed.</p>
      </div>
    </div>
  );
}
