import { useState } from 'react'
import { ChevronDown, ChevronUp, HelpCircle, Link as LinkIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

const FAQS = [
  {
    q: 'How does order verification work?',
    a: 'Every order is verified before fulfilment. Our team physically checks the device, confirms it matches the listing, and only then processes payment. You&rsquo;re protected until you receive exactly what you ordered.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept mobile money (M-Pesa, Airtel Money), bank transfers, and card payments. Payment is confirmed only after your provider reference is verified.',
  },
  {
    q: 'Do you deliver nationwide in Kenya?',
    a: 'Yes. We deliver to all major towns and cities across Kenya with tracking. Delivery fees are calculated at checkout based on your location.',
  },
  {
    q: 'What is your return policy?',
    a: 'If the device you receive doesn&rsquo;t match its listing condition, you can request a return within 7 days of delivery. Contact our support team to start the process.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Nairobi deliveries typically arrive within 1&ndash;2 business days. Upcountry deliveries take 2&ndash;4 business days, depending on your location and courier availability.',
  },
  {
    q: 'Can I track my order?',
    a: 'Yes. Use the order number and phone number from your checkout confirmation on our Track Order page to see real-time status updates.',
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<Set<number>>(new Set())

  const toggle = (index: number) => {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  return (
    <div className="wrap py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <HelpCircle className="w-6 h-6 text-teal-600" />
          <h1 className="text-3xl font-bold text-ink">Frequently Asked Questions</h1>
        </div>

        <div className="space-y-3">
          {FAQS.map(({ q, a }, i) => (
            <div key={i} className="rounded-xl border border-line bg-card overflow-hidden">
              <button
                type="button"
                onClick={() => toggle(i)}
                className="flex w-full items-center justify-between px-6 py-4 text-left text-lg font-bold text-ink hover:bg-mist transition"
                aria-expanded={open.has(i)}
              >
                {q}
                {open.has(i) ? (
                  <ChevronUp className="w-5 h-5 text-muted" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted" />
                )}
              </button>
              {open.has(i) && (
                <div className="px-6 pb-4 text-sm text-muted leading-relaxed border-t border-line/50">
                  {a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 rounded-xl border border-line bg-mist/50">
          <p className="text-sm font-bold text-muted uppercase tracking-wider mb-3">Still need help?</p>
          <p className="text-ink mb-4">Contact our support team and we&rsquo;ll get back to you within 24 hours.</p>
          <Link to="/contact" className="inline-flex items-center gap-2 text-teal-600 font-bold hover:underline">
            Go to Contact Page <LinkIcon className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
