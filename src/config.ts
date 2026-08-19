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
   Enter your WhatsApp number in INTERNATIONAL format, digits only,
   starting with the country code (254 for Kenya) and WITHOUT the "+".
   Example: "254712345678"
   -------------------------------------------------------------------------- */
export const WHATSAPP_NUMBER = "";

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

/* Helper: clean WhatsApp link, or null when the number is not configured. */
export function waHref(message: string): string | null {
  const n = WHATSAPP_NUMBER.replace(/[^\d]/g, "");
  if (!n) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
}
