import { useMemo, useState } from "react";
import { runSeoAudit } from "../../lib/nova/intelligence";

const gradeColour: Record<string, string> = { A: "#1b9e4b", B: "#0b7a63", C: "#f5a31a", D: "#c97f10", E: "#d64545" };

/** Clickable SEO audit — click any check to expand the fix. */
export default function SeoPanel() {
  const report = useMemo(() => runSeoAudit(), []);
  const [open, setOpen] = useState<string | null>(report.checks[0]?.id ?? null);
  const pct = Math.round((report.total / report.max) * 100);

  return (
    <div className="rounded-xl border border-line bg-card">
      <div className="flex items-center gap-5 border-b border-line p-5">
        <div
          className="grid h-16 w-16 shrink-0 place-items-center rounded-full border-4 font-display text-2xl font-bold text-white"
          style={{ borderColor: gradeColour[report.grade], background: `${gradeColour[report.grade]}33`, color: gradeColour[report.grade] }}
          aria-label={`SEO grade ${report.grade}`}
        >
          {report.grade}
        </div>
        <div className="flex-1">
          <p className="font-display text-lg font-bold">Site SEO health</p>
          <p className="text-[12.5px] font-semibold text-muted">{pct}% — {report.total}/{report.max} points. Click any check below for the exact fix.</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-mist">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: gradeColour[report.grade] }} />
          </div>
        </div>
      </div>

      <ul className="divide-y divide-line/70">
        {report.checks.map((c) => {
          const p = Math.round((c.score / c.max) * 100);
          const isOpen = open === c.id;
          return (
            <li key={c.id}>
              <button type="button" onClick={() => setOpen(isOpen ? null : c.id)} className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition hover:bg-mist/50" aria-expanded={isOpen}>
                <span className="w-40 shrink-0 text-[13px] font-extrabold">{c.label}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-mist">
                  <span className="block h-full rounded-full" style={{ width: `${p}%`, background: p >= 70 ? "#1b9e4b" : p >= 40 ? "#f5a31a" : "#d64545" }} />
                </span>
                <span className="w-12 shrink-0 text-right font-display text-[13px] font-bold text-muted">{c.score}/{c.max}</span>
              </button>
              {isOpen && (
                <div className="animate-pop space-y-2.5 border-t border-line/70 bg-mist/40 px-5 py-4">
                  {c.issues.length > 0 && (
                    <ul className="space-y-1">
                      {c.issues.map((iss) => (
                        <li key={iss} className="flex items-start gap-2 text-[12.5px] font-semibold text-error/90">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-error" />{iss}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="rounded-lg bg-card p-3 text-[12.5px] font-semibold leading-relaxed text-ink/85">
                    <b className="text-teal">How to fix: </b>{c.fix}
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
