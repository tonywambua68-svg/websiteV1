import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { matchRates, matchZones, normalizeLocation } from './matching.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface DeliveryFeeRequest {
  county: string
  town: string
  subtotal: number
}

interface DeliveryFeeResponse {
  supported: boolean
  zone_name?: string
  zone_id?: string
  rate_kes?: number
  delivery_fee?: number
  cod_eligible?: boolean
  delivery_method?: string
  message?: string
}

function response(body: DeliveryFeeResponse, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return response({ supported: false, message: 'Use POST to check delivery.' }, 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    if (!supabaseUrl || !supabaseAnonKey) {
      return response({ supported: false, message: 'Delivery is temporarily unavailable. Please try again later.' }, 503)
    }

    const body = await req.json() as Partial<DeliveryFeeRequest>
    if (typeof body.county !== 'string' || typeof body.town !== 'string' ||
        typeof body.subtotal !== 'number' || !Number.isFinite(body.subtotal) || body.subtotal < 0 ||
        body.county.length > 100 || body.town.length > 100) {
      return response({ supported: false, message: 'Enter a valid county, town, and order subtotal.' }, 400)
    }

    const county = normalizeLocation(body.county)
    const town = normalizeLocation(body.town)
    if (!county || !town) {
      return response({ supported: false, message: 'Enter both your county and town to check delivery.' }, 400)
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: zones, error: zonesError } = await supabase
      .from('delivery_zones')
      .select('id, name, counties, towns')
      .eq('is_active', true)

    if (zonesError) {
      return response({ supported: false, message: 'Delivery is temporarily unavailable. Please try again later.' }, 503)
    }

    // Zone entries are exact, indivisible values. Both county and town must
    // match the same zone; town-only matches are never considered.
    const matches = matchZones(zones ?? [], county, town)

    if (matches.length === 0) {
      return response({ supported: false, message: 'Delivery is not configured for this county and town.' })
    }
    if (matches.length > 1) {
      return response({ supported: false, message: 'This location matches more than one delivery zone. Please contact the store.' })
    }

    const zone = matches[0]
    const { data: rates, error: ratesError } = await supabase
      .from('delivery_rates')
      .select('id, zone_id, min_order, max_order, rate_kes, cod_eligible')
      .eq('zone_id', zone.id)
      .eq('is_active', true)

    if (ratesError) {
      return response({ supported: false, message: 'Delivery is temporarily unavailable. Please try again later.' }, 503)
    }

    const applicableRates = matchRates(rates ?? [], body.subtotal)
    if (applicableRates.length === 0) {
      return response({ supported: false, zone_name: zone.name, message: 'No active delivery rate covers this order amount.' })
    }
    if (applicableRates.length > 1) {
      return response({ supported: false, zone_name: zone.name, message: 'Delivery rates overlap for this order amount. Please contact the store.' })
    }

    const rate = applicableRates[0]
    const rateKes = Number(rate.rate_kes)
    if (!Number.isFinite(rateKes) || rateKes < 0) {
      return response({ supported: false, zone_name: zone.name, message: 'The delivery rate is invalid. Please contact the store.' }, 503)
    }

    return response({
      supported: true,
      zone_id: zone.id,
      zone_name: zone.name,
      rate_kes: rateKes,
      delivery_fee: rateKes,
      cod_eligible: Boolean(rate.cod_eligible),
      delivery_method: normalizeLocation(zone.name).includes('nairobi') ? 'standard' : 'parcel',
      message: `Delivery to ${zone.name}: KSh ${rateKes.toLocaleString('en-KE')}`,
    })
  } catch {
    // Keep provider/database details out of customer-facing responses.
    return response({ supported: false, message: 'Delivery is temporarily unavailable. Please try again later.' }, 503)
  }
})
