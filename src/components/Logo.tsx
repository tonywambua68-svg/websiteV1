import { Link } from 'react-router-dom'

/** Official OREMITECH brand mark (ink #101820 rounded square, electric-blue #087BFF bar, cyan #00C8E8 wedge) — matches site palette. */
export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-label="OREMITECH">
      <title>OREMITECH</title>
      <rect width="32" height="32" rx="7" fill="#101820" />
      <path d="M10 22V10h4v12z" fill="#087BFF" />
      <path d="M18 10l6 12h-4.5L15 13z" fill="#00C8E8" />
    </svg>
  )
}

export default function Logo({
  light = false,
  compact = false,
}: {
  light?: boolean
  compact?: boolean
}) {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="OREMITECH home">
      <LogoMark className={compact ? 'h-8 w-8' : 'h-8 w-8 md:h-9 md:w-9'} />
      <span className="leading-none">
        <span className={`block font-display text-[1.2rem] font-bold tracking-tight md:text-[1.35rem] ${light ? 'text-white' : 'text-ink'}`}>
          OREMITECH
        </span>
        <span className={`hidden text-[9px] font-extrabold uppercase tracking-[0.22em] sm:block ${light ? 'text-white/50' : 'text-muted'}`}>
          Kenya
        </span>
      </span>
    </Link>
  )
}
