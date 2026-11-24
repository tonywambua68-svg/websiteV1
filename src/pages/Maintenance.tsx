export default function Maintenance() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-mist p-4 sm:p-6 md:p-8">
      <div className="wrap max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald mb-6">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3"
            />
          </svg>
        </div>
        <h1 className="font-display text-3xl font-bold text-ink mb-2">Site under maintenance</h1>
        <p className="text-muted text-base mb-8">
          OREMITECH is temporarily unavailable while we apply updates. We'll be back shortly.
        </p>
        <div className="space-y-3">
          <a href="/" className="btn-emerald w-full sm:w-auto">
            Visit homepage
          </a>
          <a href="/shop" className="btn-amber w-full sm:w-auto">
            Browse products
          </a>
        </div>
        <p className="mt-8 text-xs text-muted">
          OREMITECH &mdash; Verified laptops &amp; computer accessories in Kenya
        </p>
      </div>
    </div>
  )
}
