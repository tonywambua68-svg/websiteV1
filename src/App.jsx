import React, { useState } from "react";

/* =====================================================================
   EDIT THESE CONSTANTS FIRST
   ===================================================================== */
const WHATSAPP_NUMBER = "2547XXXXXXXX"; // <-- put your real number here (no +, no spaces)
const REFERRAL_AMOUNT = 2000; // KES discount when a customer brings a buyer
const BUSINESS_NAME = "Oremitec Tech";
const LOCATION = "Nairobi, Kenya";

/* Build a wa.me link with a prefilled message */
const waLink = (message = `Hi ${BUSINESS_NAME}! I would like to order a laptop.`) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

/* Format price as KES */
const kes = (n) => "KES " + n.toLocaleString("en-KE");

/* =====================================================================
   LAPTOP CATALOG — edit this array to add / remove / change laptops
   fields: id, brand, model, specs[], price (number, KES),
           itStudent (true if great for IT/programming students),
           gradient (CSS background for the placeholder image)
   ===================================================================== */
const LAPTOPS = [
  {
    id: 1,
    brand: "HP",
    model: "EliteBook 840 G5",
    specs: ["Intel Core i5 8th Gen", "8GB RAM", "256GB SSD", "14\" Display"],
    price: 38000,
    itStudent: false,
    gradient: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
  },
  {
    id: 2,
    brand: "Dell",
    model: "Latitude 5490",
    specs: ["Intel Core i5 8th Gen", "8GB RAM", "256GB SSD", "Windows 11 Pro"],
    price: 35000,
    itStudent: false,
    gradient: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",
  },
  {
    id: 3,
    brand: "Lenovo",
    model: "ThinkPad T480",
    specs: ["Intel Core i7 8th Gen", "16GB RAM", "512GB SSD", "Backlit Keyboard"],
    price: 52000,
    itStudent: true,
    gradient: "linear-gradient(135deg, #1e293b 0%, #475569 100%)",
  },
  {
    id: 4,
    brand: "HP",
    model: "ProBook 450 G6",
    specs: ["Intel Core i5 10th Gen", "8GB RAM", "512GB SSD", "15.6\" FHD"],
    price: 58000,
    itStudent: false,
    gradient: "linear-gradient(135deg, #4c1d95 0%, #8b5cf6 100%)",
  },
  {
    id: 5,
    brand: "Dell",
    model: "Precision 5530",
    specs: ["Intel Core i7 8th Gen", "16GB RAM", "512GB SSD", "Quad HD Touch"],
    price: 75000,
    itStudent: true,
    gradient: "linear-gradient(135deg, #9a3412 0%, #f59e0b 100%)",
  },
  {
    id: 6,
    brand: "Apple",
    model: "MacBook Air M1",
    specs: ["Apple M1 Chip", "8GB RAM", "256GB SSD", "macOS Sonoma"],
    price: 95000,
    itStudent: true,
    gradient: "linear-gradient(135deg, #334155 0%, #94a3b8 100%)",
  },
];

/* Catalog filters */
const FILTERS = [
  { key: "all", label: "All" },
  { key: "under40", label: "Under 40K" },
  { key: "40to70", label: "40K - 70K" },
  { key: "over70", label: "70K+" },
  { key: "it", label: "For IT Students" },
];

const applyFilter = (list, key) => {
  switch (key) {
    case "under40":
      return list.filter((l) => l.price < 40000);
    case "40to70":
      return list.filter((l) => l.price >= 40000 && l.price <= 70000);
    case "over70":
      return list.filter((l) => l.price > 70000);
    case "it":
      return list.filter((l) => l.itStudent);
    default:
      return list;
  }
};

/* =====================================================================
   Small icons (inline SVG so we don't need extra packages)
   ===================================================================== */
const IconWhatsApp = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.269.489 1.703.626.714.226 1.363.194 1.877.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const IconCheck = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconChevron = ({ open }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`w-5 h-5 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/* =====================================================================
   NAVBAR
   ===================================================================== */
const NAV_LINKS = [
  { href: "#laptops", label: "Laptops" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#student-offer", label: "Student Offer" },
  { href: "#testimonials", label: "Reviews" },
  { href: "#faq", label: "FAQ" },
];

function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200 shadow-sm">
      <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2 font-extrabold text-xl text-blue-900">
          <span className="w-8 h-8 rounded-lg bg-blue-900 text-white grid place-items-center text-sm font-black">
            OT
          </span>
          {BUSINESS_NAME}
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-slate-600 hover:text-blue-900 transition-colors"
            >
              {l.label}
            </a>
          ))}
          <a
            href={waLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-full shadow transition-colors"
          >
            <IconWhatsApp className="w-4 h-4" /> Order on WhatsApp
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-slate-700"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-6 h-6">
            {open ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-slate-200 px-4 pb-4 pt-2 space-y-1 shadow-lg">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-2 text-slate-700 font-medium hover:text-blue-900"
            >
              {l.label}
            </a>
          ))}
          <a
            href={waLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center justify-center gap-2 bg-green-500 text-white font-semibold px-4 py-3 rounded-full"
          >
            <IconWhatsApp className="w-5 h-5" /> Order on WhatsApp
          </a>
        </div>
      )}
    </header>
  );
}

/* =====================================================================
   HERO
   ===================================================================== */
function Hero() {
  return (
    <section id="top" className="bg-gradient-to-b from-blue-950 via-blue-900 to-blue-800 text-white">
      <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 text-center fade-up">
        <span className="inline-block bg-white/10 border border-white/20 text-blue-100 text-xs md:text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
          🇰🇪 Trusted laptop sourcing in {LOCATION}
        </span>
        <h1 className="text-3xl md:text-5xl font-extrabold leading-tight max-w-3xl mx-auto">
          Tell me your budget. I'll get you the right laptop.
        </h1>
        <p className="mt-5 text-blue-100 md:text-lg max-w-2xl mx-auto">
          Every laptop comes with a <strong className="text-white">warranty</strong>.{" "}
          <strong className="text-white">Inspect it before you pay the balance</strong>, and get{" "}
          <strong className="text-white">delivery within 48 hours</strong>. No shop mark-ups —
          just the best deal for your course and budget.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={waLink(`Hi ${BUSINESS_NAME}! I want a laptop. My budget is ___ and my course is ___.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-white font-bold px-8 py-4 rounded-full shadow-lg shadow-green-500/30 transition-all hover:-translate-y-0.5"
          >
            <IconWhatsApp className="w-5 h-5" /> Order on WhatsApp
          </a>
          <a
            href="#laptops"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-8 py-4 rounded-full transition-all hover:-translate-y-0.5"
          >
            See Laptops ↓
          </a>
        </div>
        <p className="mt-6 text-sm text-blue-200">
          Pay deposit via M-Pesa • Receipts provided • Nairobi pickup or delivery
        </p>
      </div>
    </section>
  );
}

/* =====================================================================
   TRUST BAR
   ===================================================================== */
const TRUST_ITEMS = [
  { title: "Warranty Included", desc: "Every laptop covered" },
  { title: "Inspect Before You Pay", desc: "Check it, then pay balance" },
  { title: "M-Pesa Receipts", desc: "Full payment trail" },
  { title: "48-Hour Delivery", desc: "Fast across Nairobi" },
];

function TrustBar() {
  return (
    <section className="bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
        {TRUST_ITEMS.map((t) => (
          <div key={t.title} className="flex items-start gap-3">
            <span className="mt-0.5 w-8 h-8 rounded-full bg-green-100 text-green-600 grid place-items-center shrink-0">
              <IconCheck className="w-4 h-4" />
            </span>
            <div>
              <p className="font-bold text-slate-800 text-sm md:text-base">{t.title}</p>
              <p className="text-xs md:text-sm text-slate-500">{t.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* =====================================================================
   LAPTOP CATALOG
   ===================================================================== */
function LaptopCard({ laptop }) {
  const msg = `Hi ${BUSINESS_NAME}! I'm interested in the ${laptop.brand} ${laptop.model} (${kes(laptop.price)}). Is it available?`;
  return (
    <article className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden border border-slate-100 flex flex-col">
      {/* Placeholder "image" as gradient */}
      <div
        className="h-40 relative grid place-items-center"
        style={{ background: laptop.gradient }}
        role="img"
        aria-label={`${laptop.brand} ${laptop.model}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 opacity-90">
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M2 20h20" />
        </svg>
        {laptop.itStudent && (
          <span className="absolute top-3 left-3 bg-white/90 text-blue-900 text-[11px] font-bold px-2.5 py-1 rounded-full">
            💻 Great for IT Students
          </span>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">{laptop.brand}</p>
        <h3 className="text-lg font-bold text-slate-800">{laptop.model}</h3>
        <ul className="mt-3 space-y-1.5 flex-1">
          {laptop.specs.map((s) => (
            <li key={s} className="flex items-center gap-2 text-sm text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" /> {s}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xl font-extrabold text-blue-900">{kes(laptop.price)}</p>
        <a
          href={waLink(msg)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-3 rounded-xl transition-colors"
        >
          <IconWhatsApp className="w-4 h-4" /> Order this laptop
        </a>
      </div>
    </article>
  );
}

function Catalog() {
  const [filter, setFilter] = useState("all");
  const shown = applyFilter(LAPTOPS, filter);
  return (
    <section id="laptops" className="max-w-6xl mx-auto px-4 py-14 md:py-20">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900">Popular Laptops</h2>
        <p className="mt-2 text-slate-500 max-w-xl mx-auto">
          These are sample options — tell me your budget and course on WhatsApp and I'll source
          the best fit for you from my trusted suppliers.
        </p>
      </div>

      {/* Filter buttons */}
      <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-8">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
              filter === f.key
                ? "bg-blue-900 text-white border-blue-900 shadow"
                : "bg-white text-slate-600 border-slate-300 hover:border-blue-900 hover:text-blue-900"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="text-center text-slate-500 py-10">
          No laptops in this range right now — message me on WhatsApp and I'll source one for you!
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {shown.map((l) => (
            <LaptopCard key={l.id} laptop={l} />
          ))}
        </div>
      )}

      <div className="text-center mt-10">
        <a
          href={waLink(`Hi ${BUSINESS_NAME}! None of the listed laptops fit — can you source one for my budget?`)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-blue-900 font-semibold hover:underline"
        >
          <IconWhatsApp className="w-4 h-4" /> Can't find your budget? Request a custom search →
        </a>
      </div>
    </section>
  );
}

/* =====================================================================
   HOW IT WORKS
   ===================================================================== */
const STEPS = [
  {
    n: 1,
    title: "Tell me your budget",
    desc: "Message me on WhatsApp with your budget and your course or work needs.",
  },
  {
    n: 2,
    title: "I find the best option",
    desc: "I source the best-value laptop from my trusted suppliers and send you options.",
  },
  {
    n: 3,
    title: "Pay deposit via M-Pesa",
    desc: "Once you pick a laptop, pay a small deposit through M-Pesa — you get a receipt.",
  },
  {
    n: 4,
    title: "Inspect, then pay balance",
    desc: "Test the laptop yourself. Only when you're satisfied do you pay the balance.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-blue-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-14 md:py-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-4xl font-extrabold">How It Works</h2>
          <p className="mt-2 text-blue-200">Simple, safe, and transparent — 4 steps to your laptop.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
            >
              <span className="w-10 h-10 rounded-full bg-green-500 text-white font-extrabold grid place-items-center text-lg">
                {s.n}
              </span>
              <h3 className="mt-4 font-bold text-lg">{s.title}</h3>
              <p className="mt-2 text-sm text-blue-200 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <a
            href={waLink(`Hi ${BUSINESS_NAME}! Let's start. My budget is ___ and my course is ___.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-bold px-8 py-4 rounded-full shadow-lg transition-all hover:-translate-y-0.5"
          >
            <IconWhatsApp className="w-5 h-5" /> Start Step 1 on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}

/* =====================================================================
   STUDENT OFFER + REFERRAL
   ===================================================================== */
function StudentOffer() {
  return (
    <section id="student-offer" className="max-w-6xl mx-auto px-4 py-14 md:py-20">
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-3xl p-8 md:p-12 shadow-xl grid md:grid-cols-2 gap-8 items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-green-300">
            Student Special
          </span>
          <h2 className="mt-2 text-2xl md:text-3xl font-extrabold">
            Student budget? Get a deal that fits it.
          </h2>
          <p className="mt-3 text-blue-100 leading-relaxed">
            ICT, engineering, business or education students — send me your course and allowance,
            and I'll match you with a laptop that handles your software without breaking the bank.
            Bring a classmate along and you both win.
          </p>
        </div>
        <div className="bg-white/10 border border-white/20 rounded-2xl p-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-200">Referral Bonus</p>
          <p className="mt-2 text-3xl md:text-4xl font-extrabold text-green-300">
            {kes(REFERRAL_AMOUNT)} off
          </p>
          <p className="mt-2 text-blue-100 text-sm">
            Bring a buyer, get {kes(REFERRAL_AMOUNT)} off your next purchase or service. Just
            mention their name when you order.
          </p>
          <a
            href={waLink(`Hi ${BUSINESS_NAME}! I'm a student and I'd like a referral offer. My course is ___, budget is ___.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-bold px-6 py-3 rounded-full transition-colors"
          >
            <IconWhatsApp className="w-4 h-4" /> Claim Student Offer
          </a>
        </div>
      </div>
    </section>
  );
}

/* =====================================================================
   TESTIMONIALS (placeholders — replace with real reviews later)
   ===================================================================== */
const TESTIMONIALS = [
  {
    name: "[Student Name]",
    role: "ICT Student, [University]",
    text: "[Placeholder review — e.g. 'Got my ThinkPad within 48 hours. Inspected it before paying the balance. Solid service!']",
  },
  {
    name: "[Lecturer Name]",
    role: "Lecturer, [Institution]",
    text: "[Placeholder review — e.g. 'Needed a reliable laptop for lectures and grading. Oremitec found one within my budget and even sent the M-Pesa receipt promptly.'] ",
  },
  {
    name: "[Office Manager Name]",
    role: "Small Office, Nairobi",
    text: "[Placeholder review — e.g. 'Ordered 3 office laptops. Deposit, inspection, balance — smooth process every step. Will refer colleagues.'] ",
  },
];

function Testimonials() {
  return (
    <section id="testimonials" className="bg-white border-y border-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-14 md:py-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900">What Customers Say</h2>
          <p className="mt-2 text-slate-500">Real reviews from students, lecturers and offices.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-amber-400 text-lg" aria-label="5 star rating">★★★★★</div>
              <blockquote className="mt-3 text-slate-600 text-sm leading-relaxed">{t.text}</blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-blue-900 text-white grid place-items-center font-bold">
                  {t.name.replace(/[^A-Za-z]/g, "").slice(0, 1) || "O"}
                </span>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =====================================================================
   FAQ (accordion)
   ===================================================================== */
const FAQS = [
  {
    q: "Do the laptops come with a warranty?",
    a: "Yes. Every laptop I source comes with a warranty. I'll tell you the exact coverage period for each option before you commit, and it's confirmed in writing on WhatsApp.",
  },
  {
    q: "How does payment work?",
    a: "You pay a small deposit via M-Pesa to reserve the laptop — you always get the M-Pesa receipt. When the laptop arrives, you inspect and test it yourself. Only after you're satisfied do you pay the balance. I never ask for full payment before you've seen the laptop.",
  },
  {
    q: "How fast is delivery?",
    a: "Most orders are delivered within 48 hours anywhere in Nairobi once the supplier confirms the unit. You can also pick up in person if that's easier for you.",
  },
  {
    q: "What if the laptop has a problem after I receive it?",
    a: "Inspect it before paying the balance — if anything isn't as described, don't pay and you lose nothing beyond the handled process. After purchase, warranty claims are sorted directly with the trusted supplier, and I stay involved to make sure it's resolved.",
  },
];

function FaqItem({ item, isOpen, onToggle }) {
  return (
    <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
        aria-expanded={isOpen}
      >
        {item.q}
        <IconChevron open={isOpen} />
      </button>
      <div
        className="px-5 text-slate-600 text-sm leading-relaxed transition-all duration-300"
        style={{ maxHeight: isOpen ? "240px" : "0px", paddingBottom: isOpen ? "16px" : "0px", paddingTop: isOpen ? "4px" : "0px" }}
      >
        {item.a}
      </div>
    </div>
  );
}

function Faq() {
  const [openIndex, setOpenIndex] = useState(0);
  return (
    <section id="faq" className="max-w-3xl mx-auto px-4 py-14 md:py-20">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
        <p className="mt-2 text-slate-500">Still unsure? Ask me directly on WhatsApp.</p>
      </div>
      <div className="space-y-3">
        {FAQS.map((f, i) => (
          <FaqItem
            key={f.q}
            item={f}
            isOpen={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
          />
        ))}
      </div>
    </section>
  );
}

/* =====================================================================
   FINAL CTA + FOOTER
   ===================================================================== */
function FinalCta() {
  return (
    <section className="bg-gradient-to-b from-blue-900 to-blue-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-14 md:py-20 text-center">
        <h2 className="text-2xl md:text-4xl font-extrabold">
          Ready for a laptop that fits your budget?
        </h2>
        <p className="mt-3 text-blue-200 max-w-xl mx-auto">
          One WhatsApp message is all it takes. Tell me your budget and course — I'll handle the rest.
        </p>
        <a
          href={waLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-7 inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-bold px-10 py-4 rounded-full shadow-lg shadow-green-500/30 transition-all hover:-translate-y-0.5"
        >
          <IconWhatsApp className="w-5 h-5" /> Order on WhatsApp Now
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400">
      <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8">
        <div>
          <p className="text-white font-extrabold text-lg flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-blue-800 text-white grid place-items-center text-xs font-black">OT</span>
            {BUSINESS_NAME}
          </p>
          <p className="mt-3 text-sm leading-relaxed">
            Affordable, quality laptops sourced for students, lecturers and small offices.
            Warranty included. Inspect before you pay.
          </p>
        </div>
        <div>
          <p className="text-white font-bold mb-3">Quick Links</p>
          <ul className="space-y-2 text-sm">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="hover:text-white transition-colors">{l.label}</a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-white font-bold mb-3">Contact</p>
          <ul className="space-y-2 text-sm">
            <li>
              <a href={waLink()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-green-400 transition-colors">
                <IconWhatsApp className="w-4 h-4" /> +{WHATSAPP_NUMBER} (WhatsApp)
              </a>
            </li>
            <li>📍 {LOCATION}</li>
            <li>⚡ Delivery within 48 hours</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800">
        <p className="text-center text-xs py-5">
          © {new Date().getFullYear()} {BUSINESS_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

/* =====================================================================
   FLOATING WHATSAPP BUTTON
   ===================================================================== */
function FloatingWhatsApp() {
  return (
    <a
      href={waLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Oremitec Tech on WhatsApp"
      className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-xl shadow-green-500/40 grid place-items-center transition-transform hover:scale-110"
    >
      <IconWhatsApp className="w-7 h-7" />
    </a>
  );
}

/* =====================================================================
   APP
   ===================================================================== */
export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <TrustBar />
        <Catalog />
        <HowItWorks />
        <StudentOffer />
        <Testimonials />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
