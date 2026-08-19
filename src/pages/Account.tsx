import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { byId, fmt } from "../data/products";
import { KENYA_COUNTIES, ORDER_FLOW, statusLabel, type Order } from "../data/content";
import { useStore } from "../lib/store";
import ProductArt from "../components/ProductArt";
import { Crumbs, DemoPill } from "../components/ui";
import { WhatsAppButton } from "../components/Contact";
import {
  IcBox, IcCard, IcCheck, IcChevD, IcHeadset, IcHeart, IcPin, IcRefresh, IcTrash, IcUser,
} from "../components/Icons";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: IcUser },
  { id: "orders", label: "Orders", icon: IcBox },
  { id: "wishlist", label: "Wishlist", icon: IcHeart, to: "/wishlist" },
  { id: "addresses", label: "Saved addresses", icon: IcPin },
  { id: "profile", label: "Profile", icon: IcCard },
  { id: "support", label: "Support tickets", icon: IcHeadset },
  { id: "returns", label: "Returns", icon: IcRefresh },
];



export default function Account() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "dashboard";
  const { orders, wishlist, profile } = useStore();

  return (
    <div className="wrap py-8 md:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Crumbs items={[{ label: "Home", to: "/" }, { label: "My account" }]} />
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">Karibu, {profile.name.split(" ")[0]}</h1>
        </div>
        <DemoPill />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="h-fit lg:sticky lg:top-40">
          <nav className="card flex gap-1 overflow-x-auto p-2 no-scrollbar lg:flex-col" aria-label="Account sections">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              const cls = `flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[13px] font-extrabold transition ${active ? "bg-ink text-amber" : "text-muted hover:bg-mist hover:text-ink"}`;
              return t.to ? (
                <Link key={t.id} to={t.to} className={cls}><Icon className="h-4.5 w-4.5" /> {t.label}
                  {t.id === "wishlist" && <span className="ml-auto rounded-full bg-amber px-1.5 text-[10px] text-ink">{wishlist.length}</span>}
                </Link>
              ) : (
                <button key={t.id} type="button" onClick={() => setParams({ tab: t.id })} className={cls}>
                  <Icon className="h-4.5 w-4.5" /> {t.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0">
          {tab === "dashboard" && <Dashboard />}
          {tab === "orders" && <Orders />}
          {tab === "addresses" && <Addresses />}
          {tab === "profile" && <Profile />}
          {tab === "support" && <Support />}
          {tab === "returns" && <Returns />}
        </div>
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */
function Dashboard() {
  const { orders, wishlist, cartCount, profile } = useStore();
  const spent = orders.reduce((s, o) => s + o.total, 0);
  const stats = [
    { label: "Orders placed", value: String(orders.length), icon: IcBox },
    { label: "Wishlist items", value: String(wishlist.length), icon: IcHeart },
    { label: "In cart now", value: String(cartCount), icon: IcCard },
    { label: "Lifetime spend", value: fmt(spent), icon: IcCheck },
  ];
  return (
    <div className="space-y-5">
      <div className="card relative overflow-hidden p-6">
        <div className="dots-bg pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-teal">Demo account</p>
          <h2 className="mt-1 font-display text-xl font-bold">{profile.name}</h2>
          <p className="text-sm font-semibold text-muted">{profile.email} · {profile.phone} · Nairobi</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card p-4">
              <Icon className="h-5 w-5 text-teal" />
              <p className="mt-2.5 truncate font-display text-lg font-bold" title={s.value}>{s.value}</p>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted">{s.label}</p>
            </div>
          );
        })}
      </div>
      <div>
        <h3 className="mb-3 font-display text-lg font-bold">Recent orders</h3>
        <div className="space-y-3">{orders.slice(0, 2).map((o) => <OrderCard key={o.id} o={o} />)}</div>
        <Link to="/account?tab=orders" className="mt-3 inline-block text-[13px] font-extrabold text-teal underline-offset-2 hover:underline">View all orders →</Link>
      </div>
    </div>
  );
}

/* ---------- Orders ---------- */
function Orders() {
  const { orders } = useStore();
  return (
    <div className="space-y-3">
      <p className="flex flex-wrap items-center gap-2 rounded-xl border border-amber/40 bg-amber/10 px-4 py-3 text-[12px] font-extrabold text-amberdeep">
        <span className="rounded bg-amber px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-ink">Demo tracking</span>
        Live tracking activates automatically once your order is confirmed. These entries are demo data.
      </p>
      {orders.length === 0 && <p className="card p-8 text-center text-sm font-bold text-muted">No orders yet — your orders will appear here.</p>}
      {orders.map((o) => <OrderCard key={o.id} o={o} />)}
    </div>
  );
}

function OrderCard({ o }: { o: Order }) {
  const [open, setOpen] = useState(false);
  const cancelled = o.status === "cancelled";
  const stepIdx = ORDER_FLOW.findIndex((s) => s.id === o.status);
  const tone = o.status === "delivered" ? "bg-mint text-success"
    : o.status === "payment-pending" ? "bg-amber/15 text-amberdeep"
    : cancelled ? "bg-error/10 text-error"
    : "bg-mist text-teal";
  return (
    <div className="card overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full flex-wrap items-center gap-3 p-4 text-left md:p-5" aria-expanded={open}>
        <div className="flex -space-x-3">
          {o.items.slice(0, 3).map((it) => {
            const p = byId(it.id);
            return p ? (
              <span key={it.id} className="grid h-11 w-14 place-items-center overflow-hidden rounded-lg border-2 border-card" style={{ background: `linear-gradient(150deg, ${p.hue}33, ${p.hue}11)` }}>
                <ProductArt kind={p.art} accent={p.hue} className="h-[130%]" />
              </span>
            ) : null;
          })}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[15px] font-bold">{o.id} <span className={`ml-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${tone}`}>{statusLabel(o.status)}</span></p>
          <p className="text-xs font-bold text-muted">{o.date} · {o.items.reduce((s, i) => s + i.qty, 0)} items · {o.payment}</p>
        </div>
        <span className="font-display text-base font-bold">{fmt(o.total)}</span>
        <IcChevD className={`h-4.5 w-4.5 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="animate-pop border-t border-line p-4 md:p-5">
          {/* Timeline — completed ✓ / current ● / upcoming ○ */}
          {cancelled ? (
            <p className="rounded-xl bg-error/10 px-4 py-3 text-[13px] font-extrabold text-error">This order was cancelled. Any payment made will be refunded to your M-PESA number.</p>
          ) : (
            <ol className="flex items-start overflow-x-auto no-scrollbar pb-1">
              {ORDER_FLOW.map((s, i) => {
                const done = i < stepIdx || o.status === "delivered";
                const current = i === stepIdx && o.status !== "delivered";
                return (
                  <li key={s.id} className="flex min-w-16 flex-1 items-start last:flex-none">
                    <span className="flex flex-col items-center text-center">
                      <span className={`relative grid h-7 w-7 place-items-center rounded-full text-[10px] font-extrabold ${
                        done ? "bg-teal text-white" : current ? "bg-amber text-ink" : "bg-mist text-muted"
                      }`}>
                        {current && <span className="absolute inset-0 animate-ping-soft rounded-full bg-amber" />}
                        {done ? <IcCheck className="h-3.5 w-3.5" /> : current ? "●" : "○"}
                      </span>
                      <span className={`mt-1.5 max-w-20 text-[9.5px] font-extrabold leading-tight ${done ? "text-teal" : current ? "text-amberdeep" : "text-muted"}`}>{s.label}</span>
                    </span>
                    {i < ORDER_FLOW.length - 1 && <span className={`mx-1 mt-3.5 h-0.5 flex-1 rounded ${i < stepIdx ? "bg-teal" : "bg-line"}`} />}
                  </li>
                );
              })}
            </ol>
          )}

          {o.status === "payment-pending" && !cancelled && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber/40 bg-amber/10 px-4 py-3">
              <p className="text-[12.5px] font-extrabold text-amberdeep">
                Awaiting your M-PESA confirmation — send it on WhatsApp and we'll verify it right away.
              </p>
              <WhatsAppButton message={`Hello! I've paid for order ${o.id}. Here is my M-PESA confirmation message:`} className="btn-sm !h-9">
                Send confirmation
              </WhatsAppButton>
            </div>
          )}

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <ul className="space-y-1.5">
              {o.items.map((it) => {
                const p = byId(it.id);
                return p ? (
                  <li key={it.id} className="flex justify-between text-[13px] font-semibold">
                    <Link to={`/product/${p.id}`} className="hover:text-teal">{p.name} × {it.qty}</Link>
                    <span className="font-extrabold">{fmt(it.price * it.qty)}</span>
                  </li>
                ) : null;
              })}
              <li className="flex justify-between border-t border-line pt-1.5 text-[13px] font-semibold text-muted"><span>Delivery</span><span>{o.delivery === 0 ? "FREE" : fmt(o.delivery)}</span></li>
              {o.discount > 0 && <li className="flex justify-between text-[13px] font-semibold text-success"><span>Discount</span><span>−{fmt(o.discount)}</span></li>}
            </ul>
            <p className="h-fit rounded-xl bg-mist p-3.5 text-xs font-bold leading-relaxed text-muted">
              <IcPin className="mr-1 inline h-3.5 w-3.5 text-teal" /> {o.address}
              {o.demo && <span className="mt-1.5 block text-amberdeep">Demo order — seeded for the prototype.</span>}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Addresses ---------- */
function Addresses() {
  const { addresses, addAddress, removeAddress, toast } = useStore();
  const [form, setForm] = useState({ label: "Home", name: "", phone: "", county: "Nairobi", details: "" });
  const [showForm, setShowForm] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">Saved addresses</h2>
        <button type="button" className="btn btn-teal btn-sm" onClick={() => setShowForm(!showForm)}>{showForm ? "Close" : "+ Add address"}</button>
      </div>
      {showForm && (
        <form className="card animate-pop mt-4 grid gap-3 p-5 sm:grid-cols-2" onSubmit={(e) => {
          e.preventDefault();
          if (form.name.trim() && form.details.trim()) {
            addAddress(form); setForm({ label: "Home", name: "", phone: "", county: "Nairobi", details: "" }); setShowForm(false);
            toast("Address saved.");
          }
        }}>
          <label className="block text-xs font-extrabold text-muted">Label
            <select className="input mt-1.5" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}>
              <option>Home</option><option>Office</option><option>Other</option>
            </select>
          </label>
          <label className="block text-xs font-extrabold text-muted">County
            <select className="input mt-1.5" value={form.county} onChange={(e) => setForm({ ...form, county: e.target.value })}>
              {KENYA_COUNTIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="block text-xs font-extrabold text-muted">Recipient<input required className="input mt-1.5" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="block text-xs font-extrabold text-muted">Phone<input className="input mt-1.5" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <label className="block text-xs font-extrabold text-muted sm:col-span-2">Estate / street / building<input required className="input mt-1.5" value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} /></label>
          <button type="submit" className="btn btn-amber sm:col-span-2">Save address</button>
        </form>
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {addresses.map((a) => (
          <div key={a.id} className="card p-4">
            <div className="flex items-start justify-between">
              <span className="rounded-md bg-mint px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-teal">{a.label}</span>
              <button type="button" onClick={() => removeAddress(a.id)} className="text-muted transition hover:text-error" aria-label="Delete address"><IcTrash className="h-4 w-4" /></button>
            </div>
            <p className="mt-2.5 text-sm font-extrabold">{a.name}</p>
            <p className="text-[13px] font-semibold text-muted">{a.details}</p>
            <p className="text-[13px] font-semibold text-muted">{a.county} · {a.phone}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Profile ---------- */
function Profile() {
  const { profile, updateProfile } = useStore();
  const [f, setF] = useState(profile);
  return (
    <form className="card max-w-xl p-6" onSubmit={(e) => { e.preventDefault(); updateProfile(f); }}>
      <h2 className="font-display text-xl font-bold">Profile details</h2>
      <p className="mt-1 text-xs font-bold text-muted">Demo data — stored only in your browser.</p>
      <div className="mt-5 grid gap-3.5">
        <label className="block text-xs font-extrabold text-muted">Full name<input className="input mt-1.5" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label className="block text-xs font-extrabold text-muted">Email<input type="email" className="input mt-1.5" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label className="block text-xs font-extrabold text-muted">Phone<input className="input mt-1.5" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
        <label className="block text-xs font-extrabold text-muted">Password<input type="password" className="input mt-1.5" placeholder="•••••••• (demo)" readOnly /></label>
      </div>
      <button type="submit" className="btn btn-amber mt-5">Save changes</button>
    </form>
  );
}

/* ---------- Support tickets ---------- */
function Support() {
  const { tickets, addTicket, toast } = useStore();
  const [topic, setTopic] = useState("");
  const [msg, setMsg] = useState("");
  return (
    <div>
      <h2 className="font-display text-xl font-bold">Support tickets</h2>
      <form className="card mt-4 grid gap-3 p-5" onSubmit={(e) => {
        e.preventDefault();
        if (topic.trim() && msg.trim()) { addTicket({ topic, message: msg }); setTopic(""); setMsg(""); toast("Ticket opened — our team replies within 2 hours (demo)."); }
      }}>
        <input required className="input" placeholder="Topic, e.g. Warranty claim — Vyra Watch S2" value={topic} onChange={(e) => setTopic(e.target.value)} />
        <textarea required className="input !h-24 !py-2.5" placeholder="Describe the issue…" value={msg} onChange={(e) => setMsg(e.target.value)} />
        <button type="submit" className="btn btn-teal justify-self-start">Open ticket</button>
      </form>
      <ul className="mt-4 space-y-2.5">
        {tickets.map((t) => (
          <li key={t.id} className="card flex flex-wrap items-center gap-3 p-4">
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${t.status === "Answered" ? "bg-mint text-success" : "bg-amber/15 text-amberdeep"}`}>{t.status}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold">{t.topic}</p>
              <p className="truncate text-xs font-semibold text-muted">{t.message}</p>
            </div>
            <span className="text-xs font-bold text-muted">{t.id} · {t.date}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Returns ---------- */
function Returns() {
  const { toast } = useStore();
  return (
    <div>
      <h2 className="font-display text-xl font-bold">Returns</h2>
      <div className="card mt-4 divide-y divide-line">
        <div className="flex flex-wrap items-center gap-3 p-4">
          <span className="rounded-full bg-mint px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-success">Refunded</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold">Pulse BoomGo Speaker · IMR-2026-0091</p>
            <p className="text-xs font-semibold text-muted">Reason: changed mind · KSh 9,500 returned to M-Pesa</p>
          </div>
          <span className="text-xs font-bold text-muted">2026-01-05</span>
        </div>
      </div>
      <div className="card mt-4 p-5">
        <p className="text-sm font-bold">How returns work</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-[13px] font-semibold text-muted">
          <li>Sealed items: 7 days, full refund, free pickup in Nairobi.</li>
          <li>Faulty items: 7 days, refund or replacement — your choice.</li>
          <li>M-Pesa refunds land within 24 hours of approval.</li>
        </ul>
        <button type="button" className="btn btn-outline btn-sm mt-4" onClick={() => toast("Return request form would open here (demo).", "info")}>Request a return</button>
      </div>
    </div>
  );
}
