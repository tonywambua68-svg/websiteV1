import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { AuthError, passwordIssues, passwordStrength } from "../lib/auth";
import { AUTH, AVATAR_HUES, BUSINESS } from "../config";
import { byId, fmt } from "../data/products";
import ProductArt from "../components/ProductArt";
import { Reveal } from "../components/ui";
import { IcArrowR, IcCheck, IcEye, IcLock, IcShield, IcTruck } from "../components/Icons";

type Mode = "login" | "register";

export default function AuthPage() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { user, login, register } = useAuth();

  const initialMode: Mode = params.get("mode") === "register" ? "register" : "login";
  const redirect = useMemo(() => {
    const r = params.get("redirect") ?? "/account";
    return r.startsWith("/") && !r.startsWith("//") ? r : "/account";
  }, [params]);

  const [mode, setMode] = useState<Mode>(initialMode);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({});

  // Already signed in? Straight through.
  if (user) {
    window.setTimeout(() => nav(redirect, { replace: true }), 0);
  }

  const strength = passwordStrength(pw);
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["bg-line", "bg-error", "bg-warning", "bg-teal", "bg-success"][strength];

  const fail = (msg: string) => {
    setFormError(msg);
    setShake(true);
    window.setTimeout(() => setShake(false), 700);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (mode === "register" && name.trim().length < 2) errs.name = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) errs.email = "Enter a valid email address.";
    if (mode === "register") {
      const issues = passwordIssues(pw);
      if (issues.length) errs.pw = `Needs: ${issues.join(", ").toLowerCase()}`;
      if (pw2 !== pw) errs.pw2 = "Passwords don't match.";
    } else if (!pw) {
      errs.pw = "Enter your password.";
    }
    setFieldErr(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;
    setBusy(true);
    try {
      if (mode === "login") await login(email, pw);
      else await register({ name, email, phone, password: pw });
      nav(redirect, { replace: true });
    } catch (err) {
      fail(err instanceof AuthError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setFormError(null);
    setFieldErr({});
  };

  const t = byId("p1")!;
  const b = byId("p18")!;

  return (
    <div className="wrap grid gap-6 py-8 md:py-14 lg:grid-cols-[1.05fr_1fr] lg:items-stretch">
      {/* ---------- Brand panel ---------- */}
      <Reveal className="hidden lg:block">
        <div className="relative flex h-full min-h-[560px] flex-col overflow-hidden rounded-2xl bg-ink p-8 text-white">
          <div className="grid-lines pointer-events-none absolute inset-0" />
          <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-teal/25 blur-[120px]" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-amber/15 blur-[110px]" />

          <div className="relative">
            <Link to="/" className="flex items-center gap-2.5" aria-label="Back to home">
              <svg viewBox="0 0 32 32" className="h-9 w-9" aria-hidden="true">
                <rect width="32" height="32" rx="7" fill="#f5a31a" />
                <path d="M10 22V10h4v12z" fill="#0a1f1c" />
                <path d="M18 10l6 12h-4.5L15 13z" fill="#0a1f1c" />
              </svg>
              <span className="font-display text-xl font-bold">Imara<span className="text-teal">.</span></span>
            </Link>

            <h1 className="mt-10 font-display text-4xl font-bold leading-[1.05] tracking-tight xl:text-5xl">
              One account.
              <br />
              <span className="text-amber">Zero</span> nonsense.
            </h1>
            <p className="mt-4 max-w-sm text-[15px] font-semibold leading-relaxed text-white/60">
              Track orders, save addresses and check out faster — with a password that's
              hashed before it ever touches storage.
            </p>

            <ul className="mt-8 space-y-3">
              {[
                { icon: IcTruck, text: "Live order tracking on every purchase" },
                { icon: IcLock, text: "PBKDF2-hashed passwords — never plain text" },
                { icon: IcShield, text: "Your data is yours. No resale, no spam" },
              ].map((x) => (
                <li key={x.text} className="flex items-center gap-3 text-sm font-bold text-white/80">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/8 text-amber">
                    <x.icon className="h-4.5 w-4.5" />
                  </span>
                  {x.text}
                </li>
              ))}
            </ul>
          </div>

          {/* Floating product tiles */}
          <div className="relative mt-auto pt-10">
            <Link
              to={`/product/${t.id}`}
              className="animate-floaty absolute -top-6 right-24 hidden w-44 rounded-2xl border border-white/12 bg-pine/80 p-3 shadow-2xl backdrop-blur transition hover:border-amber/60 xl:block"
              style={{ ["--rot" as string]: "2deg" }}
            >
              <ProductArt kind={t.art} accent={t.hue} className="h-16 w-full" />
              <p className="mt-1 truncate text-[11px] font-bold">{t.name}</p>
              <p className="font-display text-[12px] font-bold text-amber">{fmt(t.price)}</p>
            </Link>
            <Link
              to={`/product/${b.id}`}
              className="animate-floaty absolute -top-14 right-2 w-36 rounded-2xl border border-white/12 bg-pine/80 p-3 shadow-2xl backdrop-blur transition hover:border-amber/60"
              style={{ ["--rot" as string]: "-3deg", animationDelay: "1.4s" }}
            >
              <ProductArt kind={b.art} accent={b.hue} className="h-14 w-full" />
              <p className="mt-1 truncate text-[11px] font-bold">{b.name}</p>
              <p className="font-display text-[12px] font-bold text-amber">{fmt(b.price)}</p>
            </Link>
            <p className="relative text-[11px] font-bold text-white/35">
              {BUSINESS.name} · genuine tech, honest prices, delivery across Kenya.
            </p>
          </div>
        </div>
      </Reveal>

      {/* ---------- Form panel ---------- */}
      <Reveal delay={100}>
        <div className={`card relative overflow-hidden p-6 md:p-8 ${shake ? "animate-shake" : ""}`}>
          <span className="dots-bg pointer-events-none absolute inset-0 opacity-30" />
          <div className="relative">
            <div className="flex items-center justify-between gap-3 lg:hidden">
              <Link to="/" className="flex items-center gap-2" aria-label="Back to home">
                <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
                  <rect width="32" height="32" rx="7" fill="#0a1f1c" />
                  <path d="M10 22V10h4v12z" fill="#f5a31a" />
                  <path d="M18 10l6 12h-4.5L15 13z" fill="#0b7a63" />
                </svg>
                <span className="font-display text-lg font-bold">Imara<span className="text-teal">.</span></span>
              </Link>
            </div>

            <p className="mt-4 text-[11px] font-extrabold uppercase tracking-[0.18em] text-teal lg:mt-0">
              {mode === "login" ? "Welcome back" : "Join Imara"}
            </p>
            <h2 className="mt-1.5 font-display text-3xl font-bold tracking-tight">
              {mode === "login" ? "Sign in to your account" : "Create your account"}
            </h2>
            <p className="mt-1.5 text-sm font-semibold text-muted">
              {mode === "login"
                ? "Pick up right where you left off."
                : "Takes less than a minute — no card required."}
            </p>

            <p className="mt-4 rounded-lg border border-amber/40 bg-amber/10 px-3.5 py-2.5 text-[11.5px] font-bold leading-relaxed text-amberdeep">
              {AUTH.demoNotice}
            </p>

            {/* Mode switch */}
            <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-mist p-1" role="tablist" aria-label="Sign in or register">
              {(["login", "register"] as Mode[]).map((m) => (
                <button
                  key={m} role="tab" aria-selected={mode === m} type="button" onClick={() => switchMode(m)}
                  className={`rounded-lg py-2 text-[13px] font-extrabold transition ${mode === m ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink"}`}
                >
                  {m === "login" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>

            {formError && (
              <div className="animate-pop mt-4 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-[13px] font-extrabold text-error" role="alert">
                {formError}
              </div>
            )}

            <form className="mt-5 space-y-4" onSubmit={submit} noValidate>
              {mode === "register" && (
                <Field label="Full name" error={fieldErr.name}>
                  <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tony Wambua" autoComplete="name" />
                </Field>
              )}

              <Field label="Email" error={fieldErr.email}>
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.co.ke" autoComplete="email" />
              </Field>

              {mode === "register" && (
                <Field label="Phone / WhatsApp (optional)">
                  <input className="input" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XX XXX XXX" autoComplete="tel" />
                </Field>
              )}

              <Field label="Password" error={fieldErr.pw}>
                <div className="relative">
                  <input
                    className="input !pr-16" type={showPw ? "text" : "password"} value={pw}
                    onChange={(e) => setPw(e.target.value)} placeholder="••••••••"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-extrabold text-muted transition hover:text-teal">
                    <IcEye className="h-3.5 w-3.5" /> {showPw ? "Hide" : "Show"}
                  </button>
                </div>
                {mode === "register" && pw && (
                  <span className="mt-2 block">
                    <span className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= strength ? strengthColor : "bg-line"}`} />
                      ))}
                    </span>
                    <span className="mt-1 block text-[11px] font-extrabold text-muted">{strengthLabel}</span>
                  </span>
                )}
              </Field>

              {mode === "register" && (
                <Field label="Confirm password" error={fieldErr.pw2}>
                  <input
                    className="input" type={showPw ? "text" : "password"} value={pw2}
                    onChange={(e) => setPw2(e.target.value)} placeholder="••••••••" autoComplete="new-password"
                  />
                </Field>
              )}

              <button type="submit" disabled={busy} className="btn btn-amber w-full !h-12 !text-[15px]">
                {busy ? (
                  <span className="flex items-center gap-2">
                    <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink" />
                    <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink" style={{ animationDelay: "0.15s" }} />
                    <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink" style={{ animationDelay: "0.3s" }} />
                    {mode === "login" ? "Signing in…" : "Creating account…"}
                  </span>
                ) : (
                  <>{mode === "login" ? "Sign in" : "Create account"} <IcArrowR className="h-4.5 w-4.5" /></>
                )}
              </button>
            </form>

            <p className="mt-5 text-center text-[13px] font-semibold text-muted">
              {mode === "login" ? (
                <>New to {BUSINESS.name}?{" "}
                  <button type="button" onClick={() => switchMode("register")} className="font-extrabold text-teal underline-offset-2 hover:underline">Create an account</button>
                </>
              ) : (
                <>Already have an account?{" "}
                  <button type="button" onClick={() => switchMode("login")} className="font-extrabold text-teal underline-offset-2 hover:underline">Sign in</button>
                </>
              )}
            </p>

            <div className="mt-6 flex items-center justify-center gap-4 border-t border-line pt-5 text-[11px] font-bold text-muted">
              <span className="flex items-center gap-1.5"><IcCheck className="h-3.5 w-3.5 text-success" /> Hashed passwords</span>
              <span className="flex items-center gap-1.5"><IcCheck className="h-3.5 w-3.5 text-success" /> Session expiry</span>
              <span className="flex items-center gap-1.5"><IcCheck className="h-3.5 w-3.5 text-success" /> Lockout protection</span>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-extrabold text-muted">{label}</span>
      {children}
      {error && <span className="animate-pop mt-1.5 block text-[11.5px] font-extrabold text-error">{error}</span>}
    </label>
  );
}
