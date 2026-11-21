import { useState } from 'react'
import { Phone, Mail, MapPin } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { useSettingsStore } from '@/store/settingsStore'

export default function Contact() {
  const settings = useSettingsStore((state) => state.settings)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: 'General Inquiry', message: '' })
  const supportPhone = settings.whatsapp_e164
  const supportEmail = settings.store_email
  const storeLocation = settings.store_location

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSending(true)
    const supabase = getSupabase()
    if (!supabase) {
      setError('The contact form is unavailable right now. Please use the configured contact details.')
      setSending(false)
      return
    }
    const { error: submitError } = await supabase.from('customer_inquiries').insert({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      message: `${form.subject}: ${form.message.trim()}`,
    })
    setSending(false)
    if (submitError) {
      setError('We could not save your message. Please try again later.')
      return
    }
    setSent(true)
  }

  return (
    <div className="wrap py-12">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Contact Info */}
          <div className="lg:col-span-4 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-ink mb-2">Get in Touch</h2>
              <p className="text-muted">
                Have a question about an order, a product, or our verification process? Reach out and we&rsquo;ll
                respond within 24 hours.
              </p>
            </div>

            <div className="space-y-5">
              {[
                {
                  icon: MapPin,
                  label: 'Visit Us',
                  text: storeLocation,
                },
                {
                  icon: Phone,
                  label: 'Call Us',
                  text: supportPhone,
                },
                {
                  icon: Mail,
                  label: 'Email Us',
                  text: supportEmail,
                },
              ].filter((item) => item.text).map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-ink">{item.label}</p>
                    <p className="text-sm text-muted">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Contact Form */}
          <div className="lg:col-span-8">
            <div className="bg-card border border-line rounded-xl p-8 shadow-sm">
              <h2 className="text-xl font-bold text-ink mb-6">Send us a message</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-ink mb-1">Full Name</label>
                    <input type="text" required maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input w-full" placeholder="Full name" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-ink mb-1">Email Address</label>
                    <input type="email" required maxLength={254} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input w-full" placeholder="you@example.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-ink mb-1">Phone Number</label>
                  <input type="tel" maxLength={40} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input w-full" placeholder="Phone number (optional)" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-ink mb-1">Subject</label>
                  <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input w-full">
                    <option>General Inquiry</option>
                    <option>Order Status</option>
                    <option>Product Verification</option>
                    <option>Delivery Issue</option>
                    <option>Wholesale / Bulk Orders</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-ink mb-1">Message</label>
                  <textarea required minLength={5} maxLength={1800} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} className="input w-full" placeholder="How can we help you?" />
                </div>
                <button
                  type="submit"
                  disabled={sending || sent}
                  className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${
                    sending || sent ? 'bg-muted cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'
                  }`}
                >
                  {sent ? 'Message Sent!' : sending ? 'Sending…' : 'Send Message'}
                </button>
                {sent && (
                  <p className="text-sm text-success mt-2">Thank you. Your message has been sent to our team.</p>
                )}
                {error && <p role="alert" className="text-sm text-error mt-2">{error}</p>}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
