import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

interface DarajaCallbackBody {
  Body?: {
    stkCallback?: {
      CheckoutRequestID?: string
      ResultCode?: number
      CallbackMetadata?: { Item?: Array<{ Name: string; Value?: string | number }> }
    }
  }
}

function tokenMatches(provided: string | null, expected: string): boolean {
  if (!provided) return false
  const a = new TextEncoder().encode(provided)
  const b = new TextEncoder().encode(expected)
  let difference = a.length ^ b.length
  const length = Math.max(a.length, b.length)
  for (let i = 0; i < length; i += 1) difference |= (a[i] ?? 0) ^ (b[i] ?? 0)
  return difference === 0
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders })
  }

  const callbackToken = Deno.env.get('DARAJA_CALLBACK_TOKEN')
  const requestToken = new URL(req.url).searchParams.get('token')
  if (!callbackToken || !tokenMatches(requestToken, callbackToken)) {
    return new Response(JSON.stringify({ error: 'Unauthorized callback' }), { status: 401, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceKey) throw new Error('Payment callback is not configured')

    const body = await req.json() as DarajaCallbackBody
    const callback = body.Body?.stkCallback
    if (!callback?.CheckoutRequestID || !Number.isInteger(callback.ResultCode)) {
      return new Response(JSON.stringify({ error: 'Invalid provider callback' }), { status: 400, headers: corsHeaders })
    }

    let amount: number | null = null
    let receipt: string | null = null
    let phone: string | null = null
    for (const item of callback.CallbackMetadata?.Item ?? []) {
      if (item.Name === 'Amount' && item.Value !== undefined) amount = Number(item.Value)
      if (item.Name === 'MpesaReceiptNumber' && item.Value !== undefined) receipt = String(item.Value)
      if (item.Name === 'PhoneNumber' && item.Value !== undefined) phone = String(item.Value)
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data, error } = await supabase.rpc('finish_mpesa_stk_callback', {
      p_checkout_request_id: callback.CheckoutRequestID,
      p_result_code: callback.ResultCode,
      p_receipt: receipt,
      p_amount: Number.isFinite(amount) ? amount : null,
      p_phone: phone,
    })
    if (error) throw new Error('Provider callback validation failed')

    return new Response(JSON.stringify({ status: data?.status ?? 'processed' }), {
      status: 200,
      headers: corsHeaders,
    })
  } catch {
    // Avoid including provider payloads, credentials, or customer details in logs/responses.
    return new Response(JSON.stringify({ error: 'Payment callback could not be validated' }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})
