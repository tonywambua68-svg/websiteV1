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

/** Marker prefix the auth layer detects to show a friendly, actionable message. */
export const SECURE_CONTEXT_REQUIRED = "SECURE_CONTEXT_REQUIRED";

function subtleCrypto(): SubtleCrypto {
  const subtle = typeof crypto !== "undefined" ? crypto.subtle : undefined;
  if (!subtle) {
    // Web Crypto only exists in secure contexts (https, or http on localhost/127.0.0.1).
    throw new Error(
      `${SECURE_CONTEXT_REQUIRED}: This browser can't hash passwords on the current page. ` +
        `Open the site at http://localhost:3000 (run "npm run dev") — not a file:// path or a non-localhost address.`,
    );
  }
  return subtle;
}

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
  const subtle = subtleCrypto();
  const keyMaterial = await subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await subtle.deriveBits(
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
  const str = typeof s === "string" ? s : "";
  if (!/^[A-Za-z0-9_-]*$/.test(str)) {
    // A record from an older engine version or tampered storage — fail with a
    // clean, catchable error instead of letting atob blow up.
    throw new Error("Invalid stored credential format.");
  }
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (str.length % 4)) % 4);
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf;
}
