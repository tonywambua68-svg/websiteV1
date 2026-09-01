import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { byId, fmt } from "../data/products";
import { KENYA_COUNTIES, ORDER_FLOW, statusLabel, type Order } from "../data/content";
import { useStore } from "../lib/store";
import { useAuth } from "../lib/AuthContext";
import { AuthError, passwordIssues } from "../lib/auth";
import {
  AVATAR_HUES, AUTH, getBizSettings, saveBizSettings, waHref, whatsappDisplay,
} from "../config";
import ProductArt from "../components/ProductArt";
import { Crumbs, DemoPill } from "../components/ui";
import { WhatsAppButton } from "../components/Contact";
import {
  IcBox, IcCard, IcCheck, IcChevD, IcHeadset, IcHeart, IcLock, IcPin, IcPlug, IcRefresh, IcTrash, IcUser,
} from "../components/Icons";

const TABS: { id: string; label: string; icon: typeof IcUser; to?: string; adminOnly?: boolean }[] = [
  { id: "dashboard", label: "Dashboard", icon: IcUser },
  { id: "orders", label: "Orders", icon: IcBox },
  { id: "wishlist", label: "Wishlist", icon: IcHeart, to: "/wishlist" },
  { id: "addresses", label: "Saved addresses", icon: IcPin },
  { id: "profile", label: "Profile", icon: IcCard },
  { id: "support", label: "Support tickets", icon: IcHeadset },
  { id: "returns", label: "Returns", icon: IcRefresh },
  { id: "connections", label: "Store connections", icon: IcPlug, adminOnly: true },
];



export default function Account() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "dashboard";
  const { orders, wishlist } = useStore();
  const { user, logout } = useAuth();
  const nav = useNavigate();

  if (!user) return null; // ProtectedRoute guarantees a user — this keeps TS happy

  return (
    <div className="wrap py-8 md:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Crumbs items={[{ label: "Home", to: "/" }, { label: "My account" }]} />
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">Karibu, {user.name.split(" ")[0]}</h1>
        </div>
        <div className="flex items-center gap-2.5">
          <DemoPill />
          <button
            type="button"
            onClick={() => { logout(); nav("/"); }}
            className="btn btn-outline btn-sm !text-error hover:!border-error"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="h-fit lg:sticky lg:top-40">
          <nav className="card flex gap-1 overflow-x-auto p-2 no-scrollbar lg:flex-col" aria-label="Account sections">
            {TABS.filter((t) => !t.adminOnly || user?.role === "admin").map((t) => {
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
          {tab === "connections" && user?.role === "admin" && <StoreConnections />}
        </div>
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */
function Dashboard() {
  const { orders, wishlist, cartCount } = useStore();
  const { user } = useAuth();
  const spent = orders.reduce((s, o) => s + o.total, 0);
  const stats = [
    { label: "Orders placed", value: String(orders.length), icon: IcBox },
    { label: "Wishlist items", value: String(wishlist.length), icon: IcHeart },
    { label: "In cart now", value: String(cartCount), icon: IcCard },
    { label: "Lifetime spend", value: fmt(spent), icon: IcCheck },
  ];
  if (!user) return null;
  const memberSince = new Date(user.createdAt).toLocaleDateString("en-KE", { month: "long", year: "numeric" });
  return (
    <div className="space-y-5">
      <div className="card relative overflow-hidden p-6">
        <div className="dots-bg pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative flex items-center gap-4">
          <span
            className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl font-display text-lg font-bold text-white shadow-lg"
            style={{ background: user.avatarHue }}
          >
            {user.name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-teal">Your account</p>
            <h2 className="mt-0.5 truncate font-display text-xl font-bold">{user.name}</h2>
            <p className="truncate text-sm font-semibold text-muted">
              {user.email}{user.phone ? ` · ${user.phone}` : ""} · member since {memberSince}
            </p>
          </div>
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
              <li className="pt-1">
                <ReorderButton order={o} />
              </li>
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

/* ---------- Reorder (one-tap buy-again) ---------- */
function ReorderButton({ order }: { order: Order }) {
  const { addToCart, setDrawerOpen, toast } = useStore();
  const [busy, setBusy] = useState(false);
  const available = order.items.filter((it) => {
    const p = byId(it.id);
    return p && p.stock > 0;
  });
  if (available.length === 0) return null;
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        available.forEach((it) => addToCart(it.id, it.qty, true));
        window.setTimeout(() => {
          setBusy(false);
          setDrawerOpen(true);
          toast(`${available.length} item${available.length > 1 ? "s" : ""} added back to your cart.`);
        }, 350);
      }}
      className="btn btn-teal btn-sm"
    >
      {busy ? "Adding…" : "Order again"}
    </button>
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
  const { user, updateProfile, changePassword } = useAuth();
  const { toast } = useStore();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [hue, setHue] = useState(user?.avatarHue ?? AVATAR_HUES[0]);
  const [pwErr, setPwErr] = useState<string | null>(null);

  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  if (!user) return null;

  const saveProfile = (e: FormEvent) => {
    e.preventDefault();
    try {
      updateProfile({ name, phone, avatarHue: hue });
      toast("Profile updated.");
    } catch (err) {
      setPwErr(err instanceof AuthError ? err.message : "Could not save profile.");
    }
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwErr(null);
    if (newPw !== newPw2) { setPwErr("New passwords don't match."); return; }
    const issues = passwordIssues(newPw);
    if (issues.length) { setPwErr(`New password needs: ${issues.join(", ").toLowerCase()}`); return; }
    setPwBusy(true);
    try {
      await changePassword(curPw, newPw);
      setCurPw(""); setNewPw(""); setNewPw2("");
      toast("Password changed — use it next time you sign in.");
    } catch (err) {
      setPwErr(err instanceof AuthError ? err.message : "Could not change password.");
    } finally {
      setPwBusy(false);
    }
  };

  const previewInitials = (name.trim() || user.name).split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");

  return (
    <div className="max-w-xl space-y-5">
      {/* Profile details */}
      <form className="card p-6" onSubmit={saveProfile}>
        <div className="flex items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl font-display text-xl font-bold text-white shadow-lg transition-colors duration-300" style={{ background: hue }}>
            {previewInitials}
          </span>
          <div>
            <h2 className="font-display text-xl font-bold">Profile details</h2>
            <p className="mt-0.5 text-xs font-bold text-muted">Only you can see this page — it's guarded by your session.</p>
          </div>
        </div>

        <p className="mt-5 text-xs font-extrabold text-muted">Avatar colour</p>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Avatar colour">
          {AVATAR_HUES.map((h) => (
            <button
              key={h} type="button" role="radio" aria-checked={hue === h} onClick={() => setHue(h)}
              className={`grid h-9 w-9 place-items-center rounded-full text-white transition ${hue === h ? "ring-2 ring-ink ring-offset-2 ring-offset-card" : "hover:scale-110"}`}
              style={{ background: h }}
              aria-label={`Colour ${h}`}
            >
              {hue === h && <IcCheck className="h-4 w-4" />}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-3.5">
          <label className="block text-xs font-extrabold text-muted">Full name
            <input className="input mt-1.5" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block text-xs font-extrabold text-muted">Email <span className="font-bold text-muted/70">(sign-in ID — fixed)</span>
            <input className="input mt-1.5 opacity-70" value={user.email} readOnly />
          </label>
          <label className="block text-xs font-extrabold text-muted">Phone / WhatsApp
            <input className="input mt-1.5" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XX XXX XXX" />
          </label>
        </div>
        <button type="submit" className="btn btn-amber mt-5">Save changes</button>
        <p className="mt-3 text-[11px] font-bold text-muted">{AUTH.demoNotice}</p>
      </form>

      {/* Password change */}
      <form className="card p-6" onSubmit={savePassword}>
        <h2 className="flex items-center gap-2 font-display text-xl font-bold"><IcLock className="h-5 w-5 text-teal" /> Change password</h2>
        <p className="mt-1 text-xs font-bold text-muted">You must confirm your current password. The new one is re-hashed with a fresh salt.</p>
        {pwErr && <p className="animate-pop mt-3 rounded-lg border border-error/30 bg-error/5 px-3.5 py-2.5 text-[12.5px] font-extrabold text-error" role="alert">{pwErr}</p>}
        <div className="mt-4 grid gap-3.5">
          <label className="block text-xs font-extrabold text-muted">Current password
            <input type="password" className="input mt-1.5" value={curPw} onChange={(e) => setCurPw(e.target.value)} autoComplete="current-password" required />
          </label>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <label className="block text-xs font-extrabold text-muted">New password
              <input type="password" className="input mt-1.5" value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" required />
            </label>
            <label className="block text-xs font-extrabold text-muted">Confirm new password
              <input type="password" className="input mt-1.5" value={newPw2} onChange={(e) => setNewPw2(e.target.value)} autoComplete="new-password" required />
            </label>
          </div>
        </div>
        <button type="submit" disabled={pwBusy} className="btn btn-dark mt-5">
          {pwBusy ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
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

/* ---------- Store connections (ADMIN ONLY) ---------- */
function StoreConnections() {
  const { toast } = useStore();
  const saved = getBizSettings();
  const [wa, setWa] = useState(saved.whatsapp ?? "");
  const [pb, setPb] = useState(saved.paybill ?? "");
  const [note, setNote] = useState(saved.accountNote ?? "");
  const [, force] = useState(0);

  const liveNumber = whatsappDisplay();
  const active = liveNumber !== null;

  const save = () => {
    const cleanWa = wa.replace(/[^\d+]/g, "");
    if (wa && !/^\+?\d{10,15}$/.test(cleanWa)) {
      toast("WhatsApp number should be digits only, international format, e.g. 254712345678.", "error");
      return;
    }
    saveBizSettings({ whatsapp: cleanWa, paybill: pb.trim(), accountNote: note.trim() });
    force((n) => n + 1);
    toast("Saved. Every “Order via WhatsApp” button on the store now uses this number.");
  };

  const test = () => {
    const href = waHref("Hello! This is a test message from my Imara Tech store — WhatsApp ordering is connected. 🎉");
    if (href) window.open(href, "_blank", "noopener");
    else toast("No WhatsApp number configured yet — save one above first.", "info");
  };

  return (
    <div>
      <h2 className="font-display text-xl font-bold">Store connections</h2>
      <p className="mt-1 text-xs font-semibold text-muted">
        Where customer orders & payments land. Changes apply to the whole store instantly — no rebuild needed.
      </p>

      <div className="card mt-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-extrabold"><IcPlug className="h-4.5 w-4.5 text-teal" /> WhatsApp ordering</p>
          <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${active ? "bg-success/15 text-success" : "bg-error/10 text-error"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-success" : "bg-error"}`} />
            {active ? `Live · ${liveNumber}` : "Not configured"}
          </span>
        </div>
        <label className="mt-4 block text-xs font-extrabold text-muted">
          WhatsApp number (international format, digits only — e.g. 254712345678)
          <input className="input mt-1.5" value={wa} onChange={(e) => setWa(e.target.value)} placeholder="254712345678" inputMode="tel" />
        </label>
        <p className="mt-2 text-[11.5px] font-semibold leading-relaxed text-muted">
          Customers' “Order via WhatsApp” buttons (product page, cart, checkout) open a chat with this number,
          pre-filled with the product, price, quantity and product link.
        </p>

        <div className="mt-5 border-t border-line pt-5">
          <p className="text-sm font-extrabold">M-PESA PayBill</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-extrabold text-muted">
              PayBill number
              <input className="input mt-1.5" value={pb} onChange={(e) => setPb(e.target.value)} placeholder="e.g. 522123" inputMode="numeric" />
            </label>
            <label className="block text-xs font-extrabold text-muted">
              “Account Number” instruction
              <input className="input mt-1.5" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Your order reference number" />
            </label>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" className="btn btn-amber" onClick={save}>Save connections</button>
          <button type="button" className="btn btn-outline" onClick={test}>Send test WhatsApp message</button>
        </div>
        <p className="mt-3 rounded-lg bg-mist px-3 py-2 text-[11px] font-bold text-muted">
          Stored in this browser for the demo. When you connect the WordPress/WooCommerce backend, these move to
          the WooCommerce settings screen — the buttons keep working exactly the same.
        </p>
      </div>
    </div>
  );
}
