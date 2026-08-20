/**
 * Imara Tech — authentication engine (client-side layer).
 *
 * HOW PASSWORDS ARE PROTECTED
 * ---------------------------
 * • Plaintext passwords are NEVER persisted. Every password is stretched with
 *   PBKDF2-SHA-256 (see AUTH.pbkdf2Iterations in src/config.ts) using a random
 *   per-user salt, via the browser's Web Crypto API (src/lib/crypto.ts).
 * • Verification uses a constant-time comparison (no timing shortcuts).
 * • Login failures return one generic message ("Invalid email or password")
 *   so attackers cannot discover which emails are registered.
 * • Brute-force protection: AUTH.maxFailedAttempts failures per email →
 *   temporary lockout of AUTH.lockoutSeconds.
 * • Sessions are CSPRNG tokens with an expiry (AUTH.sessionDays); expired
 *   sessions are discarded on read. Responses (SafeUser) never expose the
 *   stored hash or salt.
 *
 * HONEST LIMITATION — this project has no server, so the user database lives
 * in this browser's localStorage and the enforcement boundary is the device.
 * Every function below maps 1-to-1 onto a real backend (Supabase / Firebase /
 * Node+PostgreSQL / WooCommerce): when you deploy, swap ONLY this file —
 * AuthContext, pages and guards keep working unchanged.
 */

import { AUTH, AVATAR_HUES } from "../config";
import { hashPassword, newSalt, randomToken, verifyPassword } from "./crypto";

/* ---------------- types ---------------- */

export type Role = "admin" | "customer";

export interface StoredUser {
  id: string;
  name: string;
  email: string; // normalised lowercase
  phone: string;
  role: Role;
  avatarHue: string;
  salt: string; // base64url
  hash: string; // base64url — PBKDF2-SHA-256, never plaintext
  createdAt: string; // ISO
}

/** Everything the UI may see. Deliberately excludes salt/hash. */
export interface SafeUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  avatarHue: string;
  createdAt: string;
}

/** Thrown for every user-facing auth failure (safe messages only). */
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

/* ---------------- storage keys (AuthContext syncs on these) ---------------- */
const USERS_KEY = "imara.users.v1";
const SESSION_KEY = "imara.session.v1";
const LOCKS_KEY = "imara.locks.v1";

const env = ((import.meta as unknown as { env?: Record<string, string | undefined> }).env) ?? {};

/* ---------------- small helpers ---------------- */
function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full/blocked — fail soft */
  }
}
function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `u_${randomToken(12)}`;
  }
}
function toSafe(u: StoredUser): SafeUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    avatarHue: u.avatarHue,
    createdAt: u.createdAt,
  };
}

export function normalizeEmail(e: string): string {
  return e.trim().toLowerCase();
}
export function normalizePhone(p: string): string {
  return p.replace(/[\s\-().]/g, "");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^(?:\+?254|0)(?:7|1)\d{8}$/;

/* ---------------- password policy ---------------- */

/** Human-readable missing requirements, e.g. ["At least 8 characters", "A number"]. */
export function passwordIssues(pw: string): string[] {
  const issues: string[] = [];
  if (pw.length < 8) issues.push("At least 8 characters");
  if (!/[a-zA-Z]/.test(pw)) issues.push("A letter");
  if (!/\d/.test(pw)) issues.push("A number");
  return issues;
}

/** 0 (empty) … 4 (strong) — drives the strength meter on the register form. */
export function passwordStrength(pw: string): number {
  if (!pw) return 0;
  let pts = 0;
  if (pw.length >= 8) pts++;
  if (pw.length >= 12) pts++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) pts++;
  if (/\d/.test(pw)) pts++;
  if (/[^A-Za-z0-9]/.test(pw)) pts++;
  return Math.max(1, Math.min(4, pts));
}

/* ---------------- users ---------------- */
function loadUsers(): StoredUser[] {
  return read<StoredUser[]>(USERS_KEY, []);
}
function saveUsers(list: StoredUser[]) {
  write(USERS_KEY, list);
}
function findUser(email: string): StoredUser | undefined {
  return loadUsers().find((u) => u.email === normalizeEmail(email));
}
export function hasAdmin(): boolean {
  return loadUsers().some((u) => u.role === "admin");
}

/* ---------------- record integrity & self-healing ----------------
   Older engine versions stored salt/hash differently. Rather than let a
   stale localStorage record break sign-in forever, we detect unusable
   records and — for the .env-seeded dev admin only — re-derive the hash
   from the configured dev password so local logins keep working across
   upgrades. Regular user records are never silently rewritten. */

const B64URL_RE = /^[A-Za-z0-9_-]+$/;
function isUsableRecord(u: StoredUser): boolean {
  return (
    typeof u.salt === "string" && typeof u.hash === "string" &&
    B64URL_RE.test(u.salt) && B64URL_RE.test(u.hash) && u.salt.length >= 16
  );
}
async function repairRecord(u: StoredUser, password: string): Promise<StoredUser> {
  const salt = newSalt();
  const hash = await hashPassword(password, salt, AUTH.pbkdf2Iterations);
  const users = loadUsers();
  const idx = users.findIndex((x) => x.id === u.id);
  const fixed: StoredUser = { ...u, salt, hash };
  if (idx >= 0) users[idx] = fixed;
  else users.push(fixed);
  saveUsers(users);
  return fixed;
}
function convertCryptoError(err: unknown): AuthError | null {
  if (err instanceof Error && err.message.startsWith("SECURE_CONTEXT_REQUIRED")) {
    return new AuthError(
      "Your browser blocked password verification on this page. Open the site at http://localhost:3000 (run “npm run dev”) — signing in doesn't work from a file:// path or a non-localhost address.",
    );
  }
  return null;
}

async function createUser(
  input: { name: string; email: string; phone: string; password: string },
  role: Role,
): Promise<StoredUser> {
  const salt = newSalt();
  const hash = await hashPassword(input.password, salt, AUTH.pbkdf2Iterations);
  const user: StoredUser = {
    id: newId(),
    name: input.name.trim(),
    email: normalizeEmail(input.email),
    phone: normalizePhone(input.phone),
    role,
    avatarHue: AVATAR_HUES[Math.floor(Math.random() * AVATAR_HUES.length)],
    salt,
    hash,
    createdAt: new Date().toISOString(),
  };
  const users = loadUsers();
  users.push(user);
  saveUsers(users);
  return user;
}

/* ---------------- sessions ---------------- */
interface Session {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}
function loadSession(): Session | null {
  const s = read<Session | null>(SESSION_KEY, null);
  if (!s) return null;
  if (Date.now() > s.expiresAt) {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* noop */
    }
    return null;
  }
  return s;
}
function startSession(userId: string) {
  const now = Date.now();
  const session: Session = {
    token: randomToken(32),
    userId,
    createdAt: now,
    expiresAt: now + AUTH.sessionDays * 24 * 60 * 60 * 1000,
  };
  write(SESSION_KEY, session);
}

/* ---------------- lockout (brute-force protection) ---------------- */
type Locks = Record<string, { count: number; until: number }>;

function checkLock(email: string) {
  const locks = read<Locks>(LOCKS_KEY, {});
  const lock = locks[email];
  if (lock && lock.until > Date.now()) {
    const secs = Math.ceil((lock.until - Date.now()) / 1000);
    const label = secs > 90 ? `${Math.ceil(secs / 60)} minutes` : `${secs} seconds`;
    throw new AuthError(`Too many failed attempts. Try again in ${label}.`);
  }
}
function recordFailure(email: string) {
  const locks = read<Locks>(LOCKS_KEY, {});
  const prev = locks[email];
  const count = (prev && prev.until <= Date.now() ? 0 : prev?.count ?? 0) + 1;
  locks[email] = { count, until: count >= AUTH.maxFailedAttempts ? Date.now() + AUTH.lockoutSeconds * 1000 : 0 };
  write(LOCKS_KEY, locks);
  if (count >= AUTH.maxFailedAttempts) {
    throw new AuthError(`Too many failed attempts. This account is locked for ${AUTH.lockoutSeconds} seconds.`);
  }
}
function clearFailures(email: string) {
  const locks = read<Locks>(LOCKS_KEY, {});
  if (locks[email]) {
    locks[email] = { count: 0, until: 0 };
    write(LOCKS_KEY, locks);
  }
}

/* ---------------- public API (used by AuthContext) ---------------- */

export function currentUser(): SafeUser | null {
  const s = loadSession();
  if (!s) return null;
  const user = loadUsers().find((u) => u.id === s.userId);
  return user ? toSafe(user) : null;
}

export async function login(input: { email: string; password: string }): Promise<SafeUser> {
  await authReady;
  const email = normalizeEmail(input.email);
  if (!email || !input.password) throw new AuthError("Enter your email and password.");
  if (!EMAIL_RE.test(email)) throw new AuthError("Enter a valid email address.");

  checkLock(email);

  let user = findUser(email);

  // Self-heal the dev admin seeded from .env: if the stored record is from an
  // older engine version, or the env password no longer verifies, re-derive
  // the hash from the .env password. .env is gitignored and dev-only, so this
  // never affects production/template builds (no env → no self-heal).
  const envAdminEmail = normalizeEmail(env.VITE_DEMO_ADMIN_EMAIL ?? "");
  const envAdminPw = env.VITE_DEMO_ADMIN_PASSWORD;
  if (user && user.role === "admin" && user.email === envAdminEmail && envAdminPw) {
    try {
      const stillValid =
        isUsableRecord(user) &&
        (await verifyPassword(envAdminPw, user.salt, user.hash, AUTH.pbkdf2Iterations));
      if (!stillValid) user = await repairRecord(user, envAdminPw);
    } catch {
      /* fall through — handled below */
    }
  } else if (user && !isUsableRecord(user)) {
    // A corrupted non-admin record can never verify; treat as unknown.
    user = undefined;
  }

  // Always verify against *something* so unknown emails take the same time
  // as known ones (no user-enumeration via timing).
  let ok = false;
  try {
    ok = user
      ? await verifyPassword(input.password, user.salt, user.hash, AUTH.pbkdf2Iterations)
      : await verifyPassword(input.password, newSalt(), randomToken(32), AUTH.pbkdf2Iterations).then(() => false);
  } catch (err) {
    const friendly = convertCryptoError(err);
    if (friendly) throw friendly;
    throw new AuthError(
      "We couldn't verify that sign-in on this device. Open the site at http://localhost:3000 and try again — if it persists, clear this site's browser data and re-register.",
    );
  }

  if (!ok || !user) {
    recordFailure(email);
    // Deliberately generic — never reveal whether the email exists.
    throw new AuthError("Invalid email or password.");
  }

  clearFailures(email);
  startSession(user.id);
  return toSafe(user);
}

export async function register(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<SafeUser> {
  await authReady;
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone ?? "");

  if (name.length < 2) throw new AuthError("Enter your full name.");
  if (!EMAIL_RE.test(email)) throw new AuthError("Enter a valid email address.");
  if (phone && !PHONE_RE.test(phone)) {
    throw new AuthError("Enter a valid Kenyan phone number, e.g. 0712 345 678 or +254712345678.");
  }
  const issues = passwordIssues(input.password);
  if (issues.length) throw new AuthError(`Password needs: ${issues.join(", ").toLowerCase()}.`);
  if (findUser(email)) throw new AuthError("An account with this email already exists. Try signing in instead.");

  // Installer rule (like WordPress): the very first account becomes the
  // store administrator. Every account after that is a customer.
  const role: Role = hasAdmin() ? "customer" : "admin";

  let user: StoredUser;
  try {
    user = await createUser({ name, email, phone, password: input.password }, role);
  } catch (err) {
    const friendly = convertCryptoError(err);
    if (friendly) throw friendly;
    throw new AuthError("Couldn't create the account on this device. Make sure you're on http://localhost:3000 and try again.");
  }
  startSession(user.id); // auto sign-in after registration
  return toSafe(user);
}

export function logout(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* noop */
  }
}

/** Edit the signed-in user's own profile. Only their own record is touched. */
export function updateProfile(patch: { name?: string; phone?: string; avatarHue?: string }): SafeUser {
  const session = loadSession();
  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === session?.userId);
  if (idx === -1) throw new AuthError("You are signed out. Please sign in again.");

  const u = users[idx];
  if (patch.name !== undefined) {
    if (patch.name.trim().length < 2) throw new AuthError("Enter your full name.");
    u.name = patch.name.trim();
  }
  if (patch.phone !== undefined) {
    const phone = normalizePhone(patch.phone);
    if (phone && !PHONE_RE.test(phone)) {
      throw new AuthError("Enter a valid Kenyan phone number, e.g. 0712 345 678.");
    }
    u.phone = phone;
  }
  if (patch.avatarHue !== undefined) {
    u.avatarHue = patch.avatarHue;
  }
  users[idx] = u;
  saveUsers(users);
  return toSafe(u);
}

export async function changePassword(currentPw: string, nextPw: string): Promise<void> {
  const session = loadSession();
  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === session?.userId);
  if (idx === -1) throw new AuthError("You are signed out. Please sign in again.");

  const u = users[idx];
  let ok = false;
  try {
    ok = isUsableRecord(u) && (await verifyPassword(currentPw, u.salt, u.hash, AUTH.pbkdf2Iterations));
  } catch (err) {
    const friendly = convertCryptoError(err);
    if (friendly) throw friendly;
    ok = false;
  }
  if (!ok) throw new AuthError("Your current password is incorrect.");

  const issues = passwordIssues(nextPw);
  if (issues.length) throw new AuthError(`New password needs: ${issues.join(", ").toLowerCase()}.`);

  const salt = newSalt();
  u.salt = salt;
  u.hash = await hashPassword(nextPw, salt, AUTH.pbkdf2Iterations);
  users[idx] = u;
  saveUsers(users);
}

/* ---------------- dev demo-admin bootstrap (from the gitignored .env) ---------------- */
let resolveReady: () => void = () => {};
export const authReady: Promise<void> = new Promise<void>((res) => {
  resolveReady = res;
});

void (async () => {
  try {
    const email = env.VITE_DEMO_ADMIN_EMAIL;
    const password = env.VITE_DEMO_ADMIN_PASSWORD;
    if (email && password) {
      const existing = findUser(email);
      if (!existing) {
        await createUser(
          {
            name: env.VITE_DEMO_ADMIN_NAME || "Store Admin",
            email,
            phone: env.VITE_DEMO_ADMIN_PHONE || "0143198930",
            password,
          },
          "admin",
        );
      } else if (existing.role === "admin") {
        // Dev-only self-heal: keep the .env admin working across engine
        // upgrades even if an older/stale record sits in localStorage.
        try {
          const valid =
            isUsableRecord(existing) &&
            (await verifyPassword(password, existing.salt, existing.hash, AUTH.pbkdf2Iterations));
          if (!valid) await repairRecord(existing, password);
        } catch {
          /* seeding must never break the app */
        }
      }
    }
  } catch {
    /* seeding must never break the app */
  }
  resolveReady();
})();
