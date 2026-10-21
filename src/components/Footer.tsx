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
              {/* X (Twitter) */}
              <a
                href="#"
                className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 transition hover:border-amber hover:text-amber"
                aria-label="Imara Tech on X"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              {/* Instagram */}
              <a
                href="#"
                className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 transition hover:border-amber hover:text-amber"
                aria-label="Imara Tech on Instagram"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              {/* Facebook */}
              <a
                href="#"
                className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 transition hover:border-amber hover:text-amber"
                aria-label="Imara Tech on Facebook"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              {/* TikTok */}
              <a
                href="#"
                className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 transition hover:border-amber hover:text-amber"
                aria-label="Imara Tech on TikTok"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
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
