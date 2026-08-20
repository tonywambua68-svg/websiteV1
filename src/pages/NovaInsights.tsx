import { useMemo, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { useStore } from "../lib/store";
import { BUSINESS } from "../config";
import { byId, fmt, PRODUCTS } from "../data/products";
import {
  budgetHistogram, eventsInDays, funnel, objectionCounts, shippingDropoffs,
  topComparePairs, topProducts, topQueries, weeklyOrderTrend,
} from "../lib/nova/analytics";
import {
  generateOutreach, insightsSnapshot, SEGMENT_COLOURS, type SegmentName,
} from "../lib/nova/customerService";
import { adminAsk, getMarketingInsights, type AdminAnswer } from "../lib/nova/adminEngine";
import { getStockIntelligence, getMarketSignals } from "../lib/nova/intelligence";
import { Reveal } from "../components/ui";
import LiveActivityFeed from "../components/nova/LiveActivityFeed";
import SeoPanel from "../components/nova/SeoPanel";
import ContentStudio from "../components/nova/ContentStudio";
import IntegrationsPanel from "../components/nova/IntegrationsPanel";
import {
  IcArrowR, IcBolt, IcBox, IcCard, IcChat, IcGrid, IcPlug, IcSpark, IcTag, IcTruck, IcUser,
} from "../components/Icons";

const money = (n: number) => (n >= 1000 ? `KSh ${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : fmt(n));

type Tab = "overview" | "live" | "customers" | "marketing" | "seo" | "stock" | "content" | "connect";

const TABS: { id: Tab; label: string; icon: (p: { className?: string }) => React.ReactElement }[] = [
  { id: "overview", label: "Overview", icon: IcGrid },
  { id: "live", label: "Live activity", icon: IcBolt },
  { id: "customers", label: "Customers", icon: IcUser },
  { id: "marketing", label: "Marketing", icon: IcTag },
  { id: "seo", label: "SEO", icon: IcSpark },
  { id: "stock", label: "Stock", icon: IcBox },
  { id: "content", label: "Content", icon: IcChat },
  { id: "connect", label: "Connect", icon: IcPlug },
];

/** PRIVATE — admin-only customer intelligence + marketing assistant. */
export default function NovaInsights() {
  const { user, initializing } = useAuth();
  if (initializing) return null;
  if (!user) return <Navigate to="/auth?mode=login&redirect=%2Fnova-insights" replace />;
  if (user.role !== "admin") return <Navigate to="/account" replace />;
  return <InsightsBody />;
}

function InsightsBody() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="pb-4">
      {/* Header band */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="grid-lines pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal/20 blur-[110px]" />
        <div className="wrap relative py-8 md:py-10">
          <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-amber">
            <IcSpark className="h-4 w-4" /> NOVA · Private Business Intelligence
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight md:text-3xl">Command Center</h1>
          <p className="mt-1.5 max-w-xl text-[13px] font-semibold text-white/55">
            Admin-only. Built from this store's own behaviour data — never another customer's private records,
            never mixed into customer-facing answers, and never internal cost/margin data.
          </p>
        </div>
      </section>

      <div className="wrap grid gap-6 py-6 lg:grid-cols-[200px_1fr]">
        {/* Sidebar nav */}
        <nav className="h-fit lg:sticky lg:top-36" aria-label="Insights sections">
          <div className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[13px] font-extrabold transition ${
                    active ? "bg-ink text-amber shadow-md" : "text-muted hover:bg-card hover:text-ink"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-4.5 w-4.5" /> {t.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Active panel */}
        <div className="min-w-0">
          {tab === "overview" && <OverviewTab />}
          {tab === "live" && <LiveTab />}
          {tab === "customers" && <CustomersTab />}
          {tab === "marketing" && <MarketingTab />}
          {tab === "seo" && <SeoTab />}
          {tab === "stock" && <StockTab />}
          {tab === "content" && <Reveal><ContentStudio /></Reveal>}
          {tab === "connect" && <Reveal><IntegrationsPanel /></Reveal>}
        </div>
      </div>
    </div>
  );
}

/* ================= OVERVIEW ================= */
function OverviewTab() {
  const snap = useMemo(() => insightsSnapshot(), []);
  const d30 = useMemo(() => eventsInDays(30), []);
  const fun = useMemo(() => funnel(d30), [d30]);
  const hist = useMemo(() => budgetHistogram(d30), [d30]);
  const trend = useMemo(() => weeklyOrderTrend(d30, 8), [d30]);
  const queries = useMemo(() => topQueries(d30, 6), [d30]);
  const maxTrend = Math.max(...trend.map((t) => t.total), 1);

  return (
    <div className="space-y-5">
      <Reveal>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            { label: "Orders (90d)", value: String(snap.totalOrders) },
            { label: "Revenue (90d)", value: money(snap.totalRevenue) },
            { label: "Avg order value", value: money(snap.aov) },
            { label: "New customers", value: String(snap.newCustomers) },
            { label: "View→order conv", value: `${fun.convPct}%` },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <p className="font-display text-xl font-bold text-ink md:text-2xl">{s.value}</p>
              <p className="mt-0.5 text-[10.5px] font-extrabold uppercase tracking-wider text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-2">
        <Reveal>
          <Card title="Customer segments (RFM)" note="Thresholds configurable in customerService.ts">
            <div className="flex items-center gap-6">
              <Donut data={snap.segments.map((s) => ({ label: s.segment, value: s.count, colour: s.colour }))} />
              <ul className="flex-1 space-y-2">
                {snap.segments.map((s) => (
                  <li key={s.segment} className="flex items-center gap-2.5 text-[13px] font-bold">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: s.colour }} />
                    <span className="flex-1">{s.segment}</span>
                    <span className="text-muted">{s.count}</span>
                    <span className="font-display text-teal">{money(s.revenue)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </Reveal>

        <Reveal delay={60}>
          <Card title="Conversion funnel (30d)" note={`${fun.cartDropPct}% of carts drop before checkout`}>
            <div className="space-y-3">
              {[
                { label: "Product views", v: fun.views },
                { label: "Cart adds", v: fun.carts },
                { label: "Checkouts", v: fun.checkouts },
                { label: "Orders", v: fun.orders },
              ].map((f, i, arr) => {
                const pct = arr[0].v ? Math.round((f.v / arr[0].v) * 100) : 0;
                return (
                  <div key={f.label}>
                    <div className="mb-1 flex justify-between text-[12px] font-bold">
                      <span>{f.label}</span><span className="text-muted">{f.v} · {pct}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-line/60">
                      <div className="h-full rounded-full bg-gradient-to-r from-teal to-amber transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Reveal>

        <Reveal>
          <Card title="Customer budgets (30d)" note="Budgets customers volunteered in chat">
            <div className="space-y-2.5">
              {hist.map((h) => (
                <div key={h.label} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-[12px] font-bold">{h.label}</span>
                  <div className="h-5 flex-1 overflow-hidden rounded-md bg-line/50">
                    <div className="flex h-full items-center rounded-md bg-teal/80 pl-2 text-[10px] font-extrabold text-white transition-all duration-700" style={{ width: `${Math.max(h.pct, 4)}%` }}>
                      {h.pct > 12 ? `${h.count}` : ""}
                    </div>
                  </div>
                  <span className="w-10 shrink-0 text-right text-[12px] font-bold text-muted">{h.pct}%</span>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>

        <Reveal delay={60}>
          <Card title="Weekly orders (8 weeks)" note="Revenue per week">
            <div className="flex h-40 items-end gap-2">
              {trend.map((t) => (
                <div key={t.week} className="group flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-[9px] font-extrabold text-teal opacity-0 transition group-hover:opacity-100">{money(t.total)}</span>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-teal to-teal/60 transition-all duration-500 group-hover:to-amber"
                    style={{ height: `${Math.max((t.total / maxTrend) * 100, 3)}%` }}
                  />
                  <span className="text-[9px] font-bold text-muted">{t.week}</span>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>
      </div>

      <Reveal>
        <Card title="What customers ask" note="Most frequent questions & searches (30d)">
          <ul className="space-y-2">
            {queries.map((q) => (
              <li key={q.query} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2">
                <span className="flex-1 truncate text-[13px] font-bold">“{q.query}”</span>
                <span className="rounded-full bg-mint px-2 py-0.5 font-display text-[11px] font-bold text-teal">×{q.count}</span>
              </li>
            ))}
            {queries.length === 0 && <li className="text-[13px] font-semibold text-muted">No questions logged yet.</li>}
          </ul>
        </Card>
      </Reveal>
    </div>
  );
}

/* ================= LIVE ================= */
function LiveTab() {
  return (
    <div className="space-y-5">
      <Reveal><LiveActivityFeed limit={20} /></Reveal>
      <Reveal delay={60}>
        <p className="rounded-xl border border-line bg-card px-4 py-3 text-[12.5px] font-semibold leading-relaxed text-muted">
          This feed reads the same behaviour log that powers every recommendation — product views, searches,
          cart adds, checkouts, orders, abandons and NOVA conversations — as they happen on this device. In
          production it streams from the server event pipeline.
        </p>
      </Reveal>
    </div>
  );
}

/* ================= CUSTOMERS ================= */
function CustomersTab() {
  const snap = useMemo(() => insightsSnapshot(), []);
  const [selected, setSelected] = useState<SegmentName | null>(null);
  const customers = selected ? snap.records.filter((r) => r.segment === selected) : snap.records;

  return (
    <div className="space-y-5">
      <Reveal>
        <Card title="Segments — click to drill down" note="RFM: Recency · Frequency · Monetary">
          <div className="flex flex-wrap gap-2">
            {snap.segments.map((s) => (
              <button
                key={s.segment}
                type="button"
                onClick={() => setSelected(selected === s.segment ? null : s.segment)}
                className={`chip !text-[12px] ${selected === s.segment ? "chip-on" : ""}`}
                style={selected !== s.segment ? { borderColor: s.colour, color: s.colour } : undefined}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: s.colour }} />
                {s.segment} · {s.count}
              </button>
            ))}
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-line text-[10.5px] font-extrabold uppercase tracking-wider text-muted">
                  <th className="py-2 pr-3">Customer</th><th className="py-2 pr-3">Segment</th>
                  <th className="py-2 pr-3">Orders</th><th className="py-2 pr-3">Last order</th>
                  <th className="py-2 text-right">Lifetime</th>
                </tr>
              </thead>
              <tbody>
                {customers.slice(0, 12).map((c) => {
                  const seg = snap.segments.find((s) => s.segment === c.segment)!;
                  return (
                    <tr key={c.id} className="border-b border-line/60 font-semibold">
                      <td className="py-2 pr-3 font-extrabold">{c.id}</td>
                      <td className="py-2 pr-3"><span className="rounded-full px-2 py-0.5 text-[10.5px] font-extrabold" style={{ background: `${seg.colour}22`, color: seg.colour }}>{c.segment}</span></td>
                      <td className="py-2 pr-3">{c.frequency}</td>
                      <td className="py-2 pr-3 text-muted">{c.recencyDays}d ago</td>
                      <td className="py-2 text-right font-display font-bold text-teal">{money(c.monetary)}</td>
                    </tr>
                  );
                })}
                {customers.length === 0 && <tr><td colSpan={5} className="py-4 text-center font-semibold text-muted">No customers in this segment.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      </Reveal>

      <Reveal delay={60}>
        <Card title="Churn signals" note="Potentially at-risk — a signal, not a certainty">
          {snap.churn.length === 0 ? (
            <p className="text-[13px] font-semibold text-muted">No customers currently flag as at-risk.</p>
          ) : (
            <ul className="space-y-2">
              {snap.churn.map((c) => (
                <li key={c.customerId} className="rounded-lg border border-error/25 bg-error/5 px-3 py-2.5">
                  <p className="text-[13px] font-extrabold text-error">{c.customerId} · silent {c.daysInactive}d</p>
                  <p className="text-[12px] font-semibold text-muted">{c.previousFrequency} prior orders · lifetime {fmt(c.monetary)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </Reveal>

      <Reveal><Outreach /></Reveal>
    </div>
  );
}

/* ================= MARKETING ================= */
function MarketingTab() {
  const recs = useMemo(() => getMarketingInsights(), []);
  const signals = useMemo(() => getMarketSignals(), []);
  return (
    <div className="space-y-5">
      <Reveal>
        <section className="rounded-2xl border border-teal/30 bg-card p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <IcSpark className="h-5 w-5 text-amber" /> What to do next
          </h2>
          <p className="mt-1 text-[12.5px] font-semibold text-muted">Every recommendation cites the store data that produced it.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {recs.map((r) => (
              <article key={r.title} className="rounded-xl border border-line bg-mist/40 p-4 transition hover:border-teal/50 hover:shadow-md">
                <h3 className="font-display text-[14px] font-bold">{r.title}</h3>
                <p className="mt-1 text-[12.5px] font-semibold leading-relaxed text-muted"><b className="text-ink">Why:</b> {r.why}</p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {r.data.map((d) => <span key={d} className="rounded-full bg-mint px-2 py-0.5 text-[10.5px] font-extrabold text-teal">{d}</span>)}
                </div>
              </article>
            ))}
            {recs.length === 0 && <p className="text-[13px] font-semibold text-muted">Not enough data yet — recommendations appear as customers interact.</p>}
          </div>
        </section>
      </Reveal>

      <Reveal delay={60}>
        <Card title="Market intelligence" note="Labelled external context — never overrides your own store data">
          <ul className="space-y-2.5">
            {signals.map((s) => (
              <li key={s.label} className="rounded-lg border border-line px-3.5 py-3">
                <p className="text-[13px] font-extrabold">{s.label}</p>
                <p className="mt-0.5 text-[12.5px] font-semibold leading-relaxed text-muted">{s.detail}</p>
                <p className="mt-1 text-[10px] font-extrabold uppercase tracking-wider text-muted/70">{s.source}</p>
              </li>
            ))}
          </ul>
        </Card>
      </Reveal>

      <Reveal><AskNova /></Reveal>
    </div>
  );
}

/* ================= SEO ================= */
function SeoTab() {
  return <Reveal><SeoPanel /></Reveal>;
}

/* ================= STOCK ================= */
function StockTab() {
  const recs = useMemo(() => getStockIntelligence(), []);
  const kindMeta: Record<string, { label: string; colour: string }> = {
    restock: { label: "Restock", colour: "#d64545" },
    "add-range": { label: "Add range", colour: "#f5a31a" },
    promote: { label: "Promote", colour: "#0b7a63" },
    overstock: { label: "Clear", colour: "#5c716c" },
  };
  return (
    <div className="space-y-5">
      <Reveal>
        <Card title="Stock & merchandising signals" note="Data-driven: demand vs. supply, budget gaps, dead stock">
          <div className="space-y-3">
            {recs.map((r) => {
              const meta = kindMeta[r.kind];
              return (
                <div key={r.title} className="rounded-xl border border-line p-4 transition hover:border-teal/40 hover:shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white" style={{ background: meta.colour }}>{meta.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${r.priority === "high" ? "bg-error/10 text-error" : r.priority === "medium" ? "bg-amber/15 text-amberdeep" : "bg-mist text-muted"}`}>{r.priority}</span>
                    <h3 className="font-display text-[14px] font-bold">{r.title}</h3>
                  </div>
                  <p className="mt-1.5 text-[12.5px] font-semibold leading-relaxed text-muted"><b className="text-ink">Why:</b> {r.why}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.data.map((d) => <span key={d} className="rounded-full bg-mint px-2 py-0.5 text-[10.5px] font-extrabold text-teal">{d}</span>)}
                  </div>
                </div>
              );
            })}
            {recs.length === 0 && <p className="text-[13px] font-semibold text-muted">No urgent signals — demand and supply look balanced.</p>}
          </div>
        </Card>
      </Reveal>
      <Reveal delay={60}>
        <p className="flex items-start gap-2.5 rounded-xl border border-line bg-card px-4 py-3 text-[12.5px] font-semibold leading-relaxed text-muted">
          <IcTruck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-teal" />
          These are recommendations from your own behaviour data — NOVA never sees supplier costs or margins, so it optimises for demand and customer fit, not hidden pricing.
        </p>
      </Reveal>
    </div>
  );
}

/* ---------------- shared card ---------------- */
function Card({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="card h-full p-5">
      <h2 className="font-display text-[15px] font-bold">{title}</h2>
      {note && <p className="mt-0.5 text-[11.5px] font-semibold text-muted">{note}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

/* ---------------- donut ---------------- */
function Donut({ data }: { data: { label: string; value: number; colour: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const R = 42;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <svg viewBox="0 0 120 120" className="h-36 w-36 -rotate-90">
      <circle cx="60" cy="60" r={R} fill="none" stroke="var(--color-line)" strokeWidth="16" />
      {data.map((d) => {
        const frac = d.value / total;
        const dash = frac * C;
        const el = (
          <circle
            key={d.label} cx="60" cy="60" r={R} fill="none" stroke={d.colour} strokeWidth="16"
            strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={-offset}
            className="transition-all duration-700"
          />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
}

/* ---------------- Ask NOVA (admin Q&A) ---------------- */
function AskNova() {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<AdminAnswer | null>(null);
  const ask = (e: FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setAnswer(adminAsk(q));
    setQ("");
  };
  const chips = [
    "What should I advertise next?",
    "How's my SEO?",
    "What should I add to stock?",
    "Write me social content ideas",
    "Connect Zapier",
    "Which customers are at risk of churning?",
  ];
  return (
    <Card title="Ask NOVA" note="Natural-language business questions over your own data">
      <form className="flex gap-2" onSubmit={ask}>
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. What should I advertise this week?"
          className="input !h-11 flex-1"
        />
        <button type="submit" className="btn btn-teal !h-11" aria-label="Ask"><IcArrowR className="h-4.5 w-4.5" /></button>
      </form>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <button key={c} type="button" onClick={() => { setQ(c); setAnswer(adminAsk(c)); }} className="chip !text-[11px]">{c}</button>
        ))}
      </div>
      {answer && (
        <div className="animate-pop mt-4 whitespace-pre-line rounded-xl border border-teal/30 bg-mint/40 p-4 text-[13px] font-semibold leading-relaxed text-ink/85">
          {answer.text}
        </div>
      )}
    </Card>
  );
}

/* ---------------- outreach drafts ---------------- */
function Outreach() {
  const { toast } = useStore();
  const [segment, setSegment] = useState<SegmentName>("VIP");
  const [productId, setProductId] = useState(PRODUCTS[0].id);
  const [draft, setDraft] = useState<string | null>(null);
  const product = byId(productId);

  const generate = () => {
    const d = generateOutreach({
      segment,
      productName: product?.name,
      productPrice: product ? fmt(product.price) : undefined,
      businessName: BUSINESS.name,
    });
    setDraft(d.body);
  };
  const copy = async () => {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft);
      toast("Draft copied — review it, then send via your own WhatsApp/email.");
    } catch {
      toast("Couldn't access the clipboard — select and copy the text manually.", "info");
    }
  };

  return (
    <Card title="Personalised outreach" note="Drafts only — NOVA never sends anything. Review before sending.">
      <div className="grid grid-cols-2 gap-2">
        <label className="block text-xs font-extrabold text-muted">Segment
          <select className="input mt-1.5" value={segment} onChange={(e) => setSegment(e.target.value as SegmentName)}>
            {(["VIP", "Loyal", "New", "Regular", "At-Risk"] as SegmentName[]).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-extrabold text-muted">Product to feature
          <select className="input mt-1.5" value={productId} onChange={(e) => setProductId(e.target.value)}>
            {PRODUCTS.slice(0, 20).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
      </div>
      <button type="button" className="btn btn-amber mt-3 w-full" onClick={generate}>Generate draft message</button>
      {draft && (
        <div className="animate-pop mt-3">
          <pre className="max-h-52 overflow-y-auto whitespace-pre-wrap rounded-xl border border-line bg-mist/50 p-4 font-body text-[12.5px] font-semibold leading-relaxed text-ink/85">{draft}</pre>
          <button type="button" className="btn btn-outline btn-sm mt-2.5 w-full" onClick={copy}>Copy draft</button>
        </div>
      )}
    </Card>
  );
}
