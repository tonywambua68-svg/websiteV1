/**
 * NOVA Content Studio — turns real catalogue data into ready-to-post social
 * content. Never invents specs or discounts: every claim maps to a field on
 * the actual product, and any offer referenced is the store's real, configured
 * one (e.g. the IMARA5 code).
 */

import { fmt, type Product } from "../../data/products";
import { BUSINESS } from "../../config";

export type Channel = "tiktok" | "instagram" | "x" | "whatsapp";

export interface ContentPiece {
  channel: Channel;
  title: string;
  body: string;
  hashtags: string[];
  bestTime: string;
}

const KES = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(n));

const brandTags = ["#ImaraTech", "#TechKenya", "#Nairobi", "#Kenya"];

function specLine(p: Product): string {
  return [p.ram && `${p.ram} RAM`, p.storage && `${p.storage} storage`, p.screen && `${p.screen} display`]
    .filter(Boolean)
    .join(" · ");
}

export function generateContent(p: Product, channel: Channel, angle: "deal" | "specs" | "lifestyle"): ContentPiece {
  const price = fmt(p.price);
  const save = p.oldPrice ? fmt(p.oldPrice - p.price) : null;
  const offer = angle === "deal" && save ? `Save ${save} right now.` : "Genuine stock, real warranty.";
  const specs = specLine(p);

  if (channel === "tiktok") {
    return {
      channel,
      title: "15-sec unboxing script",
      body:
        `HOOK (0–2s): “This ${p.brand} costs ${price} in Kenya — here's why it's worth it.”\n` +
        `SPEC (2–7s): ${specs || p.tagline}\n` +
        `PROOF (7–12s): ${p.warranty} warranty, sealed & serial-verified.\n` +
        `CTA (12–15s): “Link in bio — we deliver countrywide. ${offer}”`,
      hashtags: [...brandTags, "#unboxing", "#techtok", "#fyp"],
      bestTime: "Tue–Thu · 7–9 PM EAT",
    };
  }
  if (channel === "instagram") {
    return {
      channel,
      title: "Feed caption",
      body:
        `${p.name} — ${price} 🔥\n\n${specs ? `✔ ${specs}\n` : ""}` +
        `✔ ${p.warranty} warranty\n✔ Delivery across Kenya\n\n${offer}\n\n` +
        `Tap the link in bio or DM us on WhatsApp to order. ${BUSINESS.phone ? `Call/WhatsApp: ${BUSINESS.phone}` : "DM to order."}`,
      hashtags: [...brandTags, "#gadgets", "#laptopskenya", "#shoplocal"],
      bestTime: "Mon/Wed/Fri · 12–1 PM or 8 PM EAT",
    };
  }
  if (channel === "x") {
    return {
      channel,
      title: "Post (thread starter)",
      body:
        `${p.name} is ${price} in Kenya.\n\n${specs || p.tagline}\n${p.warranty} warranty. Nationwide delivery.\n\n${offer}`,
      hashtags: [...brandTags.slice(0, 2), "#KE"],
      bestTime: "Weekdays · 8–10 AM EAT",
    };
  }
  // WhatsApp status / broadcast
  return {
    channel,
    title: "Status / broadcast",
    body:
      `🔥 ${p.name}\n💰 ${price}${save ? ` (was ${fmt(p.oldPrice!)})` : ""}\n` +
      `${specs ? `📦 ${specs}\n` : ""}✅ ${p.warranty} warranty\n🚚 Delivery countrywide\n\nReply to order 👇`,
    hashtags: [],
    bestTime: "Any day · 6–8 PM EAT",
  };
}

/** A week of post ideas mixing catalogue + demand themes. */
export function weeklyCalendar(products: Product[]): { day: string; idea: string; channel: Channel }[] {
  const p = (i: number) => products[i % Math.max(1, products.length)];
  return [
    { day: "Mon", idea: `Spec spotlight: ${p(0).name} (${specLine(p(0)) || p(0).tagline})`, channel: "instagram" },
    { day: "Tue", idea: `Unboxing video: ${p(1).name}`, channel: "tiktok" },
    { day: "Wed", idea: "Buying guide: how to spot a genuine vs fake device", channel: "instagram" },
    { day: "Thu", idea: `Quick deal drop: ${p(2).name} at ${fmt(p(2).price)}`, channel: "whatsapp" },
    { day: "Fri", idea: `Comparison: ${p(0).brand} vs ${p(1).brand} — which wins?`, channel: "x" },
    { day: "Sat", idea: "Customer story / delivery proof (with permission)", channel: "instagram" },
    { day: "Sun", idea: `Rest: engage — ask followers what they want under ${KES(p(0).price)}`, channel: "tiktok" },
  ];
}
