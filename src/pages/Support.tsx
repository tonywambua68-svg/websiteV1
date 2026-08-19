import { useState } from "react";
import { Link } from "react-router-dom";
import { FAQS } from "../data/content";
import { useStore } from "../lib/store";
import { BUSINESS } from "../config";
import { Crumbs, Reveal } from "../components/ui";
import { SocialRow, WhatsAppButton } from "../components/Contact";
import { IcCheck, IcChevD, IcClock, IcHeadset, IcMail, IcPhone, IcTruck, IcRefresh, IcShield } from "../components/Icons";

export default function Support() {
  const { toast, addTicket } = useStore();
  const [open, setOpen] = useState<number | null>(0);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", contact: "", topic: "Delivery question", message: "" });

  return (
    <div className="wrap py-8 md:py-12">
      <Crumbs items={[{ label: "Home", to: "/" }, { label: "Support" }]} />
      <div className="mt-4 max-w-2xl">
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-5xl">Talk to a human,<br />not a hotline.</h1>
        <p className="mt-3 text-[15px] font-semibold leading-relaxed text-muted">
          We're an online store — WhatsApp is our front desk. Real technicians answer our
          messages and calls, and every order is confirmed personally before dispatch.
        </p>
        <div className="mt-4 flex items-center gap-4">
          <SocialRow />
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted">Follow us</span>
        </div>
      </div>

      {/* Contact channels */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Reveal>
          <div className="card flex h-full flex-col p-5 transition hover:-translate-y-1 hover:shadow-lg">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#1b9e4b]/12 text-[#1b9e4b]">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5.5 w-5.5" aria-hidden="true"><path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.96L2 22l5.18-1.5A9.93 9.93 0 1 0 12.04 2Zm5.84 14.13c-.25.7-1.45 1.33-2 1.38-.53.05-1.03.24-3.47-.72-2.93-1.15-4.78-4.16-4.92-4.35-.14-.2-1.16-1.55-1.16-2.96 0-1.4.74-2.1 1-2.38.26-.29.57-.36.76-.36h.55c.18 0 .42-.07.66.5.25.6.84 2.07.91 2.22.07.14.12.31.02.5-.09.2-.14.31-.28.48-.14.17-.3.38-.42.51-.14.14-.29.3-.12.58.16.29.73 1.2 1.57 1.95 1.08.96 1.99 1.26 2.27 1.4.29.14.45.12.62-.07.16-.19.7-.82.89-1.1.19-.29.38-.24.64-.14.26.09 1.65.78 1.93.92.29.14.48.22.55.34.07.12.07.7-.18 1.4Z" /></svg>
            </span>
            <h2 className="mt-3 font-display text-lg font-bold">WhatsApp</h2>
            <p className="text-[13px] font-extrabold text-[#128C7E]">The fastest way to reach us</p>
            <p className="mt-1 text-xs font-semibold text-muted">Orders, availability, payments, warranty — all of it.</p>
            <WhatsAppButton message="Hello! I need some help." className="btn-sm mt-4">
              Chat with us on WhatsApp
            </WhatsAppButton>
          </div>
        </Reveal>

        <Reveal delay={60}>
          <div className="card flex h-full flex-col p-5 transition hover:-translate-y-1 hover:shadow-lg">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-mint text-teal"><IcPhone className="h-5.5 w-5.5" /></span>
            <h2 className="mt-3 font-display text-lg font-bold">Call us</h2>
            <p className="text-[13px] font-extrabold text-teal">{BUSINESS.phone || "Add your number in src/config.ts"}</p>
            <p className="mt-1 text-xs font-semibold text-muted">{BUSINESS.hours}</p>
            {BUSINESS.phone ? (
              <a href={`tel:${BUSINESS.phone.replace(/\s/g, "")}`} className="btn btn-outline btn-sm mt-4">Call now</a>
            ) : (
              <button type="button" onClick={() => toast("Add your phone number in src/config.ts to activate this button.", "info")} className="btn btn-outline btn-sm mt-4 opacity-60">Not configured yet</button>
            )}
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="card flex h-full flex-col p-5 transition hover:-translate-y-1 hover:shadow-lg">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber/12 text-amberdeep"><IcMail className="h-5.5 w-5.5" /></span>
            <h2 className="mt-3 font-display text-lg font-bold">Email</h2>
            <p className="break-all text-[13px] font-extrabold text-teal">{BUSINESS.email || "Add your email in src/config.ts"}</p>
            <p className="mt-1 text-xs font-semibold text-muted">For quotes, bulk orders and paperwork.</p>
            {BUSINESS.email ? (
              <a href={`mailto:${BUSINESS.email}`} className="btn btn-outline btn-sm mt-4">Send email</a>
            ) : (
              <button type="button" onClick={() => toast("Add your email in src/config.ts to activate this button.", "info")} className="btn btn-outline btn-sm mt-4 opacity-60">Not configured yet</button>
            )}
          </div>
        </Reveal>

        <Reveal delay={180}>
          <div className="card flex h-full flex-col bg-ink p-5 text-white transition hover:-translate-y-1 hover:shadow-lg">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber/15 text-amber"><IcHeadset className="h-5.5 w-5.5" /></span>
            <h2 className="mt-3 font-display text-lg font-bold">How ordering works</h2>
            <ol className="mt-2 space-y-1.5 text-xs font-semibold text-white/70">
              {["Browse & add to cart (or message us)", "Checkout or order via WhatsApp", "Pay with M-PESA PayBill", "Send us the confirmation — we deliver"].map((s, i) => (
                <li key={s} className="flex items-start gap-2">
                  <span className="mt-0.5 grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full bg-amber/20 text-[10px] font-extrabold text-amber">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
            <Link to="/policy/delivery" className="btn btn-light btn-sm mt-4">Delivery policy</Link>
          </div>
        </Reveal>
      </div>

      {/* FAQ + form */}
      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_400px]">
        <div>
          <h2 className="font-display text-2xl font-bold">Frequently asked questions</h2>
          <div className="mt-4 space-y-2.5">
            {FAQS.map((f, i) => (
              <div key={f.q} className={`card overflow-hidden transition ${open === i ? "border-teal/50" : ""}`}>
                <button type="button" onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-4 p-4 text-left md:p-5" aria-expanded={open === i}>
                  <span className="text-[14.5px] font-extrabold">{f.q}</span>
                  <IcChevD className={`h-4.5 w-4.5 shrink-0 text-muted transition-transform duration-300 ${open === i ? "rotate-180 text-teal" : ""}`} />
                </button>
                {open === i && <p className="animate-pop border-t border-line px-4 py-4 text-sm font-semibold leading-relaxed text-muted md:px-5">{f.a}</p>}
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { icon: IcTruck, title: "Delivery", text: "Timelines & fees shown before you pay", to: "/policy/delivery" },
              { icon: IcShield, title: "Warranty", text: "12–24 months, coordinated on WhatsApp", to: "/support" },
              { icon: IcRefresh, title: "Returns", text: "7 days, sealed items, honest refunds", to: "/policy/returns" },
            ].map((x) => {
              const Icon = x.icon;
              return (
                <Link key={x.title} to={x.to} className="rounded-xl bg-ink p-4 text-white transition hover:-translate-y-0.5 hover:shadow-lg">
                  <Icon className="h-5 w-5 text-amber" />
                  <p className="mt-2 font-display text-sm font-bold">{x.title}</p>
                  <p className="text-[11.5px] font-semibold text-white/55">{x.text}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Contact form */}
        <aside>
          <div className="card sticky top-40 p-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold"><IcHeadset className="h-5.5 w-5.5 text-teal" /> Send us a message</h2>
            {sent ? (
              <div className="animate-pop mt-5 rounded-xl bg-mint p-5 text-center">
                <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-success text-white"><IcCheck className="h-5 w-5" /></span>
                <p className="mt-3 font-display text-base font-bold">Message received!</p>
                <p className="mt-1 text-[13px] font-semibold text-muted">In the live store this lands straight in our support queue. (Demo — nothing was sent.)</p>
                <button type="button" className="btn btn-outline btn-sm mt-4" onClick={() => setSent(false)}>Send another</button>
              </div>
            ) : (
              <form className="mt-5 space-y-3.5" onSubmit={(e) => {
                e.preventDefault();
                addTicket({ topic: form.topic + (form.name ? ` — ${form.name}` : ""), message: form.message });
                toast("Support ticket created (demo).");
                setSent(true);
              }}>
                <label className="block text-xs font-extrabold text-muted">Your name
                  <input required className="input mt-1.5" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Brian Otieno" />
                </label>
                <label className="block text-xs font-extrabold text-muted">Phone or email
                  <input required className="input mt-1.5" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="07XX XXX XXX" />
                </label>
                <label className="block text-xs font-extrabold text-muted">Topic
                  <select className="input mt-1.5" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}>
                    {["Delivery question", "Product advice", "Payment / M-PESA help", "Warranty claim", "Return / refund", "Order issue", "Something else"].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </label>
                <label className="block text-xs font-extrabold text-muted">Message
                  <textarea required className="input mt-1.5 !h-28 !py-2.5" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="How can we help?" />
                </label>
                <button type="submit" className="btn btn-amber w-full">Send message</button>
                <p className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-muted"><IcClock className="h-3.5 w-3.5" /> A real person answers — usually within the hour</p>
              </form>
            )}
          </div>
        </aside>
      </div>

      <p className="mt-10 text-center text-sm font-semibold text-muted">
        Managing an existing order? <Link to="/account?tab=orders" className="font-extrabold text-teal underline-offset-2 hover:underline">Track it in your account →</Link>
      </p>
    </div>
  );
}
