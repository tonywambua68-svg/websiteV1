import { useMemo, useState } from "react";
import { PRODUCTS, type Product } from "../../data/products";
import { generateContent, weeklyCalendar, type Channel } from "../../lib/nova/contentStudio";
import { useStore } from "../../lib/store";

const CHANNELS: { id: Channel; label: string }[] = [
  { id: "tiktok", label: "TikTok" },
  { id: "instagram", label: "Instagram" },
  { id: "x", label: "X (Twitter)" },
  { id: "whatsapp", label: "WhatsApp" },
];
const ANGLES: { id: "deal" | "specs" | "lifestyle"; label: string }[] = [
  { id: "deal", label: "Deal / price" },
  { id: "specs", label: "Specs" },
  { id: "lifestyle", label: "Lifestyle" },
];

/** Social content generator — real specs & price, copy-ready, with hashtags. */
export default function ContentStudio() {
  const { toast } = useStore();
  const [productId, setProductId] = useState(PRODUCTS[0].id);
  const [channel, setChannel] = useState<Channel>("tiktok");
  const [angle, setAngle] = useState<"deal" | "specs" | "lifestyle">("deal");

  const product = useMemo(() => PRODUCTS.find((p) => p.id === productId)!, [productId]);
  const piece = useMemo(() => generateContent(product, channel, angle), [product, channel, angle]);
  const calendar = useMemo(() => weeklyCalendar(PRODUCTS.filter((p) => p.stock > 0)), []);

  const copy = (text: string, what: string) => {
    void navigator.clipboard?.writeText(text).then(
      () => toast(`${what} copied — paste it into ${channel === "x" ? "X" : channel}.`),
      () => toast("Couldn't access the clipboard on this browser.", "error"),
    );
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      {/* Controls */}
      <div className="space-y-4">
        <div className="rounded-xl border border-line bg-card p-4">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted">Product</p>
          <select className="input mt-2 !h-10 !text-[13px]" value={productId} onChange={(e) => setProductId(e.target.value)} aria-label="Choose product">
            {PRODUCTS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <p className="mt-4 text-[11px] font-extrabold uppercase tracking-wider text-muted">Channel</p>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {CHANNELS.map((c) => (
              <button key={c.id} type="button" onClick={() => setChannel(c.id)}
                className={`rounded-lg border px-2.5 py-2 text-[12px] font-extrabold transition ${channel === c.id ? "border-ink bg-ink text-amber" : "border-line text-muted hover:border-ink/40"}`}>
                {c.label}
              </button>
            ))}
          </div>
          <p className="mt-4 text-[11px] font-extrabold uppercase tracking-wider text-muted">Angle</p>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {ANGLES.map((a) => (
              <button key={a.id} type="button" onClick={() => setAngle(a.id)}
                className={`rounded-lg border px-2 py-2 text-[11.5px] font-extrabold transition ${angle === a.id ? "border-teal bg-mint text-teal" : "border-line text-muted hover:border-teal/40"}`}>
                {a.label}
              </button>
            ))}
          </div>
          <p className="mt-4 rounded-lg bg-mist p-2.5 text-[11px] font-bold leading-relaxed text-muted">
            Built from the real spec sheet & listed price — NOVA never invents specs or discounts.
          </p>
        </div>
      </div>

      {/* Output */}
      <div className="space-y-4">
        <div className="rounded-xl border border-line bg-card">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-[13px] font-extrabold">{piece.title} · <span className="text-teal">{CHANNELS.find((c) => c.id === channel)?.label}</span></p>
            <button type="button" onClick={() => copy(piece.body, "Caption")} className="btn btn-teal btn-sm">Copy</button>
          </div>
          <pre className="whitespace-pre-wrap px-4 py-4 font-body text-[13px] font-semibold leading-relaxed text-ink/85">{piece.body}</pre>
          {piece.hashtags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 border-t border-line px-4 py-3">
              {piece.hashtags.map((h) => (
                <button key={h} type="button" onClick={() => copy(h, "Hashtag")} className="chip !text-[11px] text-teal hover:bg-mint">{h}</button>
              ))}
            </div>
          )}
          <p className="border-t border-line px-4 py-2.5 text-[11px] font-bold text-muted">Best time to post: <span className="text-ink">{piece.bestTime}</span></p>
        </div>

        {/* 7-day calendar */}
        <div className="rounded-xl border border-line bg-card">
          <p className="border-b border-line px-4 py-3 text-[13px] font-extrabold">7-day content calendar</p>
          <ul className="divide-y divide-line/70">
            {calendar.map((d) => (
              <li key={d.day} className="flex items-center gap-3 px-4 py-2.5 text-[12.5px] font-semibold">
                <span className="grid h-8 w-12 shrink-0 place-items-center rounded-lg bg-ink font-display text-[11px] font-bold text-amber">{d.day}</span>
                <span className="min-w-0 flex-1 truncate text-ink/85">{d.idea}</span>
                <span className="shrink-0 rounded-md bg-mint px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-teal">{d.channel}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
