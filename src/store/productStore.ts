import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, ProductFilters, SearchParams } from '@/types';
import seedProducts from '../data/products.json';

const SEED = seedProducts as unknown as Product[];

interface ProductStore {
  products: Product[];
  visible: Product[];
  loading: boolean;
  filters: ProductFilters;
  searchParams: SearchParams;

  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProduct: (id: string) => Product | undefined;
  getAllProducts: () => Product[];
  fetchProducts: (filters?: ProductFilters, params?: SearchParams) => Promise<void>;
  fetchProduct: (id: string) => Promise<Product | null>;
  setFilters: (filters: ProductFilters) => void;
  setSearchParams: (params: SearchParams) => void;
  resetFilters: () => void;
}

const defaultFilters: ProductFilters = {};
const defaultSearchParams: SearchParams = {
  limit: 100,
  offset: 0,
  sort: 'date',
  order: 'desc',
};

export const useProductStore = create<ProductStore>()(
  persist(
    (set, get) => ({
      products: SEED,
      visible: SEED,
      loading: false,
      filters: defaultFilters,
      searchParams: defaultSearchParams,

      addProduct: (product) => {
        const newProduct: Product = {
          ...product,
          id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Product;
        set((state) => ({ products: [...state.products, newProduct] }));
      },

      updateProduct: (id, updates) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      deleteProduct: (id) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        }));
      },

      getProduct: (id) => get().products.find((p) => p.id === id),

      getAllProducts: () => get().products,

      fetchProducts: async (filters?: ProductFilters, params?: SearchParams) => {
        set({ loading: true });
        try {
          const f = filters || get().filters;
          const p = params || get().searchParams;

          let list = [...get().products];

          if (f.category) {
            const cat = f.category.toLowerCase();
            if (cat === 'deals') {
              list = list.filter((x: any) => x.oldPrice && x.oldPrice > x.price);
            } else {
              list = list.filter((x) => x.category.toLowerCase() === cat);
            }
          }
          if (f.search) {
            const s = f.search.toLowerCase();
            list = list.filter(
              (x) =>
                x.name.toLowerCase().includes(s) ||
                x.brand.toLowerCase().includes(s) ||
                (x.description || '').toLowerCase().includes(s)
            );
          }
          if (f.minPrice !== undefined) list = list.filter((x) => x.price >= f.minPrice!);
          if (f.maxPrice !== undefined) list = list.filter((x) => x.price <= f.maxPrice!);
          if (f.brand) {
            list = list.filter((x) => x.brand.toLowerCase() === f.brand!.toLowerCase());
          }
          if (f.inStock) {
            list = list.filter((x: any) => (x.stock ?? (x.inStock ? 10 : 0)) > 0);
          }

          if (p.sort === 'name') {
            list.sort((a, b) => {
              const c = a.name.localeCompare(b.name);
              return p.order === 'asc' ? c : -c;
            });
          } else if (p.sort === 'price') {
            list.sort((a, b) => {
              const c = a.price - b.price;
              return p.order === 'asc' ? c : -c;
            });
          }

          set({ visible: list, loading: false });
        } catch (error) {
          set({ loading: false });
        }
      },

      fetchProduct: async (id: string) => {
        return get().products.find((p) => p.id === id) || null;
      },

      setFilters: (filters: ProductFilters) => {
        set({ filters: { ...get().filters, ...filters } });
      },

      setSearchParams: (params: SearchParams) => {
        set({ searchParams: { ...get().searchParams, ...params } });
      },

      resetFilters: () => {
        set({ filters: defaultFilters, searchParams: defaultSearchParams });
      },
    }),
    {
      name: 'imara-products-v2',
      version: 2,
      partialize: (state) => ({ products: state.products }),
    }
  )
);