import { create } from 'zustand';
import { Product, ProductFilters, SearchParams } from '@/types';
import apiClient from '@/lib/api';

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
      
      const response = await apiClient.get<any>('/products', {
        ...currentFilters,
        ...currentParams,
      });

      if (response.success && response.data) {
        set({
          products: response.data.data || [],
          total: response.data.total || 0,
          hasMore: response.data.hasMore || false,
          loading: false,
        });
      } else {
        set({ error: response.error || 'Failed to fetch products', loading: false });
      }
    } catch (error) {
      set({ error: 'Failed to fetch products', loading: false });
    }
  },

  fetchProduct: async (id: string) => {
    set({ loading: true, error: null });
    
    try {
      const response = await apiClient.get<any>(`/products/${id}`);
      
      if (response.success && response.data) {
        set({ loading: false });
        return response.data;
      } else {
        set({ error: response.error || 'Failed to fetch product', loading: false });
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
