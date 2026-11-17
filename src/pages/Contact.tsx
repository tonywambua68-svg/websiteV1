import { useState } from 'react'
import { Phone, Mail, MapPin, Clock, Send } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Contact() {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    // Simulate form submission; wire to Supabase/email function when backend is ready
    await new Promise((r) => setTimeout(r, 1200))
    setSending(false)
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
                  text: 'Oremitech Ltd, Nairobi, Kenya',
                },
                {
                  icon: Phone,
                  label: 'Call Us',
                  text: '+254 700 000 000',
                },
                {
                  icon: Mail,
                  label: 'Email Us',
                  text: 'support@oremitech.co.ke',
                },
                {
                  icon: Clock,
                  label: 'Hours',
                  text: 'Mon &ndash; Fri, 9:00 &ndash; 17:00 EAT',
                },
              ].map((item) => (
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

            <div className="p-4 rounded-lg border border-line bg-card">
              <p className="font-bold text-ink mb-2">Follow Us</p>
              <div className="flex gap-3">
                {['Twitter', 'Instagram', 'Facebook', 'LinkedIn'].map((network) => (
                  <a
                    key={network}
                    href="#"
                    className="w-9 h-9 rounded-lg border border-line flex items-center justify-center text-muted hover:text-teal-600 hover:border-teal-600 transition"
                  >
                    {network.charAt(0)}
                  </a>
                ))}
              </div>
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
                    <input type="text" required className="input w-full" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-ink mb-1">Email Address</label>
                    <input type="email" required className="input w-full" placeholder="you@example.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-ink mb-1">Phone Number</label>
                  <input type="tel" className="input w-full" placeholder="+254 7XX XXX XXX" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-ink mb-1">Subject</label>
                  <select className="input w-full">
                    <option>General Inquiry</option>
                    <option>Order Status</option>
                    <option>Product Verification</option>
                    <option>Delivery Issue</option>
                    <option>Wholesale / Bulk Orders</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-ink mb-1">Message</label>
                  <textarea required rows={4} className="input w-full" placeholder="How can we help you?" />
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
                  <p className="text-sm text-success mt-2">Thank you! We&rsquo;ll get back to you shortly.</p>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
