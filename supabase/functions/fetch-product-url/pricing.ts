// Currency detection, FX conversion, and tiered markup engine for OREMITECH import engine.

export interface CurrencyDetection {
  originalPrice: number | null
  originalCurrency: string | null
  fxRateToKes: number
  estimatedKesCost: number | null
  rateTimestamp: string
  isConfidenceHigh: boolean
}

export interface MarkupTier {
  min_price: number
  max_price: number | null
  markup_pct: number
  label?: string
}

// Fallback baseline exchange rates against KES (Kenyan Shillings)
export const DEFAULT_FX_RATES: Record<string, number> = {
  KES: 1.0,
  KSH: 1.0,
  USD: 132.5,
  EUR: 143.0,
  GBP: 168.0,
  AED: 36.1,
  CNY: 18.3,
  RMB: 18.3,
  ZAR: 7.2,
  UGX: 0.035,
  TZS: 0.052,
}

export const DEFAULT_TIERS: MarkupTier[] = [
  { min_price: 0, max_price: 2000, markup_pct: 35, label: 'KSh 0 – 2,000' },
  { min_price: 2000.01, max_price: 5000, markup_pct: 30, label: 'KSh 2,001 – 5,000' },
  { min_price: 5000.01, max_price: 10000, markup_pct: 25, label: 'KSh 5,001 – 10,000' },
  { min_price: 10000.01, max_price: 30000, markup_pct: 18, label: 'KSh 10,001 – 30,000' },
  { min_price: 30000.01, max_price: 60000, markup_pct: 15, label: 'KSh 30,001 – 60,000' },
  { min_price: 60000.01, max_price: null, markup_pct: 12, label: 'Above KSh 60,000' },
]

/**
 * Extracts and normalizes price and currency from text, JSON-LD, or raw offers.
 */
export function detectPriceAndCurrency(
  rawPrice: unknown,
  rawCurrency: unknown,
  contextText: string = '',
): CurrencyDetection {
  let originalPrice: number | null = null
  let originalCurrency: string | null = null

  // 1. Process explicit price
  if (rawPrice != null) {
    const num = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice).replace(/[^0-9.]/g, ''))
    if (!Number.isNaN(num) && num > 0) {
      originalPrice = num
    }
  }

  // 2. Process explicit currency code
  if (rawCurrency && typeof rawCurrency === 'string') {
    const cleanCur = rawCurrency.trim().toUpperCase()
    if (cleanCur in DEFAULT_FX_RATES) {
      originalCurrency = cleanCur
    } else if (cleanCur === '$') {
      originalCurrency = 'USD'
    } else if (cleanCur === '€') {
      originalCurrency = 'EUR'
    } else if (cleanCur === '£') {
      originalCurrency = 'GBP'
    } else if (cleanCur === '¥') {
      originalCurrency = 'CNY'
    }
  }

  // 3. Fallback: Parse currency symbol and price from context string if missing
  if ((!originalPrice || !originalCurrency) && contextText) {
    const kesMatch = contextText.match(/\b(?:KSh|KES)\s*([\d,]+(?:\.\d{2})?)/i)
    const usdMatch = contextText.match(/\$\s*([\d,]+(?:\.\d{2})?)/)
    const eurMatch = contextText.match(/€\s*([\d,]+(?:\.\d{2})?)/)
    const gbpMatch = contextText.match(/£\s*([\d,]+(?:\.\d{2})?)/)
    const aedMatch = contextText.match(/\bAED\s*([\d,]+(?:\.\d{2})?)/i)

    if (kesMatch && !originalPrice) {
      originalPrice = parseFloat(kesMatch[1].replace(/,/g, ''))
      originalCurrency = originalCurrency || 'KES'
    } else if (usdMatch && !originalPrice) {
      originalPrice = parseFloat(usdMatch[1].replace(/,/g, ''))
      originalCurrency = originalCurrency || 'USD'
    } else if (eurMatch && !originalPrice) {
      originalPrice = parseFloat(eurMatch[1].replace(/,/g, ''))
      originalCurrency = originalCurrency || 'EUR'
    } else if (gbpMatch && !originalPrice) {
      originalPrice = parseFloat(gbpMatch[1].replace(/,/g, ''))
      originalCurrency = originalCurrency || 'GBP'
    } else if (aedMatch && !originalPrice) {
      originalPrice = parseFloat(aedMatch[1].replace(/,/g, ''))
      originalCurrency = originalCurrency || 'AED'
    }
  }

  // Never assume unstated currency is KES!
  const fxRate = originalCurrency && DEFAULT_FX_RATES[originalCurrency] ? DEFAULT_FX_RATES[originalCurrency] : 1.0
  const estimatedKesCost = originalPrice ? Math.round(originalPrice * fxRate) : null

  return {
    originalPrice,
    originalCurrency,
    fxRateToKes: fxRate,
    estimatedKesCost,
    rateTimestamp: new Date().toISOString(),
    isConfidenceHigh: Boolean(originalPrice && originalCurrency),
  }
}

/**
 * Calculates provisional selling price using acquisition cost in KES and markup tiers.
 */
export function calculateProvisionalPrice(
  costKes: number,
  tiers: MarkupTier[] = DEFAULT_TIERS,
): { provisionalPrice: number; markupPct: number; tierLabel: string } {
  if (costKes <= 0) {
    return { provisionalPrice: 0, markupPct: 0, tierLabel: 'No cost' }
  }

  for (const tier of tiers) {
    const min = tier.min_price
    const max = tier.max_price
    if (costKes >= min && (max === null || costKes <= max)) {
      const markup = tier.markup_pct
      const rawWithMarkup = Math.round(costKes * (1 + markup / 100))
      const selling = Math.ceil(rawWithMarkup / 100) * 100 // Round up to nearest 100 KES
      return {
        provisionalPrice: selling,
        markupPct: markup,
        tierLabel: tier.label || `Tier ${markup}%`,
      }
    }
  }

  // Fallback markup 15%
  return {
    provisionalPrice: Math.ceil((costKes * 1.15) / 100) * 100,
    markupPct: 15,
    tierLabel: 'Default 15%',
  }
}
