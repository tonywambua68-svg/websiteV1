import { FormEvent, useEffect, useState } from 'react'
import AdminLayout from './AdminLayout'
import { getSupabase } from '@/lib/supabase'
import { useOrderStore } from '@/store/orderStore'
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
} from 'lucide-react'

export default function AdminOrders() {
  const { orders: localOrders, updateOrderStatus: updateLocalStatus } = useOrderStore()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [paymentRefCode, setPaymentRefCode] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const loadOrders = async () => {
    const supabase = getSupabase()
    if (!supabase) {
      setOrders(
        localOrders.map((o) => ({
          id: o.id,
          order_number: o.orderNumber,
          customer_name: o.customerName,
          customer_phone: o.customerPhone,
          customer_email: o.customerEmail,
          destination: `${o.shippingAddress?.city}, ${o.shippingAddress?.state}`,
          total_amount: o.total,
          status: o.status,
          created_at: o.createdAt,
          items: o.items,
        }))
      )
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false })

      if (!error && data && data.length > 0) {
        setOrders(data)
      } else {
        setOrders(
          localOrders.map((o) => ({
            id: o.id,
            order_number: o.orderNumber,
            customer_name: o.customerName,
            customer_phone: o.customerPhone,
            customer_email: o.customerEmail,
            destination: `${o.shippingAddress?.city}, ${o.shippingAddress?.state}`,
            total_amount: o.total,
            status: o.status,
            created_at: o.createdAt,
            items: o.items,
          }))
        )
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [localOrders])

  const handleAdvanceStatus = async (orderId: string, nextStatus: string) => {
    const supabase = getSupabase()
    if (supabase) {
      try {
        const { error } = await supabase.rpc('advance_order_status', {
          p_order_id: orderId,
          p_next_status: nextStatus,
          p_note: `Order advanced to ${nextStatus} by staff`,
        })

        if (error) {
          setMessage(`Error: ${error.message}`)
        } else {
          setMessage(`Order updated to ${nextStatus.replace(/_/g, ' ')}.`)
          loadOrders()
        }
      } catch (err: any) {
        setMessage(`Error: ${err.message}`)
      }
    } else {
      updateLocalStatus(orderId, nextStatus as any)
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
      )
      setMessage(`Order status updated to ${nextStatus}.`)
    }
  }

  const handleRecordPayment = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedOrder || !paymentRefCode.trim()) return

    const supabase = getSupabase()
    if (supabase) {
      try {
        const { error } = await supabase.rpc('record_payment_reference', {
          p_order_id: selectedOrder.id,
          p_provider: 'mpesa',
          p_reference: paymentRefCode.trim().toUpperCase(),
          p_amount: Number(paymentAmount) || selectedOrder.total_amount,
          p_currency: 'KES',
        })

        if (error) {
          setMessage(`Error: ${error.message}`)
        } else {
          setMessage(`M-PESA transaction ${paymentRefCode.toUpperCase()} confirmed and linked to order!`)
          setPaymentModalOpen(false)
          setPaymentRefCode('')
          loadOrders()
        }
      } catch (err: any) {
        setMessage(`Error: ${err.message}`)
      }
    } else {
      handleAdvanceStatus(selectedOrder.id, 'paid')
      setMessage(`Payment reference ${paymentRefCode.toUpperCase()} recorded locally.`)
      setPaymentModalOpen(false)
      setPaymentRefCode('')
    }
  }

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
          <span className="text-[11px] text-muted">Strict payment validation enforced</span>
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
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted">
                    No orders recorded yet.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => {
                  const num = ord.order_number || ord.id
                  const status = ord.status || 'pending'
                  return (
                    <tr key={ord.id} className="hover:bg-mist/40">
                      <td className="px-5 py-3 font-mono font-bold text-ink">#{num}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-ink">{ord.customer_name || 'Customer'}</p>
                        <p className="text-[11px] text-muted">{ord.customer_phone}</p>
                      </td>
                      <td className="px-4 py-3 text-muted max-w-xs truncate">
                        {ord.destination || 'Kenya'}
                      </td>
                      <td className="px-4 py-3 font-extrabold text-teal">
                        {formatKES(ord.total_amount)}
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
                          {status !== 'paid' && status !== 'delivered' && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrder(ord)
                                setPaymentAmount(String(ord.total_amount))
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
          <div className="w-full max-w-lg rounded-2xl border border-line bg-card p-6 shadow-xl">
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
                <p className="font-bold text-ink">Customer: {selectedOrder.customer_name}</p>
                <p className="text-muted">Phone: {selectedOrder.customer_phone}</p>
                <p className="text-muted">Destination: {selectedOrder.destination}</p>
              </div>

              <div className="flex justify-between border-t border-line pt-2 text-sm font-extrabold">
                <span className="text-ink">Total Order Value:</span>
                <span className="text-teal">{formatKES(selectedOrder.total_amount)}</span>
              </div>

              {/* Status advancement buttons */}
              <div className="border-t border-line pt-4">
                <p className="font-bold text-muted mb-2">Advance Workflow Status:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleAdvanceStatus(selectedOrder.id, 'confirmed')}
                    className="btn btn-emerald !h-8 text-[11px] font-bold"
                  >
                    Confirm Order
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdvanceStatus(selectedOrder.id, 'processing')}
                    className="btn btn-emerald !h-8 text-[11px] font-bold"
                  >
                    Mark Processing
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdvanceStatus(selectedOrder.id, 'dispatched')}
                    className="btn btn-emerald !h-8 text-[11px] font-bold"
                  >
                    Mark Dispatched
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdvanceStatus(selectedOrder.id, 'delivered')}
                    className="btn btn-emerald !h-8 text-[11px] font-bold"
                  >
                    Mark Delivered
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdvanceStatus(selectedOrder.id, 'cancelled')}
                    className="btn btn-outline !h-8 text-[11px] font-bold text-error"
                  >
                    Cancel Order
                  </button>
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

