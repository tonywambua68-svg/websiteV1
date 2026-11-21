import { FormEvent, useEffect, useState } from 'react'
import AdminLayout from './AdminLayout'
import { getSupabase } from '@/lib/supabase'
import type { Brand } from '@/lib/domain'
import { slugify } from '@/lib/commerce'
import { Plus, Tags, ToggleLeft, ToggleRight } from 'lucide-react'

export default function AdminBrands() {
  const [brands, setBrands] = useState<Brand[]>([])

  const [form, setForm] = useState({ name: '', slug: '', sort_order: '80' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const loadBrands = async () => {
    const supabase = getSupabase()
    if (!supabase) {
      setBrands([])
      setMessage('Brands cannot be loaded because the store database is not configured.')
      return
    }
    const { data, error } = await supabase.from('brands').select('*').order('sort_order')
    if (error) {
      setBrands([])
      setMessage(`Could not load brands: ${error.message}`)
      return
    }
    setBrands((data ?? []) as Brand[])
  }

  useEffect(() => {
    loadBrands()
  }, [])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return

    setLoading(true)
    const supabase = getSupabase()
    const newBrand = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      sort_order: Number(form.sort_order) || 80,
      is_active: true,
    }

    if (supabase) {
      const { error } = await supabase.from('brands').insert(newBrand)
      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setMessage(`Brand "${form.name}" added successfully.`)
        setForm({ name: '', slug: '', sort_order: '80' })
        loadBrands()
      }
    } else setMessage('The brand was not saved because the store database is not configured.')
    setLoading(false)
  }

  const toggleActive = async (b: Brand) => {
    const supabase = getSupabase()
    const nextState = !b.is_active

    if (supabase) {
      const { error } = await supabase.from('brands').update({ is_active: nextState }).eq('id', b.id)
      if (error) setMessage(`Could not update ${b.name}: ${error.message}`)
      else setMessage(`${b.name} ${nextState ? 'activated' : 'deactivated'}.`)
      loadBrands()
    } else {
      setMessage('The brand was not updated because the store database is not configured.')
    }
  }

  return (
    <AdminLayout
      title="Laptop & Hardware Brands"
      subtitle="Manage authorized hardware manufacturers and brands"
    >
      {message && (
        <div className="mb-4 rounded-lg border border-teal/30 bg-mint/50 p-3 text-xs font-bold text-tealdeep">
          {message}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Brands Table */}
        <div className="overflow-hidden rounded-xl border border-line bg-card shadow-xs">
          <div className="border-b border-line bg-mist px-5 py-3">
            <h2 className="font-display text-sm font-bold text-ink">Active Laptop Brands</h2>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line text-[11px] font-extrabold uppercase text-muted">
              <tr>
                <th className="px-5 py-3">Brand Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Sort Order</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {brands.map((b) => (
                <tr key={b.id} className="hover:bg-mist/40">
                  <td className="px-5 py-3 font-bold text-ink">{b.name}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-muted">{b.slug}</td>
                  <td className="px-4 py-3 font-mono font-bold text-ink">{b.sort_order}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                        b.is_active ? 'bg-mint text-tealdeep' : 'bg-mist text-muted'
                      }`}
                    >
                      {b.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => toggleActive(b)}
                      className="text-muted hover:text-teal"
                    >
                      {b.is_active ? (
                        <ToggleRight className="h-6 w-6 text-teal" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-muted" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Create Brand Form */}
        <div className="h-fit rounded-xl border border-line bg-card p-6 shadow-xs">
          <h2 className="font-display text-sm font-bold text-ink flex items-center gap-2">
            <Tags className="h-4 w-4 text-teal" /> Add New Brand
          </h2>

          <form onSubmit={handleCreate} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-muted">Brand Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })}
                placeholder="e.g. MSI"
                className="input mt-1.5 w-full text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted">Slug *</label>
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="msi"
                className="input mt-1.5 w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted">Sort Order</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                className="input mt-1.5 w-full text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-emerald w-full !h-10 text-xs font-bold shadow-xs disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> Create Brand
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  )
}

