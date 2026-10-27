import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, ProductFilters, SearchParams } from '@/types';
import { searchProducts } from '@/lib/search';
import catalogueJson from '@/data/products.json';

const catalogue = catalogueJson as unknown as Product[];

/** Merge the shipped catalogue with locally-created admin products. */
function mergeCatalogue(persisted: Product[]): Product[] {
  const byId = new Map<string, Product>();
  for (const p of catalogue) byId.set(p.id, p);
  for (const p of persisted) {
    if (!byId.has(p.id)) byId.set(p.id, p);
    else {
      // Admin edits win over the shipped file, but deleted products stay gone.
      const existing = byId.get(p.id)!;
      if (p.status === 'inactive' || existing.updatedAt) byId.set(p.id, { ...existing, ...p });
    }
  }
  return Array.from(byId.values());
}

interface ProductStore {
  products: Product[];
  allProducts: Product[];
  loading: boolean;
  filters: ProductFilters;
  searchParams: SearchParams;
  
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProduct: (id: string) => Product | undefined;
  getAllProducts: () => Product[];
  getAllCatalogue: () => Product[];
  fetchProducts: (filters?: ProductFilters, params?: SearchParams) => Promise<void>;
  fetchProduct: (id: string) => Promise<Product | null>;
  setFilters: (filters: ProductFilters) => void;
  setSearchParams: (params: SearchParams) => void;
  resetFilters: () => void;
}

const defaultFilters: ProductFilters = {};
const defaultSearchParams: SearchParams = {
  limit: 20,
  offset: 0,
  sort: 'date',
  order: 'desc',
};

export const useProductStore = create<ProductStore>()(
  persist(
    (set, get) => ({
      products: catalogue,
      allProducts: catalogue,
      loading: false,
      filters: defaultFilters,
      searchParams: defaultSearchParams,

      addProduct: (product) => {
        const newProduct: Product = {
          ...product,
          id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          products: [...state.products, newProduct],
          allProducts: [...state.allProducts, newProduct],
        }));
      },

      updateProduct: (id, updates) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
          allProducts: state.allProducts.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      deleteProduct: (id) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
          allProducts: state.allProducts.filter((p) => p.id !== id),
        }));
      },

      getProduct: (id) => {
        return get().products.find((p) => p.id === id);
      },

      getAllProducts: () => {
        return get().allProducts;
      },

      fetchProducts: async (filters?: ProductFilters, params?: SearchParams) => {
        set({ loading: true });

        try {
          const currentFilters = filters || get().filters;
          const currentParams = params || get().searchParams;

          let filteredProducts = mergeCatalogue(get().products);

          // Hide products the shopper shouldn't see (admin can still edit them)
          if (!currentFilters.showInactive) {
            filteredProducts = filteredProducts.filter((p) => p.status !== 'inactive');
          }

          // Apply category filter
          if (currentFilters.category) {
            filteredProducts = filteredProducts.filter(p => 
              p.category.toLowerCase() === currentFilters.category!.toLowerCase()
            );
          }

          // Apply brand filter(s) — supports comma-separated multi-select
          if (currentFilters.brand) {
            const brands = currentFilters.brand.split(',').map((b) => b.trim().toLowerCase()).filter(Boolean);
            if (brands.length) {
              filteredProducts = filteredProducts.filter(p => brands.includes(p.brand.toLowerCase()));
            }
          }

          // Subcategory / free-text search via the shared relevance engine
          if (currentFilters.subcategory) {
            filteredProducts = filteredProducts.filter(
              (p) => (p.subcategory ?? '').toLowerCase() === currentFilters.subcategory!.toLowerCase()
            );
          }
          if (currentFilters.search) {
            filteredProducts = searchProducts(filteredProducts, currentFilters.search);
          }

          // Apply price filters
          if (currentFilters.minPrice !== undefined) {
            filteredProducts = filteredProducts.filter(p => p.price >= currentFilters.minPrice!);
          }
          if (currentFilters.maxPrice !== undefined) {
            filteredProducts = filteredProducts.filter(p => p.price <= currentFilters.maxPrice!);
          }

          // Apply stock filter
          if (currentFilters.inStock) {
            filteredProducts = filteredProducts.filter(p => (p.stock ?? (p.inStock ? 10 : 0)) > 0);
          }

          // Apply sorting (relevance from search is preserved unless an explicit sort is chosen)
          const sort = currentParams.sort ?? 'date';
          if (sort === 'name') {
            filteredProducts.sort((a, b) => {
              const comparison = a.name.localeCompare(b.name);
              return currentParams.order === 'asc' ? comparison : -comparison;
            });
          } else if (sort === 'price') {
            filteredProducts.sort((a, b) => {
              const comparison = a.price - b.price;
              return currentParams.order === 'asc' ? comparison : -comparison;
            });
          } else if (sort === 'discount') {
            const pct = (p: Product) => (p.oldPrice && p.oldPrice > p.price ? (p.oldPrice - p.price) / p.oldPrice : 0);
            filteredProducts.sort((a, b) => pct(b) - pct(a));
          } else if (sort === 'rating') {
            filteredProducts.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
          } else if (!currentFilters.search) {
            // "Featured": tagged products first, then newest
            filteredProducts.sort((a, b) => {
              const at = a.tag ? 1 : 0;
              const bt = b.tag ? 1 : 0;
              if (at !== bt) return bt - at;
              return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
            });
          }

          set({ products: filteredProducts, allProducts: mergeCatalogue(get().allProducts), loading: false });
        } catch (error) {
          set({ loading: false });
        }
      },

      fetchProduct: async (id: string) => {
        return mergeCatalogue(get().products).find((p) => p.id === id) || null;
      },

      /** All catalogue products, admin view (includes inactive drafts). */
      getAllCatalogue: () => mergeCatalogue(get().allProducts),

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
      name: 'imara-products',
    }
  )
);
