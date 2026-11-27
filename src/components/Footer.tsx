import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from '@/components/Logo'
import { getSupabase } from '@/lib/supabase'
import { useSettingsStore } from '@/store/settingsStore'
import { Phone, MapPin, Mail, ShieldCheck, Truck, CreditCard, RotateCcw } from 'lucide-react'

export default function Footer() {
  const settings = useSettingsStore((state) => state.settings)
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')

  const subscribe = async (event: FormEvent) => {
    event.preventDefault()
    const supabase = getSupabase()
    if (!supabase) {
      setNote('Newsletter signup needs the shop database.')
      return
    }
    const { error } = await supabase.from('newsletter_subscriptions').insert({ email: email.trim().toLowerCase() })
    setNote(error ? error.message : 'Thank you for subscribing!')
    if (!error) setEmail('')
  }

  return (
    <footer className="mt-16 bg-[#0b1117] text-slate-300 border-t border-slate-800">
      {/* Marketplace Trust Features Strip */}
      <div className="border-b border-slate-800/80 bg-[#101820]">
        <div className="wrap grid grid-cols-2 gap-4 py-6 md:grid-cols-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-500/10 text-primary">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Countrywide Delivery</p>
              <p className="text-[11px] text-slate-400">All 47 Counties in Kenya</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-success">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Secure M-PESA &amp; Bank</p>
              <p className="text-[11px] text-slate-400">Verified Payment References</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan/10 text-cyan">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">100% Genuine Specs</p>
              <p className="text-[11px] text-slate-400">Authentic Hardware Tested</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-amber/10 text-amber">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Inspection Warranty</p>
              <p className="text-[11px] text-slate-400">Physical Check on Delivery</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="wrap grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand info */}
        <div>
          <Logo light />
          <p className="mt-4 text-xs leading-relaxed text-slate-400">
            {settings.tagline || 'Kenya’s verified technology and laptop marketplace. Genuine stock, transparent KSh pricing, and guaranteed delivery.'}
          </p>

          <div className="mt-4 space-y-2 text-xs">
            {settings.store_location && (
              <p className="flex items-center gap-2 text-slate-400">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span>{settings.store_location}</span>
              </p>
            )}
            {settings.whatsapp_e164 && (
              <a
                className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                href={`https://wa.me/${settings.whatsapp_e164.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
              >
                <Phone className="h-4 w-4 text-success shrink-0" />
                <span>WhatsApp: {settings.whatsapp_e164}</span>
              </a>
            )}
            {settings.store_email && (
              <a
                className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                href={`mailto:${settings.store_email}`}
              >
                <Mail className="h-4 w-4 text-cyan shrink-0" />
                <span>{settings.store_email}</span>
              </a>
            )}
          </div>
        </div>

        {/* Categories */}
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-white">Shop Categories</p>
          <div className="mt-3 grid gap-2 text-xs">
            <Link to="/shop?category=laptops" className="hover:text-white transition-colors">
              Business &amp; Everyday Laptops
            </Link>
            <Link to="/shop?category=desktops" className="hover:text-white transition-colors">
              Desktops &amp; Workstations
            </Link>
            <Link to="/shop?category=monitors" className="hover:text-white transition-colors">
              Monitors &amp; Displays
            </Link>
            <Link to="/shop?category=storage-devices" className="hover:text-white transition-colors">
              Storage, NVMe &amp; SSDs
            </Link>
            <Link to="/shop?category=computer-accessories" className="hover:text-white transition-colors">
              Computer Accessories &amp; Chargers
            </Link>
            <Link to="/shop?offers=1" className="text-amber hover:underline font-semibold">
              Today&rsquo;s Hot Deals
            </Link>
          </div>
        </div>

        {/* Customer Care */}
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-white">Customer Care</p>
          <div className="mt-3 grid gap-2 text-xs">
            <Link to="/order-tracking" className="hover:text-white transition-colors">
              Track Your Order
            </Link>
            <Link to="/account" className="hover:text-white transition-colors">
              My Account &amp; Order History
            </Link>
            <Link to="/about" className="hover:text-white transition-colors">
              About OREMITECH
            </Link>
            <Link to="/contact" className="hover:text-white transition-colors">
              Contact &amp; Store Location
            </Link>
            <Link to="/faq" className="hover:text-white transition-colors">
              Frequently Asked Questions
            </Link>
            <Link to="/blog" className="hover:text-white transition-colors">
              Tech Guides &amp; Blog
            </Link>
          </div>
        </div>

        {/* Newsletter & Updates */}
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-white">Tech Newsletter</p>
          <p className="mt-2 text-xs text-slate-400">
            Get instant alerts on newly arrived laptops, price drops, and verified stock updates.
          </p>
          <form onSubmit={subscribe} className="mt-3">
            <input
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-primary focus:outline-none"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
            />
            <button className="mt-2 w-full rounded-md bg-primary py-2 text-xs font-bold text-white hover:bg-primary-hover shadow-sm transition-colors" type="submit">
              Subscribe
            </button>
            {note && <p className="mt-2 text-[11px] text-cyan">{note}</p>}
          </form>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-slate-800/80 bg-[#070b0e] py-4 text-center text-[11px] text-slate-500">
        <div className="wrap flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} OREMITECH SOLUTIONS. All rights reserved.</p>
          <p>Prices in Kenyan Shillings (KES) · Verified Delivery across Kenya</p>
        </div>
      </div>
    </footer>
  )
}
