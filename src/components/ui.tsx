import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { discountOf, fmt, type Product } from "../data/products";
import { IcChevR, IcMinus, IcPlus, IcStar } from "./Icons";

/* ---------- Stars ---------- */
export function Stars({ value, size = 13 }: { value: number; size?: number }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  const row = (cls: string) => (
    <span className={`flex gap-[2px] ${cls}`}>
      {[0, 1, 2, 3, 4].map((i) => <IcStar key={i} style={{ width: size, height: size }} />)}
    </span>
  );
  return (
    <span className="relative inline-block align-middle" aria-label={`${value} out of 5 stars`}>
      {row("text-line")}
      <span className="absolute inset-0 overflow-hidden" style={{ width: `${pct}%` }}>
        {row("text-amber")}
      </span>
    </span>
  );
}

/* ---------- Price ---------- */
export function Price({ p, big = false, light = false }: { p: Product; big?: boolean; light?: boolean }) {
  const d = discountOf(p);
  return (
    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={`font-display font-bold tracking-tight ${big ? "text-3xl md:text-4xl" : "text-lg"} ${light ? "text-white" : "text-ink"}`}>
        {fmt(p.price)}
      </span>
      {p.oldPrice && (
        <>
          <span className={`text-xs font-semibold line-through ${light ? "text-white/40" : "text-muted"}`}>{fmt(p.oldPrice)}</span>
          <span className="rounded-md bg-amber/15 px-1.5 py-0.5 text-[11px] font-extrabold text-amberdeep">−{d}%</span>
        </>
      )}
    </span>
  );
}

/* ---------- Scroll reveal ---------- */
export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add("in");
            io.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
}

/* ---------- Section heading ---------- */
export function SectionHead({ eyebrow, title, sub, right, light = false }: {
  eyebrow?: string; title: string; sub?: string; right?: ReactNode; light?: boolean;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4 md:mb-9">
      <div className="max-w-xl">
        {eyebrow && (
          <p className={`mb-2 text-[11px] font-extrabold uppercase tracking-[0.18em] ${light ? "text-amber" : "text-teal"}`}>{eyebrow}</p>
        )}
        <h2 className={`font-display text-2xl font-bold tracking-tight md:text-[2rem] md:leading-tight ${light ? "text-white" : "text-ink"}`}>{title}</h2>
        {sub && <p className={`mt-2 text-sm leading-relaxed md:text-[15px] ${light ? "text-white/60" : "text-muted"}`}>{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/* ---------- Quantity stepper ---------- */
export function Qty({ value, onChange, small = false }: { value: number; onChange: (v: number) => void; small?: boolean }) {
  const btn = `grid place-items-center rounded-md border border-line bg-card text-ink transition hover:border-teal hover:text-teal disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink ${small ? "h-7 w-7" : "h-10 w-10"}`;
  return (
    <div className="inline-flex items-center gap-2" aria-label="Quantity">
      <button type="button" className={btn} onClick={() => onChange(value - 1)} aria-label="Decrease quantity"><IcMinus className={small ? "h-3.5 w-3.5" : "h-4 w-4"} /></button>
      <span className={`min-w-8 text-center font-display font-bold ${small ? "text-sm" : "text-base"}`}>{value}</span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} aria-label="Increase quantity"><IcPlus className={small ? "h-3.5 w-3.5" : "h-4 w-4"} /></button>
    </div>
  );
}

/* ---------- Breadcrumbs ---------- */
export function Crumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-muted">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <IcChevR className="h-3 w-3 text-line" />}
          {it.to ? (
            <Link to={it.to} className="transition hover:text-teal">{it.label}</Link>
          ) : (
            <span className="text-ink">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/* ---------- Empty state ---------- */
export function Empty({ title, sub, children }: { title: string; sub: string; children?: ReactNode }) {
  return (
    <div className="card mx-auto max-w-md px-8 py-14 text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-mint text-teal">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="h-7 w-7"><circle cx="11" cy="11" r="7" /><path d="m20.5 20.5-4-4" /></svg>
      </div>
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted">{sub}</p>
      {children && <div className="mt-5 flex justify-center gap-2">{children}</div>}
    </div>
  );
}

/* ---------- Countdown to midnight (deal timer) ---------- */
export function useCountdown() {
  const calc = () => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    const ms = Math.max(0, end.getTime() - now.getTime());
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };
  const [t, setT] = useState(calc);
  useEffect(() => {
    const id = window.setInterval(() => setT(calc()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return t;
}

/* ---------- Demo notice pill ---------- */
export function DemoPill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber/40 bg-amber/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-amberdeep">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping-soft rounded-full bg-amber" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amberdeep" />
      </span>
      Design demo — no real payments
    </span>
  );
}
