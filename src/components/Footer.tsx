import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-20 bg-ink text-white/80">
      {/* Social / contact strip */}
      <div className="border-b border-white/10">
        <div className="wrap grid gap-8 py-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2.5" aria-label="Imara Tech home">
              <svg viewBox="0 0 32 32" className="h-9 w-9 shrink-0" aria-hidden="true">
                <rect width="32" height="32" rx="7" fill="#f5a31a" />
                <path d="M10 22V10h4v12z" fill="#0a1f1c" />
                <path d="M18 10l6 12h-4.5L15 13z" fill="#0b7a63" />
              </svg>
              <span className="leading-none">
                <span className="block font-display text-[1.35rem] font-bold tracking-tight text-white">
                  Imara<span className="text-teal">.</span>
                </span>
                <span className="block text-[9px] font-extrabold uppercase tracking-[0.32em] text-white/50">
                  Tech · Kenya
                </span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/55">
              Kenya's modern online electronics store. Genuine technology, honest prices in Kenya Shillings, and delivery to all 47 counties.
            </p>
            <div className="mt-4 flex gap-2">
              {['X', 'IG', 'FB', 'TT'].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 text-[11px] font-extrabold transition hover:border-amber hover:text-amber"
                  aria-label={`Imara Tech on ${s}`}
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-amber">Talk to us</p>
            <ul className="space-y-2.5 text-sm font-semibold">
              <li className="flex items-center gap-2.5">
                <span className="text-teal">📱</span>
                <span>WhatsApp: +254 709 000 000</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="text-teal">📧</span>
                <span>karibu@imaratech.example</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="text-teal">🕐</span>
                <span>Mon–Sat, 8:00 AM – 7:00 PM</span>
              </li>
            </ul>
            <p className="mt-3 text-[11.5px] font-bold text-white/40">
              We're an online store — order on the website or WhatsApp and we deliver to your door.
            </p>
          </div>

          <div>
            <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-amber">Shop</p>
            <ul className="space-y-2 text-sm">
              <li><Link to="/shop" className="font-semibold text-white/60 transition hover:text-amber">Laptops</Link></li>
              <li><Link to="/shop" className="font-semibold text-white/60 transition hover:text-amber">Phones</Link></li>
              <li><Link to="/shop" className="font-semibold text-white/60 transition hover:text-amber">Gaming</Link></li>
              <li><Link to="/shop" className="font-semibold text-white/60 transition hover:text-amber">Audio</Link></li>
              <li><Link to="/shop" className="font-semibold text-white/60 transition hover:text-amber">Today's Deals</Link></li>
              <li><Link to="/shop" className="font-semibold text-white/60 transition hover:text-amber">New Arrivals</Link></li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-amber">Customer Support</p>
            <ul className="space-y-2 text-sm">
              <li><Link to="/shop" className="font-semibold text-white/60 transition hover:text-amber">Help centre & FAQs</Link></li>
              <li><Link to="/shop" className="font-semibold text-white/60 transition hover:text-amber">Track your order</Link></li>
              <li><Link to="/shop" className="font-semibold text-white/60 transition hover:text-amber">Returns & refunds</Link></li>
              <li><Link to="/shop" className="font-semibold text-white/60 transition hover:text-amber">Warranty claims</Link></li>
              <li><Link to="/shop" className="font-semibold text-white/60 transition hover:text-amber">Contact us</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Payments */}
      <div className="border-t border-white/10">
        <div className="wrap flex flex-col items-center justify-between gap-4 py-6 md:flex-row">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/40">We accept</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-[#1b9e4b] px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-white">
                M-PESA PAYBILL
              </span>
              <span className="rounded-md border border-dashed border-white/25 px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-white/45">
                CARDS — COMING SOON
              </span>
            </div>
          </div>
          <div className="text-center md:text-right">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/40">Delivery across Kenya</p>
            <p className="mt-1.5 text-xs font-semibold text-white/55">
              Nairobi & all 47 counties · pay securely with M-PESA, verified on WhatsApp
            </p>
          </div>
        </div>
      </div>

      {/* Legal */}
      <div className="border-t border-white/10 bg-black/20">
        <div className="wrap flex flex-col items-center justify-between gap-2 py-4 text-xs font-semibold text-white/40 md:flex-row">
          <p>© 2026 Imara Tech. Design prototype — replace demo details in src/config.ts before going live.</p>
          <p>Prices in Kenya Shillings (KSh) · VAT inclusive</p>
        </div>
      </div>
    </footer>
  );
}
