import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RecentState {
  ids: string[]; // most-recent first, max 12
  push: (id: string) => void;
}

export const useRecentlyViewedStore = create<RecentState>()(
  persist(
    (set) => ({
      ids: [],
      push: (id) =>
        set((s) => ({ ids: [id, ...s.ids.filter((x) => x !== id)].slice(0, 12) })),
    }),
    { name: 'imara-recent' }
  )
);
