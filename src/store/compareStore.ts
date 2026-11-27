import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CompareState {
  ids: string[]
  add: (id: string) => void
  remove: (id: string) => void
  clear: () => void
  has: (id: string) => boolean
  toggle: (id: string) => void
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      ids: [],
      add: (id) => {
        const current = get().ids
        if (!current.includes(id) && current.length < 4) {
          set({ ids: [...current, id] })
        }
      },
      remove: (id) => {
        set({ ids: get().ids.filter((i) => i !== id) })
      },
      clear: () => set({ ids: [] }),
      has: (id) => get().ids.includes(id),
      toggle: (id) => {
        const current = get().ids
        if (current.includes(id)) {
          set({ ids: current.filter((i) => i !== id) })
        } else if (current.length < 4) {
          set({ ids: [...current, id] })
        }
      },
    }),
    {
      name: 'oremitech-compare',
    }
  )
)
