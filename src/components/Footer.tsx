import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from '@/components/Logo'
import { getSupabase } from '@/lib/supabase'
import { useSettingsStore } from '@/store/settingsStore'
import { Phone, MapPin, Mail } from 'lucide-react'

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
    setNote(error ? error.message : 'You are on the list.')
    if (!error) setEmail('')
  }

  return (
    <footer className="mt-16 bg-footer-bg text-white/80">
      <div className="wrap grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="md:col-span-2">
          <Logo light />
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[#cbd5d1]">{settings.tagline}. Prices are in Kenyan shillings. Supplier stock is labelled separately from stock held by OREMITECH.</p>
          {settings.store_location && <p className="mt-3 flex items-center gap-2 text-sm"><MapPin className="h-4 w-4" />{settings.store_location}</p>}
          {settings.whatsapp_e164 && <a className="mt-2 flex items-center gap-2 text-sm hover:text-white" href={`https://wa.me/${settings.whatsapp_e164.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"><Phone className="h-4 w-4" />{settings.whatsapp_e164}</a>}
          {settings.store_email && <a className="mt-2 flex items-center gap-2 text-sm hover:text-white" href={`mailto:${settings.store_email}`}><Mail className="h-4 w-4" />{settings.store_email}</a>}
        </div>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-white">Shop</p>
          <div className="mt-3 grid gap-2 text-sm">
            <Link to="/shop?category=laptops">Laptops</Link>
            <Link to="/shop?category=computer-accessories">Accessories</Link>
            <Link to="/shop?offers=1">Offers</Link>
            <Link to="/shop">Browse all products</Link>
            <Link to="/order-tracking">Track an order</Link>
          </div>
        </div>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-white">Help & Information</p>
          <div className="mt-3 grid gap-2 text-sm">
            <Link to="/about">About us</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/faq">FAQs</Link>
            <Link to="/blog">Technology guides</Link>
            <Link to="/account">My account</Link>
          </div>
        </div>
        <form onSubmit={subscribe}>
          <p className="text-xs font-extrabold uppercase tracking-wide text-white">Newsletter</p>
          <p className="mt-2 text-sm text-[#cbd5d1]">Product news only. No invented offers.</p>
          <input className="input mt-3 !bg-white" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" />
          <button className="btn btn-amber mt-2" type="submit">Subscribe</button>
          {note && <p className="mt-2 text-xs">{note}</p>}
        </form>
      </div>
      <div className="border-t border-white/10">
        <p className="wrap py-4 text-xs text-white/50">© {new Date().getFullYear()} OREMITECH. Prices in Kenyan shillings. Product availability is confirmed at checkout.</p>
      </div>
    </footer>
  )
}
