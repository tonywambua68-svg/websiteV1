import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useOrderStore } from '@/store/orderStore'
import { getSupabase } from '@/lib/supabase'
import { User, Package, Phone, LogOut, Shield, MapPin, Calendar, Clock, CheckCircle } from 'lucide-react'
import { formatKES, formatNairobi } from '@/lib/commerce'

export default function Account() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const { orders } = useOrderStore()
  const [dbOrders, setDbOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    const supabase = getSupabase()
    if (supabase && user?.id) {
      setLoading(true)
      supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) {
            setDbOrders(data)
          }
          setLoading(false)
        })
    }
  }, [isAuthenticated, user, navigate])

  if (!user) {
    return null
  }

  const allCustomerOrders = dbOrders.length > 0 ? dbOrders : orders

  return (
    <div className="wrap py-8">
      <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-teal/10 font-display text-xl font-bold text-teal">
            {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">{user.full_name || 'Customer Account'}</h1>
            <p className="text-xs text-muted">
              {user.email} · Role: <span className="font-bold uppercase text-teal">{user.role}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {(user.role === 'owner' || user.role === 'manager') && (
            <Link to="/admin" className="btn btn-emerald !h-10 text-xs font-bold">
              <Shield className="h-4 w-4" /> Open Admin Portal
            </Link>
          )}
          {['product_researcher', 'inventory_assistant', 'sales_assistant'].includes(user.role) && (
            <Link to="/employee" className="btn btn-emerald !h-10 text-xs font-bold">
              <Shield className="h-4 w-4" /> Employee Portal
            </Link>
          )}
          <button
            type="button"
            onClick={() => logout().then(() => navigate('/'))}
            className="btn btn-dark !h-10 text-xs font-bold"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Left: Orders List */}
        <div>
          <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
            <Package className="h-5 w-5 text-teal" /> Your Recent Orders
          </h2>

          {loading ? (
            <div className="py-12 text-center text-xs font-semibold text-muted">Loading orders…</div>
          ) : allCustomerOrders.length === 0 ? (
            <div className="mt-4 rounded-xl border border-line bg-card p-8 text-center">
              <p className="text-sm font-semibold text-ink">No orders recorded yet</p>
              <p className="mt-1 text-xs text-muted">Any orders you place will appear here with live tracking updates.</p>
              <Link to="/shop" className="btn btn-emerald mt-4 !h-9 text-xs font-bold">
                Browse Laptops
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {allCustomerOrders.map((ord: any) => {
                const orderNum = ord.order_number || ord.orderNumber || ord.id
                const total = ord.total_amount || ord.total
                const status = ord.status || 'pending'
                const date = ord.created_at || ord.createdAt

                return (
                  <div key={ord.id} className="rounded-xl border border-line bg-card p-5 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                      <div>
                        <span className="font-mono text-xs font-bold text-ink">#{orderNum}</span>
                        <span className="ml-2 text-[11px] text-muted">
                          {formatNairobi(date)}
                        </span>
                      </div>
                      <span className="rounded-full bg-mint px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-tealdeep">
                        {status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-4 text-xs">
                      <div>
                        <span className="text-muted">Total Amount:</span>{' '}
                        <span className="font-extrabold text-ink">{formatKES(total)}</span>
                      </div>
                      <div>
                        <span className="text-muted">Destination:</span>{' '}
                        <span className="font-semibold text-ink">
                          {ord.destination || ord.shippingAddress?.city || 'Kenya Delivery'}
                        </span>
                      </div>
                      <Link
                        to="/order-tracking"
                        className="font-bold text-teal hover:underline"
                      >
                        Track Status →
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right: Profile Details & Help */}
        <div className="space-y-6">
          <div className="rounded-xl border border-line bg-card p-6 shadow-xs">
            <h3 className="font-display text-sm font-bold text-ink">Profile Details</h3>
            <div className="mt-3 space-y-2 text-xs">
              <div>
                <span className="text-muted">Full Name:</span>{' '}
                <span className="font-bold text-ink">{user.full_name || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-muted">Email:</span>{' '}
                <span className="font-bold text-ink">{user.email || '—'}</span>
              </div>
              <div>
                <span className="text-muted">Phone:</span>{' '}
                <span className="font-bold text-ink">{user.phone || '—'}</span>
              </div>
              <div>
                <span className="text-muted">Account Status:</span>{' '}
                <span className="font-bold text-success capitalize">{user.account_status}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-card p-6 shadow-xs">
            <h3 className="font-display text-sm font-bold text-ink">Need Assistance?</h3>
            <p className="mt-1 text-xs text-muted">
              For order enquiries, warranty verification, or hardware advice, reach out to our team in Nairobi.
            </p>
            <div className="mt-4 space-y-2 text-xs font-semibold">
              <div className="flex items-center gap-2 text-ink">
                <Phone className="h-4 w-4 text-teal" />
                <span>+254 700 000 000</span>
              </div>
              <div className="flex items-center gap-2 text-ink">
                <MapPin className="h-4 w-4 text-teal" />
                <span>Nairobi, Kenya</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

