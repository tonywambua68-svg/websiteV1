import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DarajaCallbackBody {
  Body: {
    stkCallback: {
      MerchantRequestID: string
      CheckoutRequestID: string
      ResultCode: number
      ResultDesc: string
      CallbackMetadata?: {
        Item: Array<{
          Name: string
          Value?: string | number
        }>
      }
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body: DarajaCallbackBody = await req.json()
    const { stkCallback } = body.Body

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback

    // Extract metadata fields
    let amount: number | null = null
    let mpesaReceiptNumber: string | null = null
    let transactionDate: string | null = null
    let phoneNumber: string | null = null

    if (CallbackMetadata?.Item) {
      for (const item of CallbackMetadata.Item) {
        if (item.Name === 'Amount') amount = Number(item.Value)
        if (item.Name === 'MpesaReceiptNumber') mpesaReceiptNumber = String(item.Value)
        if (item.Name === 'TransactionDate') transactionDate = String(item.Value)
        if (item.Name === 'PhoneNumber') phoneNumber = String(item.Value)
      }
    }

    const status = ResultCode === 0 ? 'confirmed' : 'failed'
    const reference = mpesaReceiptNumber ?? CheckoutRequestID

    // Find the payment record by reference (CheckoutRequestID)
    const { data: payment, error: paymentError } = await supabase
      .from('payment_records')
      .select('*, orders(*)')
      .eq('reference', CheckoutRequestID)
      .single()

    if (paymentError || !payment) {
      return new Response(JSON.stringify({ error: 'Payment record not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Only update if not already confirmed (idempotency)
    if (payment.status === 'confirmed') {
      return new Response(JSON.stringify({ status: 'already_processed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Record the payment result
    await supabase.rpc('record_payment', {
      p_order_id: payment.order_id,
      p_provider: 'mpesa_daraja',
      p_status: status,
      p_reference: reference,
      p_amount: amount ?? payment.amount,
    })

    return new Response(JSON.stringify({ status: 'processed', resultCode: ResultCode }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})