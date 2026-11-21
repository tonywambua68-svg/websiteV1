import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (data: Record<string, unknown>, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { ...cors, 'Content-Type': 'application/json' },
})

function normalizeKenyanPhone(value: unknown) {
  const digits = String(value || '').replace(/\D/g, '')
  if (/^254\d{9}$/.test(digits)) return `+${digits}`
  if (/^0\d{9}$/.test(digits)) return `+254${digits.slice(1)}`
  return ''
}

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const apiKey = Deno.env.get('AT_API_KEY')
  const username = Deno.env.get('AT_USERNAME')
  if (!apiKey || !username) return json({ sent: false, reason: 'sms_not_configured' }, 503)

  try {
    const body = await request.json()
    const orderNumber = String(body.order_number || '').trim().toUpperCase()
    const phone = normalizeKenyanPhone(body.phone)
    if (!orderNumber || orderNumber.length > 40 || !phone) return json({ error: 'Valid order details are required.' }, 400)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const authorization = request.headers.get('Authorization') || ''
    const accessToken = authorization.replace(/^Bearer\s+/i, '')
    if (!supabaseUrl || !serviceKey || !anonKey || !accessToken) return json({ error: 'A signed-in customer session is required.' }, 401)
    const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } })
    const { data: authData, error: authError } = await authClient.auth.getUser(accessToken)
    if (authError || !authData.user) return json({ error: 'A valid customer session is required.' }, 401)
    const service = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: order, error: orderError } = await service.from('orders')
      .select('id, order_number, user_id, guest_name, guest_phone, total')
      .eq('order_number', orderNumber).eq('user_id', authData.user.id).maybeSingle()
    if (orderError || !order || normalizeKenyanPhone(order.guest_phone) !== phone) return json({ error: 'Order not found.' }, 404)

    const { data: setting, error: settingError } = await service.from('business_settings')
      .select('value').eq('key', 'order_alert_phone').maybeSingle()
    if (settingError) return json({ error: 'Order alert destination could not be read.' }, 503)
    const destination = normalizeKenyanPhone(setting?.value)
    if (!destination) return json({ sent: false, reason: 'alert_phone_not_configured' }, 503)

    const { error: claimError } = await service.from('order_sms_dispatches').insert({ order_id: order.id, status: 'sending' })
    if (claimError) {
      const { data: prior } = await service.from('order_sms_dispatches').select('status').eq('order_id', order.id).maybeSingle()
      if (prior?.status === 'sent' || prior?.status === 'sending') return json({ sent: prior.status === 'sent', reason: 'already_attempted' })
      const { data: reclaimed } = await service.from('order_sms_dispatches').update({ status: 'sending', attempted_at: new Date().toISOString() })
        .eq('order_id', order.id).eq('status', 'failed').select('order_id').maybeSingle()
      if (!reclaimed) return json({ sent: false, reason: 'already_attempted' })
    }

    const senderId = Deno.env.get('AT_SENDER_ID')
    const message = `New OREMITECH order ${order.order_number}: KSh ${Number(order.total).toLocaleString('en-KE')}. ${String(order.guest_name || 'Customer').slice(0, 45)} called ${phone}. Check your admin orders.`
    const payload = new URLSearchParams({ username, to: destination, message })
    if (senderId) payload.set('from', senderId)
    let sent = false
    let providerStatus = 0
    let providerBody: unknown = null
    try {
      const response = await fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: { apiKey, Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload,
      })
      providerStatus = response.status
      const raw = await response.text()
      try { providerBody = JSON.parse(raw) } catch { providerBody = raw.slice(0, 1500) }
      sent = response.ok && (!providerBody || typeof providerBody !== 'object' || !('SMSMessageData' in (providerBody as Record<string, unknown>)) || Boolean((providerBody as any).SMSMessageData?.Recipients?.some((recipient: any) => recipient.statusCode === 101 || recipient.statusCode === 100)))
    } catch {
      providerBody = { error: 'Provider request failed before a response was received.' }
    }
    await service.from('order_sms_dispatches').update({ status: sent ? 'sent' : 'failed', provider_response: { http_status: providerStatus, body: providerBody }, updated_at: new Date().toISOString() }).eq('order_id', order.id)
    return sent ? json({ sent: true }) : json({ sent: false, reason: 'provider_rejected_message' }, 502)
  } catch {
    return json({ error: 'Unable to process this order alert.' }, 500)
  }
})
