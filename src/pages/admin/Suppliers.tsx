import { FormEvent, useEffect, useState } from 'react'
import AdminLayout from './AdminLayout'
import { getSupabase } from '@/lib/supabase'
import { Building2, Plus, Phone, MapPin, Star, ShieldCheck, CheckCircle2 } from 'lucide-react'

export default function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState<any[]>([
    {
      id: 'sup-1',
      name: 'Nairobi Tech Hub Distro',
      shop_name: 'Apex Wholesale Nairobi',
      contact_person: 'David Mwangi',
      phone: '+254 722 112 233',
      email: 'sales@apexwholesale.co.ke',
      physical_location: 'Tom Mboya Street, Nairobi CBD',
      nairobi_area: 'CBD',
      supplier_type: 'wholesale_distributor',
      reliability_rating: 5,
      verification_status: 'verified',
      notes: 'Direct importer of certified refurbished ThinkPad and Latitude laptops.',
    },
    {
      id: 'sup-2',
      name: 'Moi Avenue Gaming Imports',
      shop_name: 'Silicon Rift Supplies',
      contact_person: 'Beatrice Njeri',
      phone: '+254 733 445 566',
      email: 'beatrice@siliconrift.ke',
      physical_location: 'Moi Avenue, Digital Mall 2nd Floor',
      nairobi_area: 'CBD',
      supplier_type: 'retail_partner',
      reliability_rating: 4,
      verification_status: 'verified',
      notes: 'Specializes in high-refresh monitors, NVMe SSDs, and gaming laptops.',
    },
  ])

  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    shop_name: '',
    contact_person: '',
    phone: '',
    email: '',
    physical_location: '',
    nairobi_area: 'CBD',
    supplier_type: 'wholesale_distributor',
    reliability_rating: '5',
    notes: '',
  })

  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const loadSuppliers = async () => {
    const supabase = getSupabase()
    if (!supabase) return
    const { data } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false })
    if (data && data.length > 0) setSuppliers(data)
  }

  useEffect(() => {
    loadSuppliers()
  }, [])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return

    setLoading(true)
    const supabase = getSupabase()
    const newRecord = {
      name: form.name.trim(),
      shop_name: form.shop_name.trim(),
      contact_person: form.contact_person.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      physical_location: form.physical_location.trim(),
      nairobi_area: form.nairobi_area,
      supplier_type: form.supplier_type,
      reliability_rating: Number(form.reliability_rating) || 5,
      verification_status: 'verified',
      notes: form.notes,
    }

    if (supabase) {
      const { error } = await supabase.from('suppliers').insert(newRecord)
      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setMessage(`Supplier "${form.name}" registered successfully!`)
        setFormOpen(false)
        loadSuppliers()
      }
    } else {
      setSuppliers((prev) => [{ id: `sup-${Date.now()}`, ...newRecord }, ...prev])
      setMessage(`Supplier "${form.name}" registered locally.`)
      setFormOpen(false)
    }
    setLoading(false)
  }

  return (
    <AdminLayout
      title="Hardware Suppliers Directory"
      subtitle="Confidential supplier directory, Nairobi locations, and reliability scores (Staff Only)"
      actions={
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="btn btn-emerald !h-9 text-xs font-bold shadow-xs"
        >
          <Plus className="h-4 w-4" /> Register Supplier
        </button>
      }
    >
      {message && (
        <div className="mb-4 rounded-lg border border-teal/30 bg-mint/50 p-3 text-xs font-bold text-tealdeep flex items-center justify-between">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage(null)} className="text-muted hover:text-ink">
            ✕
          </button>
        </div>
      )}

      {/* Registration Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-line bg-card p-6 shadow-xl">
            <h3 className="font-display text-base font-bold text-ink">Register Hardware Supplier</h3>
            <p className="mt-1 text-xs text-muted">
              Add contact person and Nairobi physical shop details for laptop sourcing.
            </p>

            <form onSubmit={handleCreate} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-muted">Supplier Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Nairobi Micro Supplies"
                    className="input mt-1.5 w-full text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-muted">Shop / Building Name</label>
                  <input
                    type="text"
                    value={form.shop_name}
                    onChange={(e) => setForm({ ...form, shop_name: e.target.value })}
                    placeholder="e.g. Digital Plaza Shop 12"
                    className="input mt-1.5 w-full text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-muted">Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={form.contact_person}
                    onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                    placeholder="e.g. Joseph Kariuki"
                    className="input mt-1.5 w-full text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-muted">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+254 7..."
                    className="input mt-1.5 w-full text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-muted">Nairobi Area / Quarter</label>
                  <select
                    value={form.nairobi_area}
                    onChange={(e) => setForm({ ...form, nairobi_area: e.target.value })}
                    className="input mt-1.5 w-full text-xs font-semibold"
                  >
                    <option value="CBD">Nairobi CBD (Tom Mboya, Moi Ave)</option>
                    <option value="Westlands">Westlands</option>
                    <option value="Industrial Area">Industrial Area</option>
                    <option value="Eastleigh">Eastleigh</option>
                    <option value="Upper Hill">Upper Hill</option>
                    <option value="Other">Other Nairobi Area</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-muted">Reliability Rating</label>
                  <select
                    value={form.reliability_rating}
                    onChange={(e) => setForm({ ...form, reliability_rating: e.target.value })}
                    className="input mt-1.5 w-full text-xs font-semibold"
                  >
                    <option value="5">⭐⭐⭐⭐⭐ Excellent (5/5)</option>
                    <option value="4">⭐⭐⭐⭐ Good (4/5)</option>
                    <option value="3">⭐⭐⭐ Average (3/5)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-muted">Physical Address / Landmark</label>
                <input
                  type="text"
                  value={form.physical_location}
                  onChange={(e) => setForm({ ...form, physical_location: e.target.value })}
                  placeholder="e.g. Ground Floor, Stall G-04, Moi Avenue"
                  className="input mt-1.5 w-full text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-muted">Internal Sourcing Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Stock payment terms, discount margins, warranty honoring history."
                  className="input mt-1.5 w-full py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-line pt-4">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="btn btn-outline !h-9 text-xs font-bold"
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn btn-emerald !h-9 text-xs font-bold shadow-xs">
                  Register Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suppliers Table */}
      <div className="overflow-hidden rounded-xl border border-line bg-card shadow-xs">
        <div className="border-b border-line bg-mist px-5 py-3">
          <h2 className="font-display text-sm font-bold text-ink">Verified Suppliers ({suppliers.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line text-[11px] font-extrabold uppercase text-muted">
              <tr>
                <th className="px-5 py-3">Supplier & Shop</th>
                <th className="px-4 py-3">Contact Person & Phone</th>
                <th className="px-4 py-3">Location (Nairobi)</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-mist/30">
                  <td className="px-5 py-3">
                    <p className="font-bold text-ink">{s.name}</p>
                    <p className="text-[11px] text-muted">{s.shop_name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{s.contact_person}</p>
                    <p className="text-[11px] font-mono text-teal">{s.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    <p className="font-semibold text-ink">{s.nairobi_area}</p>
                    <p className="text-[11px] text-muted truncate max-w-xs">{s.physical_location}</p>
                  </td>
                  <td className="px-4 py-3 font-bold text-amberdeep">
                    {'★'.repeat(s.reliability_rating || 5)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-mint px-2 py-0.5 text-[10px] font-extrabold uppercase text-tealdeep">
                      {s.verification_status || 'Verified'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}

