import { Link } from 'react-router-dom'

/** Existing OREMITECH mark already used in the header. Do not swap this artwork. */
export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <img
      src="/logo.svg?v=4"
      alt="OREMITECH"
      className={className}
      aria-hidden="true"
    />
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
