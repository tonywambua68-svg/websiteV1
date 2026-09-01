/* ============================================================================
   CRYPTO — password hashing & token generation
   ----------------------------------------------------------------------------
   Passwords are NEVER stored or transmitted in plain text. They are stretched
   with PBKDF2-SHA-256 (see AUTH.pbkdf2Iterations) using a random per-user
   salt. Session tokens come from a CSPRNG.

   Two interchangeable engines:
   • Native — Web Crypto (`crypto.subtle`), used whenever the browser exposes
     it (secure contexts: https or http://localhost).
   • Fallback — a pure-JS PBKDF2-HMAC-SHA256 (below) that produces
     BYTE-IDENTICAL output to Web Crypto. It exists because `crypto.subtle`
     is unavailable in non-secure contexts (file:// paths, http on LAN IPs,
     some editor previews). Auth must keep working there too.

   Because both engines implement exactly RFC 2898 PBKDF2 with HMAC-SHA256
   and the same iteration count, a record hashed by one engine verifies on
   the other — users never get locked out when the context changes.

   DEMO-GRADE NOTE: this runs entirely in the browser, so the enforcement
   boundary is the device, not a server. The same interface maps 1-to-1 onto
   a real backend (Supabase / Firebase / Node + PostgreSQL) later — only this
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
  const saltBytes = fromB64Url(saltB64);
  const pw = enc.encode(password);

  const subtle = typeof crypto !== "undefined" ? crypto.subtle : undefined;
  if (subtle) {
    const keyMaterial = await subtle.importKey("raw", pw, "PBKDF2", false, ["deriveBits"]);
    const bits = await subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt: saltBytes as unknown as BufferSource, iterations },
      keyMaterial,
      256,
    );
    return toB64Url(new Uint8Array(bits));
  }

  // Non-secure context (file://, http preview, …) — pure-JS fallback.
  // Identical algorithm & iterations ⇒ identical hash ⇒ no lockouts.
  return toB64Url(await pbkdf2Sha256Js(pw, saltBytes, iterations, 32));
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
  for (let i = 0; i < buf.length; i++) buf[i] = bin.charCodeAt(i);
  return buf;
}

/* ============================================================================
   PURE-JS PBKDF2-HMAC-SHA256 (fallback engine)
   RFC 2898 / RFC 6238-standard construction; output matches Web Crypto.
   ========================================================================== */

const SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function rotr(x: number, n: number): number {
  return (x >>> n) | (x << (32 - n));
}

/** SHA-256 of an arbitrary byte array (FIPS 180-4). */
function sha256(data: Uint8Array): Uint8Array {
  const H = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const len = data.length;
  const bitLenHi = Math.floor(len / 0x20000000);
  const bitLenLo = (len << 3) >>> 0;
  const paddedLen = (((len + 8) >> 6) + 1) << 6;
  const padded = new Uint8Array(paddedLen);
  padded.set(data);
  padded[len] = 0x80;
  padded[paddedLen - 8] = (bitLenHi >>> 24) & 0xff;
  padded[paddedLen - 7] = (bitLenHi >>> 16) & 0xff;
  padded[paddedLen - 6] = (bitLenHi >>> 8) & 0xff;
  padded[paddedLen - 5] = bitLenHi & 0xff;
  padded[paddedLen - 4] = (bitLenLo >>> 24) & 0xff;
  padded[paddedLen - 3] = (bitLenLo >>> 16) & 0xff;
  padded[paddedLen - 2] = (bitLenLo >>> 8) & 0xff;
  padded[paddedLen - 1] = bitLenLo & 0xff;

  const w = new Uint32Array(64);
  for (let i = 0; i < paddedLen; i += 64) {
    for (let j = 0; j < 16; j++) {
      w[j] =
        (padded[i + j * 4] << 24) |
        (padded[i + j * 4 + 1] << 16) |
        (padded[i + j * 4 + 2] << 8) |
        padded[i + j * 4 + 3];
    }
    for (let j = 16; j < 64; j++) {
      const x = w[j - 15];
      const y = w[j - 2];
      const s0 = rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3);
      const s1 = rotr(y, 17) ^ rotr(y, 19) ^ (y >>> 10);
      w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
    }
    let a = H[0], b = H[1], c = H[2], d = H[3];
    let e = H[4], f = H[5], g = H[6], h = H[7];
    for (let j = 0; j < 64; j++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + SHA256_K[j] + w[j]) | 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0;
      d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
  }

  const out = new Uint8Array(32);
  for (let i = 0; i < 8; i++) {
    out[i * 4] = (H[i] >>> 24) & 0xff;
    out[i * 4 + 1] = (H[i] >>> 16) & 0xff;
    out[i * 4 + 2] = (H[i] >>> 8) & 0xff;
    out[i * 4 + 3] = H[i] & 0xff;
  }
  return out;
}

/** HMAC-SHA256 (RFC 2104). */
function hmacSha256(key: Uint8Array, msg: Uint8Array): Uint8Array {
  let k = key;
  if (k.length > 64) k = sha256(k);
  const inner = new Uint8Array(64 + msg.length);
  const outer = new Uint8Array(64 + 32);
  for (let i = 0; i < 64; i++) {
    const kb = i < k.length ? k[i] : 0;
    inner[i] = kb ^ 0x36;
    outer[i] = kb ^ 0x5c;
  }
  inner.set(msg, 64);
  outer.set(sha256(inner), 64);
  return sha256(outer);
}

const yieldToUi = () => new Promise<void>((res) => window.setTimeout(res, 0));

/** PBKDF2-HMAC-SHA256 (RFC 2898), async-chunked so the UI stays responsive. */
async function pbkdf2Sha256Js(
  password: Uint8Array,
  salt: Uint8Array,
  iterations: number,
  dkLen: number,
): Promise<Uint8Array> {
  const blocks = Math.ceil(dkLen / 32);
  const out = new Uint8Array(blocks * 32);
  for (let block = 1; block <= blocks; block++) {
    const saltBlock = new Uint8Array(salt.length + 4);
    saltBlock.set(salt);
    saltBlock[salt.length] = (block >>> 24) & 0xff;
    saltBlock[salt.length + 1] = (block >>> 16) & 0xff;
    saltBlock[salt.length + 2] = (block >>> 8) & 0xff;
    saltBlock[salt.length + 3] = block & 0xff;

    let u = hmacSha256(password, saltBlock);
    const t = u.slice();
    for (let i = 1; i < iterations; i++) {
      u = hmacSha256(password, u);
      for (let j = 0; j < 32; j++) t[j] ^= u[j];
      if (i % 15000 === 0) await yieldToUi(); // keep the busy-animation alive
    }
    out.set(t, (block - 1) * 32);
  }
  return out.slice(0, dkLen);
}
