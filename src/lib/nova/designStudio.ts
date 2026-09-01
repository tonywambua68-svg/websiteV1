/**
 * NOVA Design Studio — graphic-design advisor for the admin.
 * Generates complete creative briefs (layout, palette, type, copy, sizes)
 * from real product data + the Imara brand system, and answers design
 * questions with practical rules that work for e-commerce creatives.
 */

import { discountOf, fmt, type Product } from "../../data/products";

export interface DesignBrief {
  title: string;
  headlines: string[];
  layout: string[];
  palette: { hex: string; role: string }[];
  type: { display: string; body: string; note: string };
  cta: string[];
  sizes: string[];
  dos: string[];
  donts: string[];
}

export type Vibe = "deal" | "premium" | "tech" | "lifestyle";
export type DesignChannel = "instagram" | "tiktok" | "facebook" | "whatsapp";

const CHANNEL_SIZES: Record<DesignChannel, string[]> = {
  instagram: ["Feed 1080×1350 (portrait wins)", "Story/Reel 1080×1920", "Carousel 1080×1080"],
  tiktok: ["Video 1080×1920", "Cover frame 1080×1920"],
  facebook: ["Link card 1200×628", "Feed 1080×1080", "Story 1080×1920"],
  whatsapp: ["Status 1080×1920", "Broadcast image 1080×1080"],
};

const VIBE_PALETTES: Record<Vibe, { hex: string; role: string }[]> = {
  deal: [
    { hex: "#F5A31A", role: "Price & CTA background — the money colour" },
    { hex: "#0A1F1C", role: "Headline ink — maximum contrast" },
    { hex: "#FCFDFD", role: "Card surface / breathing space" },
    { hex: "#D64545", role: "“Save KSh X” accents only (sparingly)" },
  ],
  premium: [
    { hex: "#0A1F1C", role: "Full-bleed dark background" },
    { hex: "#0B7A63", role: "Signature teal lines & micro-labels" },
    { hex: "#F5A31A", role: "One accent only — price or logo" },
    { hex: "#F1F5F3", role: "Body text on dark (never pure white)" },
  ],
  tech: [
    { hex: "#10312C", role: "Deep pine background, faint grid overlay" },
    { hex: "#F1F5F3", role: "Spec callout text" },
    { hex: "#0B7A63", role: "Connector lines to spec labels" },
    { hex: "#F5A31A", role: "The ONE highlighted spec" },
  ],
  lifestyle: [
    { hex: "#F1F5F3", role: "Bright, airy mist background" },
    { hex: "#0A1F1C", role: "Headline ink" },
    { hex: "#0B7A63", role: "Secondary info, links" },
    { hex: "#F5A31A", role: "CTA pill" },
  ],
};

export function generateBrief(p: Product, channel: DesignChannel, vibe: Vibe): DesignBrief {
  const d = discountOf(p);
  const price = fmt(p.price);
  const topSpec = p.specs[0];
  const productShort = p.name.replace(p.brand + " ", "");

  const headlines: Record<Vibe, string[]> = {
    deal: [
      `${productShort} — ${price}`,
      d > 0 ? `Save ${fmt((p.oldPrice ?? p.price) - p.price)} today only` : `Live price, no hidden fees`,
      `${p.brand} · ${p.warranty}`,
    ],
    premium: [
      `The ${productShort}.`,
      `${topSpec ? topSpec[1] : p.tagline}`,
      `Sealed. Serial-verified. Yours.`,
    ],
    tech: [
      `${productShort} — spec by spec`,
      topSpec ? `${topSpec[0]}: ${topSpec[1]}` : p.tagline,
      p.ram ? `${p.ram} RAM · ${p.storage ?? ""}` : p.tagline,
    ],
    lifestyle: [
      `Your next upgrade is ${price}`,
      p.tagline,
      `Same-day delivery in Nairobi`,
    ],
  };

  const layouts: Record<Vibe, string[]> = {
    deal: [
      "Top 15%: small brand wordmark + “TODAY'S DEAL” label",
      "Middle 55%: product front-and-centre on a soft tinted tile, slight tilt",
      "Bottom 30%: price HUGE (biggest element on the card), old price struck through, amber CTA pill “Order on WhatsApp”",
      "Corner chip: “−" + d + "%” in amber; keep 20% of the card as breathing space",
    ],
    premium: [
      "Full-bleed dark (#0A1F1C) with a faint grid texture at 4% opacity",
      "Product large, centre-left, lit from above — shadow grounds it",
      "Headline in Space Grotesk, bottom-left, one line only",
      "Thin teal hairline + tiny wordmark bottom-right. Nothing else. Restraint sells premium.",
    ],
    tech: [
      "Dark pine background with a 44px grid at 4% opacity",
      "Product centre; 3–4 spec callouts with thin teal connector lines to real specs",
      "One spec highlighted in amber — the reason to buy",
      "Bottom bar: price left, “Full specs →” right",
    ],
    lifestyle: [
      "Mist (#F1F5F3) background, product on a subtle shadow, plenty of air",
      "Headline top-left in ink, two lines max",
      "Small proof row: warranty icon + “Same-day Nairobi” + M-PESA chip",
      "CTA pill bottom-right in amber",
    ],
  };

  return {
    title: `${p.name} — ${channel} ${vibe} creative`,
    headlines: headlines[vibe],
    layout: layouts[vibe],
    palette: [...VIBE_PALETTES[vibe], { hex: p.hue, role: `Product tint (${p.category} hue) — use at 10–20% opacity for tiles` }],
    type: {
      display: "Space Grotesk 700 — headlines & price",
      body: "Manrope 600 — everything else",
      note: "Two families max. Price should be 2–3× the headline size on deal creatives.",
    },
    cta: ["Order on WhatsApp", `See it — ${price}`, "Check availability"],
    sizes: CHANNEL_SIZES[channel],
    dos: [
      "One message per creative — price OR one spec OR one benefit",
      "Product occupies ≥40% of the frame",
      "Test the first 2 seconds of video with sound OFF",
      "Always show the real listed price — honesty converts",
      "Export at 2× and keep text inside the middle 80% (safe zone)",
    ],
    donts: [
      "No more than 3 colours + product tint in one frame",
      "No stock-photo people — hands + product beats fake lifestyle",
      "No fake countdowns or invented “only 2 left” claims",
      "No tiny fonts below ~28px at 1080px width",
      "No gradient text or rainbow effects — it reads as spam",
    ],
  };
}

export const DESIGN_RULES: { rule: string; why: string }[] = [
  { rule: "Hierarchy first", why: "The eye should travel: product → price → CTA. If you squint and can't tell what matters, redo it." },
  { rule: "60-30-10 colour rule", why: "60% dominant (background), 30% secondary (ink/text blocks), 10% accent (amber = action). Scattered colour kills conversion." },
  { rule: "Contrast is conversion", why: "Price on dark, CTA on amber — high contrast elements get clicked. Grey-on-grey gets scrolled past." },
  { rule: "Under 20% text", why: "Social platforms suppress text-heavy images, and humans skip them anyway. Let the product talk." },
  { rule: "One CTA per creative", why: "Two buttons split intent. Decide the ONE action: WhatsApp order." },
  { rule: "Faces pull eyes", why: "If using people, eye-direction toward the product measurably lifts attention on it." },
  { rule: "Consistent brand furniture", why: "Same fonts, same amber, same card style every post — recognition compounds into trust." },
  { rule: "Mobile-first canvas", why: "95%+ of your audience is on phones: design at 1080×1350/1920, then adapt down, never up." },
];

export function askDesign(raw: string): { title: string; answer: string; rules?: { rule: string; why: string }[] } {
  const t = raw.toLowerCase();
  if (/colou?r|palette|hex/i.test(t)) {
    return {
      title: "Your brand palette (and how to use it)",
      answer: "Imara runs on four colours: Ink #0A1F1C (headlines & dark surfaces), Mist #F1F5F3 (backgrounds), Teal #0B7A63 (trust & links), Amber #F5A31A (action & price). Apply 60-30-10: mist or ink dominates, the other supports, amber appears only where you want a click. Add the per-product hue at low opacity for tiles.",
      rules: DESIGN_RULES.filter((r) => /colour|contrast/i.test(r.rule)),
    };
  }
  if (/font|typograph|type\b/i.test(t)) {
    return {
      title: "Typography system",
      answer: "Two families only. Space Grotesk 700 for headlines and prices (it has a technical character that suits electronics); Manrope 600/700 for everything else. Prices at 2–3× headline size on deal posts. Never stretch, never outline, never use more than two weights per graphic.",
      rules: DESIGN_RULES.filter((r) => /hierarchy/i.test(r.rule)),
    };
  }
  if (/canva|tool|app|software/i.test(t)) {
    return {
      title: "Tooling for a one-person design team",
      answer: "Canva Pro is the fastest: set your brand kit to the four hex codes + both fonts once, then every template stays on-brand. Batch-produce a week of posts in one sitting (NOVA's Content tab gives you the words; the brief generator gives you the layout). Export 2× PNG. For video, CapCut handles Reels/TikTok with the same brand colours.",
    };
  }
  if (/size|dimension|ratio/i.test(t)) {
    return {
      title: "Sizes that matter",
      answer: "Instagram feed 1080×1350 (portrait beats square for screen share), Stories/Reels/TikTok 1080×1920, Facebook link cards 1200×628, WhatsApp status 1080×1920. Keep all text inside the middle 80% — platforms overlay UI on edges.",
    };
  }
  return {
    title: "The rules that make creatives convert",
    answer: "Before designing anything, run this checklist. These are the difference between “nice post” and “orders”:",
    rules: DESIGN_RULES,
  };
}
