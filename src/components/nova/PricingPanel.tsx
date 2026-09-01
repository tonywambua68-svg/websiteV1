import { useMemo, useState } from "react";
import { CATEGORIES, type CategoryId } from "../../data/products";
import { fmtKes } from "../../lib/importer/pricing";
import { useImporter } from "../../lib/importer/store";
import type { ImportedProduct, PricingMethod } from "../../lib/importer/types";
import { useStore } from "../../lib/store";
import { IcBox, IcCheck, IcChevD, IcTag, IcTruck, IcX } from "../Icons";

const METHOD_LABEL: Record<PricingMethod, string> = {
  "category-rule": "Category rule",
  fixed: "Fixed markup",
  percent: "% markup",
  custom: "Custom price",
};

const STATUS_TONE: Record<ImportedProduct["status"], string> = {
  imported: "bg-mist text-muted",
  review: "bg-amber/15 text-amberdeep",
  approved: "bg-mint text-teal",
  published: "bg-success/15 text-success",
  rejected: "bg-error/10 text-error",
};

/** ADMIN-ONLY business pricing suite. Supplier costs & margins never leave this screen. */
export default function PricingPanel() {
  const { toast } = useStore();
  const imp = useImporter();
  const { items, rules, settings, priceOf, reprice, setRule, setSettings } = imp;
  const [expanded, setExpanded] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | ImportedProduct["status"]>("all");

  const rows = useMemo(() => {
    const list = statusFilter === "all" ? items : items.filter((i) => i.status === statusFilter);
    return list.map((it) => ({ it, p: priceOf(it) }));
  }, [items, statusFilter, priceOf]);

  const totals = useMemo(() => {
    const all = items.map((it) => priceOf(it));
    const net = all.reduce((s, p) => s + p.netProfitKes, 0);
    const avg = all.length ? Math.round(all.reduce((s, p) => s + p.netMarginPct, 0) / all.length) : 0;
    return { count: items.length, net, avg };
  }, [items, priceOf]);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-line p-10 text-center">
        <IcTag className="mx-auto h-10 w-10 text-muted" />
        <p className="mt-3 font-display text-lg font-bold">No imported products yet</p>
        <p className="mt-1.5 text-sm font-semibold text-muted">
          Import products from the Product Importer (AliExpress / Alibaba / CSV). Their supplier costs land
          here, where you set a pricing method per product and the engine works out your selling price and profit.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ---- Stats strip ---- */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Products" value={String(totals.count)} icon={IcBox} />
        <Stat label="Avg net margin" value={`${totals.avg}%`} icon={IcTag} />
        <Stat label="Projected net profit" value={fmtKes(totals.net)} icon={IcTruck} accent />
      </div>

      {/* ---- Category pricing rules ---- */}
      <section>
        <header className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-bold">Category pricing rules</h3>
            <p className="text-xs font-semibold text-muted">
              Applied automatically when a product's method is "Category rule". Any product can override its rule.
            </p>
          </div>
        </header>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => {
            const rule = rules.find((r) => r.categoryId === c.id);
            return <RuleEditor key={c.id} cat={c.id} name={c.name} rule={rule ?? null} onSave={setRule} toast={toast} />;
          })}
        </div>
      </section>

      {/* ---- Pricing ledger ---- */}
      <section>
        <header className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-bold">Pricing ledger</h3>
            <p className="text-xs font-semibold text-muted">Click a row to edit its pricing method, costs and price. Customers only ever see the selling price.</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["all", "imported", "review", "approved", "published", "rejected"] as const).map((s) => (
              <button key={s} type="button" onClick={() => setStatusFilter(s)}
                className={`rounded-full border px-3 py-1 text-[11px] font-extrabold capitalize transition ${statusFilter === s ? "border-ink bg-ink text-amber" : "border-line text-muted hover:border-ink/40"}`}>
                {s}
              </button>
            ))}
          </div>
        </header>

        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[980px] border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-line bg-mist/60 text-left text-[10.5px] font-extrabold uppercase tracking-wider text-muted">
                <th className="p-3">Product</th>
                <th className="p-3">Source / Supplier</th>
                <th className="p-3 text-right">Supplier cost</th>
                <th className="p-3">Method</th>
                <th className="p-3 text-right">Markup</th>
                <th className="p-3 text-right">Selling price</th>
                <th className="p-3 text-right">Delivery</th>
                <th className="p-3 text-right">Other costs</th>
                <th className="p-3 text-right">Gross</th>
                <th className="p-3 text-right">Net</th>
                <th className="p-3 text-right">Profit %</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ it, p }) => (
                <LedgerRow
                  key={it.id}
                  it={it}
                  p={p}
                  open={expanded === it.id}
                  onToggle={() => setExpanded(expanded === it.id ? null : it.id)}
                  onSave={(patch) => { reprice(it.id, patch); toast(`Repriced "${it.name}" → ${fmtKes(priceOf({ ...it, ...patch }).sellingPriceKes)}`); }}
                />
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={13} className="p-8 text-center text-sm font-semibold text-muted">No products with this status.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---- Global defaults ---- */}
      <section className="rounded-2xl border border-line p-5">
        <h3 className="font-display text-lg font-bold">Global defaults</h3>
        <p className="text-xs font-semibold text-muted">Exchange rates and default per-unit costs applied to new imports.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <NumField label="USD → KSh" value={settings.usdToKes} step={0.1} onCommit={(v) => setSettings({ ...settings, usdToKes: v })} />
          <NumField label="CNY → KSh" value={settings.cnyToKes} step={0.1} onCommit={(v) => setSettings({ ...settings, cnyToKes: v })} />
          <NumField label="Default delivery (KSh)" value={settings.defaultShippingKes} step={50} onCommit={(v) => setSettings({ ...settings, defaultShippingKes: v })} />
          <NumField label="Default payment fees (KSh)" value={settings.defaultPaymentFeesKes} step={10} onCommit={(v) => setSettings({ ...settings, defaultPaymentFeesKes: v })} />
          <NumField label="Default ad cost (KSh)" value={settings.defaultAdCostKes} step={10} onCommit={(v) => setSettings({ ...settings, defaultAdCostKes: v })} />
          <NumField label="Default other costs (KSh)" value={settings.defaultOtherCostsKes} step={10} onCommit={(v) => setSettings({ ...settings, defaultOtherCostsKes: v })} />
          <NumField label="Fallback markup %" value={settings.defaultMarkupPct} step={1} onCommit={(v) => setSettings({ ...settings, defaultMarkupPct: v })} />
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-muted">
            Rounding
            <select className="input mt-1.5 !h-10 !text-[13px]" value={settings.roundTo}
              onChange={(e) => setSettings({ ...settings, roundTo: Number(e.target.value) as typeof settings.roundTo })}>
              <option value={50}>…50</option><option value={100}>…100</option>
              <option value={500}>…500</option><option value={999}>…999</option>
            </select>
          </label>
        </div>
      </section>
    </div>
  );
}

/* ---------------- building blocks ---------------- */

function Stat({ label, value, icon: Icon, accent }: { label: string; value: string; icon: (p: { className?: string }) => React.ReactElement; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? "border-amber/40 bg-amber/10" : "border-line bg-card"}`}>
      <Icon className={`h-5 w-5 ${accent ? "text-amberdeep" : "text-teal"}`} />
      <p className="mt-2 font-display text-xl font-bold tracking-tight">{value}</p>
      <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-muted">{label}</p>
    </div>
  );
}

function RuleEditor({ cat, name, rule, onSave, toast }: {
  cat: CategoryId; name: string; rule: { method: "fixed" | "percent"; value: number } | null;
  onSave: (c: CategoryId, m: "fixed" | "percent", v: number) => void;
  toast: (m: string, k?: "success" | "info" | "error") => void;
}) {
  const [method, setMethod] = useState<"fixed" | "percent">(rule?.method ?? "percent");
  const [value, setValue] = useState(String(rule?.value ?? 20));
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-line bg-card p-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-mint font-display text-[11px] font-bold uppercase text-teal">{name.slice(0, 2)}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-extrabold">{name}</p>
        <div className="mt-1 flex items-center gap-1.5">
          <select className="input !h-8 !w-auto !px-2 !text-[11.5px]" value={method} onChange={(e) => setMethod(e.target.value as "fixed" | "percent")}>
            <option value="percent">% markup</option>
            <option value="fixed">Fixed KSh</option>
          </select>
          <input className="input !h-8 !w-20 !px-2 !text-[11.5px]" inputMode="decimal" value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^\d.]/g, ""))} />
          <button type="button" onClick={() => { onSave(cat, method, Number(value) || 0); toast(`${name} rule → ${method === "fixed" ? fmtKes(Number(value) || 0) : `${value}%`}`); }}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-teal text-white transition hover:bg-tealdeep" aria-label={`Save ${name} rule`}>
            <IcCheck className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function NumField({ label, value, step, onCommit }: { label: string; value: number; step: number; onCommit: (v: number) => void }) {
  const [v, setV] = useState(String(value));
  return (
    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-muted">
      {label}
      <input className="input mt-1.5 !h-10 !text-[13px]" inputMode="decimal" value={v} step={step}
        onChange={(e) => setV(e.target.value.replace(/[^\d.]/g, ""))}
        onBlur={() => { const n = Number(v) || 0; setV(String(n)); if (n !== value) onCommit(n); }} />
    </label>
  );
}

function LedgerRow({ it, p, open, onToggle, onSave }: {
  it: ImportedProduct;
  p: ReturnType<ReturnType<typeof useImporter>["priceOf"]>;
  open: boolean;
  onToggle: () => void;
  onSave: (patch: Partial<ImportedProduct>) => void;
}) {
  const catName = CATEGORIES.find((c) => c.id === it.storeCategory)?.name ?? "Unmapped";
  const netTone = p.netProfitKes >= 0 ? "text-success" : "text-error";
  return (
    <>
      <tr className={`cursor-pointer border-b border-line/70 transition hover:bg-mist/40 ${open ? "bg-mist/50" : ""}`} onClick={onToggle}>
        <td className="p-3">
          <p className="font-extrabold leading-snug">{it.name}</p>
          <p className="text-[10.5px] font-bold text-muted">{it.brand} · {catName} · MOQ {it.moq}</p>
        </td>
        <td className="p-3">
          <p className="font-bold">{it.seller ?? it.source}</p>
          <p className="text-[10.5px] font-semibold text-muted">{it.sourceProductId}</p>
        </td>
        <td className="p-3 text-right font-bold tabular-nums">{fmtKes(p.supplierCostKes)}</td>
        <td className="p-3"><span className="rounded-md bg-mist px-2 py-0.5 text-[10.5px] font-extrabold">{METHOD_LABEL[it.pricingMethod]}</span></td>
        <td className="p-3 text-right font-bold tabular-nums">{fmtKes(p.markupKes)}</td>
        <td className="p-3 text-right font-display font-bold tabular-nums text-ink">{fmtKes(p.sellingPriceKes)}</td>
        <td className="p-3 text-right tabular-nums text-muted">{fmtKes(it.deliveryCostKes)}</td>
        <td className="p-3 text-right tabular-nums text-muted">{fmtKes(it.paymentFeesKes + it.adCostKes + it.otherCostsKes)}</td>
        <td className="p-3 text-right font-bold tabular-nums">{fmtKes(p.grossProfitKes)}</td>
        <td className={`p-3 text-right font-bold tabular-nums ${netTone}`}>{fmtKes(p.netProfitKes)}</td>
        <td className={`p-3 text-right font-bold tabular-nums ${netTone}`}>{p.netMarginPct}%</td>
        <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${STATUS_TONE[it.status]}`}>{it.status}</span></td>
        <td className="p-3"><IcChevD className={`h-4 w-4 text-muted transition-transform ${open ? "rotate-180" : ""}`} /></td>
      </tr>
      {open && <EditRow it={it} p={p} onSave={onSave} />}
    </>
  );
}

function EditRow({ it, p, onSave }: {
  it: ImportedProduct;
  p: ReturnType<ReturnType<typeof useImporter>["priceOf"]>;
  onSave: (patch: Partial<ImportedProduct>) => void;
}) {
  const [method, setMethod] = useState<PricingMethod>(it.pricingMethod);
  const [fixed, setFixed] = useState(String(it.fixedMarkupKes));
  const [pct, setPct] = useState(String(it.markupPct));
  const [custom, setCustom] = useState(String(it.customPriceKes || it.sellingPriceKes));
  const [delivery, setDelivery] = useState(String(it.deliveryCostKes));
  const [fees, setFees] = useState(String(it.paymentFeesKes));
  const [ads, setAds] = useState(String(it.adCostKes));
  const [other, setOther] = useState(String(it.otherCostsKes));

  const num = (s: string) => Number(s) || 0;
  const preview = {
    supplierCostKes: it.supplierPrice * it.exchangeRate,
    pricingMethod: method,
    fixedMarkupKes: num(fixed),
    markupPct: num(pct),
    customPriceKes: num(custom),
    deliveryCostKes: num(delivery),
    paymentFeesKes: num(fees),
    adCostKes: num(ads),
    otherCostsKes: num(other),
  };

  return (
    <tr className="border-b border-line bg-mint/25">
      <td colSpan={13} className="p-4">
        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-muted">
              Pricing method
              <select className="input mt-1.5 !h-9 !text-[12.5px]" value={method} onChange={(e) => setMethod(e.target.value as PricingMethod)}>
                <option value="category-rule">Category rule</option>
                <option value="fixed">Fixed markup (KSh)</option>
                <option value="percent">% markup</option>
                <option value="custom">Custom selling price</option>
              </select>
            </label>
            {method === "fixed" && <In label="Markup (KSh)" v={fixed} set={setFixed} />}
            {method === "percent" && <In label="Markup %" v={pct} set={setPct} />}
            {method === "custom" && <In label="Selling price (KSh)" v={custom} set={setCustom} />}
            {method === "category-rule" && (
              <p className="self-end rounded-lg bg-card px-3 py-2 text-[11px] font-bold text-muted">
                Inherits the <b className="text-teal">{CATEGORIES.find((c) => c.id === it.storeCategory)?.name ?? "category"}</b> rule set above.
              </p>
            )}
            <In label="Delivery (KSh)" v={delivery} set={setDelivery} />
            <In label="Payment fees (KSh)" v={fees} set={setFees} />
            <In label="Ad cost (KSh)" v={ads} set={setAds} />
            <In label="Other costs (KSh)" v={other} set={setOther} />
          </div>

          <div className="rounded-xl border border-line bg-card p-4">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted">Live preview</p>
            <dl className="mt-2 space-y-1.5 text-[12.5px] font-semibold">
              <div className="flex justify-between"><dt className="text-muted">Supplier cost</dt><dd className="tabular-nums">{fmtKes(preview.supplierCostKes)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Selling price</dt><dd className="font-display font-bold tabular-nums text-ink">{fmtKes(p.sellingPriceKes)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Gross profit</dt><dd className="tabular-nums">{fmtKes(p.grossProfitKes)} ({p.grossMarginPct}%)</dd></div>
              <div className="flex justify-between border-t border-line pt-1.5"><dt className="text-muted">Net profit</dt><dd className={`font-bold tabular-nums ${p.netProfitKes >= 0 ? "text-success" : "text-error"}`}>{fmtKes(p.netProfitKes)} ({p.netMarginPct}%)</dd></div>
            </dl>
            <div className="mt-3 flex gap-2">
              <button type="button" className="btn btn-amber btn-sm flex-1" onClick={() => onSave({
                pricingMethod: method, fixedMarkupKes: num(fixed), markupPct: num(pct), customPriceKes: num(custom),
                deliveryCostKes: num(delivery), paymentFeesKes: num(fees), adCostKes: num(ads), otherCostsKes: num(other),
              })}>
                <IcCheck className="h-4 w-4" /> Apply pricing
              </button>
            </div>
            <p className="mt-2 text-[10px] font-bold leading-relaxed text-muted">
              Only the selling price is published to customers. Costs and margins stay private to this dashboard.
            </p>
          </div>
        </div>
      </td>
    </tr>
  );
}

function In({ label, v, set }: { label: string; v: string; set: (s: string) => void }) {
  return (
    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-muted">
      {label}
      <input className="input mt-1.5 !h-9 !text-[12.5px]" inputMode="decimal" value={v} onChange={(e) => set(e.target.value.replace(/[^\d.]/g, ""))} />
    </label>
  );
}
