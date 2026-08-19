import { Link } from "react-router-dom";
import { Logo } from "./Header";
import { BUSINESS, MPESA_PAYBILL_NUMBER } from "../config";
import { SocialRow, WhatsAppButton } from "./Contact";
import { IcChat, IcClock, IcMail, IcPhone } from "./Icons";

const COLS: { title: string; links: { label: string; to: string }[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "Laptops", to: "/shop?cat=laptops" },
      { label: "Phones", to: "/shop?cat=phones" },
      { label: "Gaming", to: "/shop?cat=gaming" },
      { label: "Audio", to: "/shop?cat=audio" },
      { label: "Today's Deals", to: "/deals" },
      { label: "New Arrivals", to: "/shop?tag=new" },
    ],
  },
  {
    title: "Customer Support",
    links: [
      { label: "Help centre & FAQs", to: "/support" },
      { label: "Track your order", to: "/account?tab=orders" },
      { label: "Contact us", to: "/support" },
      { label: "Warranty claims", to: "/support" },
      { label: "Compare products", to: "/compare" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Imara Tech", to: "/about" },
      { label: "Buying guides", to: "/#guides" },
      { label: "AI product finder", to: "/#finder" },
      { label: "New & honest", to: "/about" },
    ],
  },
  {
    title: "Information",
    links: [
      { label: "Delivery policy", to: "/policy/delivery" },
      { label: "Returns & refunds", to: "/policy/returns" },
      { label: "Privacy policy", to: "/policy/privacy" },
      { label: "Terms & conditions", to: "/policy/terms" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-20 bg-ink text-white/80">
      {/* Social / contact strip */}
      <div className="border-b border-white/10">
        <div className="wrap grid gap-8 py-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo light />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/55">
              Kenya's modern online electronics store. Genuine technology, honest
              prices in Kenya Shillings, and delivery to all 47 counties.
            </p>
            <div className="mt-4">
              <SocialRow light />
            </div>
          </div>

          <div className="lg:col-span-1">
            <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-amber">Talk to us</p>
            <ul className="space-y-2.5 text-sm font-semibold">
              <li className="flex items-center gap-2.5">
                <IcChat className="h-4 w-4 shrink-0 text-teal" />
                <WhatsAppButton message="Hello! I have a question about your products." className="!h-auto !border-0 !bg-transparent !p-0 !text-[13px] !font-bold !text-white/80 shadow-none hover:!text-amber hover:!bg-transparent">
                  Chat with us on WhatsApp
                </WhatsAppButton>
              </li>
              {BUSINESS.phone && <li className="flex items-center gap-2.5"><IcPhone className="h-4 w-4 shrink-0 text-teal" /> {BUSINESS.phone}</li>}
              {BUSINESS.email && <li className="flex items-center gap-2.5"><IcMail className="h-4 w-4 shrink-0 text-teal" /> {BUSINESS.email}</li>}
              <li className="flex items-center gap-2.5"><IcClock className="h-4 w-4 shrink-0 text-teal" /> {BUSINESS.hours}</li>
            </ul>
            <p className="mt-3 text-[11.5px] font-bold text-white/40">
              We're an online store — order on the website or WhatsApp and we deliver to your door.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-2 lg:grid-cols-2">
            {COLS.slice(0, 2).map((col) => (
              <div key={col.title}>
                <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-amber">{col.title}</p>
                <ul className="space-y-2 text-sm">
                  {col.links.map((l) => (
                    <li key={l.label}><Link to={l.to} className="font-semibold text-white/60 transition hover:text-amber">{l.label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Link columns */}
      <div className="wrap grid grid-cols-2 gap-8 py-10 sm:grid-cols-4">
        {COLS.map((col) => (
          <div key={col.title}>
            <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/40">{col.title}</p>
            <ul className="space-y-2 text-sm">
              {col.links.map((l) => (
                <li key={l.label}><Link to={l.to} className="font-semibold text-white/60 transition hover:text-amber">{l.label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Payments */}
      <div className="border-t border-white/10">
        <div className="wrap flex flex-col items-center justify-between gap-4 py-6 md:flex-row">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/40">We accept</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-[#1b9e4b] px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-white">M-PESA PAYBILL{MPESA_PAYBILL_NUMBER ? ` · ${MPESA_PAYBILL_NUMBER}` : ""}</span>
              <span className="rounded-md border border-dashed border-white/25 px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-white/45">CARDS — COMING SOON</span>
            </div>
          </div>
          <div className="text-center md:text-right">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/40">Delivery across Kenya</p>
            <p className="mt-1.5 text-xs font-semibold text-white/55">Nairobi & all 47 counties · pay securely with M-PESA, verified on WhatsApp</p>
          </div>
        </div>
      </div>

      {/* Legal */}
      <div className="border-t border-white/10 bg-black/20">
        <div className="wrap flex flex-col items-center justify-between gap-2 py-4 text-xs font-semibold text-white/40 md:flex-row">
          <p>© 2026 {BUSINESS.name}. Design prototype — replace demo details in src/config.ts before going live.</p>
          <p>Prices in Kenya Shillings (KSh) · VAT inclusive</p>
        </div>
      </div>
    </footer>
  );
}
