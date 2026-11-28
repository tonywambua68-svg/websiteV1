import { FormEvent, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { INFO_ARTICLES } from '@/lib/infoContent'
import { getSupabase } from '@/lib/supabase'
import { AlertTriangle, ChevronRight, CheckCircle2 } from 'lucide-react'

export function InfoPage({ slug }: { slug?: string }) {
  const params = useParams()
  const article = INFO_ARTICLES[slug ?? params.slug ?? '']
  if (!article) {
    return (
      <div className="wrap py-16 text-center">
        <p className="text-sm font-bold text-ink">Page not found</p>
        <Link to="/" className="btn btn-primary mt-4 !h-10 text-xs font-bold">Back to home</Link>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-page pb-16">
      <div className="wrap pt-4">
        <nav className="flex items-center gap-1 text-[11px] text-muted">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-ink">{article.title}</span>
        </nav>

        <div className="mt-4 rounded-xl border border-line bg-card p-6 sm:p-8">
          {article.draft && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-xs font-bold">DRAFT — Owner approval required. This is not a published promise.</p>
            </div>
          )}
          <h1 className="font-display text-2xl font-extrabold text-ink">{article.title}</h1>
          <p className="mt-2 text-sm text-muted">{article.intro}</p>
          <div className="mt-6 space-y-5">
            {article.sections.map((s) => (
              <section key={s.h}>
                <h2 className="font-display text-sm font-bold text-ink">{s.h}</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{s.p}</p>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

type SupportKind = 'request' | 'report' | 'bulk'

const KIND_META: Record<SupportKind, { title: string; intro: string; prefix: string }> = {
  request: { title: 'Request a Product', intro: 'Cannot find a product? Tell us the model or specifications and budget.', prefix: '[Product Request]' },
  report: { title: 'Report a Product', intro: 'Report an issue with a product or listing so we can review it.', prefix: '[Report a Product]' },
  bulk: { title: 'Bulk & Corporate Orders', intro: 'Request a quotation for multiple units for your organisation.', prefix: '[Bulk Quote]' },
}

export function SupportFormPage({ kind }: { kind: SupportKind }) {
  const meta = KIND_META[kind]
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (message.trim().length < 5) {
      setError('Please add a little more detail.')
      return
    }
    setState('sending')
    const supabase = getSupabase()
    if (!supabase) {
      setError('Database not configured.')
      setState('idle')
      return
    }
    const { error: dbErr } = await supabase.from('customer_inquiries').insert({
      name: name.trim() || 'Website visitor',
      phone: phone.trim() || null,
      email: email.trim() || null,
      message: `${meta.prefix} ${message.trim()}`.slice(0, 2000),
    })
    if (dbErr) {
      setError(dbErr.message)
      setState('idle')
      return
    }
    setState('done')
  }

  return (
    <div className="min-h-screen bg-page pb-16">
      <div className="wrap pt-6">
        <div className="mx-auto max-w-xl rounded-xl border border-line bg-card p-6 sm:p-8">
          <h1 className="font-display text-2xl font-extrabold text-ink">{meta.title}</h1>
          <p className="mt-2 text-sm text-muted">{meta.intro}</p>

          {state === 'done' ? (
            <div className="mt-6 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-3 text-green-800">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-sm font-bold">Thank you — your request has been submitted. Our team will follow up.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 grid gap-3 sm:grid-cols-2">
              <label>
                <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Your name" />
              </label>
              <label>
                <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Phone</span>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-primary" placeholder="07xx / 01xx" />
              </label>
              <label className="sm:col-span-2">
                <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Email (optional)</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-primary" placeholder="you@example.com" />
              </label>
              <label className="sm:col-span-2">
                <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Details *</span>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Model, specifications, quantities, budget, or the issue you are reporting…" />
              </label>
              {error && <p className="sm:col-span-2 text-xs font-bold text-error">{error}</p>}
              <button type="submit" disabled={state === 'sending'} className="btn btn-primary sm:col-span-2 !h-11 text-sm font-bold disabled:opacity-50">
                {state === 'sending' ? 'Submitting…' : 'Submit'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}