import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from "react";
import { byId, type Product } from "../data/products";
import {
  SEED_ADDRESSES, SEED_ORDERS, SEED_TICKETS, statusLabel,
  type Address, type Order, type OrderStatus, type Ticket,
} from "../data/content";

export interface CartItem { p: Product; qty: number }

interface ToastMsg { id: number; msg: string; kind: "success" | "info" | "error" }

interface StoreShape {
  cart: Record<string, number>;
  cartItems: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  cartSavings: number;
  addToCart: (id: string, qty?: number, silent?: boolean) => void;
  setQty: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  wishlist: string[];
  toggleWishlist: (id: string) => void;
  compare: string[];
  toggleCompare: (id: string) => void;
  clearCompare: () => void;
  toasts: ToastMsg[];
  toast: (msg: string, kind?: ToastMsg["kind"]) => void;
  dismissToast: (id: number) => void;
  drawerOpen: boolean;
  setDrawerOpen: (v: boolean) => void;
  orders: Order[];
  placeOrder: (meta: { delivery: number; payment: string; address: string; discount: number }) => Order;
  addresses: Address[];
  addAddress: (a: Omit<Address, "id">) => void;
  removeAddress: (id: string) => void;
  tickets: Ticket[];
  addTicket: (t: Omit<Ticket, "id" | "date" | "status">) => void;
  promo: string | null;
  applyPromo: (code: string) => boolean;
  clearPromo: () => void;
  profile: { name: string; email: string; phone: string };
  updateProfile: (p: { name: string; email: string; phone: string }) => void;
}

const Ctx = createContext<StoreShape | null>(null);

function useLocal<T>(key: string, initial: T) {
  const [v, setV] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(v));
    } catch {
      /* storage unavailable — keep in memory */
    }
  }, [key, v]);
  return [v, setV] as const;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useLocal<Record<string, number>>("imara.cart", {});
  const [wishlist, setWishlist] = useLocal<string[]>("imara.wishlist", ["p1", "p18"]);
  const [compare, setCompare] = useLocal<string[]>("imara.compare", []);
  const [orders, setOrders] = useLocal<Order[]>("imara.orders", SEED_ORDERS);
  const [addresses, setAddresses] = useLocal<Address[]>("imara.addresses", SEED_ADDRESSES);
  const [tickets, setTickets] = useLocal<Ticket[]>("imara.tickets", SEED_TICKETS);
  const [promo, setPromo] = useLocal<string | null>("imara.promo", null);
  const [profile, setProfile] = useLocal("imara.profile", {
    name: "Amina Wanjiku",
    email: "amina@example.co.ke",
    phone: "0712 345 678",
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  const toast = useCallback((msg: string, kind: ToastMsg["kind"] = "success") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((t) => [...t.slice(-2), { id, msg, kind }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const addToCart = useCallback((id: string, qty = 1, silent = false) => {
    const p = byId(id);
    if (!p || p.stock === 0) return;
    setCart((c) => ({ ...c, [id]: Math.min((c[id] ?? 0) + qty, p.stock) }));
    if (!silent) toast(`${p.name} added to cart.`);
  }, [setCart, toast]);

  const setQty = useCallback((id: string, qty: number) => {
    const p = byId(id);
    const max = p ? p.stock : 99;
    setCart((c) => {
      const next = { ...c };
      if (qty <= 0) delete next[id];
      else next[id] = Math.min(qty, max);
      return next;
    });
  }, [setCart]);

  const removeFromCart = useCallback((id: string) => {
    setCart((c) => {
      const next = { ...c };
      delete next[id];
      return next;
    });
  }, [setCart]);

  const clearCart = useCallback(() => setCart({}), [setCart]);

  const toggleWishlist = useCallback((id: string) => {
    setWishlist((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));
  }, [setWishlist]);

  const toggleCompare = useCallback((id: string) => {
    const has = compare.includes(id);
    if (!has && compare.length >= 3) {
      toast("Compare is full — remove one product first.", "info");
      return;
    }
    setCompare(has ? compare.filter((x) => x !== id) : [...compare, id]);
  }, [compare, setCompare, toast]);

  const clearCompare = useCallback(() => setCompare([]), [setCompare]);

  const cartItems = useMemo<CartItem[]>(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => {
          const p = byId(id);
          return p ? { p, qty } : null;
        })
        .filter(Boolean) as CartItem[],
    [cart],
  );

  const cartCount = useMemo(() => cartItems.reduce((s, i) => s + i.qty, 0), [cartItems]);
  const cartSubtotal = useMemo(() => cartItems.reduce((s, i) => s + i.p.price * i.qty, 0), [cartItems]);
  const cartSavings = useMemo(
    () => cartItems.reduce((s, i) => s + (i.p.oldPrice ? (i.p.oldPrice - i.p.price) * i.qty : 0), 0),
    [cartItems],
  );

  const placeOrder = useCallback((meta: { delivery: number; payment: string; address: string; discount: number }) => {
    const items = Object.entries(cart).map(([id, qty]) => ({ id, qty, price: byId(id)?.price ?? 0 }));
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const order: Order = {
      id: `IMR-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`,
      date: new Date().toISOString().slice(0, 10),
      items,
      subtotal,
      delivery: meta.delivery,
      discount: meta.discount,
      total: subtotal - meta.discount + meta.delivery,
      payment: meta.payment,
      status: "payment-pending" as OrderStatus,
      address: meta.address,
    };
    setOrders((o) => [order, ...o]);
    clearCart();
    setPromo(null);
    toast(`Order ${order.id} received — status: ${statusLabel(order.status)}.`);
    return order;
  }, [cart, setOrders, clearCart, setPromo, toast]);

  const addAddress = useCallback((a: Omit<Address, "id">) => {
    setAddresses((list) => [...list, { ...a, id: `a${Date.now()}` }]);
  }, []);

  const removeAddress = useCallback((id: string) => {
    setAddresses((list) => list.filter((a) => a.id !== id));
  }, []);

  const addTicket = useCallback((t: Omit<Ticket, "id" | "date" | "status">) => {
    setTickets((list) => [
      { ...t, id: `T-${1000 + list.length + Math.floor(Math.random() * 90)}`, date: new Date().toISOString().slice(0, 10), status: "Open" as const },
      ...list,
    ]);
  }, []);

  const applyPromo = useCallback((code: string) => {
    if (code.trim().toUpperCase() === "IMARA5") {
      setPromo("IMARA5");
      toast("Code IMARA5 applied — 5% off your order.");
      return true;
    }
    return false;
  }, [toast]);

  const clearPromo = useCallback(() => setPromo(null), []);

  const updateProfile = useCallback((p: { name: string; email: string; phone: string }) => {
    setProfile(p);
    toast("Profile updated.");
  }, [toast]);

  const value: StoreShape = {
    cart, cartItems, cartCount, cartSubtotal, cartSavings,
    addToCart, setQty, removeFromCart, clearCart,
    wishlist, toggleWishlist,
    compare, toggleCompare, clearCompare,
    toasts, toast, dismissToast,
    drawerOpen, setDrawerOpen,
    orders, placeOrder,
    addresses, addAddress, removeAddress,
    tickets, addTicket,
    promo, applyPromo, clearPromo,
    profile, updateProfile,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
