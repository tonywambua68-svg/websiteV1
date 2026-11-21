export interface LocationZone {
  id: string
  name: string
  counties: unknown
  towns: unknown
}

export interface OrderRate {
  id: string
  min_order: number | string
  max_order: number | string | null
}

export function normalizeLocation(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('en')
}

/** Exact county and town values must both match the same zone. */
export function matchZones(zones: LocationZone[], countyInput: string, townInput: string): LocationZone[] {
  const county = normalizeLocation(countyInput)
  const town = normalizeLocation(townInput)
  return zones.filter((zone) => {
    const counties = Array.isArray(zone.counties) ? zone.counties : []
    const towns = Array.isArray(zone.towns) ? zone.towns : []
    const countyMatch = counties.some((entry: unknown) => typeof entry === 'string' && normalizeLocation(entry) === county)
    const townMatch = towns.some((entry: unknown) => typeof entry === 'string' && normalizeLocation(entry) === town)
    return countyMatch && townMatch
  })
}

/** Return every active rate range that covers this amount; callers reject ambiguity. */
export function matchRates(rates: OrderRate[], subtotal: number): OrderRate[] {
  return rates.filter((rate) => {
    const minOrder = Number(rate.min_order)
    const maxOrder = rate.max_order === null ? null : Number(rate.max_order)
    return Number.isFinite(minOrder) && minOrder >= 0 && minOrder <= subtotal
      && (maxOrder === null || (Number.isFinite(maxOrder) && maxOrder >= minOrder && subtotal <= maxOrder))
  })
}
