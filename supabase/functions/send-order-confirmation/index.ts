import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
})

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[character]!))
}

function formatKes(value: unknown): string {
  return `KSh ${Number(value || 0).toLocaleString('en-KE', { maximumFractionDigits: 2 })}`
}

function paymentLabel(method: string): string {
  if (method === 'mpesa_paybill') return 'M-PESA'
  if (method === 'cash_on_delivery') return 'Cash on Delivery'
  return method.replace(/_/g, ' ')
}

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const apiKey = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('RESEND_FROM_EMAIL')
  const siteUrl = Deno.env.get('PUBLIC_SITE_URL')?.replace(/\/$/, '')
  if (!apiKey || !from || !siteUrl) {
    return json({ error: 'Order email is not configured. Set the Resend key, verified sender, and public site URL.' }, 503)
  }

  try {
    const body = await request.json()
    const orderNumber = String(body.order_number || '').trim().toUpperCase()
    const rawPhone = String(body.phone || '')
    const phoneDigits = rawPhone.replace(/\D/g, '')
    const phone = /^254\d{9}$/.test(phoneDigits) ? phoneDigits : /^0\d{9}$/.test(phoneDigits) ? `254${phoneDigits.slice(1)}` : ''
    if (!orderNumber || orderNumber.length > 40 || !phone) return json({ error: 'Valid order details are required.' }, 400)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Order email service is unavailable.' }, 503)
    const service = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })

    const { data: order, error: orderError } = await service.from('orders')
      .select('id, order_number, created_at, guest_name, guest_phone, guest_email, delivery_location, payment_method, status, currency, subtotal, discount, delivery_fee, total')
      .eq('order_number', orderNumber).eq('guest_phone', phone).maybeSingle()
    if (orderError || !order) return json({ error: 'Order not found.' }, 404)
    if (!order.guest_email) return json({ sent: false, reason: 'no_email' })

    // Claim a single send attempt. A retry after a timeout cannot send a duplicate
    // customer email or alter any order/payment records.
    const { error: claimError } = await service.from('order_email_dispatches').insert({
      order_id: order.id, email_type: 'order_confirmation', status: 'sending',
    })
    if (claimError) {
      const { data: prior } = await service.from('order_email_dispatches')
        .select('status').eq('order_id', order.id).eq('email_type', 'order_confirmation').maybeSingle()
      if (prior?.status === 'sent') return json({ sent: true, already_sent: true })
      if (prior?.status === 'failed') {
        const { data: reclaimed } = await service.from('order_email_dispatches')
          .update({ status: 'sending', attempted_at: new Date().toISOString() })
          .eq('order_id', order.id).eq('email_type', 'order_confirmation').eq('status', 'failed')
          .select('order_id').maybeSingle()
        if (!reclaimed) return json({ sent: false, reason: 'already_attempted' })
      } else {
        return json({ sent: false, reason: 'already_attempted' })
      }
    }

    const [{ data: items, error: itemsError }, { data: payment }, { data: settings }] = await Promise.all([
      service.from('order_items').select('product_name, quantity, unit_price, line_total').eq('order_id', order.id).order('id'),
      service.from('payment_records').select('status').eq('order_id', order.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      service.rpc('public_business_settings'),
    ])
    if (itemsError || !items?.length) {
      await service.from('order_email_dispatches').update({ status: 'failed' }).eq('order_id', order.id).eq('email_type', 'order_confirmation')
      return json({ error: 'Saved order items could not be read.' }, 500)
    }

    const paymentStatus = payment?.status || 'unpaid'
    const paymentStatusLabel = paymentStatus === 'confirmed' ? 'Paid and confirmed'
      : paymentStatus === 'pending' ? 'Pending confirmation'
      : paymentStatus === 'failed' ? 'Failed'
      : paymentStatus === 'refunded' ? 'Refunded' : 'Not paid'
    const publicSettings = settings && typeof settings === 'object' ? settings as Record<string, string> : {}
    const supportEmail = String(publicSettings.store_email || '')
    const whatsapp = String(publicSettings.whatsapp_e164 || '').replace(/\D/g, '')
    const date = new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Nairobi' }).format(new Date(order.created_at))
    const itemRows = items.map((item) => `<tr><td style="padding:12px;border-bottom:1px solid #e5eeeb">${escapeHtml(item.product_name)}</td><td style="padding:12px;border-bottom:1px solid #e5eeeb;text-align:center">${Number(item.quantity)}</td><td style="padding:12px;border-bottom:1px solid #e5eeeb;text-align:right">${formatKes(item.unit_price)}</td><td style="padding:12px;border-bottom:1px solid #e5eeeb;text-align:right">${formatKes(item.line_total)}</td></tr>`).join('')
    const discountRow = Number(order.discount) > 0 ? `<tr><td colspan="3" style="padding:6px 0;color:#58716a">Discount</td><td style="text-align:right">−${formatKes(order.discount)}</td></tr>` : ''
    const helpLine = [supportEmail ? `Email <a href="mailto:${escapeHtml(supportEmail)}" style="color:#087f73">${escapeHtml(supportEmail)}</a>` : '', whatsapp ? `WhatsApp <a href="https://wa.me/${escapeHtml(whatsapp)}" style="color:#087f73">${escapeHtml(publicSettings.whatsapp_e164)}</a>` : ''].filter(Boolean).join(' · ')
    const logoUrl = `${siteUrl}/logo.svg`
    const trackingUrl = `${siteUrl}/order-tracking`
    const html = `<!doctype html><html><body style="margin:0;background:#f1f6f4;font-family:Arial,sans-serif;color:#152b26"><div style="max-width:680px;margin:24px auto;background:#fff;border:1px solid #dce8e4;border-radius:16px;overflow:hidden"><div style="padding:24px 28px;background:#eaf5f1;display:flex;align-items:center"><img src="${escapeHtml(logoUrl)}" width="44" height="44" alt="OREMITECH" style="margin-right:12px"><div><strong style="font-size:22px;letter-spacing:.04em">OREMITECH</strong><div style="font-size:12px;color:#58716a">${escapeHtml(publicSettings.tagline || 'Verified technology, delivered.')}</div></div></div><div style="padding:28px"><h1 style="font-size:24px;margin:0 0 8px">Thank you, ${escapeHtml(order.guest_name)}.</h1><p style="color:#58716a;margin:0 0 20px">Your order has been saved. Keep this email as your order summary.</p><div style="padding:14px;background:#f5f9f7;border-radius:10px;margin-bottom:20px"><strong>Order ${escapeHtml(order.order_number)}</strong><div style="font-size:13px;color:#58716a;margin-top:5px">Placed ${escapeHtml(date)}</div></div><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="background:#f5f9f7"><th align="left" style="padding:10px">Product</th><th>Qty</th><th align="right">Unit price</th><th align="right">Amount</th></tr></thead><tbody>${itemRows}</tbody></table><table style="width:100%;max-width:340px;margin:18px 0 18px auto;font-size:13px">${`<tr><td colspan="3" style="padding:6px 0;color:#58716a">Subtotal</td><td style="text-align:right">${formatKes(order.subtotal)}</td></tr>`}${discountRow}<tr><td colspan="3" style="padding:6px 0;color:#58716a">Delivery fee</td><td style="text-align:right">${formatKes(order.delivery_fee)}</td></tr><tr style="font-weight:bold;font-size:16px"><td colspan="3" style="padding-top:12px">Total</td><td style="text-align:right;padding-top:12px">${formatKes(order.total)}</td></tr></table><div style="padding:14px;border:1px solid #e5eeeb;border-radius:10px;font-size:13px"><div><strong>Deliver to:</strong> ${escapeHtml(order.delivery_location)}</div><div style="margin-top:8px"><strong>Payment:</strong> ${escapeHtml(paymentLabel(order.payment_method))}</div><div style="margin-top:8px"><strong>Payment status:</strong> ${escapeHtml(paymentStatusLabel)}</div></div><p style="font-size:13px;line-height:1.6;color:#58716a">Our team will review your order and contact you to coordinate delivery. M-PESA requests are not proof of payment; only a verified payment callback confirms payment. Cash on Delivery remains unpaid until collected.</p><p><a href="${escapeHtml(trackingUrl)}" style="display:inline-block;background:#087f73;color:#fff;text-decoration:none;border-radius:8px;padding:12px 18px;font-size:13px;font-weight:bold">Track your order</a></p>${helpLine ? `<p style="font-size:12px;color:#58716a">Need help? ${helpLine}</p>` : ''}</div><div style="padding:16px 28px;background:#f5f9f7;color:#58716a;font-size:11px">OREMITECH · ${escapeHtml(publicSettings.store_location || '')}</div></div></body></html>`

    const resend = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `order-confirmation/${order.id}`,
      },
      body: JSON.stringify({ from, to: [order.guest_email], subject: `OREMITECH order confirmation ${order.order_number}`, html }),
    })
    if (!resend.ok) {
      await service.from('order_email_dispatches').update({ status: 'failed' }).eq('order_id', order.id).eq('email_type', 'order_confirmation')
      return json({ error: 'The email provider did not accept the order email.' }, 502)
    }
    await service.from('order_email_dispatches').update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('order_id', order.id).eq('email_type', 'order_confirmation')
    return json({ sent: true })
  } catch {
    return json({ error: 'Order email could not be prepared.' }, 500)
  }
})
