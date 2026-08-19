import type { ReactNode } from "react";
import { fmt, type Product } from "../data/products";
import { useStore } from "../lib/store";
import {
  BUSINESS, MPESA_ACCOUNT_NOTE, MPESA_PAYBILL_NUMBER, PAYMENT_WORDS, SOCIALS, waHref,
} from "../config";

/* ============================================================================
   Brand icons (WhatsApp + social) — recognisable official-style marks.
   ========================================================================== */

export function IcWhatsApp({ className = "h-4.5 w-4.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.96L2 22l5.18-1.5A9.93 9.93 0 1 0 12.04 2Zm5.84 14.13c-.25.7-1.45 1.33-2 1.38-.53.05-1.03.24-3.47-.72-2.93-1.15-4.78-4.16-4.92-4.35-.14-.2-1.16-1.55-1.16-2.96 0-1.4.74-2.1 1-2.38.26-.29.57-.36.76-.36h.55c.18 0 .42-.07.66.5.25.6.84 2.07.91 2.22.07.14.12.31.02.5-.09.2-.14.31-.28.48-.14.17-.3.38-.42.51-.14.14-.29.3-.12.58.16.29.73 1.2 1.57 1.95 1.08.96 1.99 1.26 2.27 1.4.29.14.45.12.62-.07.16-.19.7-.82.89-1.1.19-.29.38-.24.64-.14.26.09 1.65.78 1.93.92.29.14.48.22.55.34.07.12.07.7-.18 1.4Z" />
    </svg>
  );
}

const SOCIAL_META: { key: keyof typeof SOCIALS; label: string; path: ReactNode }[] = [
  {
    key: "tiktok", label: "TikTok",
    path: <path d="M16.6 3c.4 2.2 1.8 3.6 4.4 3.8v2.9c-1.7 0-3.2-.5-4.4-1.5v6.5A6.35 6.35 0 1 1 10.25 8.3v3.2a3.2 3.2 0 1 0 3.15 3.2V3h3.2Z" />,
  },
  {
    key: "instagram", label: "Instagram",
    path: <><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="17.2" cy="6.8" r="1.3" /></>,
  },
  {
    key: "x", label: "X",
    path: <path d="M17.7 3H21l-7.3 8.3L22.2 21h-6.7l-5.2-6.2L4.3 21H1l7.8-8.9L1.8 3h6.9l4.7 5.7L17.7 3Zm-1.2 16h1.9L7.3 4.9H5.3L16.5 19Z" />,
  },
  {
    key: "facebook", label: "Facebook",
    path: <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.5-3.9 3.77-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />,
  },
];

/* ============================================================================
   Social row — icons link ONLY when configured in src/config.ts.
   Unconfigured icons stay visible but inert, with a clear notice on click.
   ========================================================================== */
export function SocialRow({ light = false, size = "h-9 w-9" }: { light?: boolean; size?: string }) {
  const { toast } = useStore();
  return (
    <div className="flex gap-2">
      {SOCIAL_META.map((s) => {
        const url = SOCIALS[s.key];
        const base = `grid ${size} place-items-center rounded-lg border transition`;
        const on = light
          ? "border-white/15 text-white/80 hover:border-amber hover:text-amber"
          : "border-line text-muted hover:border-teal hover:text-teal";
        const off = light ? "border-white/10 text-white/25" : "border-line text-line";
        if (url) {
          return (
            <a key={s.key} href={url} target="_blank" rel="noreferrer" aria-label={`${BUSINESS.name} on ${s.label}`} className={`${base} ${on}`}>
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5" aria-hidden="true">{s.path}</svg>
            </a>
          );
        }
        return (
          <button
            key={s.key} type="button" aria-label={`${s.label} — not configured yet`}
            title={`${s.label}: add your link in src/config.ts`}
            onClick={() => toast(`${s.label} isn't configured yet — add your link in src/config.ts`, "info")}
            className={`${base} ${off} cursor-not-allowed`}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5" aria-hidden="true">{s.path}</svg>
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================================
   WhatsApp buttons & message builders
   ========================================================================== */

export function productUrl(p: Product): string {
  return `${window.location.origin}${window.location.pathname}#/product/${p.id}`;
}

export function productWaMessage(p: Product, qty: number): string {
  return [
    `Hello ${BUSINESS.name}! I am interested in:`,
    "",
    `Product: ${p.name}`,
    `Price: ${fmt(p.price)}`,
    `Quantity: ${qty}`,
    `Product link: ${productUrl(p)}`,
    "",
    "Please confirm availability and ordering details.",
  ].join("\n");
}

export function cartWaMessage(items: { p: Product; qty: number }[], total: number): string {
  const lines = items.map(({ p, qty }, i) => `${i + 1}. ${p.name} × ${qty} — ${fmt(p.price * qty)}`);
  return [
    `Hello ${BUSINESS.name}! I would like to place an order:`,
    "",
    ...lines,
    "",
    `Estimated total: ${fmt(total)} (delivery to be confirmed)`,
    "",
    "Please confirm availability, delivery and payment details.",
  ].join("\n");
}

/** Primary green WhatsApp action button. Falls back to a clear toast when not configured. */
export function WhatsAppButton({ message, children, className = "btn !bg-[#128C7E] !text-white hover:!bg-[#0e7264]", disabled }: {
  message: string; children: ReactNode; className?: string; disabled?: boolean;
}) {
  const { toast } = useStore();
  return (
    <button
      type="button"
      disabled={disabled}
      className={`btn ${className}`}
      onClick={() => {
        const href = waHref(message);
        if (href) window.open(href, "_blank", "noopener");
        else toast("WhatsApp ordering isn't configured yet — add your number in src/config.ts", "info");
      }}
    >
      <IcWhatsApp /> {children}
    </button>
  );
}

/* ============================================================================
   M-PESA PayBill box + step-by-step instructions
   ========================================================================== */
export function PayBillBox({ reference, amount, compact = false }: { reference?: string; amount?: number; compact?: boolean }) {
  const configured = MPESA_PAYBILL_NUMBER.trim() !== "";
  return (
    <div className={`rounded-xl border border-[#1b9e4b]/30 bg-[#1b9e4b]/[0.06] ${compact ? "p-4" : "p-5"}`}>
      <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#14713a]">
        <span className="grid h-6 w-6 place-items-center rounded bg-[#1b9e4b] text-[10px] font-extrabold text-white">M</span>
        Pay with M-PESA PayBill
      </p>
      <dl className={`mt-3 grid gap-2 text-[13px] font-bold sm:grid-cols-2 ${compact ? "" : "sm:gap-4"}`}>
        <div className="rounded-lg bg-card px-3 py-2.5">
          <dt className="text-[10px] font-extrabold uppercase tracking-wider text-muted">PayBill number</dt>
          <dd className={`font-display ${compact ? "text-lg" : "text-xl"} ${configured ? "text-ink" : "text-warning"}`}>
            {configured ? MPESA_PAYBILL_NUMBER : "Add in src/config.ts"}
          </dd>
        </div>
        <div className="rounded-lg bg-card px-3 py-2.5">
          <dt className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Account number</dt>
          <dd className="font-display text-[13px] leading-snug text-ink">{reference ?? MPESA_ACCOUNT_NOTE}</dd>
        </div>
        {typeof amount === "number" && (
          <div className="rounded-lg bg-card px-3 py-2.5 sm:col-span-2">
            <dt className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Amount</dt>
            <dd className="font-display text-xl text-teal">{fmt(amount)}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

const PAY_STEPS = [
  "Open M-PESA on your phone.",
  "Select Lipa na M-PESA.",
  "Select PayBill.",
  "Enter our PayBill number.",
  "Enter your order reference as the Account Number.",
  "Enter the amount.",
  "Enter your M-PESA PIN.",
  "Confirm the payment.",
];

export function HowToPay({ withWhatsApp = true }: { withWhatsApp?: boolean }) {
  const href = waHref("Hello! I have just made an M-PESA payment for my order. Here is my confirmation message:");
  const { toast } = useStore();
  return (
    <div>
      <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted">How to pay</p>
      <ol className="mt-3 space-y-2">
        {PAY_STEPS.map((s, i) => (
          <li key={s} className="flex items-start gap-3 text-[13.5px] font-semibold text-ink/85">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mint font-display text-[11px] font-bold text-teal">{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
      <p className="mt-4 rounded-lg bg-amber/10 px-3.5 py-3 text-[12.5px] font-bold leading-relaxed text-amberdeep">
        {PAYMENT_WORDS.afterPayNote}
      </p>
      {withWhatsApp && (
        <button
          type="button"
          onClick={() => {
            if (href) window.open(href, "_blank", "noopener");
            else toast("WhatsApp isn't configured yet — add your number in src/config.ts", "info");
          }}
          className="mt-3 inline-flex items-center gap-2 text-[13px] font-extrabold text-[#128C7E] underline-offset-2 hover:underline"
        >
          <IcWhatsApp className="h-4 w-4" /> Send confirmation on WhatsApp →
        </button>
      )}
      <p className="mt-3 text-[11px] font-bold text-muted">{PAYMENT_WORDS.verifyNote}</p>
    </div>
  );
}
