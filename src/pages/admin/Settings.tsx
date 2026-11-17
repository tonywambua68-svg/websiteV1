import { FormEvent, useEffect, useState } from 'react'
import AdminLayout from './AdminLayout'
import { getSupabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useProductStore } from '@/store/productStore'
import { useOrderStore } from '@/store/orderStore'
import { Settings, Save, CheckCircle2, ShieldAlert, Download, Database } from 'lucide-react'

export default function AdminSettings() {
  const { user } = useAuthStore()
  const isOwner = user?.role === 'owner'
  const { settings, load } = useSettingsStore()
  const { allProducts } = useProductStore()
  const { orders } = useOrderStore()

  const [form, setForm] = useState({
    business_name: settings.business_name || 'OREMITECH',
    tagline: settings.tagline || 'Verified laptops and computer accessories in Kenya',
    currency: 'KES',
    timezone: 'Africa/Nairobi',
    whatsapp_e164: settings.whatsapp_e164 || '+254700000000',
    store_email: settings.store_email || 'support@oremitech.co.ke',
    store_location: settings.store_location || 'Nairobi, Kenya',
    ga_measurement_id: settings.ga_measurement_id || '',
    gsc_verification: settings.gsc_verification || '',
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setForm({
      business_name: settings.business_name || 'OREMITECH',
      tagline: settings.tagline || 'Verified laptops and computer accessories in Kenya',
      currency: 'KES',
      timezone: 'Africa/Nairobi',
      whatsapp_e164: settings.whatsapp_e164 || '+254700000000',
      store_email: settings.store_email || 'support@oremitech.co.ke',
      store_location: settings.store_location || 'Nairobi, Kenya',
      ga_measurement_id: settings.ga_measurement_id || '',
      gsc_verification: settings.gsc_verification || '',
    })
  }, [settings])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!isOwner) {
      setMessage('Permission Denied: Business settings can only be altered by the Owner account.')
      return
    }

    setLoading(true)
    const supabase = getSupabase()
    if (supabase) {
      try {
        const updates = Object.entries(form).map(([key, value]) =>
          supabase.from('business_settings').upsert({ key, value: String(value) }, { onConflict: 'key' })
        )
        await Promise.all(updates)
        setMessage('Business settings saved to PostgreSQL.')
        load()
      } catch (err: any) {
        setMessage(`Error: ${err.message}`)
      }
    } else {
      setMessage('Settings updated locally.')
    }
    setLoading(false)
  }

  const exportCatalogueCSV = () => {
    const headers = ['ID', 'Slug', 'Name', 'Brand', 'Category', 'Selling Price (KES)', 'Condition', 'Owned Stock']
    const rows = allProducts.map((p) => [
      p.id,
      p.slug,
      p.name,
      p.brand_name || '',
      p.category_name,
      String(p.selling_price),
      p.laptop_condition,
      String(p.owned_available),
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].map((e) => e.map((val) => `"${val}"`).join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `OREMITECH_Products_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <AdminLayout
      title="Storefront & Business Settings"
      subtitle="Configure enterprise parameters, Kenya contact channels, and Google integrations (Owner Only)"
    >
      {message && (
        <div className="mb-4 rounded-lg border border-teal/30 bg-mint/50 p-3 text-xs font-bold text-tealdeep flex items-center justify-between">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage(null)} className="text-muted hover:text-ink">
            ✕
          </button>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Settings Form */}
        <form onSubmit={handleSave} className="space-y-6">
          <div className="rounded-xl border border-line bg-card p-6 shadow-xs">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-muted">
              1. Brand Identity & Operating Parameters
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-muted">Official Business Name *</label>
                <input
                  type="text"
                  required
                  value={form.business_name}
                  onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                  className="input mt-1.5 w-full text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted">Operating Currency</label>
                <input
                  type="text"
                  disabled
                  value="KES (Kenyan Shillings)"
                  className="input mt-1.5 w-full text-xs font-bold opacity-75"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-muted">Storefront Tagline</label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  className="input mt-1.5 w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted">Business Timezone</label>
                <input
                  type="text"
                  disabled
                  value="Africa/Nairobi (EAT, UTC+3)"
                  className="input mt-1.5 w-full text-xs font-bold opacity-75"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted">Physical Store / Nairobi Location</label>
                <input
                  type="text"
                  value={form.store_location}
                  onChange={(e) => setForm({ ...form, store_location: e.target.value })}
                  placeholder="Nairobi, Kenya"
                  className="input mt-1.5 w-full text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-card p-6 shadow-xs">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-muted">
              2. Customer Support & WhatsApp Channel
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-muted">Official WhatsApp (E.164 format) *</label>
                <input
                  type="text"
                  required
                  value={form.whatsapp_e164}
                  onChange={(e) => setForm({ ...form, whatsapp_e164: e.target.value })}
                  placeholder="+254700000000"
                  className="input mt-1.5 w-full text-xs font-bold text-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted">Customer Support Email</label>
                <input
                  type="email"
                  value={form.store_email}
                  onChange={(e) => setForm({ ...form, store_email: e.target.value })}
                  placeholder="support@oremitech.co.ke"
                  className="input mt-1.5 w-full text-xs"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-card p-6 shadow-xs">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-muted">
              3. Google Acquisition (GA4 & Search Console)
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-muted">Google Analytics 4 Measurement ID</label>
                <input
                  type="text"
                  value={form.ga_measurement_id}
                  onChange={(e) => setForm({ ...form, ga_measurement_id: e.target.value })}
                  placeholder="G-XXXXXXXXXX"
                  className="input mt-1.5 w-full text-xs font-mono"
                />
                <span className="mt-1 block text-[10px] text-muted">
                  Leave empty if not ready; no fake tracking IDs are inserted.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted">Google Search Console Verification Token</label>
                <input
                  type="text"
                  value={form.gsc_verification}
                  onChange={(e) => setForm({ ...form, gsc_verification: e.target.value })}
                  placeholder="google-site-verification token"
                  className="input mt-1.5 w-full text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-emerald !h-11 px-8 text-xs font-bold shadow-md disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> Save Business Configuration
            </button>
          </div>
        </form>

        {/* Database & Export Card */}
        <div className="space-y-6">
          <div className="rounded-xl border border-line bg-card p-6 shadow-xs">
            <h3 className="font-display text-sm font-bold text-ink flex items-center gap-2">
              <Database className="h-4 w-4 text-teal" /> Data Portability & Exports
            </h3>
            <p className="mt-1 text-xs text-muted">
              Download clean CSV snapshots of the relational database for offline spreadsheets or Google Sheets integration.
            </p>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={exportCatalogueCSV}
                className="btn btn-emerald w-full !h-9 justify-start text-xs font-bold"
              >
                <Download className="h-3.5 w-3.5" /> Export Catalogue CSV
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-amber/30 bg-amber/10 p-5 text-xs text-amberdeep">
            <h4 className="font-bold flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4" /> Security Safeguards
            </h4>
            <p className="mt-1 text-[11px] leading-relaxed">
              Row Level Security enforces that public storefront visitors cannot read private purchase costs or customer order data. Only authenticated staff with active profiles have administrative access.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

