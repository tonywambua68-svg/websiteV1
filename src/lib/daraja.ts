/**
 * M-Pesa Daraja API client library.
 *
 * IMPORTANT: The Daraja consumer secret must NEVER be exposed in the browser.
 * STK push initiation and OAuth token retrieval MUST happen server-side
 * (Supabase Edge Function). This frontend module defines the API contract,
 * phone normalization, amount formatting, and request/response types.
 *
 * Endpoints expected from your Edge Function (or backend):
 *   POST /api/payments/daraja/stk-push   { phone, amount, order_id } -> { CheckoutRequestID, MerchantRequestID, ResponseCode, ResponseDescription }
 *   POST /api/payments/daraja/callback   (Daraja posts here) -> handled server-side
 *   GET  /api/payments/daraja/status?checkout_request_id=... -> { status, reference }
 */

export type DarajaEnvironment = 'sandbox' | 'production'

export type DarajaTransactionType = 'CustomerPayBillOnline' | 'CustomerBuyGoodsOnline'

export interface DarajaStkPushRequest {
  phone: string                    // International format: 2547XXXXXXXX
  amount: number                   // KES amount
  orderId: string                  // OREMITECH order id
  accountReference?: string        // e.g. order number
  transactionDesc?: string
}

export interface DarajaStkPushResponse {
  MerchantRequestID: string
  CheckoutRequestID: string
  ResponseCode: string
  ResponseDescription: string
  CustomerMessage: string
}

export interface DarajaCallbackBody {
  Body: {
    stkCallback: {
      MerchantRequestID: string
      CheckoutRequestID: string
      ResultCode: number       // 0 = success, 1 = failed
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

export interface DarajaPaymentStatus {
  checkoutRequestId: string
  status: 'pending' | 'completed' | 'failed' | 'timeout'
  reference?: string
  amount?: number
  transactionDate?: string
  phone?: string
}

/**
 * Normalize a Kenyan phone number to international format (2547XXXXXXXX).
 */
export function normalizeDarajaPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('254') && digits.length === 12) return digits
  if (digits.startsWith('0') && digits.length === 10) return `254${digits.slice(1)}`
  if (digits.length === 9) return `254${digits}`
  return digits
}

/**
 * Validate that a phone number is a valid Kenyan mobile number for Daraja.
 */
export function isValidDarajaPhone(raw: string): boolean {
  return /^254[17]\d{8}$/.test(normalizeDarajaPhone(raw))
}

/**
 * Build the Daraja Base64-encoded password from shortcode + passkey + timestamp.
 * This MUST be computed server-side (never expose passkey in frontend).
 */
export interface DarajaCredentials {
  shortcode: string
  passkey: string
  timestamp: string
}

export function buildDarajaPassword(creds: DarajaCredentials): string {
  const data = `${creds.shortcode}${creds.passkey}${creds.timestamp}`
  return btoa(unescape(encodeURIComponent(data))) // eslint-disable-line no-undef
}

/**
 * Get the Daraja base URL based on environment.
 */
export function getDarajaBaseUrl(env: DarajaEnvironment): string {
  return env === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke'
}

/**
 * Format amount for Daraja (integer KES, no decimals).
 */
export function formatDarajaAmount(amount: number): string {
  return Math.round(amount).toString()
}
