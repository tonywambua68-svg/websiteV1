import { create } from 'zustand';
import { Product, CartItem } from '@/types';

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  calculateTotal: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  total: 0,
  itemCount: 0,

  addItem: (product: Product, quantity: number = 1) => {
    const items = get().items;
    const existingItem = items.find(item => item.product.id === product.id);

    if (existingItem) {
      set({
        items: items.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        ),
      });
    } else {
      set({ items: [...items, { product, quantity }] });
    }

    get().calculateTotal();
  },

  removeItem: (productId: string) => {
    set({ items: get().items.filter(item => item.product.id !== productId) });
    get().calculateTotal();
  },

  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }

    set({
      items: get().items.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      ),
    });
    get().calculateTotal();
  },

  clearCart: () => {
    set({ items: [], total: 0, itemCount: 0 });
  },

  calculateTotal: () => {
    const items = get().items;
    const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const itemCount = items.reduce((count, item) => count + item.quantity, 0);
    set({ total, itemCount });
  },
}));
