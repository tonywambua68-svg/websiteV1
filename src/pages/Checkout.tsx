import { useState, FormEvent, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { useSettingsStore } from '@/store/settingsStore'
import { getSupabase } from '@/lib/supabase'
import { isProductUuid } from '@/lib/productIds'
import { getCheckoutAttemptToken } from '@/lib/checkoutAttempt'
import {
  CheckCircle2,
  Truck,
  ShieldCheck,
  Phone,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react'
import { formatKES, normalizePhone, isKenyanPhone, whatsappHref } from '@/lib/commerce'

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
  const { items, totals, clearCart, refreshPrices } = useCartStore()
  const { user, isAuthenticated, checkAuth } = useAuthStore()
  const supportPhone = useSettingsStore((state) => state.settings.whatsapp_e164)
  const { subtotal } = totals()
  const paybillNumber = import.meta.env.VITE_MPESA_PAYBILL_NUMBER?.trim()

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [authReady, setAuthReady] = useState(false)
  const submissionLock = useRef(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState('')
  const [confirmedOrderTotal, setConfirmedOrderTotal] = useState<number | null>(null)
  const [referenceSubmitted, setReferenceSubmitted] = useState(false)
  const [paymentReference, setPaymentReference] = useState('')
  const [stkPaymentState, setStkPaymentState] = useState<'idle' | 'starting' | 'pending' | 'confirmed' | 'failed' | 'manual' | 'unknown'>('idle')
  const [stkPaymentMessage, setStkPaymentMessage] = useState<string | null>(null)
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<'mpesa' | 'delivery'>(paybillNumber ? 'mpesa' : 'delivery')

  // Delivery fee state (computed server-side, never trusted from frontend)
  const [deliveryFee, setDeliveryFee] = useState(0)
  const [deliveryZoneId, setDeliveryZoneId] = useState<string | null>(null)
  const [deliveryZone, setDeliveryZone] = useState<string | null>(null)
  const [deliverySupported, setDeliverySupported] = useState(false)
  const [deliveryMessage, setDeliveryMessage] = useState<string | null>(null)
  const [codEligible, setCodEligible] = useState(false)
  const [deliveryMethod, setDeliveryMethod] = useState<string | null>(null)
  const [feeCalculating, setFeeCalculating] = useState(false)
  const deliveryRequestId = useRef(0)

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
    refreshPrices()
  }, [checkAuth, refreshPrices])

  useEffect(() => {
    if (!authReady || !user) return
    const parts = (user.full_name || '').trim().split(/\s+/).filter(Boolean)
    setFormData((current) => ({
      ...current,
      firstName: current.firstName || parts[0] || '',
      lastName: current.lastName || parts.slice(1).join(' '),
      phone: current.phone || user.phone || '',
      email: current.email || user.email || '',
    }))
  }, [authReady, user])

  // Calculate delivery fee server-side when location or subtotal changes
  // Never trust a frontend-submitted delivery fee
  useEffect(() => {
    if (!formData.county || !formData.town) {
      setDeliveryFee(0)
      setDeliveryZoneId(null)
      setDeliveryZone(null)
      setDeliverySupported(false)
      setDeliveryMessage(null)
      setCodEligible(false)
      setDeliveryMethod(null)
      return
    }

    setFeeCalculating(true)
    const abortController = new AbortController()
    const requestId = ++deliveryRequestId.current

    ;(async () => {
      try {
        const supabase = getSupabase()
        if (!supabase) {
          setDeliveryMessage('Delivery is temporarily unavailable. Please try again later.')
          setFeeCalculating(false)
          return
        }

        const { data, error } = await supabase.functions.invoke('get-delivery-fees', {
          body: {
            county: formData.county,
            town: formData.town,
            subtotal: subtotal,
          },
          signal: abortController.signal,
        })

        if (error) throw error
        if (requestId !== deliveryRequestId.current) return

        setDeliverySupported(data.supported ?? false)
        setDeliveryZoneId(data.zone_id ?? null)
        setDeliveryZone(data.zone_name ?? null)
        setDeliveryFee(data.supported ? (data.delivery_fee ?? 0) : 0)
        setDeliveryMessage(data.message ?? null)
        setCodEligible(data.cod_eligible ?? false)
        setDeliveryMethod(data.delivery_method ?? null)
      } catch (err: any) {
        if (err.name === 'AbortError') return
        if (requestId !== deliveryRequestId.current) return
        setDeliverySupported(false)
        setDeliveryMessage('Delivery is temporarily unavailable. Please try again later.')
        setDeliveryFee(0)
      } finally {
        if (requestId === deliveryRequestId.current) setFeeCalculating(false)
      }
    })()

    return () => abortController.abort()
  }, [formData.county, formData.town, subtotal, getSupabase])

  useEffect(() => {
    if (!orderPlaced || selectedPaymentMode !== 'mpesa' || stkPaymentState !== 'pending') return
    const supabase = getSupabase()
    if (!supabase) return
    let attempts = 0
    const poll = async () => {
      attempts += 1
      const { data, error } = await supabase.rpc('track_order', {
        p_number: confirmedOrderNumber,
        p_phone: normalizePhone(formData.phone),
      })
      if (!error && data?.found) {
        if (data.payment_status === 'confirmed') {
          setStkPaymentState('confirmed')
          setStkPaymentMessage('M-PESA payment confirmed.')
          return true
        }
        if (data.payment_status === 'failed') {
          setStkPaymentState('failed')
          setStkPaymentMessage('The STK payment did not complete. Contact the store before retrying or paying again.')
          return true
        }
      }
      return attempts >= 12
    }
    let stopped = false
    const timer = setInterval(() => {
      void poll().then((done) => {
        if (done && !stopped) clearInterval(timer)
      })
    }, 5000)
    void poll().then((done) => {
      if (done) clearInterval(timer)
    })
    return () => { stopped = true; clearInterval(timer) }
  }, [orderPlaced, selectedPaymentMode, stkPaymentState, confirmedOrderNumber, formData.phone])

  if (!authReady) {
    return null
  }

  if (items.length === 0 && !orderPlaced) {
    navigate('/cart')
    return null
  }

  const hasSupplierItems = items.some((item) => item.availability === 'supplier')
  const shippingFee = deliveryFee
  const totalAmount = subtotal + shippingFee

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting || submissionLock.current) return
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
    if (feeCalculating || !deliverySupported || !deliveryZoneId) {
      setErrorMessage(deliveryMessage || 'Wait for a supported delivery fee before placing your order.')
      return
    }
    if (selectedPaymentMode === 'delivery' && !codEligible) {
      setErrorMessage('Cash on delivery is not available for this location or order amount.')
      return
    }
    if (selectedPaymentMode === 'mpesa' && !paybillNumber) {
      setErrorMessage('M-PESA PayBill is not configured. Choose another available payment method or contact the store.')
      return
    }

    submissionLock.current = true
    setSubmitting(true)
    setLoading(true)

    let productsVerified = false
    try {
      productsVerified = await refreshPrices()
    } catch {
      setErrorMessage('We could not verify the products in your cart. Please try again before placing the order.')
      setSubmitting(false)
      setLoading(false)
      submissionLock.current = false
      return
    }
    if (!productsVerified) {
      const cartStatus = useCartStore.getState()
      setErrorMessage(cartStatus.error || 'A product is no longer available from the store. Review your cart and try again.')
      setSubmitting(false)
      setLoading(false)
      submissionLock.current = false
      return
    }
    const refreshedCart = useCartStore.getState()
    const checkoutItems = refreshedCart.items
    const refreshedSubtotal = refreshedCart.totals().subtotal
    if (checkoutItems.length === 0) {
      setErrorMessage('Your cart no longer has products available from the store. Please return to the shop and add available products.')
      setSubmitting(false)
      setLoading(false)
      submissionLock.current = false
      return
    }
    if (checkoutItems.some((item) => !isProductUuid(item.product_id))) {
      setErrorMessage('A cart item could not be matched to a store product. Please remove it and add the product again from the shop.')
      setSubmitting(false)
      setLoading(false)
      submissionLock.current = false
      return
    }
    if (refreshedSubtotal !== subtotal) {
      setErrorMessage('Your cart prices or stock were updated. Review the refreshed cart and delivery total before placing the order.')
      setSubmitting(false)
      setLoading(false)
      return
    }

    const normalizedPhone = normalizePhone(formData.phone)
    const customerFullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`
    const fullDestination = `${formData.county}, ${formData.town.trim()} - ${formData.street.trim() || 'N/A'}`

    try {
      const supabase = getSupabase()
      if (!supabase) {
        throw new Error('Checkout is temporarily unavailable because the store database is not configured.')
      }

      try {
        const orderFingerprint = JSON.stringify({
          cart: checkoutItems.map((item) => [item.product_id, item.quantity]),
          phone: normalizedPhone,
          customer: customerFullName,
          email: formData.email.trim().toLowerCase(),
          destination: fullDestination,
          instructions: formData.deliveryNotes.trim(),
          payment_method: selectedPaymentMode === 'mpesa' ? 'mpesa_paybill' : 'cash_on_delivery',
          delivery_zone_id: deliveryZoneId,
          delivery_method: deliveryMethod,
        })
        const checkoutToken = getCheckoutAttemptToken(orderFingerprint)
        const { data, error } = await supabase.rpc('place_order', {
          payload: {
            customer_name: customerFullName,
            phone: normalizedPhone,
            email: formData.email.trim() || null,
            delivery_location: fullDestination,
            county: formData.county,
            town: formData.town.trim(),
            delivery_instructions: formData.deliveryNotes.trim() || null,
            coupon_code: null,
            payment_method: selectedPaymentMode === 'mpesa' ? 'mpesa_paybill' : 'cash_on_delivery',
            payment_reference: null,
            checkout_token: checkoutToken,
            delivery_zone_name: deliveryZone ?? null,
            delivery_zone_id: deliveryZoneId ?? null,
            delivery_method: deliveryMethod ?? null,
            items: checkoutItems.map((item) => ({
              product_id: item.product_id,
              variant_id: null,
              quantity: item.quantity,
            })),
          },
        })

        if (error) throw error
        if (!data) throw new Error('The store did not confirm the order. Please try again.')
        const orderId = String((data as any).order_id || (data as any).id || '')
        const orderNumber = String((data as any).order_number || '')
        const confirmedTotal = Number((data as any).total)
        if (!isProductUuid(orderId) || !orderNumber || !Number.isFinite(confirmedTotal)) {
          throw new Error('The store response was incomplete. Your order may have been recorded; retrying safely will check the same order.')
        }
        setConfirmedOrderNumber(orderNumber)
        setConfirmedOrderTotal(confirmedTotal)
        setReferenceSubmitted(false)
        setOrderPlaced(true)
        const orderState = {
          orderId,
          phone: normalizedPhone,
          email: formData.email.trim(),
          startMpesa: selectedPaymentMode === 'mpesa',
        }
        void clearCart().catch((clearError) => console.error('Cart cleanup after confirmed order failed:', clearError))
        navigate(`/order-confirmation/${encodeURIComponent(orderNumber)}`, { replace: true, state: orderState })
        return
      } catch (dbErr: any) {
        if (/A product in the cart is not available/i.test(dbErr.message || '')) {
          await refreshPrices()
          setErrorMessage('A product became unavailable before the order was saved. Your cart has been refreshed; please review it and try again.')
        } else {
          setErrorMessage(dbErr.message || 'Database order placement failed.')
        }
        setSubmitting(false)
        setLoading(false)
        submissionLock.current = false
        return
      }

      // A confirmed order navigates above before background cart synchronization.
    } catch (err) {
      console.error('Checkout error:', err)
      setErrorMessage(err instanceof Error ? err.message : 'Could not complete order placement. Please check your connection.')
    } finally {
      setSubmitting(false)
      setLoading(false)
      submissionLock.current = false
    }
  }

  const submitPaymentReference = async (event: FormEvent) => {
    event.preventDefault()
    const supabase = getSupabase()
    if (!supabase || !paymentReference.trim()) return
    const { error } = await supabase.rpc('submit_payment_reference', {
      p_order_number: confirmedOrderNumber,
      p_phone: normalizePhone(formData.phone),
      p_reference: paymentReference.trim().toUpperCase(),
    })
    if (error) {
      setErrorMessage(error.message)
      return
    }
    setErrorMessage(null)
    setReferenceSubmitted(true)
  }

  if (orderPlaced) {
    const waText = `Hello OREMITECH, I just placed order #${confirmedOrderNumber} for delivery to ${formData.county}. Please confirm dispatch.`
    const waLink = supportPhone ? whatsappHref(supportPhone, waText) : null

    return (
      <div className="wrap max-w-2xl py-12">
        <div className="rounded-2xl border border-line bg-card p-8 text-center shadow-md">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-teal/10 text-teal">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <h1 className="mt-5 font-display text-2xl font-bold text-ink">Order Received Successfully!</h1>
          <p className="mt-2 text-sm text-muted">
            Thank you for shopping with OREMITECH Kenya. Your order has been recorded. We will contact you using the phone number you provided.
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
              <span className="text-teal">{formatKES(confirmedOrderTotal ?? totalAmount)}</span>
            </div>
          </div>

          {hasSupplierItems && (
            <div className="mt-4 rounded-lg border border-amber/30 bg-amber/10 p-3 text-left text-xs font-semibold text-amberdeep">
              Notice: Your order includes supplier-verified items. Our team will verify supplier physical availability before concluding final dispatch.
            </div>
          )}

          {selectedPaymentMode === 'mpesa' && (
            <div className="mt-4 rounded-lg border border-line bg-mist p-4 text-left text-xs">
              <p className="font-bold text-ink">M-PESA payment: {stkPaymentState.replace(/_/g, ' ')}</p>
              <p className="mt-1 text-muted">{stkPaymentMessage || 'Your order has not been marked paid.'}</p>
              {(stkPaymentState === 'manual' || stkPaymentState === 'failed') && paybillNumber && !referenceSubmitted && (
                <>
                  <p className="mt-3 text-muted">PayBill: <strong>{paybillNumber}</strong> · Account: <strong>{confirmedOrderNumber}</strong> · Amount: <strong>{formatKES(confirmedOrderTotal ?? totalAmount)}</strong></p>
                  <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={submitPaymentReference}>
                    <input
                      type="text"
                      value={paymentReference}
                      onChange={(event) => setPaymentReference(event.target.value.toUpperCase())}
                      placeholder="M-PESA transaction code"
                      className="input min-w-0 flex-1 text-xs"
                      required
                    />
                    <button type="submit" className="btn btn-outline !h-10 text-xs font-bold">Submit reference</button>
                  </form>
                </>
              )}
              {referenceSubmitted && <p className="mt-2 font-bold text-teal">Reference received for staff verification.</p>}
              {errorMessage && <p className="mt-2 text-error">{errorMessage}</p>}
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
              {paybillNumber ? <label
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                  selectedPaymentMode === 'mpesa' ? 'border-primary bg-blue-50/60' : 'border-line bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={selectedPaymentMode === 'mpesa'}
                  onChange={() => setSelectedPaymentMode('mpesa')}
                  className="mt-1 text-primary focus:ring-primary"
                />
                <div>
                  <span className="block text-sm font-extrabold text-ink">M-PESA STK Push</span>
                  <span className="mt-1 block text-xs text-muted">
                    {paybillNumber ? 'We will request payment on your phone. PayBill instructions are available if STK Push is unavailable.' : 'M-PESA is unavailable until payment is configured for this store.'}
                  </span>
                </div>
              </label> : <p className="col-span-2 rounded-lg border border-error/30 bg-error/10 p-3 text-xs text-error">M-PESA PayBill is not configured for this store.</p>}

              {codEligible && (
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                    selectedPaymentMode === 'delivery' ? 'border-primary bg-blue-50/60' : 'border-line bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={selectedPaymentMode === 'delivery'}
                    onChange={() => setSelectedPaymentMode('delivery')}
                    className="mt-1 text-primary focus:ring-primary"
                    disabled={!codEligible}
                  />
                  <div>
                    <span className="block text-sm font-extrabold text-ink">Cash on Delivery</span>
                    <span className="mt-1 block text-xs text-muted">
                      Pay cash when your order is delivered. Confirmed at handover.
                    </span>
                  </div>
                </label>
              )}

              {!codEligible && deliverySupported && (
                <div className="col-span-2 rounded-lg border border-amber/30 bg-amber/5 p-3 text-xs text-amberdeep">
                  Cash on Delivery is not available for this location or order amount.
                </div>
              )}
            </div>

            {!deliverySupported && deliveryMessage && (
              <div className="mt-4 rounded-lg border border-error/30 bg-error/10 p-3 text-xs text-error">
                {deliveryMessage}
              </div>
            )}

            {selectedPaymentMode === 'mpesa' && (
              <div className="mt-4 rounded-lg border border-primary/20 bg-blue-50/50 p-4 text-xs">
                <p className="font-bold text-ink flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" /> M-PESA PayBill Instructions
                </p>
                <div className="mt-2 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted">PayBill Number:</span>
                    <span className="font-bold text-ink bg-white border border-slate-200 px-2 py-0.5 rounded">{paybillNumber || 'Not configured'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Account Number:</span>
                    <span className="font-bold text-ink bg-white border border-slate-200 px-2 py-0.5 rounded">{confirmedOrderNumber || formData.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Amount (KSh):</span>
                    <span className="font-bold text-ink">{formatKES(totalAmount)}</span>
                  </div>
                </div>
                <p className="mt-2 text-muted">
                  STK Push is sent after order creation. If it cannot be started, the confirmation screen will provide these PayBill details and a transaction-code form.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Sidebar Summary */}
        <div className="h-fit rounded-xl border border-line bg-white p-6 shadow-sm">
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
            {deliverySupported && deliveryZone && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">Delivery ({deliveryZone}):</span>
                <span className="font-bold text-ink">{formatKES(deliveryFee)}</span>
              </div>
            )}
            {!deliverySupported && deliveryMessage && (
              <div className="flex justify-between text-xs text-error">
                <span>Delivery:</span>
                <span className="font-bold text-error">{deliveryMessage}</span>
              </div>
            )}
            {!deliverySupported && !deliveryMessage && feeCalculating && (
              <div className="flex justify-between text-xs text-muted">
                <span>Delivery:</span>
                <span className="font-bold text-muted">Calculating…</span>
              </div>
            )}
            <div className="flex justify-between border-t border-line pt-2 text-sm font-extrabold text-ink">
              <span>Total Payable:</span>
              <span className="text-base text-primary">{formatKES(totalAmount)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || submitting || feeCalculating || !deliverySupported || !deliveryZoneId}
            aria-live="polite"
            aria-busy={loading || submitting}
            className="btn btn-primary mt-6 w-full !h-12 text-sm font-bold shadow-md disabled:opacity-50"
          >
            {loading ? 'Processing Order…' : 'Place Order Now'}
          </button>

          <p className="mt-3 text-center text-[10px] text-muted">
            By placing your order, you agree to OREMITECH Kenya terms of service and returns policy.
          </p>
        </div>
      </form>
    </div>
  )
}
