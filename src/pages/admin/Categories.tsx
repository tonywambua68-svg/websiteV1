import { FormEvent, useEffect, useState } from 'react'
import AdminLayout from './AdminLayout'
import { getSupabase } from '@/lib/supabase'
import type { Category } from '@/lib/domain'
import { slugify } from '@/lib/commerce'
import { Plus, CheckCircle2, Layers, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', parent_id: null, name: 'Laptops', slug: 'laptops', description: 'All laptop models', menu_group: 'laptops', sort_order: 10, is_active: true, seo_title: null, seo_description: null, seo_focus_keyword: null, seo_social_title: null, seo_social_description: null },
    { id: '2', parent_id: null, name: 'Business Laptops', slug: 'business-laptops', description: 'Enterprise machines', menu_group: 'use', sort_order: 20, is_active: true, seo_title: null, seo_description: null, seo_focus_keyword: null, seo_social_title: null, seo_social_description: null },
    { id: '3', parent_id: null, name: 'Gaming Laptops', slug: 'gaming-laptops', description: 'High performance gaming', menu_group: 'use', sort_order: 30, is_active: true, seo_title: null, seo_description: null, seo_focus_keyword: null, seo_social_title: null, seo_social_description: null },
    { id: '4', parent_id: null, name: 'Student Laptops', slug: 'student-laptops', description: 'Affordable everyday laptops', menu_group: 'use', sort_order: 40, is_active: true, seo_title: null, seo_description: null, seo_focus_keyword: null, seo_social_title: null, seo_social_description: null },
    { id: '5', parent_id: null, name: 'Workstations', slug: 'workstations', description: 'Professional engineering laptops', menu_group: 'use', sort_order: 50, is_active: true, seo_title: null, seo_description: null, seo_focus_keyword: null, seo_social_title: null, seo_social_description: null },
    { id: '6', parent_id: null, name: 'Computer Accessories', slug: 'computer-accessories', description: 'Peripherals and adapters', menu_group: 'accessories', sort_order: 60, is_active: true, seo_title: null, seo_description: null, seo_focus_keyword: null, seo_social_title: null, seo_social_description: null },
    { id: '7', parent_id: null, name: 'Monitors', slug: 'monitors', description: 'High resolution external screens', menu_group: 'accessories', sort_order: 70, is_active: true, seo_title: null, seo_description: null, seo_focus_keyword: null, seo_social_title: null, seo_social_description: null },
    { id: '8', parent_id: null, name: 'Storage Devices', slug: 'storage-devices', description: 'SSDs, hard drives, and flash', menu_group: 'accessories', sort_order: 80, is_active: true, seo_title: null, seo_description: null, seo_focus_keyword: null, seo_social_title: null, seo_social_description: null },
    { id: '9', parent_id: null, name: 'Networking Equipment', slug: 'networking-equipment', description: 'Routers, switches and cables', menu_group: 'accessories', sort_order: 90, is_active: true, seo_title: null, seo_description: null, seo_focus_keyword: null, seo_social_title: null, seo_social_description: null },
  ])

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    menu_group: 'use',
    sort_order: '100',
    seo_title: '',
    seo_description: '',
    seo_focus_keyword: '',
    seo_social_title: '',
    seo_social_description: '',
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const loadCategories = async () => {
    const supabase = getSupabase()
    if (!supabase) return
    const { data } = await supabase.from('categories').select('*').order('sort_order')
    if (data && data.length > 0) setCategories(data as Category[])
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const handleNameChange = (nameVal: string) => {
    setForm((prev) => ({
      ...prev,
      name: nameVal,
      slug: slugify(nameVal),
    }))
  }

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return

    setLoading(true)
    const supabase = getSupabase()
      const newCat = {
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        description: form.description.trim(),
        menu_group: form.menu_group,
        sort_order: Number(form.sort_order) || 100,
        is_active: true,
        seo_title: form.seo_title.trim() || null,
        seo_description: form.seo_description.trim() || null,
        seo_focus_keyword: form.seo_focus_keyword.trim() || null,
        seo_social_title: form.seo_social_title.trim() || null,
        seo_social_description: form.seo_social_description.trim() || null,
      }

    if (supabase) {
      const { error } = await supabase.from('categories').insert(newCat)
      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setMessage(`Category "${form.name}" created!`)
        setForm({ name: '', slug: '', description: '', menu_group: 'use', sort_order: '100', seo_title: '', seo_description: '', seo_focus_keyword: '', seo_social_title: '', seo_social_description: '' })
        loadCategories()
      }
    } else {
      setCategories((prev) => [...prev, { id: `local-${Date.now()}`, parent_id: null, ...newCat }])
      setMessage(`Category "${form.name}" added locally.`)
      setForm({ name: '', slug: '', description: '', menu_group: 'use', sort_order: '100', seo_title: '', seo_description: '', seo_focus_keyword: '', seo_social_title: '', seo_social_description: '' })
    }
    setLoading(false)
  }

  const toggleActive = async (cat: Category) => {
    const supabase = getSupabase()
    const nextState = !cat.is_active

    if (supabase) {
      await supabase.from('categories').update({ is_active: nextState }).eq('id', cat.id)
      loadCategories()
    } else {
      setCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, is_active: nextState } : c)))
    }
  }

  return (
    <AdminLayout
      title="Product Categories"
      subtitle="Manage laptop categories and navigation mega menu groups"
    >
      {message && (
        <div className="mb-4 rounded-lg border border-teal/30 bg-mint/50 p-3 text-xs font-bold text-tealdeep">
          {message}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Categories List */}
        <div className="overflow-hidden rounded-xl border border-line bg-card shadow-xs">
          <div className="border-b border-line bg-mist px-5 py-3">
            <h2 className="font-display text-sm font-bold text-ink">Active Categories</h2>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line text-[11px] font-extrabold uppercase text-muted">
              <tr>
                <th className="px-5 py-3">Name & Slug</th>
                <th className="px-4 py-3">Menu Group</th>
                <th className="px-4 py-3">Sort Order</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-mist/40">
                  <td className="px-5 py-3">
                    <p className="font-bold text-ink">{c.name}</p>
                    <p className="text-[11px] text-muted">{c.slug}</p>
                  </td>
                  <td className="px-4 py-3 uppercase text-[11px] font-bold text-muted">
                    {c.menu_group}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-ink">{c.sort_order}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                        c.is_active ? 'bg-mint text-tealdeep' : 'bg-mist text-muted'
                      }`}
                    >
                      {c.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => toggleActive(c)}
                      className="text-muted hover:text-teal"
                    >
                      {c.is_active ? (
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

        {/* Create Category Form */}
        <div className="h-fit rounded-xl border border-line bg-card p-6 shadow-xs">
          <h2 className="font-display text-sm font-bold text-ink flex items-center gap-2">
            <Layers className="h-4 w-4 text-teal" /> Add New Category
          </h2>

          <form onSubmit={handleCreate} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-muted">Category Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Ultrabooks"
                className="input mt-1.5 w-full text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted">URL Slug *</label>
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="ultrabooks"
                className="input mt-1.5 w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted">Menu Group *</label>
              <select
                value={form.menu_group}
                onChange={(e) => setForm({ ...form, menu_group: e.target.value })}
                className="input mt-1.5 w-full text-xs font-bold"
              >
                <option value="laptops">Laptops</option>
                <option value="use">Shop by Use (Business, Gaming, Student)</option>
                <option value="accessories">Computer Accessories</option>
              </select>
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

            <div>
              <label className="block text-xs font-bold text-muted">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief category summary"
                className="input mt-1.5 w-full text-xs"
              />
            </div>

            <div className="border-t border-line pt-4">
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-muted mb-3">SEO Settings</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-muted">SEO Title</label>
                  <input
                    type="text"
                    value={form.seo_title}
                    onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
                    placeholder="SEO title (max 60 chars)"
                    className="input mt-1.5 w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted">SEO Description</label>
                  <input
                    type="text"
                    value={form.seo_description}
                    onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
                    placeholder="Meta description (max 160 chars)"
                    className="input mt-1.5 w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted">Focus Keyword</label>
                  <input
                    type="text"
                    value={form.seo_focus_keyword}
                    onChange={(e) => setForm({ ...form, seo_focus_keyword: e.target.value })}
                    placeholder="laptops Kenya"
                    className="input mt-1.5 w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted">Social Title</label>
                  <input
                    type="text"
                    value={form.seo_social_title}
                    onChange={(e) => setForm({ ...form, seo_social_title: e.target.value })}
                    placeholder="Open Graph title"
                    className="input mt-1.5 w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted">Social Description</label>
                  <input
                    type="text"
                    value={form.seo_social_description}
                    onChange={(e) => setForm({ ...form, seo_social_description: e.target.value })}
                    placeholder="Open Graph description"
                    className="input mt-1.5 w-full text-xs"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-emerald w-full !h-10 text-xs font-bold shadow-xs disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> Create Category
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  )
}

