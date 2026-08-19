/* ============================================================================
   CRYPTO — password hashing & token generation (Web Crypto API)
   ----------------------------------------------------------------------------
   Passwords are NEVER stored or transmitted in plain text. They are stretched
   with PBKDF2-SHA-256 (browser-native, no dependencies) using a random
   per-user salt. Session tokens come from a CSPRNG.

   DEMO-GRADE NOTE: this runs entirely in the browser, so the enforcement
   boundary is the device, not a server. The same interface maps 1-to-1 onto a
   real backend (Supabase / Firebase / Node + PostgreSQL) later — only this
   file and src/lib/auth.ts need to be swapped.
   ========================================================================== */

const enc = new TextEncoder();

/** Cryptographically random token, base64url-encoded. */
export function randomToken(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return toB64Url(buf);
}

/** Fresh random salt for a password hash. */
export function newSalt(): string {
  return randomToken(16);
}

/** PBKDF2-SHA-256 password hash → base64url string. */
export async function hashPassword(password: string, saltB64: string, iterations: number): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: fromB64Url(saltB64) as unknown as BufferSource, iterations },
    keyMaterial,
    256,
  );
  return toB64Url(new Uint8Array(bits));
}

/** Constant-time comparison of a candidate password against a stored hash. */
export async function verifyPassword(
  password: string,
  saltB64: string,
  storedHash: string,
  iterations: number,
): Promise<boolean> {
  const candidate = await hashPassword(password, saltB64, iterations);
  const a = fromB64Url(candidate);
  const b = fromB64Url(storedHash);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/* ---------- base64url helpers ---------- */

function toB64Url(buf: Uint8Array): string {
  let bin = "";
  buf.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf;
}
