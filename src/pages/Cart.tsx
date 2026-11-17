import { Link, useNavigate } from 'react-router-dom'
import { useCartStore } from '@/store/cartStore'
import { Trash2, Minus, Plus, ShoppingBag, ShieldCheck, ArrowRight, Truck } from 'lucide-react'
import { formatKES, availabilityLabel } from '@/lib/commerce'

const PLACEHOLDER = '/images/products/laptop-placeholder.svg'

export default function Cart() {
  const { items, totals, updateQuantity, removeItem, clearCart, error } = useCartStore()
  const navigate = useNavigate()
  const { subtotal, itemCount } = totals()

  if (items.length === 0) {
    return (
      <div className="wrap py-16 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-mist text-muted">
          <ShoppingBag className="h-10 w-10" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold text-ink">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted">Browse our collection of laptops, workstations, and computer accessories.</p>
        <Link to="/shop" className="btn btn-emerald mt-6">
          Explore Laptops & Accessories
        </Link>
      </div>
    )
  }

  return (
    <div className="wrap py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink md:text-3xl">Shopping Cart</h1>
          <p className="mt-1 text-xs text-muted">
            {itemCount} {itemCount === 1 ? 'item' : 'items'} in your basket · Prices in Kenyan Shillings
          </p>
        </div>
        <button
          type="button"
          onClick={clearCart}
          className="text-xs font-semibold text-muted hover:text-error"
        >
          Clear all items
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs font-medium text-warning">
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Cart Item List */}
        <div className="grid gap-4">
          {items.map((item) => (
            <div
              key={item.product_id}
              className="flex flex-col gap-4 rounded-xl border border-line bg-card p-4 sm:flex-row sm:items-center"
            >
              <Link
                to={`/product/${item.slug}`}
                className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-line bg-mist p-2"
              >
                <img
                  src={item.image_url || PLACEHOLDER}
                  alt={item.name}
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = PLACEHOLDER
                  }}
                />
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  to={`/product/${item.slug}`}
                  className="font-display text-base font-bold text-ink hover:text-teal"
                >
                  {item.name}
                </Link>
                <p className="mt-1 text-xs font-bold text-teal">
                  {availabilityLabel(item.availability)}
                </p>
                <p className="mt-1 text-sm font-extrabold text-ink">
                  {formatKES(item.unit_price)}
                </p>
              </div>

              {/* Quantity Controls & Delete */}
              <div className="flex items-center justify-between gap-4 border-t border-line pt-3 sm:border-0 sm:pt-0">
                <div className="flex items-center rounded-lg border border-line bg-card">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                    className="grid h-8 w-8 place-items-center hover:bg-mist text-ink"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-9 text-center text-xs font-bold text-ink">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                    disabled={item.quantity >= item.max_quantity}
                    className="grid h-8 w-8 place-items-center hover:bg-mist text-ink disabled:opacity-40"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="text-right">
                  <p className="text-sm font-extrabold text-ink">
                    {formatKES(item.unit_price * item.quantity)}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeItem(item.product_id)}
                    className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-error"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div className="mt-2 flex items-center justify-between text-xs text-muted">
            <Link to="/shop" className="font-bold text-teal hover:underline">
              ← Continue shopping
            </Link>
            <span>Verified hardware · Physical inspection warranty</span>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="h-fit rounded-xl border border-line bg-card p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold text-ink">Order Summary</h2>

          <div className="mt-4 space-y-3 border-b border-line pb-4 text-sm">
            <div className="flex justify-between text-muted">
              <span>Items Subtotal ({itemCount})</span>
              <span className="font-bold text-ink">{formatKES(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Delivery estimate</span>
              <span className="font-semibold text-teal">Calculated at checkout</span>
            </div>
          </div>

          <div className="mt-4 flex justify-between text-base font-extrabold text-ink">
            <span>Total Payable</span>
            <span className="text-lg text-teal">{formatKES(subtotal)}</span>
          </div>

          <p className="mt-2 text-[11px] leading-relaxed text-muted">
            Payment references are verified through Kenya banking/M-PESA channels. No fake or unconfirmed automated charges.
          </p>

          <button
            type="button"
            onClick={() => navigate('/checkout')}
            className="btn btn-emerald mt-6 w-full !h-12 text-sm font-bold shadow-md"
          >
            Proceed to Checkout <ArrowRight className="h-4 w-4" />
          </button>

          <div className="mt-6 space-y-2 border-t border-line pt-4 text-[11px] text-muted">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-teal" />
              <span>Doorstep delivery across all 47 counties in Kenya</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-teal" />
              <span>Full specifications check on every laptop</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
