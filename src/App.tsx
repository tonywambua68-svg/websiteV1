import { useEffect } from "react";
import { HashRouter, Link, Route, Routes, useLocation } from "react-router-dom";
import { StoreProvider } from "./lib/store";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { BottomNav, CartDrawer, CompareTray, Toasts } from "./components/Overlays";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductPage from "./pages/Product";
import CartPage from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Account from "./pages/Account";
import Wishlist from "./pages/Wishlist";
import Deals from "./pages/Deals";
import Compare from "./pages/Compare";
import Support from "./pages/Support";
import About from "./pages/About";
import Policies from "./pages/Policies";

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

export default function App() {
  return (
    <HashRouter>
      <StoreProvider>
        <ScrollToTop />
        <div className="flex min-h-screen flex-col pb-16 md:pb-0">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<ProductPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/account" element={<Account />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/deals" element={<Deals />} />
              <Route path="/compare" element={<Compare />} />
          <Route path="/support" element={<Support />} />
          <Route path="/about" element={<About />} />
          <Route path="/policy/:slug" element={<Policies />} />              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
          <BottomNav />
        </div>
        <CartDrawer />
        <CompareTray />
        <Toasts />
      </StoreProvider>
    </HashRouter>
  );
}
