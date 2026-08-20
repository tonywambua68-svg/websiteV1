import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { CATEGORIES, fmt, PRODUCTS } from "../data/products";
import { POPULAR_SEARCHES } from "../data/content";
import { useStore } from "../lib/store";
import { useAuth } from "../lib/AuthContext";
import ProductArt from "./ProductArt";
import { SocialRow, WhatsAppButton } from "./Contact";
import {
  IcBolt, IcCart, IcChevD, IcHeart, IcMenu, IcSearch, IcSpark, IcSwap, IcUser, IcX,
} from "./Icons";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Imara Tech home">
      <svg viewBox="0 0 32 32" className="h-9 w-9 shrink-0" aria-hidden="true">
        <rect width="32" height="32" rx="7" fill={light ? "#f5a31a" : "#0a1f1c"} />
        <path d="M10 22V10h4v12z" fill={light ? "#0a1f1c" : "#f5a31a"} />
        <path d="M18 10l6 12h-4.5L15 13z" fill={light ? "#0a1f1c" : "#0b7a63"} />
      </svg>
      <span className="leading-none">
        <span className={`block font-display text-[1.35rem] font-bold tracking-tight ${light ? "text-white" : "text-ink"}`}>
          Imara<span className="text-teal">.</span>
        </span>
        <span className={`block text-[9px] font-extrabold uppercase tracking-[0.32em] ${light ? "text-white/50" : "text-muted"}`}>Tech · Kenya</span>
      </span>
    </Link>
  );
}

const NAV = [
  { label: "Home", to: "/", end: true },
  { label: "Shop", to: "/shop" },
  { label: "Laptops", to: "/shop?cat=laptops" },
  { label: "Phones", to: "/shop?cat=phones" },
  { label: "Gaming", to: "/shop?cat=gaming" },
  { label: "Accessories", to: "/shop?cat=accessories" },
  { label: "New Arrivals", to: "/shop?tag=new" },
  { label: "Support", to: "/support" },
];

const initialsOf = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");

export default function Header() {
  const { cartCount, wishlist, compare, setDrawerOpen } = useStore();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [loc.pathname, loc.search]);

  return (
    <header className="sticky top-0 z-40">
      {/* Announcement */}
      <div className="bg-ink text-center text-[11px] font-bold tracking-wide text-white/85 md:text-xs">
        <p className="wrap flex h-8 items-center justify-center gap-2">
          <IcBolt className="hidden h-3.5 w-3.5 text-amber sm:block" />
          <span className="truncate">Fast delivery across Kenya · Pay with M-PESA PayBill · Order via WhatsApp</span>
        </p>
      </div>

      {/* Main bar */}
      <div className="border-b border-line bg-card/95 backdrop-blur">
        <div className="wrap flex h-16 items-center gap-3 md:gap-6">
          <button type="button" className="btn btn-sm btn-outline !px-2.5 md:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <IcMenu className="h-5 w-5" />
          </button>

          <Logo />

          <div className="hidden flex-1 md:block">
            <SearchBar />
          </div>

          <nav className="ml-auto flex items-center gap-1 md:gap-2" aria-label="Account">
            <Link
              to={user ? "/account" : "/auth?mode=login&redirect=%2Faccount"}
              className="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-mist"
              aria-label={user ? `Your account, ${user.name}` : "Sign in"}
            >
              <span
                className="grid h-8 w-8 place-items-center rounded-full font-display text-[11px] font-bold text-white transition group-hover:scale-105"
                style={{ background: user ? user.avatarHue : "#e3f2ed", color: user ? "#fff" : "#0b7a63" }}
              >
                {user ? initialsOf(user.name) : <IcUser className="h-4 w-4" />}
              </span>
              <span className="hidden text-left leading-tight lg:block">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">{user ? "Account" : "Welcome"}</span>
                <span className="block text-xs font-extrabold">{user ? user.name.split(" ")[0] : "Sign in"}</span>
              </span>
            </Link>

            <Link to="/wishlist" className="relative grid h-10 w-10 place-items-center rounded-lg transition hover:bg-mist" aria-label={`Wishlist, ${wishlist.length} items`}>
              <IcHeart className="h-5 w-5" />
              {wishlist.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-ink px-1 text-[10px] font-extrabold text-amber">{wishlist.length}</span>
              )}
            </Link>

            <Link to="/compare" className="relative hidden h-10 w-10 place-items-center rounded-lg transition hover:bg-mist sm:grid" aria-label={`Compare, ${compare.length} selected`}>
              <IcSwap className="h-5 w-5" />
              {compare.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-teal px-1 text-[10px] font-extrabold text-white">{compare.length}</span>
              )}
            </Link>

            {user?.role === "admin" && (
              <Link
                to="/nova-insights"
                className="hidden h-10 items-center gap-1.5 rounded-lg bg-ink px-3 font-display text-xs font-bold text-amber transition hover:bg-pine lg:flex"
                aria-label="NOVA admin insights"
              >
                <IcSpark className="h-3.5 w-3.5" /> NOVA Insights
              </Link>
            )}

            <button type="button" onClick={() => setDrawerOpen(true)} className="relative flex h-10 items-center gap-2 rounded-lg bg-amber px-3 font-display text-sm font-bold text-ink transition hover:bg-[#ffb538] active:scale-95" aria-label={`Open cart, ${cartCount} items`}>
              <IcCart className="h-5 w-5" />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[10px] font-extrabold text-amber">{cartCount}</span>
              )}
            </button>
          </nav>
        </div>

        {/* Mobile search */}
        <div className="wrap pb-3 md:hidden">
          <SearchBar />
        </div>

        {/* Desktop nav */}
        <nav className="hidden border-t border-line md:block" aria-label="Main">
          <div className="wrap flex items-center gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.label}
                to={n.to}
                end={n.end as boolean | undefined}
                className={({ isActive }) =>
                  `relative px-3.5 py-2.5 text-[13px] font-bold transition hover:text-teal ${
                    n.label === "New Arrivals" ? "text-teal" : ""
                  } ${isActive ? "text-teal after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-teal" : "text-ink/80"}`
                }
              >
                {n.label}
              </NavLink>
            ))}
            <NavLink
              to="/deals"
              className={({ isActive }) =>
                `ml-auto flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-extrabold transition hover:text-amberdeep ${isActive ? "text-amberdeep" : "text-amberdeep/90"}`
              }
            >
              <IcBolt className="h-4 w-4" /> Deals
            </NavLink>
          </div>
        </nav>
      </div>

      {menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} />}
    </header>
  );
}

/* ================= Search ================= */

function SearchBar() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const boxRef = useRef<HTMLDivElement>(null);
  const blurTimer = useRef<number>(0);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return null;
    const prods = PRODUCTS.filter(
      (p) => p.name.toLowerCase().includes(term) || p.brand.toLowerCase().includes(term) || p.category.includes(term),
    ).slice(0, 4);
    const cats = CATEGORIES.filter((c) => c.name.toLowerCase().includes(term)).slice(0, 2);
    return { prods, cats };
  }, [q]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setOpen(false);
    nav(`/shop?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div ref={boxRef} className="relative">
      <form onSubmit={submit} role="search">
        <div className="flex h-11 items-center overflow-hidden rounded-xl border border-line bg-mist transition focus-within:border-teal focus-within:bg-card focus-within:shadow-[0_0_0_3px_rgba(11,122,99,0.12)]">
          <IcSearch className="ml-3.5 h-4.5 w-4.5 shrink-0 text-muted" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true); }}
            onFocus={() => { setOpen(true); window.clearTimeout(blurTimer.current); }}
            placeholder="Search laptops, phones, accessories…"
            aria-label="Search products"
            className="h-full w-full bg-transparent px-2.5 text-sm font-semibold outline-none placeholder:font-medium placeholder:text-muted/70"
          />
          <button type="submit" className="m-1.5 grid h-8 shrink-0 place-items-center rounded-lg bg-teal px-3.5 text-xs font-extrabold text-white transition hover:bg-tealdeep">
            Search
          </button>
        </div>
      </form>

      {open && (
        <div className="card animate-pop absolute inset-x-0 top-[calc(100%+6px)] z-50 overflow-hidden shadow-[0_24px_50px_-20px_rgba(10,31,28,0.35)]">
          {!results ? (
            <div className="p-4">
              <p className="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted">Popular searches</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((s) => (
                  <button key={s} type="button" className="chip" onClick={() => { setQ(s); setOpen(false); nav(`/shop?q=${encodeURIComponent(s)}`); }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : results.prods.length === 0 && results.cats.length === 0 ? (
            <div className="p-5 text-sm font-semibold text-muted">
              No matches for “{q}”. Try “laptop”, “earbuds” or a brand like “Vyra”.
            </div>
          ) : (
            <>
              {results.cats.length > 0 && (
                <div className="border-b border-line p-2">
                  {results.cats.map((c) => (
                    <Link key={c.id} to={`/shop?cat=${c.id}`} onClick={() => setOpen(false)}
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-bold transition hover:bg-mint hover:text-teal">
                      <span>{c.name} <span className="font-semibold text-muted">— category</span></span>
                      <span className="text-xs text-muted">Browse →</span>
                    </Link>
                  ))}
                </div>
              )}
              <div className="p-2">
                {results.prods.map((p) => (
                  <Link key={p.id} to={`/product/${p.id}`} onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-mist">
                    <span className="grid h-10 w-12 shrink-0 place-items-center rounded-md" style={{ background: `linear-gradient(150deg, ${p.hue}22, ${p.hue}08)` }}>
                      <ProductArt kind={p.art} accent={p.hue} className="h-[130%]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-bold">{p.name}</span>
                      <span className="block text-[11px] font-semibold text-muted">{p.brand} · {p.category}</span>
                    </span>
                    <span className="font-display text-[13px] font-bold text-teal">{fmt(p.price)}</span>
                  </Link>
                ))}
              </div>
              <button type="button" onClick={submit}
                className="block w-full border-t border-line bg-mist/60 px-4 py-2.5 text-left text-[13px] font-extrabold text-teal transition hover:bg-mint">
                See all results for “{q}” →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ================= Mobile menu ================= */

function MobileMenu({ onClose }: { onClose: () => void }) {
  const { wishlist, compare } = useStore();
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <button type="button" className="animate-fade absolute inset-0 bg-ink/60" onClick={onClose} aria-label="Close menu" />
      <div className="animate-drawer-left absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col overflow-y-auto bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-line p-4">
          <Logo />
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-lg border border-line transition hover:border-error hover:text-error" aria-label="Close menu">
            <IcX className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-3" aria-label="Mobile main">
          {[...NAV, { label: "Deals", to: "/deals" }].map((n) => (
            <NavLink key={n.label} to={n.to} end={n.end as boolean | undefined}
              className={({ isActive }) => `flex items-center justify-between rounded-xl px-4 py-3 text-[15px] font-bold transition ${isActive ? "bg-mint text-teal" : "hover:bg-mist"}`}>
              {n.label} <IcChevD className="h-4 w-4 -rotate-90 text-muted" />
            </NavLink>
          ))}
        </nav>

        <p className="px-7 pb-1 pt-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted">Shop by category</p>
        <nav className="grid grid-cols-2 gap-2 p-4 pt-1" aria-label="Categories">
          {CATEGORIES.map((c) => (
            <Link key={c.id} to={`/shop?cat=${c.id}`} className="rounded-xl border border-line px-3 py-2.5 text-[13px] font-bold transition hover:border-teal hover:text-teal">
              {c.name}
            </Link>
          ))}
        </nav>

        <div className="mt-auto space-y-3 border-t border-line p-4">
          <WhatsAppButton message="Hello! I'd like to place an order." className="w-full">
            Order via WhatsApp
          </WhatsAppButton>
          <div className="flex items-center justify-between">
            <SocialRow size="h-8 w-8" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Follow us</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Link to={user ? "/account" : "/auth?mode=login&redirect=%2Faccount"} className="rounded-xl bg-mist px-2 py-2.5 text-center text-xs font-extrabold">
              {user ? "Account" : "Sign in"}
            </Link>
            <Link to="/wishlist" className="rounded-xl bg-mist px-2 py-2.5 text-center text-xs font-extrabold">Wishlist ({wishlist.length})</Link>
            <Link to="/compare" className="rounded-xl bg-mist px-2 py-2.5 text-center text-xs font-extrabold">Compare ({compare.length})</Link>
          </div>
          {user ? (
            <button
              type="button"
              onClick={() => { logout(); onClose(); nav("/"); }}
              className="w-full rounded-xl border border-line px-2 py-2.5 text-center text-xs font-extrabold text-error transition hover:border-error"
            >
              Sign out ({user.name.split(" ")[0]})
            </button>
          ) : (
            <Link to="/auth?mode=register" className="block rounded-xl bg-ink px-2 py-2.5 text-center text-xs font-extrabold text-amber">
              Create an account — it's free
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
