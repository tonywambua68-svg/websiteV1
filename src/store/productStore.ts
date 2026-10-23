import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, ProductFilters, SearchParams } from '@/types';

interface ProductStore {
  products: Product[];
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
  limit: 20,
  offset: 0,
  sort: 'date',
  order: 'desc',
};

export const useProductStore = create<ProductStore>()(
  persist(
    (set, get) => ({
      products: [],
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

      getProduct: (id) => {
        return get().products.find((p) => p.id === id);
      },

      getAllProducts: () => {
        return get().products;
      },

      fetchProducts: async (filters?: ProductFilters, params?: SearchParams) => {
        set({ loading: true });
        
        try {
          const currentFilters = filters || get().filters;
          const currentParams = params || get().searchParams;
          
          let filteredProducts = [...get().products];

          // Apply category filter
          if (currentFilters.category) {
            filteredProducts = filteredProducts.filter(p => 
              p.category.toLowerCase() === currentFilters.category!.toLowerCase()
            );
          }

          // Apply search filter
          if (currentFilters.search) {
            const searchTerm = currentFilters.search.toLowerCase();
            filteredProducts = filteredProducts.filter(p =>
              p.name.toLowerCase().includes(searchTerm) ||
              p.brand.toLowerCase().includes(searchTerm) ||
              p.description.toLowerCase().includes(searchTerm)
            );
          }

          // Apply price filters
          if (currentFilters.minPrice !== undefined) {
            filteredProducts = filteredProducts.filter(p => p.price >= currentFilters.minPrice!);
          }
          if (currentFilters.maxPrice !== undefined) {
            filteredProducts = filteredProducts.filter(p => p.price <= currentFilters.maxPrice!);
          }

          // Apply brand filter
          if (currentFilters.brand) {
            filteredProducts = filteredProducts.filter(p => 
              p.brand.toLowerCase() === currentFilters.brand!.toLowerCase()
            );
          }

          // Apply stock filter
          if (currentFilters.inStock) {
            filteredProducts = filteredProducts.filter(p => (p.stock ?? (p.inStock ? 10 : 0)) > 0);
          }

          // Apply sorting
          if (currentParams.sort === 'name') {
            filteredProducts.sort((a, b) => {
              const comparison = a.name.localeCompare(b.name);
              return currentParams.order === 'asc' ? comparison : -comparison;
            });
          } else if (currentParams.sort === 'price') {
            filteredProducts.sort((a, b) => {
              const comparison = a.price - b.price;
              return currentParams.order === 'asc' ? comparison : -comparison;
            });
          }

          set({ products: filteredProducts, loading: false });
        } catch (error) {
          set({ loading: false });
        }
      },

      fetchProduct: async (id: string) => {
        const product = get().products.find(p => p.id === id);
        return product || null;
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
      name: 'imara-products',
    }
  )
);
