import { create } from 'zustand';
import { Product, ProductFilters, SearchParams } from '@/types';
import productsData from '@/data/products.json';

interface ProductState {
  products: Product[];
  loading: boolean;
  error: string | null;
  filters: ProductFilters;
  searchParams: SearchParams;
  total: number;
  hasMore: boolean;
  
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

// Convert JSON data to Product type
const allProducts: Product[] = productsData.map(p => ({
  id: p.id,
  sku: p.id,
  name: p.name,
  brand: p.brand,
  category: p.category,
  price: p.price,
  oldPrice: p.oldPrice || undefined,
  images: [p.image],
  stock: p.inStock ? 10 : 0,
  description: p.description,
  url: `/product/${p.id}`,
  status: 'active' as const,
  source: 'local',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  loading: false,
  error: null,
  filters: defaultFilters,
  searchParams: defaultSearchParams,
  total: 0,
  hasMore: false,

  fetchProducts: async (filters?: ProductFilters, params?: SearchParams) => {
    set({ loading: true, error: null });
    
    try {
      const currentFilters = filters || get().filters;
      const currentParams = params || get().searchParams;
      
      let filteredProducts = [...allProducts];

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
        filteredProducts = filteredProducts.filter(p => p.stock > 0);
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

      // Apply pagination
      const offset = currentParams.offset || 0;
      const limit = currentParams.limit || 20;
      const paginatedProducts = filteredProducts.slice(offset, offset + limit);

      set({
        products: paginatedProducts,
        total: filteredProducts.length,
        hasMore: offset + limit < filteredProducts.length,
        loading: false,
      });
    } catch (error) {
      set({ error: 'Failed to fetch products', loading: false });
    }
  },

  fetchProduct: async (id: string) => {
    set({ loading: true, error: null });
    
    try {
      const product = allProducts.find(p => p.id === id);
      
      if (product) {
        set({ loading: false });
        return product;
      } else {
        set({ error: 'Product not found', loading: false });
        return null;
      }
    } catch (error) {
      set({ error: 'Failed to fetch product', loading: false });
      return null;
    }
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
}));
