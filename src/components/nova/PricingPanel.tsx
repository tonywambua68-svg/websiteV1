import { useMemo, useState } from "react";
import { fmt, type CategoryId } from "../../data/products";
import {
  calculatePrice, entryMargin, loadPriceBook, marketMedian, priceBookStats, priceVerdict,
  psychologicalPrice, removePriceBookEntry, savePriceBookEntry, type PricingMode,
} from "../../lib/nova/reseller";
import { useStore } from "../../lib/store";

const MODES: { id: PricingMode; label: string; suffix: string }[] = [
  { id: "markup", label: "Markup on cost", suffix: "%" },
  { id: "profit", label: "Fixed profit / unit", suffix: "KSh" },
  { id: "margin", label: "Target margin", suffix: "%" },
];

/** ADMIN-ONLY reseller pricing brain. Buying prices never leave this screen. */
export default function PricingPanel() {
  const { toast } = useStore();
  const [buy, setBuy] = useState("28000");
  const [units, setUnits] = useState("1");
  const [extra, setExtra] = useState("1500");
  const [mode, setMode] = useState<PricingMode>("markup");
  const [value, setValue] = useState("25");
  const [category, setCategory] = useState<CategoryId | "">("laptops");
  const [name, setName] = useState("");
  const [book, setBook] = useState(loadPriceBook);

  const result = useMemo(
    () => calculatePrice({
      buyPrice: Number(buy) || 0,
      units: Number(units) || 1,
      extraCosts: Number(extra) || 0,
      mode,
      value: Number(value) || 0,
    }),
    [buy, units, extra, mode, value],
  );
  const verdict = useMemo(
    () => priceVerdict(result.sellPrice, category || undefined),
    [result.sellPrice, category],
  );
  const median = useMemo(() => marketMedian(category || undefined), [category]);
  const stats = useMemo(() => priceBookStats(book), [book]);

  const save = () => {
    const label = name.trim() || "Untitled item";
    if (savePriceBookEntry({ name: label, buyPrice: result.unitCost, sellPrice: result.sellPrice, note: MODES.find((m) => m.id === mode)?.label })) {
      setBook(loadPriceBook());
      setName("");
      toast(`Saved “${label}” to your price book — margin ${result.marginPct.toFixed(1)}%.`);
    } else {
      toast("Couldn't save — admin session not detected.", "error");
    }
  };

  const num = (v: string, set: (s: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const s = e.target.value.replace(/[^\d]/g, "");
    set(s);
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[400px_1fr]">
      {/* Calculator */}
      <div className="rounded-2xl border border-ink bg-ink p-5 text-white">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-amber">Reseller calculator</p>
        <p className="mt-1 text-[12px] font-semibold text-white/55">Buying price in → selling price out. Internal only.</p>

        <div className="mt-4 grid grid-cols-3 gap-2.5">
          <label className="block text-[10.5px] font-extrabold uppercase tracking-wider text-white/50">Buy / unit
            <input className="input mt-1.5 !h-10 !border-white/15 !bg-white/5 !text-white" inputMode="numeric" value={buy} onChange={num(buy, setBuy)} placeholder="28000" />
          </label>
          <label className="block text-[10.5px] font-extrabold uppercase tracking-wider text-white/50">Units
            <input className="input mt-1.5 !h-10 !border-white/15 !bg-white/5 !text-white" inputMode="numeric" value={units} onChange={num(units, setUnits)} placeholder="1" />
          </label>
          <label className="block text-[10.5px] font-extrabold uppercase tracking-wider text-white/50">Extra costs
            <input className="input mt-1.5 !h-10 !border-white/15 !bg-white/5 !text-white" inputMode="numeric" value={extra} onChange={num(extra, setExtra)} placeholder="shipping…" />
          </label>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {MODES.map((m) => (
            <button key={m.id} type="button" onClick={() => setMode(m.id)}
              className={`rounded-lg border px-2 py-2 text-[11px] font-extrabold transition ${mode === m.id ? "border-amber bg-amber text-ink" : "border-white/15 text-white/60 hover:border-amber/50"}`}>
              {m.label}
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-[1fr_130px] gap-2.5">
          <label className="block text-[10.5px] font-extrabold uppercase tracking-wider text-white/50">{MODES.find((m) => m.id === mode)?.label}
            <div className="relative mt-1.5">
              <input className="input !h-10 !border-white/15 !bg-white/5 !pr-12 !text-white" inputMode="numeric" value={value} onChange={num(value, setValue)} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-extrabold text-amber">{MODES.find((m) => m.id === mode)?.suffix}</span>
            </div>
          </label>
          <label className="block text-[10.5px] font-extrabold uppercase tracking-wider text-white/50">Market
            <select className="input mt-1.5 !h-10 !border-white/15 !bg-white/5 !text-white" value={category} onChange={(e) => setCategory(e.target.value as CategoryId | "")}>
              <option value="">All store</option>
              {["laptops", "phones", "tablets", "gaming", "audio", "monitors", "networking", "accessories", "smart"].map((c) => (
                <option key={c} value={c} className="text-ink">{c}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Result */}
        <div className="mt-5 rounded-xl border border-amber/30 bg-amber/10 p-4">
          <p className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] text-white/50">Recommended selling price</p>
          <p className="mt-1 font-display text-4xl font-bold tracking-tight text-amber">{fmt(result.sellPrice)}</p>
          <p className="mt-0.5 text-[11px] font-bold text-white/45">rounded from {fmt(Math.round(result.rawPrice))} · unit cost {fmt(Math.round(result.unitCost))}</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              { l: "Profit / unit", v: fmt(Math.round(result.profitPerUnit)) },
              { l: "Gross margin", v: `${result.marginPct.toFixed(1)}%` },
              { l: "ROI on cost", v: `${result.roiPct.toFixed(0)}%` },
            ].map((x) => (
              <div key={x.l} className="rounded-lg bg-ink/50 px-1 py-2">
                <p className="font-display text-[15px] font-bold text-white">{x.v}</p>
                <p className="text-[9.5px] font-extrabold uppercase tracking-wider text-white/45">{x.l}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12px] font-bold leading-relaxed text-white/70">{fmt(result.totalProfit)} total profit on {units || 1} unit(s).</p>
        </div>

        <p className={`mt-3 rounded-xl px-4 py-3 text-[12.5px] font-bold leading-relaxed ${
          verdict.tone === "hot" ? "bg-[#f5a31a]/15 text-amber" : verdict.tone === "warn" ? "bg-[#d64545]/15 text-[#ff9d9d]" : "bg-[#1b9e4b]/15 text-[#8ef0b6]"
        }`}>
          NOVA vs market{median ? ` (median ${fmt(median)})` : ""}: {verdict.text}
        </p>

        <div className="mt-3 flex gap-2">
          <input className="input !h-11 !border-white/15 !bg-white/5 !text-white" placeholder="Name this item (e.g. AeroBook 14 batch #2)" value={name} onChange={(e) => setName(e.target.value)} />
          <button type="button" onClick={save} className="btn btn-amber shrink-0">Save</button>
        </div>
      </div>

      {/* Price book */}
      <div className="flex flex-col rounded-2xl border border-line bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
          <div>
            <h3 className="font-display text-[15px] font-bold">Your price book</h3>
            <p className="text-[11.5px] font-semibold text-muted">Internal ledger — never visible to customers or the customer AI.</p>
          </div>
          <div className="flex gap-2">
            <span className="rounded-lg bg-mist px-3 py-1.5 text-[11px] font-extrabold">{stats.count} items</span>
            <span className="rounded-lg bg-mint px-3 py-1.5 text-[11px] font-extrabold text-teal">avg margin {stats.avgMargin.toFixed(1)}%</span>
            <span className="rounded-lg bg-amber/15 px-3 py-1.5 text-[11px] font-extrabold text-amberdeep">potential {fmt(Math.round(stats.totalPotential))}</span>
          </div>
        </div>

        {book.length === 0 ? (
          <p className="flex-1 px-5 py-10 text-center text-[13px] font-semibold text-muted">
            Nothing saved yet. Price an item on the left and hit <b>Save</b> — your whole margin picture builds up here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-line text-[10.5px] font-extrabold uppercase tracking-wider text-muted">
                  <th className="px-5 py-2.5">Item</th>
                  <th className="px-3 py-2.5 text-right">Buy</th>
                  <th className="px-3 py-2.5 text-right">Sell</th>
                  <th className="px-3 py-2.5 text-right">Profit</th>
                  <th className="px-3 py-2.5 text-right">Margin</th>
                  <th className="px-5 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {book.map((e) => {
                  const m = entryMargin(e);
                  return (
                    <tr key={e.id} className="border-b border-line/60 font-semibold transition hover:bg-mist/50">
                      <td className="px-5 py-3 font-extrabold">{e.name}<span className="ml-2 text-[10.5px] font-bold text-muted">{e.note}</span></td>
                      <td className="px-3 py-3 text-right">{fmt(e.buyPrice)}</td>
                      <td className="px-3 py-3 text-right font-extrabold">{fmt(e.sellPrice)}</td>
                      <td className="px-3 py-3 text-right text-teal">{fmt(e.sellPrice - e.buyPrice)}</td>
                      <td className="px-3 py-3 text-right">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${m < 15 ? "bg-error/10 text-error" : m > 35 ? "bg-success/10 text-success" : "bg-mint text-teal"}`}>{m.toFixed(1)}%</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button type="button" className="text-[11px] font-extrabold text-muted transition hover:text-error"
                          onClick={() => { removePriceBookEntry(e.id); setBook(loadPriceBook()); toast("Removed from price book.", "info"); }}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="border-t border-line px-5 py-3 text-[11px] font-bold text-muted">
          {stats.thin > 0 ? <span className="text-warning">⚠ {stats.thin} item(s) sit under a 15% margin — thin for electronics after delivery & warranty risk.</span> : "Margins look healthy. Revisit when supplier prices or exchange rates move."}
        </p>
      </div>
    </div>
  );
}
