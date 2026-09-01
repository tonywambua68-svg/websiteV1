/**
 * Verified-purchase reviews — HONESTY-FIRST.
 *
 * There are NO seeded/fake reviews. A review can only be written by a
 * signed-in customer whose order history actually contains the product
 * (verified-purchase rule, Amazon-style). Every review is marked with the
 * order it came from. Until a real backend exists, reviews persist in this
 * browser's localStorage and are clearly labelled demo-session data in the UI.
 */

import type { Order } from "../data/content";
import type { SafeUser } from "./auth";

export interface Review {
  id: string;
  productId: string;
  userName: string;
  orderId: string;
  rating: number; // 1–5
  title: string;
  text: string;
  date: string; // ISO
}

const KEY = "imara.reviews.v1";

function load(): Review[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Review[]) : [];
  } catch {
    return [];
  }
}
function save(list: Review[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(-300)));
  } catch {
    /* storage unavailable — fail soft */
  }
}

export function getReviews(productId: string): Review[] {
  return load()
    .filter((r) => r.productId === productId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** A customer may review a product only if one of their orders contains it. */
export function qualifyingOrder(user: SafeUser | null, orders: Order[], productId: string): Order | null {
  if (!user) return null;
  return orders.find((o) => o.items.some((i) => i.id === productId)) ?? null;
}

export function addReview(input: {
  user: SafeUser;
  order: Order;
  productId: string;
  rating: number;
  title: string;
  text: string;
}): Review {
  const rating = Math.max(1, Math.min(5, Math.round(input.rating)));
  const review: Review = {
    id: `r_${Date.now()}_${Math.floor(Math.random() * 1e5)}`,
    productId: input.productId,
    userName: input.user.name,
    orderId: input.order.id,
    rating,
    title: input.title.trim().slice(0, 90),
    text: input.text.trim().slice(0, 1200),
    date: new Date().toISOString(),
  };
  const list = load();
  list.push(review);
  save(list);
  return review;
}
