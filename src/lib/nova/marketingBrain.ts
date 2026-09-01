/**
 * NOVA Marketing Brain — the digital-marketing knowledge the admin AI is
 * "taught". Pure strategy knowledge (no customer-private data), surfaced in
 * the Marketing tab and through adminAsk. Every playbook is written for a
 * Kenyan online electronics reseller: M-PESA payments, WhatsApp-first
 * customers, county-wide delivery.
 */

export interface MarketingAnswer {
  title: string;
  intro: string;
  steps?: { h: string; body: string }[];
  kpis?: string[];
  example?: string;
  chips?: string[];
}

export interface Framework {
  id: string;
  name: string;
  tagline: string;
  bestFor: string;
  steps: string[];
  example: string;
}

export const FRAMEWORKS: Framework[] = [
  {
    id: "aida", name: "AIDA", tagline: "Attention → Interest → Desire → Action",
    bestFor: "Ad creatives, product posts, landing pages",
    steps: [
      "Attention — stop the scroll: bold price, striking product shot, or a problem hook",
      "Interest — one concrete fact (spec, battery hours, warranty) that matters to them",
      "Desire — paint the outcome: “exam season sorted”, “no more dead-phone panic”",
      "Action — one clear next step: “Order on WhatsApp” or “Tap to see specs”",
    ],
    example: "“KSh 34,999 — 14-hour battery. (A) Lecture days without a charger. (I) 16GB RAM handles AutoCAD. (D) Only 4 left. (A) Order via WhatsApp.”",
  },
  {
    id: "pas", name: "PAS", tagline: "Problem → Agitate → Solution",
    bestFor: "Captions, WhatsApp broadcasts, video scripts",
    steps: [
      "Problem — name the pain in the customer's own words",
      "Agitate — make the cost of ignoring it felt (time, money, stress)",
      "Solution — your product as the fix, with proof (warranty, delivery speed)",
    ],
    example: "“Phone dies by 2 PM? (P) You miss calls, orders, M-PESA alerts. (A) The Nexon Flow 10 carries a 5500mAh battery + 33W charging — and we deliver same-day in Nairobi. (S)”",
  },
  {
    id: "hso", name: "Hook · Story · Offer", tagline: "The short-video formula",
    bestFor: "TikTok / Reels scripts",
    steps: [
      "Hook (0–2s) — a claim, question or price that earns the next 3 seconds",
      "Story (2–15s) — show the product in a real moment, hands-on, unpolished",
      "Offer (15–25s) — price + guarantee + exactly how to order (WhatsApp)",
    ],
    example: "Hook: “This KSh 28k laptop runs engineering software.” Story: open SolidWorks live. Offer: “24-month warranty, same-day Nairobi delivery — link in bio or WhatsApp us.”",
  },
  {
    id: "funnel", name: "TOFU · MOFU · BOFU", tagline: "The awareness-to-purchase funnel",
    bestFor: "Planning what content to post when",
    steps: [
      "Top — educational, no selling: buying guides, spec explainers, “RAM you actually need”",
      "Middle — comparison & proof: product face-offs, unboxings, delivery proof, customer chats",
      "Bottom — direct offer: price posts, limited-stock flags, IMARA5 code, WhatsApp CTA",
    ],
    example: "Week plan: Mon guide (TOFU), Wed comparison Reel (MOFU), Fri price-drop post with code (BOFU).",
  },
  {
    id: "fab", name: "FAB", tagline: "Features → Advantages → Benefits",
    bestFor: "Product descriptions that convert",
    steps: [
      "Feature — the raw spec (“120Hz AMOLED”)",
      "Advantage — what it does (“scrolling and games look twice as smooth”)",
      "Benefit — why they care (“your eyes feel it after a full day”)",
    ],
    example: "Never post “5000mAh” alone. Post “5000mAh — a full day of classes, matatu playlists and still 30% at bedtime.”",
  },
  {
    id: "sevenps", name: "The 7 Ps", tagline: "Audit your whole offer",
    bestFor: "Strategy reviews when sales stall",
    steps: [
      "Product — is the range what people actually ask for? (check NOVA's budget data)",
      "Price — psychological pricing (…999), visible VAT, honest deals",
      "Place — website + WhatsApp + status updates: friction-free ordering",
      "Promotion — the content calendar below",
      "People — fast, human WhatsApp replies win orders",
      "Process — M-PESA → confirm → dispatch → deliver, narrated to the customer",
      "Physical evidence — unboxing photos, warranty cards, delivery selfies",
    ],
    example: "Sales down? Audit each P. Usually it's Process (slow replies) or Promotion (posting features instead of outcomes).",
  },
  {
    id: "rfm", name: "RFM retention loop", tagline: "Sell again to people who already trust you",
    bestFor: "Growing revenue without ad spend",
    steps: [
      "Recency — message recent buyers 7 days after delivery: setup help, accessories that fit",
      "Frequency — reward repeat buyers with first-look on new stock",
      "Monetary — VIPs get white-glove treatment; at-risk buyers get a personal win-back",
    ],
    example: "NOVA's Customer tab already segments this for you — export the VIP list and send one genuine message a month.",
  },
];

export interface Playbook { id: string; channel: string; steps: string[]; budget: string; kpis: string[] }

export const PLAYBOOKS: Playbook[] = [
  {
    id: "tiktok", channel: "TikTok / Reels (organic)",
    steps: [
      "Post 1 short video daily for 21 days — consistency beats production value",
      "Film real things: unboxings, spec tests, packing orders, delivery runs",
      "First frame = the hook; last frame = price + WhatsApp",
      "Reply to every comment with a video when possible — algorithm gold",
      "Reuse each video as an IG Reel, FB Reel and WhatsApp status",
    ],
    budget: "Time only — phone camera is enough",
    kpis: ["Watch-through rate > 40%", "Profile visits", "“How much?” comments (intent signal)"],
  },
  {
    id: "paid", channel: "Facebook / Instagram ads",
    steps: [
      "Start with KSh 500–1,000/day on ONE product with a real discount",
      "Target: 18–45, interest in your category, +25km around Nairobi",
      "Creative: 1080×1350 product card, price big, 3 benefit bullets, WhatsApp CTA button",
      "Let it run 3 days untouched, then kill anything under 1% CTR",
      "Retarget viewers with a second ad: warranty + delivery proof",
    ],
    budget: "KSh 15–30k/month testing budget",
    kpis: ["CTR ≥ 1%", "CPC < KSh 15", "Cost per WhatsApp chat < KSh 80", "ROAS ≥ 3"],
  },
  {
    id: "whatsapp", channel: "WhatsApp status + broadcasts",
    steps: [
      "3 statuses/day max: 1 value, 1 product, 1 proof (delivery, chat, unboxing)",
      "Save every customer number (with permission) — your status is a free ad board",
      "Broadcast lists of ≤256, segmented: buyers, browsers, VIPs — never spam everyone",
      "Personalise: name + product they viewed/asked about",
      "Always close with a question: “Should I hold one for you?”",
    ],
    budget: "Free — your highest-ROI channel",
    kpis: ["Status replies", "Broadcast response rate > 10%", "Replies → orders conversion"],
  },
  {
    id: "google", channel: "Google (search + maps)",
    steps: [
      "Claim a Google Business Profile as an online store — shows in “electronics Nairobi” searches",
      "Write one guide page per top question from NOVA's data (SEO tab shows the gaps)",
      "Target long-tail: “gaming laptop under 50k Kenya”, not “laptops”",
      "Get listed on Kenyan tech directories and answer questions there",
    ],
    budget: "Time + optional KSh 10k/mo search ads on exact product names",
    kpis: ["Impressions for target queries", "Click-through to site", "Guide-page rankings"],
  },
];

export const METRICS: { name: string; what: string; good: string }[] = [
  { name: "CTR", what: "Clicks ÷ impressions — is the creative stopping people?", good: "≥1% ads · 3–6% organic is strong" },
  { name: "CPC", what: "Cost per click — what attention costs you", good: "<KSh 15 for Kenyan electronics" },
  { name: "CPM", what: "Cost per 1,000 impressions", good: "KSh 60–200 depending on audience" },
  { name: "ROAS", what: "Revenue ÷ ad spend — the only number that pays rent", good: "≥3x to scale; <2x means fix creative or product" },
  { name: "Conversion rate", what: "Orders ÷ site visitors", good: "1–2% is typical for electronics; 3%+ is excellent" },
  { name: "AOV", what: "Average order value — lift it with bundles & accessories", good: "NOVA shows yours live in the Overview tab" },
  { name: "CAC", what: "Customer acquisition cost — marketing spend ÷ new customers", good: "Must stay well under your average gross profit per order" },
];

export const OBJECTION_SCRIPTS: { objection: string; script: string }[] = [
  { objection: "“It's expensive”", script: "Compare the TOTAL cost of ownership, not the sticker: genuine stock + 24-month warranty + free Nairobi delivery over 30k. A cheaper grey import with no warranty costs more the day it fails. Want me to show the 3 best options at a lower budget?" },
  { objection: "“Is it genuine?”", script: "Fair question — fakes are everywhere. Every unit we sell is sealed, serial-verified, and the serial checks with the manufacturer. We'll send you the serial before dispatch so you can verify it yourself." },
  { objection: "“Delivery will take forever”", script: "Nairobi orders before 2 PM arrive same day — you'll get dispatch and rider updates on WhatsApp. Outside Nairobi, 1–3 days with a tracking confirmation. Want today's slot?" },
  { objection: "“I'll think about it”", script: "Totally fine. Two things that might help: the price is live stock (it changes), and we're one WhatsApp message away for any question — even after you buy. What's the one thing still unsure?" },
];

export const KENYA_CALENDAR: { when: string; moment: string; play: string }[] = [
  { when: "Jan & Apr & Aug–Sep", moment: "Back to school / campus", play: "Student laptop bundles, “campus-ready” content, payment-plan messaging" },
  { when: "Mar–Apr", moment: "Easter + April rains", play: "Indoor entertainment: TVs, audio, gaming; “rainy-day setup” bundles" },
  { when: "Jun–Jul", moment: "Mid-year / Madaraka", play: "Mid-year clearance on older stock; upgrade campaigns for professionals" },
  { when: "Oct", moment: "Pre-Christmas stocking", play: "Start gifting guides; early-bird prices to beat November rush" },
  { when: "Nov (Black Friday)", moment: "Peak discount season", play: "Real markdowns only — your honesty angle IS the differentiator; daily deal drops" },
  { when: "Dec", moment: "Christmas + gifting", play: "Gift bundles, “we deliver before the 24th” urgency, accessories as gifts" },
];

/* ---------------- the router ---------------- */
export function askMarketing(raw: string): MarketingAnswer {
  const t = raw.toLowerCase();

  if (/roas|ctr|cpc|cpm|cac|metric|benchmark|kpi|measure|analytics.*market/i.test(t)) {
    return {
      title: "The numbers that matter (Kenyan electronics benchmarks)",
      intro: "Ignore vanity metrics. These are the ones that tell you if marketing is paying for itself:",
      steps: METRICS.map((m) => ({ h: `${m.name} — ${m.what}`, body: `Target: ${m.good}` })),
      chips: METRICS.map((m) => m.name),
    };
  }

  if (/tiktok|reels?|video|short.form/i.test(t)) {
    const pb = PLAYBOOKS.find((p) => p.id === "tiktok")!;
    return { title: `Playbook: ${pb.channel}`, intro: "Short-form video is the cheapest attention available right now. The 21-day plan:", steps: pb.steps.map((s, i) => ({ h: `Day rule ${i + 1}`, body: s })), kpis: pb.kpis, example: FRAMEWORKS.find((f) => f.id === "hso")!.example };
  }

  if (/facebook|instagram ad|paid ad|boost|run.*ad|ads\b|advertise|campaign.*run|budget.*ad/i.test(t)) {
    const pb = PLAYBOOKS.find((p) => p.id === "paid")!;
    return { title: `Playbook: ${pb.channel}`, intro: `Start small and let data decide. Suggested testing budget: ${pb.budget}.`, steps: pb.steps.map((s, i) => ({ h: `Step ${i + 1}`, body: s })), kpis: pb.kpis, example: "Week 1: AeroBook 14 at its deal price → measure cost per WhatsApp chat, not likes." };
  }

  if (/whatsapp|status|broadcast/i.test(t)) {
    const pb = PLAYBOOKS.find((p) => p.id === "whatsapp")!;
    return { title: `Playbook: ${pb.channel}`, intro: "This is your highest-ROI channel — you already close orders there.", steps: pb.steps.map((s, i) => ({ h: `Rule ${i + 1}`, body: s })), kpis: pb.kpis };
  }

  if (/google|seo.*market|search\b/i.test(t)) {
    const pb = PLAYBOOKS.find((p) => p.id === "google")!;
    return { title: `Playbook: ${pb.channel}`, intro: "Slow compound growth — the guides you write keep selling for years.", steps: pb.steps.map((s, i) => ({ h: `Step ${i + 1}`, body: s })), kpis: pb.kpis };
  }

  if (/black friday|november|christmas|december|back to school|january|easter|season|calendar/i.test(t)) {
    return {
      title: "Kenya retail calendar — when to push what",
      intro: "Plan stock and content AROUND these moments; demand spikes are predictable:",
      steps: KENYA_CALENDAR.map((c) => ({ h: `${c.when} — ${c.moment}`, body: c.play })),
      chips: KENYA_CALENDAR.map((c) => c.moment),
    };
  }

  if (/objection|expensive|hesitat|not buying|convince|trust issue/i.test(t)) {
    return {
      title: "Objection-handling scripts (use as a human, not a robot)",
      intro: "The four objections that kill most Kenyan electronics sales — and how to answer honestly:",
      steps: OBJECTION_SCRIPTS.map((o) => ({ h: o.objection, body: o.script })),
      example: "Notice the pattern: acknowledge → evidence → a next step. Never fake scarcity or discounts — your honesty is the brand.",
    };
  }

  if (/funnel|journey|awareness|stage/i.test(t)) {
    const f = FRAMEWORKS.find((x) => x.id === "funnel")!;
    return { title: `${f.name} — ${f.tagline}`, intro: f.bestFor, steps: f.steps.map((s, i) => ({ h: `Stage ${i + 1}`, body: s })), example: f.example };
  }

  if (/retain|repeat|loyal|come back|old customer/i.test(t)) {
    const f = FRAMEWORKS.find((x) => x.id === "rfm")!;
    return { title: `${f.name} — ${f.tagline}`, intro: f.bestFor, steps: f.steps.map((s, i) => ({ h: `Move ${i + 1}`, body: s })), example: f.example };
  }

  if (/audit|stall|not growing|strategy|7p|check.*business/i.test(t)) {
    const f = FRAMEWORKS.find((x) => x.id === "sevenps")!;
    return { title: `${f.name} — ${f.tagline}`, intro: f.bestFor, steps: f.steps.map((s, i) => ({ h: `P ${i + 1}`, body: s })), example: f.example };
  }

  // default: teach the two workhorses
  return {
    title: "Start here: the two frameworks that do 80% of the work",
    intro: "Everything in marketing is variation on these. Master them and every post gets sharper:",
    steps: [
      { h: "PAS — Problem, Agitate, Solution", body: FRAMEWORKS.find((f) => f.id === "pas")!.steps.join(" → ") },
      { h: "Hook · Story · Offer", body: FRAMEWORKS.find((f) => f.id === "hso")!.steps.join(" → ") },
      { h: "Then measure", body: "CTR, cost per WhatsApp chat, and ROAS. Cut what underperforms weekly." },
    ],
    example: FRAMEWORKS.find((f) => f.id === "pas")!.example,
    chips: ["TikTok playbook", "Facebook ads", "WhatsApp marketing", "Objection scripts", "Kenya calendar"],
  };
}
