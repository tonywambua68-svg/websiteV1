import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getSupabase } from '@/lib/supabase'
import { asCatalogue, type CatalogueProduct } from '@/lib/domain'
import { availableUnits, clampQuantity, lineTotal } from '@/lib/commerce'

export interface CartLine {
  product_id: string
  slug: string
  name: string
  image_url: string | null
  unit_price: number
  quantity: number
  max_quantity: number
  availability: CatalogueProduct['availability']
}

interface CartState {
  items: CartLine[]
  error: string | null
  addItem: (product: CatalogueProduct, quantity?: number) => Promise<boolean>
  updateQuantity: (productId: string, quantity: number) => Promise<void>
  removeItem: (productId: string) => Promise<void>
  clearCart: () => Promise<void>
  totals: () => { subtotal: number; itemCount: number }
  refreshPrices: () => Promise<void>
  syncToServer: () => Promise<void>
  syncFromServer: () => Promise<void>
}

function lineFromProduct(product: CatalogueProduct, quantity: number): CartLine {
  const max = Math.min(10, availableUnits(product.owned_available, product.supplier_available))
  return {
    product_id: product.id,
    slug: product.slug,
    name: product.name,
    image_url: product.image_url,
    unit_price: Number(product.selling_price),
    quantity,
    max_quantity: max,
    availability: product.availability,
  }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      error: null,

      addItem: async (product, quantity = 1) => {
        const maxAvailable = availableUnits(product.owned_available, product.supplier_available)
        if (maxAvailable < 1) {
          set({ error: 'This product is not available.' })
          return false
        }
        const existing = get().items.find((item) => item.product_id === product.id)
        const nextQty = clampQuantity((existing?.quantity ?? 0) + quantity, maxAvailable)
        if (nextQty < (existing?.quantity ?? 0) + quantity) {
          set({ error: `Only ${Math.min(10, maxAvailable)} can be added.` })
          if (nextQty < 1) return false
        } else {
          set({ error: null })
        }
        const line = lineFromProduct(product, nextQty)
        set({
          items: existing
            ? get().items.map((item) => (item.product_id === product.id ? line : item))
            : [...get().items, line],
        })
        await get().syncToServer()
        return true
      },

      updateQuantity: async (productId, quantity) => {
        if (quantity <= 0) {
          await get().removeItem(productId)
          return
        }
        const current = get().items.find((item) => item.product_id === productId)
        if (!current) return
        const safe = clampQuantity(quantity, current.max_quantity)
        if (safe < 1) return
        set({
          error: safe < quantity ? `Only ${current.max_quantity} are available.` : null,
          items: get().items.map((item) => (item.product_id === productId ? { ...item, quantity: safe } : item)),
        })
        await get().syncToServer()
      },

      removeItem: async (productId) => {
        set({ items: get().items.filter((item) => item.product_id !== productId), error: null })
        await get().syncToServer()
      },

      clearCart: async () => {
        set({ items: [], error: null })
        await get().syncToServer()
      },

      totals: () => {
        const items = get().items
        const subtotal = Math.round(items.reduce((sum, item) => sum + lineTotal(item.unit_price, item.quantity), 0) * 100) / 100
        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
        return { subtotal, itemCount }
      },

      refreshPrices: async () => {
        const supabase = getSupabase()
        const ids = get().items.map((item) => item.product_id)
        if (!supabase || ids.length === 0) return
        const { data, error } = await supabase.from('catalogue_products').select('*').in('id', ids)
        if (error || !data) return
        const byId = new Map(data.map((row) => [String(row.id), asCatalogue(row as Record<string, unknown>)]))
        const next: CartLine[] = []
        let note: string | null = null
        for (const item of get().items) {
          const product = byId.get(item.product_id)
          if (!product) {
            note = 'A product was removed because it is no longer published.'
            continue
          }
          const max = Math.min(10, availableUnits(product.owned_available, product.supplier_available))
          if (max < 1) {
            note = 'An unavailable product was removed from the cart.'
            continue
          }
          const quantity = Math.min(item.quantity, max)
          if (quantity !== item.quantity) note = 'A quantity was reduced to match current stock.'
          if (product.selling_price !== item.unit_price) note = note ?? 'A price changed. The cart shows the current selling price.'
          next.push(lineFromProduct(product, quantity))
        }
        set({ items: next, error: note })
      },

      syncToServer: async () => {
        const supabase = getSupabase()
        if (!supabase) return
        const { data: authUser } = await supabase.auth.getUser()
        if (!authUser.user) return
        const { data: cart, error } = await supabase
          .from('carts')
          .upsert({ user_id: authUser.user.id }, { onConflict: 'user_id' })
          .select('id')
          .maybeSingle()
        if (error || !cart) return
        await supabase.from('cart_items').delete().eq('cart_id', cart.id)
        if (get().items.length === 0) return
        await supabase.from('cart_items').insert(
          get().items.map((item) => ({
            cart_id: cart.id,
            product_id: item.product_id,
            quantity: item.quantity,
          })),
        )
      },

      syncFromServer: async () => {
        const supabase = getSupabase()
        if (!supabase) return
        const { data: authUser } = await supabase.auth.getUser()
        if (!authUser.user) return
        const { data: cart } = await supabase.from('carts').select('id').eq('user_id', authUser.user.id).maybeSingle()
        if (!cart) return
        const { data: items } = await supabase.from('cart_items').select('product_id, quantity').eq('cart_id', cart.id)
        if (!items?.length) return
        const { data: products } = await supabase.from('catalogue_products').select('*').in('id', items.map((item) => item.product_id))
        const byId = new Map((products ?? []).map((row) => [String(row.id), asCatalogue(row as Record<string, unknown>)]))
        const lines = items
          .map((item) => {
            const product = byId.get(String(item.product_id))
            if (!product) return null
            const quantity = clampQuantity(Number(item.quantity), availableUnits(product.owned_available, product.supplier_available))
            if (quantity < 1) return null
            return lineFromProduct(product, quantity)
          })
          .filter((line): line is CartLine => Boolean(line))
        if (lines.length) set({ items: lines })
      },
    }),
    { name: 'oremitech-cart', partialize: (state) => ({ items: state.items }) },
  ),
)
