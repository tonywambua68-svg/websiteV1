/* ============================================================================
   IMARA TECH — BUSINESS CONFIGURATION
   ----------------------------------------------------------------------------
   ★ EDIT THIS FILE to put in your real business details. ★

   Everything below is left EMPTY on purpose — the website never invents
   your phone number, PayBill number or social media links.

   When a value is empty, the related button shows a polite
   "not configured yet" notice instead of a fake link.
   ========================================================================== */

export const BUSINESS = {
  /** Your business name — shown in the footer and policies. */
  name: "Imara Tech",

  /** Customer-care email, e.g. "hello@yourbusiness.co.ke" */
  email: "",

  /** Phone number shown on the Support page, e.g. "0712 345 678" */
  phone: "",

  /** Opening/support hours text (free wording — edit as you like). */
  hours: "Mon–Sat · 8:00 AM – 7:00 PM",
};

/* ----------------------------------------------------------------------------
   WHATSAPP ORDERING
   International format, digits only, country code first (254 for Kenya),
   no "+". This default is the owner's demo number (0143 198 930).
   The store owner can ALSO override this at runtime from
   Account → Store connections (saved in the browser; no rebuild needed).
   -------------------------------------------------------------------------- */
export const WHATSAPP_NUMBER = "254143198930";

/* ----------------------------------------------------------------------------
   M-PESA PAYBILL
   Enter the PayBill number Safaricom gave you. Example: "522123"

   ACCOUNT_NOTE explains what customers should enter as the
   "Account Number" when paying — usually their order reference.
   -------------------------------------------------------------------------- */
export const MPESA_PAYBILL_NUMBER = "";
export const MPESA_ACCOUNT_NOTE = "Your order reference number (e.g. IMR-2026-0451)";

/* ----------------------------------------------------------------------------
   SOCIAL MEDIA LINKS
   Paste your FULL profile URLs. Leave empty to show the icon as
   "not configured yet" (it will not link anywhere fake).
   -------------------------------------------------------------------------- */
export const SOCIALS = {
  tiktok: "", //    e.g. "https://www.tiktok.com/@yourbusiness"
  instagram: "", // e.g. "https://www.instagram.com/yourbusiness"
  x: "", //         e.g. "https://x.com/yourbusiness"
  facebook: "", //  e.g. "https://www.facebook.com/yourbusiness"
};

/* ----------------------------------------------------------------------------
   DELIVERY OPTIONS offered at checkout.
   Edit freely — add, remove or re-price options to match what you
   actually offer. `fee: 0` means free. Set FREE_DELIVERY_AT to 0 to disable
   the free-delivery threshold.
   -------------------------------------------------------------------------- */
export const DELIVERY_OPTIONS: { id: string; label: string; eta: string; fee: number }[] = [
  { id: "same-day", label: "Same-day · Nairobi", eta: "Today, 5–9 PM", fee: 300 },
  { id: "standard", label: "Standard · All 47 counties", eta: "1–3 working days", fee: 500 },
];

/** Orders above this subtotal get free delivery (KSh). Set to 0 to disable. */
export const FREE_DELIVERY_AT = 30000;

/* ----------------------------------------------------------------------------
   ORDERING / PAYMENT WORDING
   These strings appear on the product page, cart, checkout and confirmation.
   Edit them any time — no code changes needed.
   -------------------------------------------------------------------------- */
export const PAYMENT_WORDS = {
  afterPayNote:
    "After payment, send your M-PESA confirmation message to us on WhatsApp so we can verify your order and start processing it.",
  verifyNote:
    "Payments are verified manually on WhatsApp before dispatch — you'll get a confirmation message from us once it's done.",
};

/* ----------------------------------------------------------------------------
   STRUCTURED KNOWLEDGE — `mpesa_payment_steps`
   NOVA (the store AI) answers payment questions ONLY from this list.
   Edit the wording here; the AI never invents payment instructions.
   -------------------------------------------------------------------------- */
export const MPESA_PAYMENT_STEPS: string[] = [
  "Open M-PESA on your phone.",
  "Select Lipa na M-PESA.",
  "Select PayBill.",
  "Enter our PayBill number.",
  "Enter your order reference as the Account Number.",
  "Enter the amount.",
  "Enter your M-PESA PIN.",
  "Confirm the payment.",
];

/* ----------------------------------------------------------------------------
   ACCOUNTS & SECURITY (demo-grade, browser-only)
   These tune the built-in account system. When you connect a real backend
   (Supabase / Firebase / WooCommerce), delete this block and swap
   src/lib/auth.ts — nothing else in the app needs to change.
   -------------------------------------------------------------------------- */
export const AUTH = {
  /** How long a login session lasts (days). */
  sessionDays: 7,

  /** PBKDF2 iteration count — the hashing cost for every stored password. */
  pbkdf2Iterations: 120_000,

  /** Failed login attempts allowed before a temporary lock. */
  maxFailedAttempts: 5,

  /** Lock duration after too many failed attempts (seconds). */
  lockoutSeconds: 60,

  /** Notice shown on the sign-in screen — edit to match your store. */
  demoNotice:
    "Demo accounts — passwords are hashed and stored in this browser only. Connect a backend before going live.",

  /**
   * DEMO ACCOUNTS — seeded (hashed) on first load so the login works instantly.
   * ★ Change or delete these before a public launch ★ (or override the admin
   * one privately via .env: VITE_DEMO_ADMIN_EMAIL / VITE_DEMO_ADMIN_PASSWORD).
   */
  demoAccounts: [
    { role: "admin" as const, name: "Tony Wambua", email: "tony@example.com", password: "tony@123", phone: "0143198930" },
    { role: "customer" as const, name: "Amina Wanjiku", email: "amina@example.com", password: "amina@123", phone: "0712345678" },
  ],
};

/** Brand accent hues offered as avatar colours in the profile editor. */
export const AVATAR_HUES = ["#0b7a63", "#b45309", "#0369a1", "#7c3aed", "#be185d", "#c2410c"];

/* ----------------------------------------------------------------------------
   RUNTIME BUSINESS SETTINGS
   Owner-editable from Account → Store connections. Stored in the browser's
   localStorage so the whole shop picks changes up immediately — no code
   edits, no rebuild. Values here WIN over the compile-time defaults above.
   (In a real deployment these move to server-side settings; the interface
   stays identical.)
   -------------------------------------------------------------------------- */
const SETTINGS_KEY = "imara.biz.settings.v1";

export interface BizSettings {
  whatsapp?: string;
  paybill?: string;
  accountNote?: string;
}

export function getBizSettings(): BizSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? (JSON.parse(raw) as BizSettings) : {};
  } catch {
    return {};
  }
}

export function saveBizSettings(s: BizSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable — settings stay in-memory for this visit */
  }
}

/** Effective WhatsApp number (runtime override → config default), digits only. */
export function getWhatsAppNumber(): string {
  const n = (getBizSettings().whatsapp?.trim() || WHATSAPP_NUMBER).replace(/[^\d]/g, "");
  return /^\d{10,15}$/.test(n) ? n : "";
}

/** Human-friendly number for display, e.g. "+254 143 198 930". */
export function whatsappDisplay(): string | null {
  const n = getWhatsAppNumber();
  if (!n) return null;
  const parts = [n.slice(0, 3), n.slice(3, 6), n.slice(6, 9), n.slice(9)].filter(Boolean);
  return `+${parts.join(" ")}`;
}

/** Effective M-PESA PayBill number (runtime override → config default). */
export function getPayBill(): string {
  return getBizSettings().paybill?.trim() || MPESA_PAYBILL_NUMBER.trim();
}

/** Effective PayBill "Account Number" instruction shown to customers. */
export function getAccountNote(): string {
  return getBizSettings().accountNote?.trim() || MPESA_ACCOUNT_NOTE;
}

/* Helper: clean WhatsApp link, or null when the number is not configured. */
export function waHref(message: string): string | null {
  const n = getWhatsAppNumber();
  if (!n) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
}
