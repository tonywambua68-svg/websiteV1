import { useEffect, useMemo, useRef, useState } from "react";
import { byId } from "../../data/products";
import { eventsInDays, type BehaviorEvent, type EventKind } from "../../lib/nova/analytics";

const KIND_META: Record<EventKind, { label: string; colour: string }> = {
  view: { label: "Viewed", colour: "#0b7a63" },
  compare: { label: "Compared", colour: "#0369a1" },
  cart_add: { label: "Added to cart", colour: "#f5a31a" },
  checkout: { label: "Started checkout", colour: "#8a5a06" },
  order: { label: "Ordered", colour: "#1b9e4b" },
  abandon: { label: "Abandoned", colour: "#d64545" },
  conversation: { label: "Asked NOVA", colour: "#7c3aed" },
  search: { label: "Searched", colour: "#5c716c" },
};

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function describe(e: BehaviorEvent): string {
  const p = e.productId ? byId(e.productId)?.name : undefined;
  switch (e.kind) {
    case "view": return `viewed ${p ?? "a product"}`;
    case "compare": return `compared ${p ?? "products"}${e.secondProductId ? ` vs ${byId(e.secondProductId)?.name ?? ""}` : ""}`;
    case "cart_add": return `added ${p ?? "an item"} to cart`;
    case "checkout": return `started checkout${e.meta?.total ? ` (${Math.round(e.meta.total / 1000)}k)` : ""}`;
    case "order": return `placed an order${e.meta?.total ? ` worth ${Math.round(e.meta.total / 1000)}k` : ""}`;
    case "abandon": return `abandoned at the ${e.meta?.stage ?? "checkout"} step`;
    case "conversation": return `asked NOVA: “${e.query ?? "a question"}”`;
    case "search": return `searched “${e.query ?? ""}”`;
    default: return e.kind;
  }
}

/** Real-time customer activity — polls the behaviour log every 3s. */
export default function LiveActivityFeed({ limit = 14 }: { limit?: number }) {
  const [tick, setTick] = useState(0);
  const prevCount = useRef<number | null>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 3000);
    return () => window.clearInterval(id);
  }, []);

  const events = useMemo(() => {
    void tick;
    return [...eventsInDays(2)].sort((a, b) => b.ts - a.ts).slice(0, limit);
  }, [tick, limit]);

  useEffect(() => {
    if (prevCount.current !== null && events.length > prevCount.current) {
      setFlash(true);
      const id = window.setTimeout(() => setFlash(false), 900);
      return () => window.clearTimeout(id);
    }
    prevCount.current = events.length;
  }, [events.length]);

  return (
    <div className={`rounded-xl border transition-colors duration-700 ${flash ? "border-success/60 bg-success/5" : "border-line bg-card"}`}>
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="flex items-center gap-2 text-[13px] font-extrabold">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping-soft rounded-full bg-success" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          Live customer activity
        </p>
        <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-muted">auto-refresh · 3s</span>
      </div>
      <ul className="divide-y divide-line/70">
        {events.map((e) => {
          const meta = KIND_META[e.kind];
          return (
            <li key={e.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: meta.colour }} />
              <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-ink/85">
                <b className="text-muted">Shopper</b> {describe(e)}
              </span>
              <span className="shrink-0 text-[10.5px] font-bold text-muted">{timeAgo(e.ts)}</span>
            </li>
          );
        })}
        {events.length === 0 && <li className="px-4 py-6 text-center text-[12.5px] font-bold text-muted">No activity yet — browse the store to see it appear here.</li>}
      </ul>
    </div>
  );
}
