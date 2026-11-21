/** Deterministic tiered-markup pricing engine (Phase 4). No external services. */

export interface MarkupTier {
  id?: string
  min_price: number
  max_price: number | null
  markup_pct: number
  label?: string | null
  is_active?: boolean
  sort_order?: number
}

export interface AcquisitionCostInput {
  label: string
  amount: number
  is_estimated?: boolean
  currency?: string
}

export interface PricingInput {
  supplierPrice: number
  supplierCurrency: string
  fxRateToKes: number
  costs: AcquisitionCostInput[]
  competitorPrice?: number | null
  tiers: MarkupTier[]
  minMarginPct?: number
  manualSellingPrice?: number | null
  overrideReason?: string | null
}

export interface PricingResult {
  supplierCostKes: number
  extraCostsKes: number
  totalAcquisitionCost: number
  hasEstimatedCosts: boolean
  markupPct: number
  tierLabel: string | null
  suggestedSellingPrice: number
  appliedSellingPrice: number
  isManualOverride: boolean
  grossProfit: number
  grossMarginPct: number
  meetsMinMargin: boolean
  canApprove: boolean
  missingCostData: boolean
  warnings: string[]
}

export const DEFAULT_MARKUP_TIERS: MarkupTier[] = [
  { min_price: 0, max_price: 2000, markup_pct: 35, label: 'KSh 0 – 2,000', sort_order: 1, is_active: true },
  { min_price: 2000.01, max_price: 5000, markup_pct: 30, label: 'KSh 2,001 – 5,000', sort_order: 2, is_active: true },
  { min_price: 5000.01, max_price: 10000, markup_pct: 25, label: 'KSh 5,001 – 10,000', sort_order: 3, is_active: true },
  { min_price: 10000.01, max_price: 30000, markup_pct: 18, label: 'KSh 10,001 – 30,000', sort_order: 4, is_active: true },
  { min_price: 30000.01, max_price: 60000, markup_pct: 15, label: 'KSh 30,001 – 60,000', sort_order: 5, is_active: true },
  { min_price: 60000.01, max_price: null, markup_pct: 12, label: 'Above KSh 60,000', sort_order: 6, is_active: true },
]

export const DEFAULT_MIN_MARGIN_PCT = 10

function round2(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.round(value * 100) / 100
}

export function pickTier(tiers: MarkupTier[], cost: number): MarkupTier | null {
  const active = tiers
    .filter((t) => t.is_active !== false)
    .slice()
    .sort((a, b) => Number(a.min_price) - Number(b.min_price))
  if (active.length === 0) return null
  for (const tier of active) {
    const min = Number(tier.min_price)
    const max = tier.max_price == null ? null : Number(tier.max_price)
    if (cost >= min && (max == null || cost <= max)) return tier
  }
  // Fall back to the highest tier for costs beyond the configured ranges.
  return active[active.length - 1]
}

export function computePricing(input: PricingInput): PricingResult {
  const warnings: string[] = []
  const fx = Number.isFinite(input.fxRateToKes) && input.fxRateToKes > 0 ? input.fxRateToKes : 1
  const supplierPrice = Number(input.supplierPrice) || 0

  const supplierCostKes = round2(supplierPrice * fx)
  const extraCostsKes = round2(
    (input.costs || []).reduce((sum, c) => sum + (Number.isFinite(Number(c.amount)) ? Number(c.amount) : 0), 0),
  )
  const totalAcquisitionCost = round2(supplierCostKes + extraCostsKes)
  const hasEstimatedCosts = (input.costs || []).some((c) => c.is_estimated !== false)

  const tier = pickTier(input.tiers, totalAcquisitionCost)
  const markupPct = tier ? Number(tier.markup_pct) : 0
  const suggestedSellingPrice = round2(totalAcquisitionCost * (1 + markupPct / 100))

  const manual = input.manualSellingPrice != null && Number(input.manualSellingPrice) > 0
  const appliedSellingPrice = manual ? round2(Number(input.manualSellingPrice)) : suggestedSellingPrice
  const isManualOverride = manual && Math.abs(appliedSellingPrice - suggestedSellingPrice) > 0.01

  const grossProfit = round2(appliedSellingPrice - totalAcquisitionCost)
  const grossMarginPct = appliedSellingPrice > 0 ? round2((grossProfit / appliedSellingPrice) * 100) : 0
  const minMarginPct = input.minMarginPct ?? DEFAULT_MIN_MARGIN_PCT
  const meetsMinMargin = grossMarginPct >= minMarginPct
  const missingCostData = supplierPrice <= 0 || totalAcquisitionCost <= 0

  if (missingCostData) {
    warnings.push('Enter the supplier purchase price to calculate a selling price.')
  }
  if (hasEstimatedCosts && extraCostsKes > 0) {
    warnings.push('Some acquisition costs are estimated, not confirmed.')
  }
  if (!missingCostData && !meetsMinMargin) {
    warnings.push(`Gross margin ${grossMarginPct.toFixed(1)}% is below the ${minMarginPct}% minimum.`)
  }
  if (isManualOverride && !(input.overrideReason && input.overrideReason.trim().length >= 3)) {
    warnings.push('A manual price override requires a reason.')
  }
  if (
    input.competitorPrice != null &&
    Number(input.competitorPrice) > 0 &&
    Number(input.competitorPrice) < totalAcquisitionCost
  ) {
    warnings.push("A competitor's advertised price is below our acquisition cost. Review viability.")
  }

  const canApprove =
    !missingCostData &&
    appliedSellingPrice > 0 &&
    meetsMinMargin &&
    (!isManualOverride || Boolean(input.overrideReason && input.overrideReason.trim().length >= 3))

  return {
    supplierCostKes,
    extraCostsKes,
    totalAcquisitionCost,
    hasEstimatedCosts,
    markupPct,
    tierLabel: tier?.label ?? null,
    suggestedSellingPrice,
    appliedSellingPrice,
    isManualOverride,
    grossProfit,
    grossMarginPct,
    meetsMinMargin,
    canApprove,
    missingCostData,
    warnings,
  }
}
