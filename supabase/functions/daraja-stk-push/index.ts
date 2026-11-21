import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StkPushRequest {
  phone: string
  order_id: string
}

function normalizeKenyanPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (/^254\d{9}$/.test(digits)) return digits
  if (/^0\d{9}$/.test(digits)) return `254${digits.slice(1)}`
  if (/^\d{9}$/.test(digits)) return `254${digits}`
  return ''
}

function darajaTimestamp(): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}${values.month}${values.day}${values.hour}${values.minute}${values.second}`
}

async function getDarajaAccessToken(consumerKey: string, consumerSecret: string, env: string): Promise<string> {
  const baseUrl = env === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke'
  const auth = btoa(`${consumerKey}:${consumerSecret}`)

  const res = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Daraja OAuth failed: ${res.status} ${text}`)
  }

  const data = await res.json()
  return data.access_token
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let providerAccepted = false
  let knownOrderNumber = ''
  let paymentReservationId: string | null = null
  let releaseReservation: (() => Promise<boolean>) | null = null
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace(/^Bearer\s+/i, '')
    let authenticatedUserId: string | null = null
    if (token) {
      const { data, error } = await supabase.auth.getUser(token)
      if (!error) authenticatedUserId = data.user?.id ?? null
    }

    const body: StkPushRequest = await req.json()
    const phone = normalizeKenyanPhone(body.phone || '')
    const { order_id } = body

    if (!phone || !order_id) {
      return new Response(JSON.stringify({ error: 'Enter a valid Kenyan phone and order reference' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const consumerKey = Deno.env.get('DARAJA_CONSUMER_KEY')
    const consumerSecret = Deno.env.get('DARAJA_CONSUMER_SECRET') ?? Deno.env.get('DARAJA_CONSUMER_SECRE')
    const shortcode = Deno.env.get('DARAJA_SHORTCODE')
    const passkey = Deno.env.get('DARAJA_PASSKEY')
    const env = Deno.env.get('DARAJA_ENVIRONMENT') ?? 'sandbox'
    const callbackUrl = Deno.env.get('DARAJA_CALLBACK_URL')
    const callbackToken = Deno.env.get('DARAJA_CALLBACK_TOKEN')

    let callbackIsProtected = false
    if (callbackUrl && callbackToken) {
      try {
        const parsedCallbackUrl = new URL(callbackUrl)
        callbackIsProtected = parsedCallbackUrl.protocol === 'https:'
          && parsedCallbackUrl.searchParams.get('token') === callbackToken
      } catch {
        callbackIsProtected = false
      }
    }

    if (!consumerKey || !consumerSecret || !shortcode || !passkey || !callbackUrl || !callbackIsProtected) {
      return new Response(JSON.stringify({ started: false, safeToPayManually: true, message: 'STK Push is not configured.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (env !== 'sandbox' && env !== 'production') {
      return new Response(JSON.stringify({ started: false, safeToPayManually: true, message: 'STK Push is not configured.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (env === 'production' && Deno.env.get('DARAJA_ALLOW_PRODUCTION') !== 'true') {
      return new Response(JSON.stringify({ started: false, safeToPayManually: true, message: 'Production STK payments are disabled pending account verification.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify the order exists and belongs to this user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, order_number, total, guest_phone, payment_method, status, requires_supplier_confirmation')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    knownOrderNumber = order.order_number
    if ((authenticatedUserId && order.user_id !== authenticatedUserId) || (!authenticatedUserId && order.user_id !== null)) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (order.payment_method !== 'mpesa_paybill' || order.status === 'paid' || order.status === 'cancelled' || order.status === 'refunded' || order.requires_supplier_confirmation) {
      return new Response(JSON.stringify({ error: 'This order cannot start an M-PESA payment' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const orderPhone = normalizeKenyanPhone(order.guest_phone || '')
    const amount = Number(order.total)
    if (!orderPhone || orderPhone !== phone || !Number.isSafeInteger(amount) || amount < 1) {
      return new Response(JSON.stringify({ error: 'Payment phone or order amount is invalid' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: reservationId, error: reservationError } = await supabase.rpc('prepare_mpesa_stk_payment', {
      p_order_id: order_id,
    })
    if (reservationError || !reservationId) {
      return new Response(JSON.stringify({
        started: false,
        safeToPayManually: false,
        paymentState: 'unknown',
        message: 'An M-PESA payment attempt is already pending or could not be reserved. Check order tracking before paying again.',
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    paymentReservationId = String(reservationId)
    releaseReservation = async () => {
      const { error } = await supabase.rpc('fail_mpesa_stk_payment', { p_payment_id: paymentReservationId })
      return !error
    }

    // Get OAuth token (server-side, secret not exposed)
    const accessToken = await getDarajaAccessToken(consumerKey, consumerSecret, env)

    const baseUrl = env === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke'
    const timestamp = darajaTimestamp()
    const password = btoa(`${shortcode}${passkey}${timestamp}`)

    const stkPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: phone,
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: callbackUrl,
      AccountReference: `OM${order.order_number.replace(/[^A-Z0-9]/gi, '').slice(-10)}`,
      TransactionDesc: `OREMITECH ${order.order_number}`.slice(0, 13),
    }

    const stkRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPayload),
    })

    const stkData = await stkRes.json()

    if (!stkRes.ok || String(stkData.ResponseCode) !== '0' || !stkData.CheckoutRequestID) {
      const released = releaseReservation ? await releaseReservation() : false
      paymentReservationId = null
      return new Response(JSON.stringify(released
        ? { started: false, safeToPayManually: true, message: 'Safaricom did not accept the STK request.' }
        : { started: false, safeToPayManually: false, paymentState: 'unknown', message: 'The STK request failed and its payment reservation could not be released. Do not pay again yet.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    providerAccepted = true

    // Record the pending payment in Supabase
    const { error: paymentError } = await supabase.rpc('begin_mpesa_stk_payment', {
      p_payment_id: paymentReservationId,
      p_checkout_request_id: stkData.CheckoutRequestID,
    })
    if (paymentError) throw new Error('Payment was initiated but could not be recorded. Contact support before retrying.')

    return new Response(JSON.stringify({
      started: true,
      safeToPayManually: false,
      CustomerMessage: stkData.CustomerMessage,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch {
    let reservationReleased = paymentReservationId === null
    if (!providerAccepted && paymentReservationId && releaseReservation) {
      reservationReleased = await releaseReservation()
    }
    return new Response(JSON.stringify(providerAccepted
      ? { started: false, safeToPayManually: false, paymentState: 'unknown', order_number: knownOrderNumber, message: 'STK was accepted but its status could not be recorded. Do not pay again until the order status is checked.' }
      : reservationReleased
        ? { started: false, safeToPayManually: true, message: 'STK could not be started. You can use PayBill if it is configured.' }
        : { started: false, safeToPayManually: false, paymentState: 'unknown', order_number: knownOrderNumber, message: 'Payment status is uncertain. Do not pay again until the order status is checked.' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
