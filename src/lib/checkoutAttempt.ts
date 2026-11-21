let memoryAttempt: { fingerprint: string; token: string } | null = null

function createToken(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
}

export function getCheckoutAttemptToken(fingerprint: string): string {
  const storageKey = 'oremitech-checkout-attempt'
  try {
    const saved = sessionStorage.getItem(storageKey)
    if (saved) {
      const parsed = JSON.parse(saved) as { fingerprint?: string; token?: string }
      if (parsed.fingerprint === fingerprint && parsed.token) {
        memoryAttempt = { fingerprint, token: parsed.token }
        return parsed.token
      }
    }
    if (memoryAttempt?.fingerprint === fingerprint) return memoryAttempt.token
    const token = createToken()
    memoryAttempt = { fingerprint, token }
    sessionStorage.setItem(storageKey, JSON.stringify({ fingerprint, token }))
    return token
  } catch {
    if (memoryAttempt?.fingerprint === fingerprint) return memoryAttempt.token
    memoryAttempt = { fingerprint, token: createToken() }
    return memoryAttempt.token
  }
}

export function clearCheckoutAttempt(): void {
  memoryAttempt = null
  try { sessionStorage.removeItem('oremitech-checkout-attempt') } catch { /* storage is optional */ }
}
