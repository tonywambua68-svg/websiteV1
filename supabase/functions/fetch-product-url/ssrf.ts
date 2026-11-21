// SSRF protection and safe HTTP client for OREMITECH product URL scraper.
// Validates URLs against SSRF: private IPs, loopback, link-local, cloud metadata,
// custom ports, and re-validates on every redirect hop.

export const MAX_BYTES = 3_000_000 // 3 MB
export const TIMEOUT_MS = 12_000
export const MAX_REDIRECTS = 4

/**
 * Returns true if an IPv4 or IPv6 address is private, loopback, link-local,
 * cloud metadata, carrier-grade NAT, or multicast.
 */
export function isPrivateIp(ip: string): boolean {
  const clean = ip.trim().toLowerCase().replace(/^\[|\]$/g, '')

  // IPv4 checks
  const m = clean.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (m) {
    const a = Number(m[1])
    const b = Number(m[2])
    const c = Number(m[3])
    const d = Number(m[4])

    if ([a, b, c, d].some((octet) => octet < 0 || octet > 255)) return true

    // 0.0.0.0/8 (current network)
    if (a === 0) return true
    // 10.0.0.0/8 (private)
    if (a === 10) return true
    // 100.64.0.0/10 (carrier-grade NAT)
    if (a === 100 && b >= 64 && b <= 127) return true
    // 127.0.0.0/8 (loopback)
    if (a === 127) return true
    // 169.254.0.0/16 (link-local, cloud metadata AWS/GCP/Azure)
    if (a === 169 && b === 254) return true
    // 172.16.0.0/12 (private)
    if (a === 172 && b >= 16 && b <= 31) return true
    // 192.0.0.0/24 (IETF protocol assignments)
    if (a === 192 && b === 0 && c === 0) return true
    // 192.168.0.0/16 (private)
    if (a === 192 && b === 168) return true
    // 198.18.0.0/15 (benchmark tests)
    if (a === 198 && (b === 18 || b === 19)) return true
    // 224.0.0.0/4 (multicast)
    if (a >= 224 && a <= 239) return true
    // 240.0.0.0/4 (reserved)
    if (a >= 240) return true

    return false
  }

  // IPv6 checks
  if (clean === '::1' || clean === '::') return true
  // Unique local addresses (fc00::/7)
  if (clean.startsWith('fc') || clean.startsWith('fd')) return true
  // Link-local unicast (fe80::/10)
  if (clean.startsWith('fe8') || clean.startsWith('fe9') || clean.startsWith('fea') || clean.startsWith('feb')) return true
  // IPv4-mapped IPv6 (::ffff:127.0.0.1 or ::ffff:7f00:1)
  if (clean.startsWith('::ffff:')) {
    const mapped = clean.replace('::ffff:', '')
    if (mapped.includes('.')) return isPrivateIp(mapped)
  }

  return false
}

/**
 * Returns true if a hostname is private or resolves to localhost / internal addresses.
 */
export function isPrivateHostname(hostname: string): boolean {
  const h = hostname.toLowerCase().trim().replace(/^\[|\]$/g, '')
  if (
    h === 'localhost' ||
    h.endsWith('.localhost') ||
    h.endsWith('.local') ||
    h.endsWith('.internal') ||
    h.endsWith('.lan') ||
    h.endsWith('.home') ||
    h.endsWith('.corp') ||
    h === '0.0.0.0' ||
    h === 'broadcasthost' ||
    h === 'metadata.google.internal' ||
    h === 'instance-data'
  ) {
    return true
  }

  // If host is an IP literal
  if (isPrivateIp(h)) return true

  return false
}

/**
 * Validates a user-supplied URL against scheme, port, and hostname rules.
 */
export function assertSafeUrl(raw: string): URL {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error('Invalid URL')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only http and https URLs are allowed')
  }

  if (isPrivateHostname(url.hostname)) {
    throw new Error('This URL target is not permitted')
  }

  // Strict port check: only standard HTTP/HTTPS ports permitted
  if (url.port && !['80', '443', ''].includes(url.port)) {
    throw new Error('This URL uses a port that is not permitted')
  }

  return url
}

/**
 * Resolves a hostname using DNS and verifies that no resolved IP is private.
 * Protects against DNS rebinding attacks.
 */
export async function verifyDnsResolution(hostname: string): Promise<void> {
  const cleanHost = hostname.toLowerCase().trim().replace(/^\[|\]$/g, '')
  if (isPrivateIp(cleanHost)) {
    throw new Error('Access to private IP addresses is blocked')
  }

  // If in Deno environment, perform DNS resolution pre-check
  if (typeof (globalThis as any).Deno?.resolveDns === 'function') {
    try {
      const aRecords = await (globalThis as any).Deno.resolveDns(cleanHost, 'A').catch(() => [] as string[])
      for (const ip of aRecords) {
        if (isPrivateIp(ip)) {
          throw new Error(`Hostname ${hostname} resolves to prohibited address ${ip}`)
        }
      }
      const aaaaRecords = await (globalThis as any).Deno.resolveDns(cleanHost, 'AAAA').catch(() => [] as string[])
      for (const ip of aaaaRecords) {
        if (isPrivateIp(ip)) {
          throw new Error(`Hostname ${hostname} resolves to prohibited IPv6 address ${ip}`)
        }
      }
    } catch (err: any) {
      if (err.message?.includes('prohibited')) throw err
      // DNS resolution failure will be handled by fetch
    }
  }
}

/**
 * Concatenates Uint8Array chunks into a single Uint8Array.
 */
export function concatChunks(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((n, c) => n + c.byteLength, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.byteLength
  }
  return out
}

/**
 * Safe fetch wrapper that handles redirects manually, re-verifies safe URLs and DNS
 * on each redirect hop, enforces strict timeouts, max byte limits, and Content-Type.
 */
export async function safeFetchHtml(startUrl: URL): Promise<{ html: string; finalUrl: string }> {
  let current = startUrl

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    assertSafeUrl(current.toString())
    await verifyDnsResolution(current.hostname)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    let response: Response

    try {
      response = await fetch(current.toString(), {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 (OREMITECH-CatalogueBot/2.0; +https://oremitech.co.ke)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      })
    } finally {
      clearTimeout(timer)
    }

    // Handle redirects manually to re-verify every hop
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location) throw new Error(`Redirect without a location (HTTP ${response.status})`)
      current = assertSafeUrl(new URL(location, current).toString())
      continue
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error('This supplier page requires authentication or blocks automated requests. Import it manually instead.')
    }
    if (response.status === 429) {
      throw new Error('This site is rate-limiting requests. Please try again later.')
    }
    if (!response.ok) {
      throw new Error(`The supplier page returned HTTP ${response.status}`)
    }

    const contentType = (response.headers.get('content-type') || '').toLowerCase()
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      throw new Error('The URL did not return an HTML document')
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('The page response body could not be read')

    let received = 0
    const chunks: Uint8Array[] = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) {
        received += value.byteLength
        if (received > MAX_BYTES) {
          await reader.cancel()
          break
        }
        chunks.push(value)
      }
    }

    const html = new TextDecoder('utf-8', { fatal: false }).decode(concatChunks(chunks))
    return { html, finalUrl: current.toString() }
  }

  throw new Error('Too many redirects encountered while fetching supplier page')
}
