import { useEffect, useState } from "react";
import { HashRouter, Link, Route, Routes, useLocation } from "react-router-dom";
import { StoreProvider } from "./lib/store";
import { AuthProvider } from "./lib/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { BottomNav, CartDrawer, CompareTray, Toasts } from "./components/Overlays";
import NovaChat from "./components/NovaChat";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductPage from "./pages/Product";
import CartPage from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Account from "./pages/Account";
import AuthPage from "./pages/Auth";
import Wishlist from "./pages/Wishlist";
import Deals from "./pages/Deals";
import Compare from "./pages/Compare";
import Support from "./pages/Support";
import About from "./pages/About";
import Policies from "./pages/Policies";
import NovaInsights from "./pages/NovaInsights";

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const id = hash.replace("#", "");
      window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, [pathname, hash]);
  return null;
}

/* Reading progress — a thin amber line that tracks the page */
function ScrollProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setPct(max > 0 ? (h.scrollTop / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-[2.5px] bg-transparent" aria-hidden="true">
      <div className="h-full bg-amber transition-[width] duration-150 ease-out" style={{ width: `${pct}%` }} />
    </div>
  );
}

/* Back to top — appears once you've scrolled into the catalogue */
function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!show) return null;
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="animate-pop fixed bottom-20 left-4 z-[58] grid h-11 w-11 place-items-center rounded-full border border-line bg-card text-ink shadow-[0_12px_30px_-10px_rgba(10,31,28,0.35)] transition hover:-translate-y-0.5 hover:border-teal hover:text-teal md:bottom-6 md:left-6"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}

/* Global shortcuts: "/" focuses search, like the best docs sites */
function useGlobalShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement;
      const typing = el instanceof HTMLElement && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
      if (typing) return;
      const search = document.getElementById("site-search") as HTMLInputElement | null;
      if (search) {
        e.preventDefault();
        search.focus();
        search.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

function NotFound() {
  return (
    <div className="wrap py-24 text-center">
      <p className="font-display text-7xl font-bold text-line">404</p>
      <h1 className="mt-3 font-display text-2xl font-bold">This aisle doesn't exist</h1>
      <p className="mt-2 text-sm font-semibold text-muted">The page you're after was moved, renamed, or never stocked.</p>
      <Link to="/" className="btn btn-amber mt-6">Back to home</Link>
    </div>
  );
}

function RouteShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="animate-page">
      {children}
    </div>
  );
}

function GlobalChrome() {
  useGlobalShortcuts();
  return <ScrollProgress />;
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
      <StoreProvider>
        <ScrollToTop />
        <GlobalChrome />
        <div className="flex min-h-screen flex-col pb-16 md:pb-0">
          <a href="#main" className="skip-link btn btn-dark btn-sm">Skip to content</a>
          <Header />
          <main id="main" className="flex-1">
            <RouteShell>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<ProductPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/deals" element={<Deals />} />
              <Route path="/compare" element={<Compare />} />
          <Route path="/support" element={<Support />} />
          <Route path="/about" element={<About />} />
          <Route path="/policy/:slug" element={<Policies />} />
          <Route path="/nova-insights" element={<NovaInsights />} />
          <Route path="*" element={<NotFound />} />
            </Routes>
            </RouteShell>
          </main>
          <Footer />
          <BottomNav />
        </div>
        <BackToTop />
        <CartDrawer />
        <CompareTray />
        <NovaChat />
        <Toasts />
      </StoreProvider>
      </AuthProvider>
    </HashRouter>
  );
}
