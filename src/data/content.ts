// Content for the Imara Tech prototype.
// Honesty-first: no fake reviews, no fake sales counts — this is a new business
// building trust through transparency. Edit wording freely.

export const BRANDS = ["Vyra", "Nexon", "Zuva", "Riftcore", "Pulse", "Meshi", "Voltik", "Halcyon", "Orbita", "Kore"];

export const POPULAR_SEARCHES = ["Gaming laptop", "Phone under 20,000", "ANC headphones", "Power bank", "4K monitor", "Mesh Wi-Fi"];

export const TRUST_ITEMS: { icon: string; title: string; text: string }[] = [
  { icon: "shield", title: "Genuine products", text: "Sourced from authorised distributors, sealed and serial-verified." },
  { icon: "lock", title: "M-PESA PayBill", text: "Pay the simple Kenyan way — clear PayBill instructions with every order." },
  { icon: "truck", title: "Delivery across Kenya", text: "Same-day in Nairobi, 1–3 days to all 47 counties via trusted couriers." },
  { icon: "badge", title: "Warranty support", text: "Up to 24 months cover, coordinated over WhatsApp with courier pickup." },
  { icon: "headset", title: "WhatsApp support", text: "Message us any time — a real technician answers, not a bot." },
  { icon: "refresh", title: "7-day easy returns", text: "Changed your mind? Return it sealed within 7 days, no drama." },
];

export const GUIDES = [
  {
    tag: "Buying guide", mins: 6, title: "Best laptops for students in Kenya (2026)",
    excerpt: "What actually matters for campus life — battery, weight and the RAM sweet spot.",
    tips: ["Aim for 8–16GB RAM; 8GB is the floor for modern coursework", "Under 1.5kg saves your back on lecture days", "Prioritise 8+ hour battery over a dedicated GPU"],
  },
  {
    tag: "Budget", mins: 4, title: "Best phones under KSh 50,000",
    excerpt: "Where the sweet spot is, and which specs are marketing noise.",
    tips: ["120Hz AMOLED is now standard above KSh 25,000 — don't settle for less", "Check for dual SIM + dedicated storage expansion", "67W charging beats a slightly bigger battery"],
  },
  {
    tag: "Explainer", mins: 3, title: "How much RAM do you actually need?",
    excerpt: "8, 16 or 32 gigabytes — a no-nonsense decision tree.",
    tips: ["8GB: browsing, Office, streaming", "16GB: programming, design, heavy multitasking", "32GB: video editing, 3D work, future-proofing"],
  },
  {
    tag: "Buying guide", mins: 5, title: "The laptop buying guide",
    excerpt: "Screen, processor, ports and the five questions to ask before you pay.",
    tips: ["IPS panel, 300+ nits — your eyes will thank you", "NVMe SSD is non-negotiable in 2026", "Count the USB ports you'll actually use before buying"],
  },
];

export const FAQS = [
  { q: "How do I place an order?", a: "Add items to your cart and check out, or tap “Order via WhatsApp” on any product. We confirm availability, delivery and payment with you personally on WhatsApp before dispatch." },
  { q: "How do I pay with M-PESA?", a: "We use M-PESA PayBill. At checkout you'll see our PayBill number and your order reference to use as the Account Number. After paying, send us the M-PESA confirmation message on WhatsApp so we can verify it." },
  { q: "Is payment verified automatically?", a: "Not yet — payments are verified manually on WhatsApp, which is why we ask for your confirmation message. You'll always get a personal confirmation from us before dispatch. Automatic M-PESA integration is on our roadmap." },
  { q: "How fast is delivery?", a: "Same-day within Nairobi for orders placed before 2:00 PM. The rest of Kenya is served by trusted couriers in 1–3 working days. Exact timelines are shown at checkout." },
  { q: "Are your products genuine?", a: "Every item is sourced from authorised distributors, arrives sealed, and carries a serial number you can verify with the manufacturer. If we can't verify a product, we don't stock it." },
  { q: "What does the warranty cover?", a: "Manufacturing defects for the period shown on each product (12–24 months). Physical damage and liquid exposure are not covered. Claims are coordinated over WhatsApp with courier pickup." },
  { q: "What is your return policy?", a: "Sealed products can be returned within 7 days for a full refund or exchange. Opened items qualify within 7 days if faulty. Approved refunds go back to your M-PESA number." },
  { q: "Do you have a physical shop?", a: "No — we are a fully online store, which keeps our prices honest. You order online or via WhatsApp, pay by M-PESA PayBill, and we deliver to your door anywhere in Kenya." },
];

// Home page comparison: Vyra AeroBook 14 (a) vs Riftcore Havoc 15 (b)
export const COMPARE_ROWS: { label: string; a: { v: string; pct: number }; b: { v: string; pct: number } }[] = [
  { label: "Processor", a: { v: "VX-7 OctaCore · 4.6GHz", pct: 78 }, b: { v: "VX-9 8-core", pct: 92 } },
  { label: "RAM", a: { v: "16GB LPDDR5", pct: 70 }, b: { v: "16GB DDR5 (expandable)", pct: 80 } },
  { label: "Storage", a: { v: "512GB NVMe", pct: 55 }, b: { v: "1TB NVMe", pct: 90 } },
  { label: "Display", a: { v: '14" 2.2K · 400 nits', pct: 75 }, b: { v: '15.6" FHD · 144Hz', pct: 85 } },
  { label: "Battery", a: { v: "Up to 14 hours", pct: 92 }, b: { v: "Up to 6 hours", pct: 45 } },
  { label: "Graphics", a: { v: "Vega-X integrated", pct: 40 }, b: { v: "RX-8 8GB dedicated", pct: 95 } },
  { label: "Warranty", a: { v: "24 months", pct: 85 }, b: { v: "24 months", pct: 85 } },
  { label: "Price", a: { v: "KSh 84,999", pct: 70 }, b: { v: "KSh 139,999", pct: 45 } },
];

export const AI_QUICK_PROMPTS = [
  "I need a laptop for programming and school under KSh 80,000",
  "Best phone under 20k with a good camera",
  "Something for gaming with dedicated graphics",
];

export const KENYA_COUNTIES = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret (Uasin Gishu)", "Kiambu", "Machakos",
  "Kajiado", "Meru", "Nyeri", "Kakamega", "Bungoma", "Kericho", "Tharaka Nithi", "Other",
];

/* ----------------------------------------------------------------------------
   ORDER TRACKING — status model (backend-ready)
   The same flow will be driven by WooCommerce order statuses later.
   -------------------------------------------------------------------------- */
export type OrderStatus =
  | "order-received" | "payment-pending" | "payment-confirmed" | "processing"
  | "packed" | "out-for-delivery" | "delivered" | "cancelled";

export const ORDER_FLOW: { id: OrderStatus; label: string; hint: string }[] = [
  { id: "order-received", label: "Order Received", hint: "We've got your order." },
  { id: "payment-pending", label: "Payment Pending", hint: "Awaiting your M-PESA confirmation on WhatsApp." },
  { id: "payment-confirmed", label: "Payment Confirmed", hint: "M-PESA payment verified — thank you!" },
  { id: "processing", label: "Processing", hint: "Your items are being prepared and tested." },
  { id: "packed", label: "Packed", hint: "Sealed, boxed and labelled for dispatch." },
  { id: "out-for-delivery", label: "Out for Delivery", hint: "With the courier — keep your phone close." },
  { id: "delivered", label: "Delivered", hint: "Enjoy your tech!" },
];

export const statusLabel = (s: OrderStatus) =>
  s === "cancelled" ? "Cancelled" : ORDER_FLOW.find((x) => x.id === s)?.label ?? s;

export interface OrderItem { id: string; qty: number; price: number }
export interface Order {
  id: string;
  date: string;
  items: OrderItem[];
  subtotal: number;
  delivery: number;
  discount: number;
  total: number;
  payment: string;
  status: OrderStatus;
  address: string;
  /** Optional note from the customer to the seller (added at checkout). */
  note?: string;
  demo?: boolean;
}

export const SEED_ORDERS: Order[] = [
  {
    id: "IMR-2026-0148", date: "2026-01-28", items: [{ id: "p1", qty: 1, price: 84999 }, { id: "p27", qty: 1, price: 3999 }],
    subtotal: 88998, delivery: 0, discount: 0, total: 88998, payment: "M-PESA PayBill", status: "delivered",
    address: "Amina Wanjiku · Lavington, Nairobi", demo: true,
  },
  {
    id: "IMR-2026-0217", date: "2026-02-09", items: [{ id: "p18", qty: 2, price: 7999 }],
    subtotal: 15998, delivery: 300, discount: 800, total: 15498, payment: "M-PESA PayBill", status: "out-for-delivery",
    address: "Amina Wanjiku · Lavington, Nairobi", demo: true,
  },
];

export interface Address { id: string; label: string; name: string; phone: string; county: string; details: string }
export const SEED_ADDRESSES: Address[] = [
  { id: "a1", label: "Home", name: "Amina Wanjiku", phone: "0712 345 678", county: "Nairobi", details: "Rosecourt Apartments, Gitanga Rd, Lavington" },
  { id: "a2", label: "Office", name: "Amina Wanjiku", phone: "0712 345 678", county: "Nairobi", details: "Delta Towers, 4th Floor, Westlands" },
];

export interface Ticket { id: string; topic: string; message: string; date: string; status: "Open" | "Answered" }
export const SEED_TICKETS: Ticket[] = [
  { id: "T-1042", topic: "Warranty claim — BassPro ANC", message: "Left cup stopped charging after 5 months.", date: "2026-01-19", status: "Answered" },
];
