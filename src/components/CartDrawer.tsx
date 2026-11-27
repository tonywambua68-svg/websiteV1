import { Link, useNavigate } from 'react-router-dom'
import { useCartStore } from '@/store/cartStore'
import { X, CheckCircle2, ShoppingCart, ArrowRight, Trash2, Plus, Minus } from 'lucide-react'
import { formatKES } from '@/lib/commerce'

const PLACEHOLDER = '/images/products/laptop-placeholder.svg'

export default function CartDrawer() {
  const { items, isDrawerOpen, setDrawerOpen, lastAddedItem, totals, updateQuantity, removeItem } = useCartStore()
  const navigate = useNavigate()
  const { subtotal, itemCount } = totals()

  if (!isDrawerOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-out Panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-line animate-drawer">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line px-5 py-4 bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-emerald-100 text-success">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-display text-sm font-bold text-ink">Added to Cart</h2>
                <p className="text-[11px] text-muted">{itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-ink transition-colors"
              aria-label="Close cart drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Recently Added Item Banner */}
          {lastAddedItem && (
            <div className="border-b border-line bg-blue-50/60 p-4">
              <div className="flex items-center gap-3">
                <img
                  src={lastAddedItem.image_url || PLACEHOLDER}
                  alt={lastAddedItem.name}
                  className="h-14 w-14 rounded-md border border-slate-200 bg-white object-contain p-1 shrink-0"
                  onError={(e) => {
                    e.currentTarget.src = PLACEHOLDER
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-xs font-bold text-ink">{lastAddedItem.name}</p>
                  <p className="mt-0.5 text-xs font-extrabold text-primary">
                    {formatKES(lastAddedItem.unit_price)}
                  </p>
                  <p className="text-[10px] text-muted">Qty: {lastAddedItem.quantity}</p>
                </div>
              </div>
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted">
              Cart Items ({items.length})
            </h3>

            {items.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted">
                Your cart is currently empty.
              </div>
            ) : (
              items.map((item) => (
                <div key={item.product_id} className="flex gap-3 border-b border-line pb-3.5 last:border-0">
                  <img
                    src={item.image_url || PLACEHOLDER}
                    alt={item.name}
                    className="h-16 w-16 rounded-md border border-slate-100 bg-white object-contain p-1 shrink-0"
                    onError={(e) => {
                      e.currentTarget.src = PLACEHOLDER
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/product/${item.slug}`}
                      onClick={() => setDrawerOpen(false)}
                      className="line-clamp-1 text-xs font-bold text-ink hover:text-primary transition-colors"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 text-xs font-extrabold text-ink">
                      {formatKES(item.unit_price)}
                    </p>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded border border-line bg-slate-50">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          className="grid h-6 w-6 place-items-center hover:bg-slate-200 text-ink"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center text-[11px] font-bold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          disabled={item.quantity >= item.max_quantity}
                          className="grid h-6 w-6 place-items-center hover:bg-slate-200 text-ink disabled:opacity-30"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.product_id)}
                        className="text-slate-400 hover:text-error transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with Totals & CTAs */}
          <div className="border-t border-line bg-slate-50 p-5 space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-bold text-muted">Subtotal:</span>
              <span className="text-lg font-extrabold text-ink">{formatKES(subtotal)}</span>
            </div>
            <p className="text-[11px] text-muted leading-tight">
              Taxes included. Delivery calculated at checkout across Kenya.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false)
                  navigate('/cart')
                }}
                className="btn btn-outline !h-11 w-full text-xs font-bold"
              >
                View Full Cart
              </button>

              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false)
                  navigate('/checkout')
                }}
                className="btn btn-primary !h-11 w-full text-xs font-bold shadow-md flex items-center justify-center gap-1.5"
              >
                Checkout <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="w-full text-center text-xs font-bold text-muted hover:text-primary transition-colors pt-1"
            >
              ← Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
