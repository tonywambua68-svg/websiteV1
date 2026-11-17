import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StkPushRequest {
  phone: string
  amount: number
  order_id: string
  account_reference?: string
  transaction_desc?: string
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

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body: StkPushRequest = await req.json()
    const { phone, amount, order_id, account_reference, transaction_desc } = body

    if (!phone || !amount || !order_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields: phone, amount, order_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const consumerKey = Deno.env.get('DARAJA_CONSUMER_KEY')
    const consumerSecret = Deno.env.get('DARAJA_CONSUMER_SECRET')
    const shortcode = Deno.env.get('DARAJA_SHORTCODE')
    const passkey = Deno.env.get('DARAJA_PASSKEY')
    const env = Deno.env.get('DARAJA_ENVIRONMENT') ?? 'sandbox'
    const callbackUrl = Deno.env.get('DARAJA_CALLBACK_URL')

    if (!consumerKey || !consumerSecret || !shortcode || !passkey) {
      return new Response(JSON.stringify({ error: 'Daraja credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify the order exists and belongs to this user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, total, customer_phone')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get OAuth token (server-side, secret not exposed)
    const accessToken = await getDarajaAccessToken(consumerKey, consumerSecret, env)

    const baseUrl = env === 'production' ? 'https://api.safaricom.co.ke' : 'https://safaricom.co.ke'
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '')
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
      CallBackURL: callbackUrl ?? `${new URL(req.url).origin}/api/payments/daraja-callback`,
      AccountReference: account_reference ?? order.order_number ?? order_id,
      TransactionDesc: transaction_desc ?? `OREMITECH order ${order.order_number ?? order_id}`,
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

    if (!stkRes.ok) {
      return new Response(JSON.stringify({ error: 'STK push failed', details: stkData }), {
        status: stkRes.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Record the pending payment in Supabase
    await supabase.rpc('record_payment', {
      p_order_id: order_id,
      p_provider: 'mpesa_daraja',
      p_status: 'pending',
      p_reference: stkData.CheckoutRequestID,
      p_amount: amount,
    })

    return new Response(JSON.stringify({
      MerchantRequestID: stkData.MerchantRequestID,
      CheckoutRequestID: stkData.CheckoutRequestID,
      ResponseCode: stkData.ResponseCode,
      ResponseDescription: stkData.ResponseDescription,
      CustomerMessage: stkData.CustomerMessage,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})