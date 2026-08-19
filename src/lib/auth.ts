/* ============================================================================
   AUTH SERVICE — accounts, sessions, password management
   ----------------------------------------------------------------------------
   Single source of truth for authentication. The rest of the app only ever
   talks to this module (via AuthContext), which makes it the ONE file to
   replace when a real backend (Supabase / Firebase / WooCommerce) is added.

   Security properties (demo-grade, browser-enforced):
   • Passwords hashed with PBKDF2-SHA-256 + random per-user salt — never plain
   • Session tokens from a CSPRNG, with expiry
   • Brute-force lockout after repeated failures (per email)
   • Generic error messages — login never reveals whether the email exists
   • Profile data is only ever exposed for the CURRENT session's user
   • No hard-coded credentials, no hidden admin accounts, no backdoors

   STORAGE KEYS (versioned so a future backend migration can ignore them):
   imara.users.v1   → { [userId]: StoredUser }
   imara.session.v1 → { token, userId, expiresAt }
   imara.lockout.v1 → { [email]: { fails, until } }
   ========================================================================== */

import { AUTH, AVATAR_HUES } from "../config";
import { hashPassword, newSalt, randomToken, verifyPassword } from "./crypto";

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  salt: string;
  hash: string;
  avatarHue: string;
  createdAt: string;
}

/** What the UI is allowed to see — credentials stripped at the boundary. */
export type SafeUser = Omit<StoredUser, "salt" | "hash">;

interface SessionRecord { token: string; userId: string; expiresAt: number }
interface LockoutRecord { fails: number; until: number }

export type AuthErrorCode =
  | "invalid-input" | "email-exists" | "bad-credentials" | "locked-out"
  | "session-expired" | "wrong-password" | "weak-password" | "no-session";

export class AuthError extends Error {
  code: AuthErrorCode;
  retryAfterSec?: number;
  constructor(code: AuthErrorCode, message: string, retryAfterSec?: number) {
    super(message);
    this.code = code;
    this.retryAfterSec = retryAfterSec;
  }
}

const USERS_KEY = "imara.users.v1";
const SESSION_KEY = "imara.session.v1";
const LOCKOUT_KEY = "imara.lockout.v1";

/* ---------- storage helpers ---------- */

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
    /* storage unavailable (private mode) — session simply won't persist */
  }
}

const getUsers = () => read<Record<string, StoredUser>>(USERS_KEY, {});
const saveUsers = (u: Record<string, StoredUser>) => write(USERS_KEY, u);

/* ---------- validation ---------- */

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizeEmail(email));

export function passwordIssues(pw: string): string[] {
  const issues: string[] = [];
  if (pw.length < 8) issues.push("At least 8 characters");
  if (!/[a-zA-Z]/.test(pw)) issues.push("At least one letter");
  if (!/\d/.test(pw)) issues.push("At least one number");
  return issues;
}

/** 0–4 strength score for the UI meter. */
export function passwordStrength(pw: string): number {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^a-zA-Z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}

const assertName = (name: string) => {
  if (name.trim().length < 2) throw new AuthError("invalid-input", "Enter your full name.");
};
const assertEmail = (email: string) => {
  if (!isValidEmail(email)) throw new AuthError("invalid-input", "Enter a valid email address.");
};
const assertPassword = (pw: string) => {
  const issues = passwordIssues(pw);
  if (issues.length) throw new AuthError("weak-password", `Password needs: ${issues.join(", ").toLowerCase()}.`);
};

/* ---------- lockout ---------- */

function lockoutFor(email: string): LockoutRecord {
  return read<Record<string, LockoutRecord>>(LOCKOUT_KEY, {})[normalizeEmail(email)] ?? { fails: 0, until: 0 };
}

function setLockout(email: string, rec: LockoutRecord) {
  const all = read<Record<string, LockoutRecord>>(LOCKOUT_KEY, {});
  all[normalizeEmail(email)] = rec;
  write(LOCKOUT_KEY, all);
}

/* ---------- internals ---------- */

const toSafe = (u: StoredUser): SafeUser => {
  const { salt: _s, hash: _h, ...safe } = u;
  return safe;
};

function currentSession(): SessionRecord | null {
  const s = read<SessionRecord | null>(SESSION_KEY, null);
  if (!s) return null;
  if (Date.now() > s.expiresAt) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
  return s;
}

/* ---------- public API ---------- */

export async function register(input: { name: string; email: string; phone: string; password: string }): Promise<SafeUser> {
  assertName(input.name);
  assertEmail(input.email);
  assertPassword(input.password);

  const email = normalizeEmail(input.email);
  const users = getUsers();
  if (Object.values(users).some((u) => u.email === email)) {
    throw new AuthError("email-exists", "An account with this email already exists. Try signing in.");
  }

  const salt = newSalt();
  const hash = await hashPassword(input.password, salt, AUTH.pbkdf2Iterations);
  const user: StoredUser = {
    id: `u_${randomToken(12)}`,
    name: input.name.trim(),
    email,
    phone: input.phone.trim(),
    salt,
    hash,
    avatarHue: AVATAR_HUES[Object.keys(users).length % AVATAR_HUES.length],
    createdAt: new Date().toISOString(),
  };
  users[user.id] = user;
  saveUsers(users);
  startSession(user.id);
  return toSafe(user);
}

export async function login(input: { email: string; password: string }): Promise<SafeUser> {
  const email = normalizeEmail(input.email);

  const lock = lockoutFor(email);
  if (lock.until > Date.now()) {
    const secs = Math.ceil((lock.until - Date.now()) / 1000);
    throw new AuthError("locked-out", `Too many failed attempts. Try again in ${secs}s.`, secs);
  }

  const users = getUsers();
  const user = Object.values(users).find((u) => u.email === email);

  // Hash even when the user is missing so timing stays uniform.
  const ok = user
    ? await verifyPassword(input.password, user.salt, user.hash, AUTH.pbkdf2Iterations)
    : ((await verifyPassword(input.password, newSalt(), randomToken(32), AUTH.pbkdf2Iterations)), false);

  if (!user || !ok) {
    const fails = lock.fails + 1;
    const until = fails >= AUTH.maxFailedAttempts ? Date.now() + AUTH.lockoutSeconds * 1000 : 0;
    setLockout(email, { fails: until ? 0 : fails, until });
    throw new AuthError(
      until ? "locked-out" : "bad-credentials",
      until
        ? `Too many failed attempts. Locked for ${AUTH.lockoutSeconds}s.`
        : "Incorrect email or password.",
      until ? AUTH.lockoutSeconds : undefined,
    );
  }

  setLockout(email, { fails: 0, until: 0 });
  startSession(user.id);
  return toSafe(user);
}

function startSession(userId: string) {
  const session: SessionRecord = {
    token: randomToken(32),
    userId,
    expiresAt: Date.now() + AUTH.sessionDays * 24 * 60 * 60 * 1000,
  };
  write(SESSION_KEY, session);
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

/** The only way the app reads user data — always the CURRENT session's user. */
export function currentUser(): SafeUser | null {
  const s = currentSession();
  if (!s) return null;
  const user = getUsers()[s.userId];
  return user ? toSafe(user) : null;
}

/** Update the current user's allowed profile fields. Nothing else can be touched. */
export function updateProfile(patch: { name?: string; phone?: string; avatarHue?: string }): SafeUser {
  const s = currentSession();
  const user = s ? getUsers()[s.userId] : null;
  if (!s || !user) throw new AuthError("no-session", "You are signed out.");
  if (patch.name !== undefined) assertName(patch.name);
  const next: StoredUser = {
    ...user,
    name: patch.name !== undefined ? patch.name.trim() : user.name,
    phone: patch.phone !== undefined ? patch.phone.trim() : user.phone,
    avatarHue: patch.avatarHue ?? user.avatarHue,
  };
  const users = getUsers();
  users[user.id] = next;
  saveUsers(users);
  return toSafe(next);
}

/** Change password — requires proving knowledge of the current one. */
export async function changePassword(currentPw: string, nextPw: string): Promise<void> {
  const s = currentSession();
  const user = s ? getUsers()[s.userId] : null;
  if (!s || !user) throw new AuthError("no-session", "You are signed out.");

  const ok = await verifyPassword(currentPw, user.salt, user.hash, AUTH.pbkdf2Iterations);
  if (!ok) throw new AuthError("wrong-password", "Current password is incorrect.");
  assertPassword(nextPw);

  const salt = newSalt(); // always rotate the salt
  const hash = await hashPassword(nextPw, salt, AUTH.pbkdf2Iterations);
  const users = getUsers();
  users[user.id] = { ...user, salt, hash };
  saveUsers(users);
}

/** Signed-in user count — used only for the demo dashboard badge. */
export function demoUserCount(): number {
  return Object.keys(getUsers()).length;
}
