// Central shopping rules — used by Cart, Checkout and product pages so the
// numbers a customer sees are always consistent.

import type { Product } from '@/types';

export const FREE_SHIPPING_THRESHOLD = 30000; // KSh
export const BASE_DELIVERY_FEE = 450; // KSh — Nairobi CBD & suburbs
export const COUNTY_DELIVERY_FEE = 700; // KSh — other counties (G4E/RFG estimate)

/** Nairobi metro counties/areas for delivery pricing. */
export const NAIROBI_AREAS = [
  'nairobi', 'kiambu', 'machakos', 'kajiado', 'syokaimu', 'ruka', 'kitengela',
];

export function isNairobiArea(cityOrCounty: string): boolean {
  const c = cityOrCounty.toLowerCase();
  return NAIROBI_AREAS.some((a) => c.includes(a));
}

export function deliveryFee(subtotal: number, location: string): number {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return isNairobiArea(location) ? BASE_DELIVERY_FEE : COUNTY_DELIVERY_FEE;
}

export function formatKsh(n: number): string {
  return `KSh ${Math.round(n).toLocaleString('en-KE')}`;
}

export function stockOf(p: Product): number {
  return p.stock ?? (p.inStock ? 10 : 0);
}

export function discountPct(p: Product): number {
  return p.oldPrice && p.oldPrice > p.price
    ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100)
    : 0;
}

/** Honest, catalogue-based delivery estimate. Never promises a fixed date. */
export function deliveryEstimate(location: string): string {
  if (isNairobiArea(location)) return 'Same day – next morning within Nairobi metro';
  return '2–4 working days upcountry via G4E / RFG';
}

export const WHATSAPP_NUMBER = '254709000000'; // public business number (see Footer)
export const whatsappLink = (message: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
