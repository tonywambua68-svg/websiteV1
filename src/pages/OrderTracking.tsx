import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getSupabase } from '@/lib/supabase'
import { Package, Truck, CheckCircle, Clock, XCircle, Phone, Link as LinkIcon, MapPin } from 'lucide-react'

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

interface OrderItem {
  name: string
  quantity: number
  unit_price: number
  line_total: number
  fulfilment: string
}

interface OrderHistory {
  status: string
  note: string
  created_at: string
}

interface TrackResult {
  found: boolean
  order_number?: string
  status?: OrderStatus
  total?: number
  currency?: string
  requires_supplier_confirmation?: boolean
  delivery_location?: string
  created_at?: string
  items?: OrderItem[]
  history?: OrderHistory[]
  payment_status?: string
}

function getStatusIcon(status: OrderStatus) {
  switch (status) {
    case 'pending': return <Clock className="w-5 h-5 text-yellow-600" />
    case 'confirmed': return <CheckCircle className="w-5 h-5 text-blue-600" />
    case 'processing': return <Package className="w-5 h-5 text-purple-600" />
    case 'shipped': return <Truck className="w-5 h-5 text-indigo-600" />
    case 'delivered': return <CheckCircle className="w-5 h-5 text-green-600" />
    case 'cancelled': return <XCircle className="w-5 h-5 text-red-600" />
    default: return <Clock className="w-5 h-5 text-gray-600" />
  }
}

function getStatusColor(status: OrderStatus) {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    case 'confirmed': return 'bg-blue-100 text-blue-800'
    case 'processing': return 'bg-purple-100 text-purple-800'
    case 'shipped': return 'bg-indigo-100 text-indigo-800'
    case 'delivered': return 'bg-green-100 text-green-800'
    case 'cancelled': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export default function OrderTracking() {
  const [searchParams] = useSearchParams()
  const [searchOrderNumber, setSearchOrderNumber] = useState(searchParams.get('number') || '')
  const [searchPhone, setSearchPhone] = useState('')
  const [order, setOrder] = useState<TrackResult | null>(null)
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setOrder(null)
    setSearched(false)

    if (!searchOrderNumber.trim() || !searchPhone.trim()) {
      setError('Please enter both your order number and phone number.')
      return
    }

    setLoading(true)
    try {
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase client not available')
      const { data, error: rpcError } = await supabase.rpc('track_order', {
        p_number: searchOrderNumber.trim(),
        p_phone: searchPhone.trim(),
      })

      if (rpcError) throw rpcError

      const result = data as TrackResult
      if (!result.found) {
        setSearched(true)
        setOrder(null)
        return
      }

      setOrder(result)
      setSearched(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to track order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="wrap py-8">
      <div className="flex items-center gap-2 mb-8">
        <Package className="w-6 h-6 text-primary" />
        <h1 className="text-3xl font-bold text-ink">Track Your Order</h1>
      </div>
      <p className="text-muted mb-8">
        Enter your order number and the phone number you used at checkout to see your order status and delivery details.
      </p>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="max-w-xl space-y-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-ink mb-2">Order Number</label>
            <input
              type="text"
              value={searchOrderNumber}
              onChange={(e) => setSearchOrderNumber(e.target.value)}
              placeholder="e.g., ORM-2026-0001"
              className="input !h-11 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-ink mb-2">Phone Number</label>
            <input
              type="tel"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              placeholder="e.g., 0712345678"
              className="input !h-11 text-sm"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${
            loading ? 'bg-muted cursor-not-allowed' : 'bg-primary hover:bg-primary-hover shadow-md'
          }`}
        >
          {loading ? 'Looking up order…' : 'Track Order'}
        </button>
      </form>

      {error && (
        <div className="max-w-xl mb-8 p-4 rounded-lg bg-error/10 border border-error/20 text-error">
          <XCircle className="w-4 h-4 mr-2" /> {error}
        </div>
      )}

      {/* Results */}
      {searched && !loading && order && (
        <div className="max-w-3xl space-y-6">
          <div className="bg-card border border-line rounded-xl p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-bold text-ink">Order {order.order_number}</h2>
                <p className="text-sm text-muted">
                  Placed on {new Date(order.created_at || '').toLocaleDateString()}
                </p>
              </div>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status as OrderStatus || 'pending')}`}>
                {getStatusIcon(order.status as OrderStatus || 'pending')}
                <span>{(order.status || 'pending').replace(/_/g, ' ')}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border border-line">
                <p className="text-xs font-bold text-muted uppercase tracking-wider">Total</p>
                <p className="text-lg font-bold text-ink">KSh {(order.total || 0).toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-lg border border-line">
                <p className="text-xs font-bold text-muted uppercase tracking-wider">Currency</p>
                <p className="text-lg font-bold text-ink">{order.currency || 'KES'}</p>
              </div>
              <div className="p-4 rounded-lg border border-line">
                <p className="text-xs font-bold text-muted uppercase tracking-wider">Delivery</p>
                <p className="text-lg font-bold text-ink">{order.delivery_location || '—'}</p>
              </div>
            </div>

            {(order.payment_status && order.payment_status !== 'unpaid') && (
              <div className="mt-4 p-3 rounded-lg border border-line bg-success/10 text-success border-success/20">
                <p className="text-sm font-medium">Payment Status: {order.payment_status}</p>
              </div>
            )}

            {order.requires_supplier_confirmation && (
              <div className="mt-3 p-3 rounded-lg border border-line bg-warning/10 text-warning border-warning/20">
                <p className="text-sm font-medium">This order requires supplier confirmation before fulfilment begins.</p>
              </div>
            )}
          </div>

          {/* Order Items */}
          {(order.items && order.items.length > 0) && (
            <div>
              <h3 className="text-lg font-bold text-ink mb-3">Order Items</h3>
              <div className="space-y-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-line">
                    <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                      {item.name}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-ink">{item.name}</p>
                      <p className="text-xs text-muted">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-ink">KSh {item.line_total.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status History */}
          {(order.history && order.history.length > 0) && (
            <div className="mt-6">
              <h3 className="text-lg font-bold text-ink mb-3">Status History</h3>
              <div className="space-y-3">
                {order.history.map((h, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-line">
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${getStatusColor(h.status as OrderStatus)}`}>
                      {h.status.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-ink">{h.status.replace(/_/g, ' ')}</p>
                      {h.note && <p className="text-xs text-muted">{h.note}</p>}
                    </div>
                    <div className="text-xs text-muted">
                      {new Date(h.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {searched && !loading && !order && error === null && (
        <div className="max-w-xl text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-ink mb-2">No Orders Found</h3>
          <p className="text-muted">We couldn&rsquo;t find an order matching that order number and phone number.</p>
        </div>
      )}
    </div>
  )
}
