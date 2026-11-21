import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { CheckCircle2, Clock3, Mail, PackageCheck, Printer, Truck } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { formatKES, normalizePhone } from '@/lib/commerce'
import { useSettingsStore } from '@/store/settingsStore'
import { clearCheckoutAttempt } from '@/lib/checkoutAttempt'

type OrderItem = { name: string; quantity: number; unit_price: number; line_total: number; fulfilment: string }
type OrderReceipt = {
  found: boolean; order_id: string; order_number: string; created_at: string; customer_name: string
  delivery_location: string; payment_method: string; status: string; payment_status: string
  currency: string; subtotal: number; discount: number; delivery_fee: number; total: number
  requires_supplier_confirmation: boolean; items: OrderItem[]
}
type ConfirmationState = {
  orderId?: string; phone?: string; customerName?: string; deliveryLocation?: string
  paymentMethod?: string; email?: string; startMpesa?: boolean
}

function paymentLabel(method?: string) {
  if (method === 'mpesa_paybill') return 'M-PESA'
  if (method === 'cash_on_delivery') return 'Cash on Delivery'
  return method?.replace(/_/g, ' ') || 'Payment method pending'
}

function paymentStatusLabel(status?: string) {
  if (status === 'confirmed') return 'Paid and confirmed'
  if (status === 'pending') return 'Pending confirmation'
  if (status === 'failed') return 'Failed'
  if (status === 'refunded') return 'Refunded'
  return 'Not paid'
}

export default function OrderConfirmation() {
  const { orderNumber = '' } = useParams()
  const location = useLocation()
  const initial = (location.state || {}) as ConfirmationState
  const { settings, load: loadSettings } = useSettingsStore()
  const [order, setOrder] = useState<OrderReceipt | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [stkMessage, setStkMessage] = useState<string | null>(null)
  const [emailMessage, setEmailMessage] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<string>('pending')
  const didStartStk = useRef(false)
  const didSendEmail = useRef(false)
  const didRequestOwnerSms = useRef(false)
  const paybillNumber = import.meta.env.VITE_MPESA_PAYBILL_NUMBER?.trim()

  useEffect(() => { void loadSettings() }, [loadSettings])

  useEffect(() => {
    let active = true
    const loadOrder = async () => {
      if (!initial.phone || !orderNumber) {
        setLoadError('Order details could not be verified in this browser session. Use order tracking with your order number and phone to look it up.')
        setLoading(false)
        return
      }
      const supabase = getSupabase()
      if (!supabase) {
        setLoadError('Order details are temporarily unavailable. Your order was received; please try refreshing later.')
        setLoading(false)
        return
      }
      const { data, error } = await supabase.rpc('get_order_confirmation', {
        p_number: orderNumber,
        p_phone: normalizePhone(initial.phone),
      })
      if (!active) return
      if (error || !data?.found) {
        setLoadError(error?.message || 'We could not verify this order. Check the order number and contact the store if you need help.')
      } else {
        setOrder(data as OrderReceipt)
        setPaymentStatus(String(data.payment_status || 'unpaid'))
        clearCheckoutAttempt()
      }
      setLoading(false)
    }
    void loadOrder()
    return () => { active = false }
  }, [initial.phone, orderNumber])

  useEffect(() => {
    if (!order || !initial.startMpesa || !initial.orderId || !initial.phone || didStartStk.current) return
    const supabase = getSupabase()
    if (!supabase) return
    didStartStk.current = true
    void supabase.functions.invoke('daraja-stk-push', {
      body: { phone: normalizePhone(initial.phone), order_id: initial.orderId },
    }).then(({ data, error }) => {
      if (error) {
        setStkMessage('We could not confirm whether the payment request reached Safaricom. Your order is safe. Check its status before trying to pay again.')
      } else if (data?.started) {
        setPaymentStatus('pending')
        setStkMessage(data.CustomerMessage || 'Payment prompt sent. Enter your M-PESA PIN, then wait for payment confirmation.')
      } else if (data?.safeToPayManually) {
        setStkMessage(data.message || 'The payment prompt is unavailable. You may pay by PayBill and submit the transaction code for verification.')
      } else {
        setStkMessage(data?.message || 'Payment status is uncertain. Check order tracking before attempting payment again.')
      }
    }).catch(() => setStkMessage('We could not confirm payment request status. Your order is safe; check its status before paying again.'))
  }, [order, initial.startMpesa, initial.orderId, initial.phone])

  useEffect(() => {
    if (!order || !initial.email || !initial.phone || didSendEmail.current) return
    const supabase = getSupabase()
    if (!supabase) return
    didSendEmail.current = true
    void supabase.functions.invoke('send-order-confirmation', {
      body: { order_number: order.order_number, phone: normalizePhone(initial.phone) },
    }).then(({ data, error }) => {
      if (error || data?.error) setEmailMessage('We could not send the email right now. Your order is confirmed; contact the store if you need a copy.')
      else if (data?.sent) setEmailMessage(`Confirmation sent to ${initial.email}.`)
      else if (data?.reason === 'no_email') setEmailMessage('No email address was provided for this order.')
      else if (data?.reason === 'already_attempted') setEmailMessage('Your confirmation email has already been sent or is still being prepared.')
      else setEmailMessage('The email provider could not accept the confirmation. Your order remains confirmed.')
    }).catch(() => setEmailMessage('We could not send the email right now. Your order is confirmed.'))
  }, [order, initial.email, initial.phone])

  useEffect(() => {
    if (!order || !initial.phone || didRequestOwnerSms.current) return
    const supabase = getSupabase()
    if (!supabase) return
    didRequestOwnerSms.current = true
    void supabase.functions.invoke('send-new-order-sms', {
      body: { order_number: order.order_number, phone: normalizePhone(initial.phone) },
    }).catch((error) => console.error('Order alert could not be requested:', error))
  }, [order, initial.phone])

  useEffect(() => {
    if (!order || order.payment_method !== 'mpesa_paybill' || paymentStatus === 'confirmed' || !initial.phone) return
    const supabase = getSupabase()
    if (!supabase) return
    let stopped = false
    let attempts = 0
    const check = async () => {
      attempts += 1
      const { data } = await supabase.rpc('track_order', { p_number: order.order_number, p_phone: normalizePhone(initial.phone!) })
      if (stopped || !data?.found) return attempts >= 12
      if (data.payment_status) setPaymentStatus(String(data.payment_status))
      return data.payment_status === 'confirmed' || data.payment_status === 'failed' || attempts >= 12
    }
    const timer = setInterval(() => { void check().then((done) => { if (done) clearInterval(timer) }) }, 5000)
    void check().then((done) => { if (done) clearInterval(timer) })
    return () => { stopped = true; clearInterval(timer) }
  }, [order, paymentStatus, initial.phone])

  const dateLabel = order?.created_at
    ? new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Nairobi' }).format(new Date(order.created_at))
    : '—'

  return (
    <main className="wrap max-w-4xl py-8 md:py-12">
      <section className="order-document rounded-2xl border border-line bg-card p-5 shadow-md md:p-9">
        <header className="flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="OREMITECH" className="h-12 w-12" />
            <div><p className="font-display text-xl font-black tracking-tight text-ink">OREMITECH</p><p className="text-xs text-muted">Verified technology, delivered.</p></div>
          </div>
          <div className="flex gap-2 print:hidden">
            <button type="button" onClick={() => window.print()} className="btn btn-outline text-xs font-bold"><Printer className="mr-2 h-4 w-4" />Print / Save PDF</button>
            <Link to="/order-tracking" className="btn btn-emerald text-xs font-bold"><Truck className="mr-2 h-4 w-4" />Track order</Link>
          </div>
        </header>

        <div className="py-7 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-teal" />
          <h1 className="mt-3 font-display text-2xl font-extrabold text-ink md:text-3xl">Thank you. Your order is confirmed.</h1>
          <p className="mt-2 text-sm text-muted">We have saved your order. Payment will only show as paid after it is verified.</p>
          <div className="mt-5 inline-flex flex-col rounded-xl bg-mist px-6 py-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Order number</span>
            <span className="text-xl font-black text-teal">{order?.order_number || decodeURIComponent(orderNumber)}</span>
          </div>
        </div>

        {loading && <p className="flex items-center justify-center gap-2 py-6 text-sm text-muted"><Clock3 className="h-4 w-4 animate-pulse" />Loading your saved order details…</p>}
        {loadError && <div role="status" className="mb-5 rounded-lg border border-amber/30 bg-amber/10 p-4 text-sm text-amberdeep">{loadError}</div>}

        {order && <>
          <div className="grid gap-4 border-y border-line py-5 text-sm sm:grid-cols-2">
            <div><p className="text-xs font-bold uppercase tracking-wide text-muted">Order date</p><p className="mt-1 font-semibold text-ink">{dateLabel}</p></div>
            <div><p className="text-xs font-bold uppercase tracking-wide text-muted">Customer</p><p className="mt-1 font-semibold text-ink">{order.customer_name}</p></div>
            <div><p className="text-xs font-bold uppercase tracking-wide text-muted">Deliver to</p><p className="mt-1 font-semibold text-ink">{order.delivery_location}</p></div>
            <div><p className="text-xs font-bold uppercase tracking-wide text-muted">Payment</p><p className="mt-1 font-semibold text-ink">{paymentLabel(order.payment_method)}</p></div>
            <div><p className="text-xs font-bold uppercase tracking-wide text-muted">Payment status</p><p className={`mt-1 font-bold ${paymentStatus === 'confirmed' ? 'text-teal' : 'text-amberdeep'}`}>{paymentStatusLabel(paymentStatus)}</p></div>
            <div><p className="text-xs font-bold uppercase tracking-wide text-muted">Order status</p><p className="mt-1 font-semibold capitalize text-ink">{(order.status || 'pending').replace(/_/g, ' ')}</p></div>
          </div>

          <div className="py-6">
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-ink"><PackageCheck className="h-5 w-5 text-teal" />Order summary</h2>
            <div className="overflow-hidden rounded-xl border border-line">
              <div className="hidden grid-cols-[1fr_5rem_8rem_8rem] gap-3 bg-mist px-4 py-3 text-xs font-bold text-muted sm:grid"><span>Product</span><span>Qty</span><span>Unit price</span><span className="text-right">Amount</span></div>
              {order.items.map((item, index) => <div key={`${item.name}-${index}`} className="grid grid-cols-2 gap-2 border-t border-line px-4 py-3 text-sm first:border-t-0 sm:grid-cols-[1fr_5rem_8rem_8rem] sm:gap-3">
                <span className="col-span-2 font-semibold text-ink sm:col-span-1">{item.name}</span><span className="text-muted">Qty: {item.quantity}</span><span className="text-muted">{formatKES(item.unit_price)} each</span><span className="text-right font-bold text-ink">{formatKES(item.line_total)}</span>
              </div>)}
            </div>
            <div className="ml-auto mt-4 max-w-sm space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted">Subtotal</span><span className="font-semibold">{formatKES(order.subtotal)}</span></div>
              {Number(order.discount) > 0 && <div className="flex justify-between"><span className="text-muted">Discount</span><span className="font-semibold">−{formatKES(order.discount)}</span></div>}
              <div className="flex justify-between"><span className="text-muted">Delivery fee</span><span className="font-semibold">{formatKES(order.delivery_fee)}</span></div>
              <div className="flex justify-between border-t border-line pt-3 text-base font-extrabold"><span>Total</span><span className="text-teal">{formatKES(order.total)}</span></div>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-mist p-4">
            <h2 className="font-bold text-ink">What happens next</h2>
            <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-muted">
              <li>Our team reviews your order and delivery details.</li>
              <li>We contact you on the supplied phone number to coordinate delivery.</li>
              {order.requires_supplier_confirmation && <li>Supplier stock is physically reconfirmed before dispatch.</li>}
              <li>Track order progress using the order number and your phone.</li>
            </ol>
          </div>

          {order.payment_method === 'mpesa_paybill' && paymentStatus !== 'confirmed' && <div className="mt-4 rounded-xl border border-amber/30 bg-amber/10 p-4 text-sm">
            <p className="font-bold text-amberdeep">M-PESA payment is not confirmed yet.</p>
            <p className="mt-1 text-muted">{stkMessage || 'Wait for the payment prompt or check order tracking. Do not pay twice while the status is uncertain.'}</p>
            {paybillNumber && <p className="mt-2 text-muted">PayBill: <strong>{paybillNumber}</strong> · Account: <strong>{order.order_number}</strong> · Amount: <strong>{formatKES(order.total)}</strong></p>}
          </div>}
        </>}

        {emailMessage && <p className="mt-4 flex items-center gap-2 text-sm text-muted"><Mail className="h-4 w-4" />{emailMessage}</p>}
        {settings.store_email && <p className="mt-5 text-center text-xs text-muted">Questions? Contact <a className="font-semibold text-teal underline" href={`mailto:${settings.store_email}`}>{settings.store_email}</a></p>}
        <footer className="mt-7 border-t border-line pt-5 text-center text-xs text-muted">
          {settings.store_location && <p>{settings.store_location}</p>}
          <p className="mt-1">OREMITECH · {settings.tagline}</p>
        </footer>
      </section>
    </main>
  )
}
