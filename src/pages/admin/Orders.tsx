import { FormEvent, useEffect, useState } from 'react'
import AdminLayout from './AdminLayout'
import { getSupabase } from '@/lib/supabase'
import { formatKES, formatNairobi } from '@/lib/commerce'
import {
  ShoppingCart,
  CheckCircle2,
  Clock,
  Truck,
  CreditCard,
  AlertCircle,
  Eye,
  X,
  ShieldCheck,
  RefreshCw,
  Search,
} from 'lucide-react'

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [paymentRefCode, setPaymentRefCode] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadOrders = async () => {
    const supabase = getSupabase()
    if (!supabase) {
      setOrders([])
      setMessage('Orders cannot be loaded because the store database is not configured.')
      setLoading(false)
      return []
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*), order_status_history(*), payment_records(*), shipments(*)')
        .order('created_at', { ascending: false })

      if (error) throw error
      const freshOrders = data ?? []
      setOrders(freshOrders)
      setLastUpdated(new Date())
      setSelectedOrder((current: any) => current ? freshOrders.find((order: any) => order.id === current.id) ?? current : null)
      return freshOrders
    } catch (error: any) {
      setMessage(`Could not load orders: ${error?.message || 'check the database connection and your staff permissions.'}`)
      return []
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadOrders()
    const timer = window.setInterval(() => { void loadOrders() }, 15000)
    return () => window.clearInterval(timer)
  }, [])

  const handleAdvanceStatus = async (orderId: string, nextStatus: string) => {
    const supabase = getSupabase()
    if (supabase) {
      try {
        const { error } = await supabase.rpc('update_order_status', {
          p_order_id: orderId,
          p_status: nextStatus,
          p_note: `Order advanced to ${nextStatus} by staff`,
        })

        if (error) {
          setMessage(`Error: ${error.message}`)
        } else {
          setMessage(`Order updated to ${nextStatus.replace(/_/g, ' ')}.`)
          const refreshed = await loadOrders()
          setSelectedOrder(refreshed.find((order: any) => order.id === orderId) ?? null)
        }
      } catch (err: any) {
        setMessage(`Error: ${err.message}`)
      }
    } else setMessage('Orders cannot be updated because the store database is not configured.')
  }

  const handleRecordPayment = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedOrder || !paymentRefCode.trim()) return

    const supabase = getSupabase()
    if (supabase) {
      try {
        const { error } = await supabase.rpc('record_payment', {
          p_order_id: selectedOrder.id,
          p_provider: 'manual',
          p_status: 'confirmed',
          p_reference: paymentRefCode.trim().toUpperCase(),
          p_amount: Number(paymentAmount),
        })

        if (error) {
          setMessage(`Error: ${error.message}`)
        } else {
          setMessage(`M-PESA transaction ${paymentRefCode.toUpperCase()} confirmed and linked to order!`)
          setPaymentModalOpen(false)
          setPaymentRefCode('')
          await loadOrders()
          setSelectedOrder(null)
        }
      } catch (err: any) {
        setMessage(`Error: ${err.message}`)
      }
    } else setMessage('Payments cannot be verified because the store database is not configured.')
  }

  const visibleOrders = orders.filter((order) => {
    const statusMatch = statusFilter === 'all' || order.status === statusFilter
    const haystack = `${order.order_number || ''} ${order.guest_name || ''} ${order.guest_phone || ''} ${order.delivery_location || ''}`.toLowerCase()
    return statusMatch && haystack.includes(search.trim().toLowerCase())
  })

  return (
    <AdminLayout
      title="Sales & Customer Orders"
      subtitle="Fulfill customer orders, verify genuine M-PESA references, and coordinate Kenya dispatches"
    >
      {message && (
        <div className="mb-4 rounded-lg border border-teal/30 bg-mint/50 p-3 text-xs font-bold text-tealdeep flex items-center justify-between">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage(null)} className="text-muted hover:text-ink">
            ✕
          </button>
        </div>
      )}

      {/* Orders Table */}
      <div className="overflow-hidden rounded-xl border border-line bg-card shadow-xs">
        <div className="border-b border-line bg-mist px-5 py-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-bold text-ink">All Customer Orders ({orders.length})</h2>
          <div className="flex items-center gap-3 text-[11px] text-muted">
            <span>{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString('en-KE')}` : 'Loading latest orders'}</span>
            <button type="button" onClick={() => void loadOrders()} disabled={loading} className="inline-flex items-center gap-1 rounded border border-line px-2 py-1 font-bold hover:text-teal disabled:opacity-50"><RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />Refresh</button>
          </div>
        </div>
        <div className="grid gap-2 border-b border-line p-4 sm:grid-cols-[1fr_220px]">
          <label className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" /><input className="input w-full pl-9 text-xs" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, customer, phone, or destination" /></label>
          <select className="input text-xs" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter orders by status">
            <option value="all">All statuses</option>
            {['pending', 'awaiting_supplier_confirmation', 'confirmed', 'awaiting_payment', 'paid', 'processing', 'ready_for_delivery', 'dispatched', 'delivered', 'cancelled', 'refunded'].map((status) => <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line text-[11px] font-extrabold uppercase text-muted">
              <tr>
                <th className="px-5 py-3">Order #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Destination</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted font-semibold">
                    Loading orders…
                  </td>
                </tr>
              ) : visibleOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted">
                    {orders.length === 0 ? 'No orders recorded yet.' : 'No orders match these filters.'}
                  </td>
                </tr>
              ) : (
                visibleOrders.map((ord) => {
                  const num = ord.order_number || ord.id
                  const status = ord.status || 'pending'
                  const total = ord.total ?? ord.total_amount
                  return (
                    <tr key={ord.id} className="hover:bg-mist/40">
                      <td className="px-5 py-3 font-mono font-bold text-ink">#{num}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-ink">{ord.guest_name || ord.customer_name || 'Customer'}</p>
                        <p className="text-[11px] text-muted">{ord.guest_phone || ord.customer_phone}</p>
                      </td>
                      <td className="px-4 py-3 text-muted max-w-xs truncate">
                        {ord.delivery_location || ord.destination || 'Kenya'}
                      </td>
                      <td className="px-4 py-3 font-extrabold text-teal">
                        {formatKES(total)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                            status === 'paid' || status === 'delivered'
                              ? 'bg-mint text-tealdeep'
                              : status === 'awaiting_payment' || status === 'pending'
                              ? 'bg-amber/15 text-amberdeep'
                              : status === 'cancelled'
                              ? 'bg-error/15 text-error'
                              : 'bg-mist text-ink'
                          }`}
                        >
                          {status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted">{formatNairobi(ord.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(ord)}
                            className="rounded p-1 text-muted hover:text-teal"
                            title="Inspect order details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {ord.payment_method === 'mpesa_paybill' && !['paid', 'delivered', 'cancelled', 'refunded'].includes(status) && !ord.payment_records?.some((payment: any) => payment.status === 'confirmed') && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrder(ord)
                                setPaymentAmount(String(total))
                                setPaymentModalOpen(true)
                              }}
                              className="rounded border border-teal/40 bg-mint/50 px-2 py-0.5 text-[10px] font-bold text-tealdeep hover:bg-mint"
                            >
                              Verify M-PESA
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Drawer / Modal */}
      {selectedOrder && !paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="font-display text-base font-bold text-ink">
                  Order #{selectedOrder.order_number || selectedOrder.id}
                </h3>
                <p className="text-xs text-muted">{formatNairobi(selectedOrder.created_at)}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-1 text-muted hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="rounded-lg border border-line bg-mist p-3">
                <p className="font-bold text-ink">Customer: {selectedOrder.guest_name || selectedOrder.customer_name || 'Customer'}</p>
                <p className="text-muted">Phone: {selectedOrder.guest_phone || selectedOrder.customer_phone}</p>
                <p className="text-muted">Destination: {selectedOrder.delivery_location || selectedOrder.destination}</p>
                  <p className="text-muted">Payment method: {String(selectedOrder.payment_method || 'pending').replace(/_/g, ' ')}</p>
              </div>

                <div className="rounded-lg border border-line p-3">
                  <p className="mb-2 font-bold text-ink">Items</p>
                  <div className="space-y-1.5">
                    {(selectedOrder.order_items || []).map((item: any) => <div key={item.id} className="flex justify-between gap-3 text-muted"><span>{item.quantity} × {item.product_name}</span><span className="shrink-0 font-semibold text-ink">{formatKES(item.line_total)}</span></div>)}
                    {(!selectedOrder.order_items || selectedOrder.order_items.length === 0) && <p className="text-muted">No item details were returned.</p>}
                  </div>
                </div>

                <div className="rounded-lg border border-line p-3">
                  <p className="mb-2 font-bold text-ink">Payment records</p>
                  <div className="space-y-1.5">
                    {[...(selectedOrder.payment_records || [])].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((payment: any) => <div key={payment.id} className="flex flex-wrap justify-between gap-2 text-muted"><span>{payment.provider} · {payment.status}{payment.reference ? ` · ${payment.reference}` : ''}</span><span>{formatKES(payment.amount)}</span></div>)}
                    {(!selectedOrder.payment_records || selectedOrder.payment_records.length === 0) && <p className="text-muted">No payment attempts recorded.</p>}
                  </div>
                </div>

                <div className="rounded-lg border border-line p-3">
                  <p className="mb-2 font-bold text-ink">Order progress</p>
                  <ol className="space-y-2">
                    {[...(selectedOrder.order_status_history || [])].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map((entry: any) => <li key={entry.id} className="border-l-2 border-teal/30 pl-3"><p className="font-bold capitalize text-ink">{entry.status.replace(/_/g, ' ')}</p><p className="text-muted">{entry.note || 'Status updated'} · {formatNairobi(entry.created_at)}</p></li>)}
                    {(!selectedOrder.order_status_history || selectedOrder.order_status_history.length === 0) && <li className="text-muted">No status history recorded.</li>}
                  </ol>
                </div>

              <div className="flex justify-between border-t border-line pt-2 text-sm font-extrabold">
                <span className="text-ink">Total Order Value:</span>
                <span className="text-teal">{formatKES(selectedOrder.total ?? selectedOrder.total_amount)}</span>
              </div>

              {/* Status advancement buttons */}
              <div className="border-t border-line pt-4">
                <p className="font-bold text-muted mb-2">Advance Workflow Status:</p>
                <div className="flex flex-wrap gap-2">
                  {['pending', 'awaiting_supplier_confirmation'].includes(selectedOrder.status) && <button
                    type="button"
                    onClick={() => handleAdvanceStatus(selectedOrder.id, 'confirmed')}
                    className="btn btn-emerald !h-8 text-[11px] font-bold"
                  >
                    Confirm Order
                  </button>}
                  {['confirmed', 'paid'].includes(selectedOrder.status) && <button
                    type="button"
                    onClick={() => handleAdvanceStatus(selectedOrder.id, 'processing')}
                    className="btn btn-emerald !h-8 text-[11px] font-bold"
                  >
                    Mark Processing
                  </button>}
                  {selectedOrder.status === 'processing' && <button
                    type="button"
                    onClick={() => handleAdvanceStatus(selectedOrder.id, 'ready_for_delivery')}
                    className="btn btn-emerald !h-8 text-[11px] font-bold"
                  >
                    Ready for Delivery
                  </button>}
                  {selectedOrder.status === 'ready_for_delivery' && <button
                    type="button"
                    onClick={() => handleAdvanceStatus(selectedOrder.id, 'dispatched')}
                    className="btn btn-emerald !h-8 text-[11px] font-bold"
                  >
                    Mark Dispatched
                  </button>}
                  {selectedOrder.status === 'dispatched' && <button
                    type="button"
                    onClick={() => handleAdvanceStatus(selectedOrder.id, 'delivered')}
                    className="btn btn-emerald !h-8 text-[11px] font-bold"
                  >
                    Mark Delivered
                  </button>}
                  {!['cancelled', 'refunded', 'delivered', 'paid'].includes(selectedOrder.status) && <button
                    type="button"
                    onClick={() => handleAdvanceStatus(selectedOrder.id, 'cancelled')}
                    className="btn btn-outline !h-8 text-[11px] font-bold text-error"
                  >
                    Cancel Order
                  </button>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Genuine M-PESA Verification Modal */}
      {paymentModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-line bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2 text-teal">
                <ShieldCheck className="h-5 w-5" />
                <h3 className="font-display text-base font-bold text-ink">Record Genuine M-PESA Payment</h3>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="rounded-lg p-1 text-muted hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-4 text-xs">
              <p className="text-muted leading-relaxed">
                Do not simulate payments. Enter the official Safaricom M-PESA confirmation code from your PayBill/Till statement to securely mark this order as paid.
              </p>

              <div>
                <label className="block font-bold text-muted">M-PESA Reference Code *</label>
                <input
                  type="text"
                  required
                  value={paymentRefCode}
                  onChange={(e) => setPaymentRefCode(e.target.value.toUpperCase())}
                  placeholder="e.g. QKH89X23YZ"
                  className="input mt-1.5 w-full text-xs font-mono font-extrabold uppercase text-teal"
                />
              </div>

              <div>
                <label className="block font-bold text-muted">Amount Received (KES) *</label>
                <input
                  type="number"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="input mt-1.5 w-full text-xs font-bold"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-line pt-4">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="btn btn-outline !h-9 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-emerald !h-9 text-xs font-bold shadow-xs"
                >
                  Confirm & Link Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

