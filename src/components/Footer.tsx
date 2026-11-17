import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from '@/components/Logo'
import { getSupabase } from '@/lib/supabase'
import { useSettingsStore } from '@/store/settingsStore'

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
      <div className="wrap grid gap-8 py-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo light />
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[#cbd5d1]">{settings.tagline}. Prices are in Kenyan shillings. Supplier stock is labelled separately from stock held by OREMITECH.</p>
          {settings.store_location && <p className="mt-2 text-sm">{settings.store_location}</p>}
          {settings.store_email && <p className="text-sm">{settings.store_email}</p>}
        </div>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-white">Shop</p>
          <div className="mt-3 grid gap-2 text-sm">
            <Link to="/shop?category=laptops">Laptops</Link>
            <Link to="/shop?category=computer-accessories">Accessories</Link>
            <Link to="/shop?offers=1">Offers</Link>
            <Link to="/order-tracking">Track an order</Link>
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
        <p className="wrap py-4 text-xs text-white/50">© {new Date().getFullYear()} OREMITECH. Nairobi, Kenya.</p>
      </div>
    </footer>
  )
}
