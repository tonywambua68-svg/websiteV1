import { Link } from "react-router-dom";
import { Crumbs, DemoPill, Reveal } from "../components/ui";
import { WhatsAppButton } from "../components/Contact";
import { IcArrowR, IcBolt, IcShield, IcTruck, IcHeadset } from "../components/Icons";

const COMMITMENTS = [
  ["0", "fake reviews — ever", "Ratings appear only when real customers leave them."],
  ["100%", "serial-verified stock", "If we can't verify it with the manufacturer, we don't list it."],
  ["M-PESA", "PayBill payments", "The simple, familiar way to pay — verified personally on WhatsApp."],
  ["47", "counties delivered", "Nairobi first, then everywhere else — fees shown before you pay."],
];

const VALUES = [
  { icon: IcShield, title: "Genuine or nothing", text: "Every unit comes from authorised distributors, sealed, with a serial number you can verify yourself." },
  { icon: IcBolt, title: "Honest pricing", text: "KSh prices, VAT inclusive, no surprise fees at checkout. Deals are real markdowns, not theatre." },
  { icon: IcTruck, title: "Delivery promises we keep", text: "Timelines and fees are shown before you pay — and we message you at every step of the way." },
  { icon: IcHeadset, title: "Support by technicians", text: "The person who answers on WhatsApp knows the difference between an SSD and a SIM. Ask us anything." },
];

const ROADMAP = [
  { year: "Now", title: "Open for business — online", text: "A focused catalogue of laptops, phones, gaming and accessories. Order on the website or WhatsApp, pay by M-PESA PayBill." },
  { year: "Next", title: "Automatic M-PESA confirmation", text: "PayBill integration that verifies payments instantly, so orders move from “pending” to “processing” without waiting for a message." },
  { year: "Next", title: "Reviews from real customers", text: "Verified-purchase reviews, published only when they're real. We'd rather have five honest ones than five thousand invented ones." },
  { year: "Later", title: "Deeper catalogue, faster delivery", text: "More categories, county-level delivery partners, and a loyalty programme that actually rewards you." },
];

export default function About() {
  return (
    <div>
      {/* Statement */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="grid-lines pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-teal/20 blur-[130px]" />
        <div className="wrap relative py-16 md:py-24">
          <Crumbs items={[{ label: "Home", to: "/" }, { label: "About" }]} />
          <div className="mt-6 max-w-3xl">
            <DemoPill />
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              A new store, built to be the one Kenya <span className="text-amber">trusts</span>.
            </h1>
            <p className="mt-6 max-w-2xl text-[15px] font-semibold leading-relaxed text-white/65 md:text-base">
              "Imara" means firm, solid, reliable in Swahili — and that's the whole brand in one word.
              We're a new, fully online electronics store: no showroom, no middlemen markup, no fake
              five-star reviews. Just genuine technology, honest KSh prices, M-PESA payments and a
              human on WhatsApp who answers.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop" className="btn btn-amber !h-12 !px-7">Browse the shop <IcArrowR className="h-4.5 w-4.5" /></Link>
              <WhatsAppButton message="Hello! I'm new here — I have a question before ordering." className="!h-12 !px-7">
                Ask us anything
              </WhatsAppButton>
            </div>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-4">
            {COMMITMENTS.map(([n, l, s], i) => (
              <Reveal key={l} delay={i * 70}>
                <div className="border-l-2 border-amber/60 pl-4">
                  <p className="font-display text-2xl font-bold text-white md:text-3xl">{n}</p>
                  <p className="mt-1 text-xs font-extrabold uppercase tracking-[0.14em] text-amber/90">{l}</p>
                  <p className="mt-1.5 text-[11.5px] font-semibold leading-relaxed text-white/45">{s}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="wrap py-14 md:py-20">
        <h2 className="font-display text-2xl font-bold md:text-3xl">How we earn trust without shortcuts</h2>
        <p className="mt-2 max-w-xl text-sm font-semibold text-muted">
          Being new means we can't lean on years of reviews — so we lean on transparency instead.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v, i) => {
            const Icon = v.icon;
            return (
              <Reveal key={v.title} delay={i * 60}>
                <div className="card h-full p-5 transition hover:-translate-y-1 hover:border-teal/40 hover:shadow-lg">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-mint text-teal"><Icon className="h-5.5 w-5.5" /></span>
                  <h3 className="mt-3.5 font-display text-[15px] font-bold">{v.title}</h3>
                  <p className="mt-1.5 text-[13px] font-semibold leading-relaxed text-muted">{v.text}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Roadmap */}
      <section className="border-t border-line bg-card py-14 md:py-20">
        <div className="wrap grid gap-10 lg:grid-cols-[320px_1fr]">
          <div>
            <h2 className="font-display text-2xl font-bold md:text-3xl">Where we are & where we're going</h2>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-muted">
              An honest roadmap instead of an invented history. Every milestone here is something
              we're actually building towards.
            </p>
          </div>
          <ol className="relative space-y-8 border-l-2 border-line pl-8">
            {ROADMAP.map((m, i) => (
              <Reveal key={m.title} delay={i * 70}>
                <li className="relative">
                  <span className="absolute -left-[42px] grid h-6 w-6 place-items-center rounded-full border-2 border-teal bg-card">
                    <span className={`h-2 w-2 rounded-full ${i === 0 ? "animate-ping-soft bg-amber" : "bg-teal"}`} />
                  </span>
                  <p className="font-display text-sm font-bold text-teal">{m.year}</p>
                  <h3 className="mt-0.5 font-display text-lg font-bold">{m.title}</h3>
                  <p className="mt-1 max-w-xl text-sm font-semibold leading-relaxed text-muted">{m.text}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="wrap py-14">
        <div className="relative overflow-hidden rounded-2xl bg-ink p-8 text-center text-white md:p-14">
          <div className="grid-lines absolute inset-0" />
          <div className="relative">
            <h2 className="font-display text-2xl font-bold md:text-4xl">See the store in action</h2>
            <p className="mx-auto mt-3 max-w-md text-sm font-semibold text-white/60">
              Browse the catalogue, fill a cart, try the AI finder, place a demo order — every button on this site works.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/shop" className="btn btn-amber !h-12 !px-7">Browse the shop <IcArrowR className="h-4.5 w-4.5" /></Link>
              <Link to="/deals" className="btn btn-light !h-12 !px-7">Today's deals</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
