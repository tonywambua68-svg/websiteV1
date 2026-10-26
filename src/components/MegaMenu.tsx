import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ArrowRight, Flame, Truck, ShieldCheck, Headphones } from 'lucide-react';
import { megaMenu, type MegaMenuItem, type FeaturedCard } from '@/data/megaMenu';

/* ------------------------------------------------------------------ */
/* Featured promo card shown on the right of every mega panel          */
/* ------------------------------------------------------------------ */

const accentStyles: Record<FeaturedCard['accent'], string> = {
  amber: 'bg-amber text-ink',
  teal: 'bg-teal text-white',
  ink: 'bg-ink text-amber',
};

function PromoCard({ card }: { card: FeaturedCard }) {
  const Icon = card.icon;
  return (
    <Link
      to={card.to}
      className="group/promo relative flex h-full min-h-[150px] flex-col justify-end overflow-hidden rounded-xl border border-line bg-card p-4 transition hover:border-teal/60 hover:shadow-md"
    >
      <span
        className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg ${accentStyles[card.accent]}`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <p className="font-display text-sm font-bold leading-snug text-ink">{card.title}</p>
      <p className="mt-0.5 text-[11px] leading-snug text-muted">{card.subtitle}</p>
      <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wide text-teal">
        Shop now
        <ArrowRight className="h-3.5 w-3.5 transition group-hover/promo:translate-x-0.5" />
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Trust strip under the panel columns                                 */
/* ------------------------------------------------------------------ */

function TrustStrip() {
  const items = [
    { icon: Truck, label: 'Fast delivery across Kenya' },
    { icon: ShieldCheck, label: 'Genuine products & warranty' },
    { icon: Headphones, label: 'Support via WhatsApp' },
    { icon: Flame, label: 'New deals every week' },
  ];
  return (
    <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-4">
      {items.map(({ icon: Icon, label }) => (
        <span key={label} className="flex items-center gap-2 text-[11px] font-bold text-muted">
          <Icon className="h-4 w-4 text-teal" />
          {label}
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Desktop mega panel                                                  */
/* ------------------------------------------------------------------ */

function MegaPanel({ item }: { item: MegaMenuItem }) {
  return (
    <div className="mega-panel absolute left-0 right-0 top-full z-30 origin-top">
      <div className="border-b border-line bg-card shadow-[0_24px_40px_-24px_rgba(10,31,28,0.35)]">
        <div className="wrap py-7">
          <div
            className="grid gap-8"
            style={{
              gridTemplateColumns: `repeat(${item.columns.length}, minmax(0, 1fr)) minmax(230px, 1.15fr)`,
            }}
          >
            {/* Link columns */}
            {item.columns.map((col) => (
              <div key={col.title}>
                <p className="mb-3 border-b-2 border-amber pb-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink">
                  {col.title}
                </p>
                <ul className="space-y-0.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="-mx-1.5 block rounded-md px-1.5 py-1.5 text-[13px] font-medium text-muted transition hover:bg-mist hover:text-teal"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Featured promos */}
            <div className="grid gap-3">
              {item.featured.map((card) => (
                <PromoCard key={card.title} card={card} />
              ))}
            </div>
          </div>

          {/* Bottom row: quick links + trust strip */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {item.footerLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-mist px-3.5 py-1.5 text-[12px] font-bold text-ink transition hover:border-teal hover:text-teal"
                >
                  {link.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ))}
            </div>
            <div className="hidden lg:block">
              <TrustStrip />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Public hook other header pieces can reuse if needed                 */
/* ------------------------------------------------------------------ */

export function useMegaMenuState() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = (i: number) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenIndex(i);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenIndex(null), 120);
  };
  const closeNow = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenIndex(null);
  };

  return { openIndex, open, scheduleClose, closeNow };
}

/* ------------------------------------------------------------------ */
/* Mega menu bar (desktop)                                             */
/* ------------------------------------------------------------------ */

export default function MegaMenu() {
  const { openIndex, open, scheduleClose, closeNow } = useMegaMenuState();
  const location = useLocation();

  // Close the panel whenever the route changes
  useEffect(() => {
    closeNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  return (
    <div className="relative hidden border-t border-line bg-card md:block" onMouseLeave={scheduleClose}>
      <nav className="wrap flex items-stretch gap-1" aria-label="Shop categories">
        {megaMenu.map((item, i) => {
          const Icon = item.icon;
          const isOpen = openIndex === i;
          return (
            <div key={item.label} className="relative" onMouseEnter={() => open(i)} onFocus={() => open(i)} onBlur={scheduleClose}>
              <Link
                to={item.to}
                className={`flex h-12 items-center gap-1.5 border-b-2 px-3.5 text-[13px] font-bold transition ${
                  isOpen
                    ? 'border-amber text-teal'
                    : 'border-transparent text-ink/85 hover:border-teal/40 hover:text-teal'
                }`}
                aria-expanded={isOpen}
                aria-haspopup="true"
              >
                <Icon className="h-4 w-4 text-teal" />
                {item.label}
                <ChevronDown
                  className={`h-3.5 w-3.5 text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
              </Link>
            </div>
          );
        })}

        {/* Right-hand highlight */}
        <div className="ml-auto hidden lg:flex items-center">
          <Link
            to="/shop?category=Deals"
            className="flex h-12 items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-wide text-amberdeep transition hover:text-ink"
          >
            <Flame className="h-4 w-4" />
            Today&apos;s offers
          </Link>
        </div>
      </nav>

      {/* Active panel */}
      {openIndex !== null && (
        <div onMouseEnter={() => open(openIndex)}>
          <MegaPanel item={megaMenu[openIndex]} />
        </div>
      )}
    </div>
  );
}
