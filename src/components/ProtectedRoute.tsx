import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

/**
 * Authorization gate. Unauthenticated visitors are redirected to the sign-in
 * screen with their intended destination preserved (and sanitised — only
 * same-app paths starting with "/" are honoured).
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, initializing } = useAuth();
  const loc = useLocation();

  if (initializing) {
    return (
      <div className="wrap grid min-h-[50vh] place-items-center">
        <div className="flex flex-col items-center gap-4">
          <span className="relative grid h-14 w-14 place-items-center rounded-2xl bg-ink">
            <span className="absolute inset-0 animate-ping-soft rounded-2xl bg-teal/50" />
            <svg viewBox="0 0 32 32" className="relative h-8 w-8" aria-hidden="true">
              <path d="M10 22V10h4v12z" fill="#f5a31a" />
              <path d="M18 10l6 12h-4.5L15 13z" fill="#0b7a63" />
            </svg>
          </span>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted">Checking your session…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    const target = `${loc.pathname}${loc.search}`;
    const safe = target.startsWith("/") && !target.startsWith("//") ? target : "/";
    return <Navigate to={`/auth?mode=login&redirect=${encodeURIComponent(safe)}`} replace />;
  }

  return <>{children}</>;
}
