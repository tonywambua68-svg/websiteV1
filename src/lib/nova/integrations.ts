/**
 * NOVA Integrations — connect the store to the outside world.
 *
 * How this really works (and stays honest):
 * • Connection settings (API keys, webhook URLs) are stored ONLY in this
 *   browser's localStorage — they are never committed to Git and never sent
 *   anywhere by this demo. In production these live server-side as env vars.
 * • NOVA builds a standard webhook payload; a service like Zapier / Make /
 *   n8n receives it and does the actual sending (WhatsApp, email, Sheets, Ads).
 *   Nothing here claims to post to a social network by itself.
 */

export type IntegrationId = "zapier" | "meta" | "ga" | "mailchimp" | "twilio" | "sheets";

export interface Integration {
  id: IntegrationId;
  name: string;
  tagline: string;
  category: "automation" | "ads" | "analytics" | "email" | "messaging";
  fields: { key: string; label: string; placeholder: string; secret?: boolean }[];
  docs: string;
}

export const INTEGRATIONS: Integration[] = [
  {
    id: "zapier",
    name: "Zapier",
    tagline: "Send orders & leads to 6,000+ apps (Sheets, WhatsApp, Slack, Mailchimp…)",
    category: "automation",
    fields: [{ key: "webhookUrl", label: "Zapier Webhook URL", placeholder: "https://hooks.zapier.com/hooks/catch/…", secret: true }],
    docs: "Create a Zap → trigger “Webhooks by Zapier (Catch Hook)” → paste the URL here. NOVA will POST a JSON payload on every new order.",
  },
  {
    id: "meta",
    name: "Meta (Facebook/Instagram) Ads",
    tagline: "Build retargeting audiences from product views & cart adds",
    category: "ads",
    fields: [{ key: "pixelId", label: "Meta Pixel ID", placeholder: "123456789012345" }],
    docs: "Install the Meta Pixel, add your Pixel ID. Fire ViewContent / AddToCart / Purchase events so you can retarget shoppers with dynamic product ads.",
  },
  {
    id: "ga",
    name: "Google Analytics 4",
    tagline: "Measure traffic, funnels and revenue attribution",
    category: "analytics",
    fields: [{ key: "measurementId", label: "GA4 Measurement ID", placeholder: "G-XXXXXXXXXX" }],
    docs: "Create a GA4 property, paste the G- ID. Map view_item, add_to_cart and purchase events to the NOVA behaviour log for real funnel reporting.",
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    tagline: "Grow an email list & send deal newsletters",
    category: "email",
    fields: [{ key: "audienceId", label: "Audience ID", placeholder: "abc123" }, { key: "apiKey", label: "API Key", placeholder: "…-us20", secret: true }],
    docs: "Sync newsletter signups (the homepage subscribe box) into a Mailchimp audience for automated welcome + deal campaigns.",
  },
  {
    id: "twilio",
    name: "Twilio / WhatsApp Business API",
    tagline: "Send order updates & broadcasts over the WhatsApp API",
    category: "messaging",
    fields: [{ key: "accountSid", label: "Account SID", placeholder: "AC…", secret: true }, { key: "authToken", label: "Auth Token", placeholder: "…", secret: true }],
    docs: "Upgrade from a personal WhatsApp number to the official WhatsApp Business API for automated order confirmations and approved broadcasts.",
  },
  {
    id: "sheets",
    name: "Google Sheets",
    tagline: "Pipe every order straight into a spreadsheet",
    category: "automation",
    fields: [{ key: "webhookUrl", label: "Apps Script Web App URL", placeholder: "https://script.google.com/macros/s/…/exec", secret: true }],
    docs: "Deploy a tiny Apps Script that appends rows to a Sheet, paste its Web App URL. Every placed order is logged automatically.",
  },
];

/* ---------------- connection state (localStorage, never committed) ---------------- */
const KEY = "imara.nova.integrations.v1";

type Store = Partial<Record<IntegrationId, Record<string, string>>>;

function load(): Store {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Store;
  } catch {
    return {};
  }
}
function save(s: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* noop */
  }
}

export function getSettings(id: IntegrationId): Record<string, string> {
  return load()[id] ?? {};
}
export function isConnected(id: IntegrationId): boolean {
  const s = getSettings(id);
  const def = INTEGRATIONS.find((i) => i.id === id)!;
  return def.fields.every((f) => (s[f.key] ?? "").trim().length > 0);
}
export function saveSettings(id: IntegrationId, values: Record<string, string>) {
  const all = load();
  all[id] = values;
  save(all);
}
export function disconnect(id: IntegrationId) {
  const all = load();
  delete all[id];
  save(all);
}

/* ---------------- webhook payload builder ---------------- */
export interface OrderPayload {
  event: "order.created";
  order_id: string;
  total: number;
  items: { name: string; qty: number; price: number }[];
  customer: { name: string; phone: string };
  created_at: string;
}

/** The standard JSON NOVA sends to a connected webhook (Zapier/Sheets/etc). */
export function buildOrderPayload(order: { id: string; total: number; items: { id: string; qty: number; price: number }[]; address: string }): OrderPayload {
  return {
    event: "order.created",
    order_id: order.id,
    total: order.total,
    items: order.items.map((it) => ({ name: it.id, qty: it.qty, price: it.price })),
    customer: { name: order.address.split("·")[0].trim(), phone: "" },
    created_at: new Date().toISOString(),
  };
}
