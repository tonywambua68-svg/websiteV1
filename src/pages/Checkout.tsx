import { useState, FormEvent, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCartStore } from '@/store/cartStore'
import { useOrderStore } from '@/store/orderStore'
import { useAuthStore } from '@/store/authStore'
import { getSupabase } from '@/lib/supabase'
import {
  CheckCircle2,
  Truck,
  ShieldCheck,
  Phone,
  ArrowLeft,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { formatKES, normalizePhone, isKenyanPhone, whatsappHref } from '@/lib/commerce'
import {
  normalizeDarajaPhone,
  isValidDarajaPhone,
} from '@/lib/daraja'

const KENYA_COUNTIES = [
  'Nairobi',
  'Mombasa',
  'Kiambu',
  'Nakuru',
  'Machakos',
  'Kajiado',
  'Kisumu',
  'Uasin Gishu (Eldoret)',
  'Kilifi',
  'Meru',
  'Nyeri',
  'Murang\'a',
  'Kakamega',
  'Trans Nzoia (Kitale)',
  'Kisii',
  'Kericho',
  'Other Kenya County',
]

export default function Checkout() {
  const navigate = useNavigate()
  const { items, totals, clearCart, syncToServer } = useCartStore()
  const { addOrder } = useOrderStore()
  const { user, isAuthenticated, checkAuth } = useAuthStore()
  const { subtotal } = totals()

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [authReady, setAuthReady] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState('')
  const [paymentReference, setPaymentReference] = useState('')
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<'mpesa' | 'delivery'>('mpesa')

  // M-Pesa STK push state
  const [stkPushStatus, setStkPushStatus] = useState<'idle' | 'pending' | 'completed' | 'failed'>('idle')
  const [stkPushLoading, setStkPushLoading] = useState(false)
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null)
  const [stkMessage, setStkMessage] = useState<string | null>(null)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    county: 'Nairobi',
    town: '',
    street: '',
    deliveryNotes: '',
  })

  useEffect(() => {
    checkAuth().then(() => setAuthReady(true))
    syncToServer()
  }, [checkAuth, syncToServer])

  // Poll payment status from server
  useEffect(() => {
    if (!checkoutRequestId || stkPushStatus !== 'pending') {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
      return
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const supabase = getSupabase()
        if (!supabase) return

        const { data, error } = await supabase.rpc('record_payment', {
          p_order_id: '00000000-0000-0000-0000-000000000000', // placeholder, replaced below
          p_provider: 'mpesa_daraja',
          p_status: 'pending',
          p_reference: '',
          p_amount: 0,
        })
        // We don't have a status-check RPC yet; poll the order via payment_records instead
        // This is a placeholder — a dedicated get_payment_status RPC would be cleaner
      } catch {
        // ignore poll errors
      }
    }, 5000)

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [checkoutRequestId, stkPushStatus])

  if (!authReady) {
    return null
  }

  if (!isAuthenticated && user === null) {
    navigate('/login?from=/checkout')
    return null
  }

  if (items.length === 0 && !orderPlaced) {
    navigate('/cart')
    return null
  }

  const hasSupplierItems = items.some((item) => item.availability === 'supplier')
  const shippingFee = formData.county === 'Nairobi' ? 250 : 450
  const totalAmount = subtotal + shippingFee

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setErrorMessage(null)

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrorMessage('Please enter your full customer name.')
      return
    }

    if (!isKenyanPhone(formData.phone)) {
      setErrorMessage('Please provide a valid Kenyan phone number (e.g. 0712345678 or 254712345678).')
      return
    }

    if (!formData.town.trim()) {
      setErrorMessage('Please provide your town or neighborhood.')
      return
    }

    setSubmitting(true)
    setLoading(true)

    const normalizedPhone = normalizePhone(formData.phone)
    const customerFullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`
    const fullDestination = `${formData.county}, ${formData.town.trim()} - ${formData.street.trim() || 'N/A'}`

    try {
      const supabase = getSupabase()
      let orderId: string | null = null

      if (supabase && user?.id) {
        try {
          const { data, error } = await supabase.rpc('place_order', {
            customer_name: customerFullName,
            phone: normalizedPhone,
            email: formData.email.trim() || null,
            delivery_location: fullDestination,
            delivery_instructions: `${formData.deliveryNotes.trim()} | Payment: ${selectedPaymentMode.toUpperCase()} Ref: ${paymentReference || 'PENDING'}`,
            coupon_code: null,
            items: items.map((item) => ({
              product_id: item.product_id,
              variant_id: null,
              quantity: item.quantity,
            })),
          })

          if (error) throw error
          if (data) {
            setConfirmedOrderNumber(String((data as any).order_number || (data as any).order_id))
            orderId = String((data as any).order_id || (data as any).id)
          }
        } catch (dbErr: any) {
          setErrorMessage(dbErr.message || 'Database order placement failed.')
          setSubmitting(false)
          setLoading(false)
          return
        }
      }

      // Store in client order tracker
      addOrder({
        customerName: customerFullName,
        customerPhone: normalizedPhone,
        customerEmail: formData.email.trim(),
        shippingAddress: {
          street: formData.street,
          city: formData.town,
          state: formData.county,
          zipCode: '00100',
          country: 'Kenya',
        },
        items: items.map((line) => ({
          product: {
            id: line.product_id,
            name: line.name,
            brand: 'Hardware',
            category: 'Laptops',
            price: line.unit_price,
            image: line.image_url || undefined,
            description: '',
          },
          quantity: line.quantity,
        })),
        subtotal,
        shippingCost: shippingFee,
        total: totalAmount,
        paymentMethod: selectedPaymentMode === 'mpesa' ? 'M-PESA PayBill' : 'Cash on Delivery',
        notes: formData.deliveryNotes,
      })

      // If M-Pesa selected, initiate STK push
      if (selectedPaymentMode === 'mpesa' && orderId && supabase) {
        setStkPushStatus('pending')
        setStkPushLoading(true)
        setStkMessage('Initiating M-Pesa STK push…')

        try {
          const normalizedStkPhone = normalizeDarajaPhone(formData.phone)
          if (!isValidDarajaPhone(normalizedStkPhone)) {
            throw new Error('Invalid phone number for M-Pesa payment')
          }

          const { data: stkData, error: stkError } = await supabase.functions.invoke('daraja-stk-push', {
            body: {
              phone: normalizedStkPhone,
              amount: totalAmount,
              order_id: orderId,
              account_reference: confirmedOrderNumber,
              transaction_desc: `OREMITECH order ${confirmedOrderNumber}`,
            },
          })

          if (stkError) throw stkError

          setCheckoutRequestId(stkData.CheckoutRequestID)
          setStkMessage('STK push sent to your phone. Enter your M-Pesa PIN to complete payment.')
          setStkPushStatus('pending')

          // Start polling for payment status (server callback updates payment_records)
          // We'll poll via the order status or payment record
          pollIntervalRef.current = setInterval(async () => {
            try {
              const { data: orderStatus } = await supabase
                .from('orders')
                .select('status, payment_status')
                .eq('id', orderId)
                .single()

              if (orderStatus?.payment_status === 'confirmed' || orderStatus?.status === 'paid') {
                setStkPushStatus('completed')
                setStkMessage('Payment confirmed successfully!')
                if (pollIntervalRef.current) {
                  clearInterval(pollIntervalRef.current)
                  pollIntervalRef.current = null
                }
                setOrderPlaced(true)
                return
              }

              if (orderStatus?.payment_status === 'failed') {
                setStkPushStatus('failed')
                setStkMessage('Payment failed. Please try again or pay on delivery.')
                if (pollIntervalRef.current) {
                  clearInterval(pollIntervalRef.current)
                  pollIntervalRef.current = null
                }
              }
            } catch {
              // ignore poll errors
            }
          }, 5000)

        } catch (stkErr: any) {
          setStkPushStatus('failed')
          setStkMessage(stkErr.message || 'Failed to initiate M-Pesa payment. You can pay on delivery instead.')
        } finally {
          setStkPushLoading(false)
        }
      } else {
        await clearCart()
        setOrderPlaced(true)
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setErrorMessage('Could not complete order placement. Please check your connection.')
    } finally {
      setSubmitting(false)
      setLoading(false)
    }
  }

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  if (orderPlaced) {
    const waText = `Hello OREMITECH, I just placed order #${confirmedOrderNumber} for delivery to ${formData.county}. Please confirm dispatch.`
    const waLink = whatsappHref('254700000000', waText)

    return (
      <div className="wrap max-w-2xl py-12">
        <div className="rounded-2xl border border-line bg-card p-8 text-center shadow-md">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-teal/10 text-teal">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <h1 className="mt-5 font-display text-2xl font-bold text-ink">Order Received Successfully!</h1>
          <p className="mt-2 text-sm text-muted">
            Thank you for shopping with OREMITECH Kenya. We have recorded your order and will contact you via phone/WhatsApp to coordinate delivery.
          </p>

          <div className="mt-6 rounded-xl border border-line bg-mist p-4 text-left">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-muted">Order Number:</span>
              <span className="font-extrabold text-teal">{confirmedOrderNumber}</span>
            </div>
            <div className="mt-2 flex justify-between text-xs">
              <span className="font-bold text-muted">Customer Name:</span>
              <span className="font-semibold text-ink">{formData.firstName} {formData.lastName}</span>
            </div>
            <div className="mt-2 flex justify-between text-xs">
              <span className="font-bold text-muted">Contact Phone:</span>
              <span className="font-semibold text-ink">{formData.phone}</span>
            </div>
            <div className="mt-2 flex justify-between text-xs">
              <span className="font-bold text-muted">Delivery Destination:</span>
              <span className="font-semibold text-ink">{formData.county}, {formData.town}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-line/60 pt-2 text-sm font-extrabold">
              <span className="text-ink">Order Total:</span>
              <span className="text-teal">{formatKES(totalAmount)}</span>
            </div>
          </div>

          {hasSupplierItems && (
            <div className="mt-4 rounded-lg border border-amber/30 bg-amber/10 p-3 text-left text-xs font-semibold text-amberdeep">
              Notice: Your order includes supplier-verified items. Our team will verify supplier physical availability before concluding final dispatch.
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="btn btn-emerald text-xs font-bold"
              >
                Confirm via WhatsApp
              </a>
            )}
            <Link to="/order-tracking" className="btn btn-outline text-xs font-bold">
              Track Order Status
            </Link>
            <Link to="/shop" className="btn btn-outline text-xs font-bold">
              Back to Shop
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="wrap py-8">
      <Link to="/cart" className="inline-flex items-center gap-1 text-xs font-bold text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Return to Cart
      </Link>

      <h1 className="mt-3 font-display text-2xl font-bold text-ink md:text-3xl">Checkout & Delivery</h1>
      <p className="mt-1 text-xs text-muted">
        Fill in your delivery details in Kenya. Orders are confirmed with genuine payment validation.
      </p>

      {hasSupplierItems && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber/30 bg-amber/10 p-4 text-xs font-medium text-amberdeep">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <span className="font-bold">Supplier-Backed Items:</span> One or more items in your cart are fulfilled through verified suppliers. Dispatch is confirmed following our standard physical verification.
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 rounded-lg border border-error/30 bg-error/10 p-3 text-xs font-semibold text-error">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Customer Information Form */}
        <div className="space-y-6">
          <div className="rounded-xl border border-line bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold text-ink">1. Contact Information</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-muted">First Name *</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="e.g. Samuel"
                  className="input mt-1.5 w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted">Last Name *</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="e.g. Ochieng"
                  className="input mt-1.5 w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted">Kenyan Phone (M-PESA / Call) *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0712 345 678"
                  className="input mt-1.5 w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted">Email Address (Optional)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="receipt@example.com"
                  className="input mt-1.5 w-full text-sm"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold text-ink">2. Delivery Location (Kenya)</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-muted">County *</label>
                <select
                  value={formData.county}
                  onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                  className="input mt-1.5 w-full text-sm"
                >
                  {KENYA_COUNTIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted">Town / Neighborhood *</label>
                <input
                  type="text"
                  required
                  value={formData.town}
                  onChange={(e) => setFormData({ ...formData, town: e.target.value })}
                  placeholder="e.g. Westlands, CBD, Ruiru"
                  className="input mt-1.5 w-full text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-muted">Specific Building / Street / Landmark</label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  placeholder="e.g. Apex Tower, 4th Floor or Near Total Station"
                  className="input mt-1.5 w-full text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-muted">Delivery Instructions</label>
                <textarea
                  rows={2}
                  value={formData.deliveryNotes}
                  onChange={(e) => setFormData({ ...formData, deliveryNotes: e.target.value })}
                  placeholder="e.g. Call upon arrival at the gate"
                  className="input mt-1.5 w-full py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold text-ink">3. Payment Channel</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                  selectedPaymentMode === 'mpesa' ? 'border-teal bg-mint/30' : 'border-line bg-card'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={selectedPaymentMode === 'mpesa'}
                  onChange={() => setSelectedPaymentMode('mpesa')}
                  className="mt-1"
                />
                <div>
                  <span className="block text-sm font-extrabold text-ink">M-PESA PayBill / Till</span>
                  <span className="mt-1 block text-xs text-muted">
                    Pay via M-Pesa STK push to your phone, or provide transaction code after ordering.
                  </span>
                </div>
              </label>

              <label
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                  selectedPaymentMode === 'delivery' ? 'border-teal bg-mint/30' : 'border-line bg-card'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={selectedPaymentMode === 'delivery'}
                  onChange={() => setSelectedPaymentMode('delivery')}
                  className="mt-1"
                />
                <div>
                  <span className="block text-sm font-extrabold text-ink">Pay on Delivery</span>
                  <span className="mt-1 block text-xs text-muted">
                    Available in Nairobi and select urban centres.
                  </span>
                </div>
              </label>
            </div>

            {selectedPaymentMode === 'mpesa' && (
              <div className="mt-4 rounded-lg border border-line bg-mist p-4 text-xs">
                <p className="font-bold text-ink">M-PESA Payment Details:</p>
                <p className="mt-1 text-muted">
                  We will send an M-Pesa STK push to your phone after you place the order. Enter your PIN to complete payment.
                </p>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value.toUpperCase())}
                  placeholder="M-Pesa transaction code (optional, if already paid)"
                  className="input mt-2 w-full text-xs"
                />
              </div>
            )}
          </div>

          {/* M-Pesa STK Push Status */}
          {selectedPaymentMode === 'mpesa' && stkPushStatus !== 'idle' && (
            <div className="rounded-xl border p-4 shadow-sm ${
              stkPushStatus === 'pending'
                ? 'border-amber/30 bg-amber/5'
                : stkPushStatus === 'completed'
                ? 'border-teal/30 bg-teal/5'
                : 'border-error/30 bg-error/5'
            }">
              {stkPushStatus === 'pending' && (
                <div className="flex items-start gap-3">
                  <Loader2 className="mt-0.5 h-5 w-5 text-amber animate-spin" />
                  <div>
                    <p className="text-xs font-bold text-amberdeep">{stkMessage || 'Processing M-Pesa payment…'}</p>
                    <p className="mt-1 text-xs text-amber">
                      Check your phone and enter your M-Pesa PIN to complete the payment.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        // Retry poll
                      }}
                      className="mt-2 text-xs underline text-amber hover:text-amberdeep"
                    >
                      Check payment status
                    </button>
                  </div>
                </div>
              )}
              {stkPushStatus === 'completed' && (
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-teal" />
                  <div>
                    <p className="text-xs font-bold text-teal">{stkMessage || 'Payment confirmed!'}</p>
                  </div>
                </div>
              )}
              {stkPushStatus === 'failed' && (
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-error" />
                  <div>
                    <p className="text-xs font-bold text-error">{stkMessage || 'Payment failed.'}</p>
                    <p className="mt-1 text-xs text-muted">
                      You can still pay on delivery or enter a transaction reference below.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Summary */}
        <div className="h-fit rounded-xl border border-line bg-card p-6 shadow-sm">
          <h3 className="font-display text-base font-bold text-ink">Order Items ({items.length})</h3>

          <div className="mt-4 max-h-60 space-y-3 overflow-y-auto border-b border-line pb-4 text-xs">
            {items.map((line) => (
              <div key={line.product_id} className="flex justify-between gap-2">
                <span className="truncate text-muted">
                  {line.name} <span className="font-bold text-ink">× {line.quantity}</span>
                </span>
                <span className="shrink-0 font-bold text-ink">
                  {formatKES(line.unit_price * line.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between text-muted">
              <span>Items Subtotal:</span>
              <span className="font-bold text-ink">{formatKES(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Delivery Fee ({formData.county}):</span>
              <span className="font-bold text-ink">{formatKES(shippingFee)}</span>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-sm font-extrabold text-ink">
              <span>Total Payable:</span>
              <span className="text-base text-teal">{formatKES(totalAmount)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || stkPushLoading}
            className="btn btn-emerald mt-6 w-full !h-12 text-sm font-bold shadow-md disabled:opacity-50"
          >
            {stkPushLoading ? 'Sending STK Push…' : loading ? 'Processing Order…' : 'Place Order Now'}
          </button>

          <p className="mt-3 text-center text-[10px] text-muted">
            By placing your order, you agree to OREMITECH Kenya terms of service and physical inspection policies.
          </p>
        </div>
      </form>
    </div>
  )
}
