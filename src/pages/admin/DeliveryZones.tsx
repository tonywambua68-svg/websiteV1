import { FormEvent, useEffect, useState } from 'react'
import AdminLayout from './AdminLayout'
import { getSupabase } from '@/lib/supabase'
import type { DeliveryZone, DeliveryRate } from '@/lib/domain'
import { Plus, Layers, ToggleLeft, ToggleRight, Trash2, MapPin } from 'lucide-react'

type EditMode = 'zone' | 'rate'

function parseEntries(value: string): string[] {
  const seen = new Set<string>()
  return value.split(/[\n,]+/).map((entry) => entry.trim().replace(/\s+/g, ' ')).filter((entry) => {
    const key = entry.toLocaleLowerCase('en')
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export default function AdminDeliveryZones() {
  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [rates, setRates] = useState<DeliveryRate[]>([])
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null)
  const [editingRateId, setEditingRateId] = useState<string | null>(null)

  const [zoneForm, setZoneForm] = useState({
    name: '',
    counties: '',
    towns: '',
    is_active: true,
  })

  const [rateForm, setRateForm] = useState({
    min_order: '',
    max_order: '',
    rate_kes: '',
    cod_eligible: false,
    is_active: true,
  })

  const [loading, setLoading] = useState(false)
  const [savingZone, setSavingZone] = useState(false)
  const [savingRate, setSavingRate] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [mode, setMode] = useState<EditMode>('zone')

  const loadZones = async () => {
    const supabase = getSupabase()
    if (!supabase) {
      setMessage('Delivery zones cannot be loaded because the store database is not configured.')
      return
    }
    setLoading(true)
    const { data, error } = await supabase.from('delivery_zones').select('*').order('name')
    if (error) setMessage('Could not load delivery zones. Check the database connection and permissions.')
    else if (data) setZones(data as DeliveryZone[])
    setLoading(false)
  }

  const loadRates = async (zoneId: string) => {
    const supabase = getSupabase()
    if (!supabase) return
    setLoading(true)
    const { data, error } = await supabase.from('delivery_rates').select('*').eq('zone_id', zoneId).order('min_order')
    if (error) setMessage('Could not load rates for this zone. Check the database connection and permissions.')
    else if (data) setRates(data as DeliveryRate[])
    setLoading(false)
  }

  useEffect(() => {
    loadZones()
  }, [])

  const handleZoneCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!zoneForm.name.trim()) return

    setSavingZone(true)
    const supabase = getSupabase()
    const newZone = {
      name: zoneForm.name.trim(),
      counties: parseEntries(zoneForm.counties),
      towns: parseEntries(zoneForm.towns),
      is_active: zoneForm.is_active,
    }

    if (supabase) {
      const result = selectedZone
        ? await supabase.from('delivery_zones').update(newZone).eq('id', selectedZone.id)
        : await supabase.from('delivery_zones').insert(newZone)
      const { error } = result
      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setMessage(`Delivery zone "${zoneForm.name}" ${selectedZone ? 'updated' : 'created'}.`)
        await loadZones()
        if (selectedZone) {
          const updatedZone = { ...selectedZone, ...newZone }
          setSelectedZone(updatedZone)
        } else {
          setZoneForm({ name: '', counties: '', towns: '', is_active: true })
        }
      }
    } else {
      setMessage('Delivery zones cannot be saved because the store database is not configured.')
    }
    setSavingZone(false)
  }

  const toggleZoneActive = async (zone: DeliveryZone) => {
    const supabase = getSupabase()
    const nextState = !zone.is_active
    if (supabase) {
      const { error } = await supabase.from('delivery_zones').update({ is_active: nextState }).eq('id', zone.id)
      if (error) setMessage('Could not update this delivery zone.')
      else await loadZones()
    }
  }

  const selectZone = (zone: DeliveryZone | null) => {
    setSelectedZone(zone)
    setRates([])
    setZoneForm(zone ? {
      name: zone.name,
      counties: zone.counties.join(', '),
      towns: zone.towns.join(', '),
      is_active: zone.is_active,
    } : { name: '', counties: '', towns: '', is_active: true })
    if (zone) loadRates(zone.id)
    setEditingRateId(null)
    setRateForm({ min_order: '', max_order: '', rate_kes: '', cod_eligible: false, is_active: true })
    setMode('zone')
  }

  const handleRateCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedZone) return

    const minOrder = Number(rateForm.min_order)
    const maxOrder = rateForm.max_order.trim() ? Number(rateForm.max_order) : null
    const rateKes = Number(rateForm.rate_kes)
    if (!Number.isFinite(minOrder) || minOrder < 0 || (maxOrder !== null && (!Number.isFinite(maxOrder) || maxOrder < minOrder)) || !Number.isFinite(rateKes) || rateKes < 0) {
      setMessage('Enter a valid non-negative order range and delivery fee. Maximum order must be at least the minimum.')
      return
    }

    setSavingRate(true)
    const supabase = getSupabase()
    const newRate = {
      zone_id: selectedZone.id,
      min_order: minOrder,
      max_order: maxOrder,
      rate_kes: rateKes,
      cod_eligible: rateForm.cod_eligible,
      is_active: rateForm.is_active,
    }

    if (supabase) {
      const result = editingRateId
        ? await supabase.from('delivery_rates').update(newRate).eq('id', editingRateId)
        : await supabase.from('delivery_rates').insert(newRate)
      const { error } = result
      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setMessage(`Rate ${editingRateId ? 'updated' : 'added'} for "${selectedZone.name}".`)
        setEditingRateId(null)
        setRateForm({ min_order: '', max_order: '', rate_kes: '', cod_eligible: false, is_active: true })
        if (selectedZone) loadRates(selectedZone.id)
      }
    } else {
      setMessage('Delivery rates cannot be saved because the store database is not configured.')
    }
    setSavingRate(false)
  }

  const toggleRateActive = async (rate: DeliveryRate) => {
    const supabase = getSupabase()
    const nextState = !rate.is_active
    if (supabase) {
      const { error } = await supabase.from('delivery_rates').update({ is_active: nextState }).eq('id', rate.id)
      if (error) setMessage('Could not update this delivery rate.')
      else if (selectedZone) loadRates(selectedZone.id)
    }
  }

  const deleteRate = async (rate: DeliveryRate) => {
    if (!window.confirm('Delete this delivery rate?')) return
    const supabase = getSupabase()
    if (supabase) {
      const { error } = await supabase.from('delivery_rates').delete().eq('id', rate.id)
      if (error) setMessage('Could not delete this delivery rate.')
      else if (selectedZone) loadRates(selectedZone.id)
    }
  }

  const hasOverlappingCoverage = zones.some((zone, index) => zones.slice(index + 1).some((other) =>
    zone.is_active && other.is_active && zone.counties.some((county) =>
      other.counties.some((otherCounty) => otherCounty.trim().toLocaleLowerCase('en') === county.trim().toLocaleLowerCase('en'))
      && zone.towns.some((town) => other.towns.some((otherTown) => otherTown.trim().toLocaleLowerCase('en') === town.trim().toLocaleLowerCase('en')))
    )
  ))
  const hasOverlappingRates = rates.some((rate, index) => rates.slice(index + 1).some((other) =>
    rate.is_active && other.is_active && Number(rate.min_order) <= (other.max_order ?? Infinity)
      && Number(other.min_order) <= (rate.max_order ?? Infinity)
  ))

  return (
    <AdminLayout title="Delivery Zones & Rates" subtitle="Configure delivery coverage areas and pricing">
      {message && (
        <div className="mb-4 rounded-lg border border-teal/30 bg-mint/50 p-3 text-xs font-bold text-tealdeep">
          {message}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
        {/* Zones List */}
        <div className="overflow-hidden rounded-xl border border-line bg-card shadow-xs">
          <div className="flex items-center justify-between border-b border-line bg-mist px-5 py-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-tealdeep" />
              <h2 className="font-display text-sm font-bold text-ink">Delivery Zones</h2>
            </div>
            <button type="button" onClick={() => selectZone(null)} className="text-xs font-bold text-teal hover:underline">New Zone</button>
          </div>
          {hasOverlappingCoverage && <p className="border-b border-amber/30 bg-amber/5 px-5 py-3 text-xs text-amberdeep">Active zones overlap on county and town coverage. Checkout will refuse ambiguous matches until an administrator resolves the coverage.</p>}
          {loading && <p className="border-b border-line px-5 py-2 text-xs text-muted">Loading delivery configuration…</p>}
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line text-[11px] font-extrabold uppercase text-muted">
              <tr>
                <th className="px-5 py-3">Zone Name</th>
                <th className="px-4 py-3">Counties</th>
                <th className="px-4 py-3">Towns</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {zones.map((z) => (
                <tr
                  key={z.id}
                  className={`hover:bg-mist/40 cursor-pointer ${selectedZone?.id === z.id ? 'bg-emerald/10 border-l-2 border-emerald' : ''}`}
                  onClick={() => selectZone(z)}
                >
                  <td className="px-5 py-3">
                    <p className="font-bold text-ink">{z.name}</p>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-muted">{z.counties.join(', ') || '—'}</td>
                  <td className="px-4 py-3 text-[11px] text-muted">{z.towns.join(', ') || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                        z.is_active ? 'bg-mint text-tealdeep' : 'bg-mist text-muted'
                      }`}
                    >
                      {z.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right flex gap-1">
                    <button type="button" onClick={(event) => { event.stopPropagation(); selectZone(z) }} className="text-xs font-bold text-teal hover:underline">Edit</button>
                    <button
                      type="button"
                      onClick={() => toggleZoneActive(z)}
                      className="text-muted hover:text-teal"
                      aria-label={z.is_active ? 'Disable zone' : 'Enable zone'}
                    >
                      {z.is_active ? (
                        <ToggleRight className="h-5 w-5 text-teal" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-muted" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Create / Edit Zone Form */}
        <div className="h-fit rounded-xl border border-line bg-card p-6 shadow-xs">
          <h2 className="font-display text-sm font-bold text-ink flex items-center gap-2 mb-4">
            <Layers className="h-4 w-4 text-teal" /> {selectedZone ? `Edit: ${selectedZone.name}` : 'Add New Delivery Zone'}
          </h2>

          <form onSubmit={handleZoneCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-muted">Zone Name *</label>
              <input
                type="text"
                required
                value={zoneForm.name}
                onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                placeholder="e.g. Nairobi Metro"
                className="input mt-1.5 w-full text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted">Counties (one per line or comma-separated) *</label>
              <input
                type="text"
                required
                value={zoneForm.counties}
                onChange={(e) => setZoneForm({ ...zoneForm, counties: e.target.value })}
                placeholder="Nairobi, Kiambu, Kajiado"
                className="input mt-1.5 w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted">Towns (one per line or comma-separated) *</label>
              <input
                type="text"
                value={zoneForm.towns}
                onChange={(e) => setZoneForm({ ...zoneForm, towns: e.target.value })}
                placeholder="Westlands, Karen, Thika"
                className="input mt-1.5 w-full text-xs"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={zoneForm.is_active}
                onChange={(e) => setZoneForm({ ...zoneForm, is_active: e.target.checked })}
                className="rounded border-input bg-background text-emerald focus:ring-emerald"
              />
              <label className="text-xs font-bold text-muted cursor-pointer">Active zone</label>
            </div>

            <button
              type="submit"
              disabled={savingZone}
              className="btn btn-emerald w-full !h-10 text-xs font-bold shadow-xs disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> {selectedZone ? 'Update Zone' : 'Create Zone'}
            </button>
          </form>
        </div>

        {/* Rates Section (when a zone is selected) */}
        {selectedZone && (
          <div className="col-span-2 overflow-hidden rounded-xl border border-line bg-card shadow-xs">
            <div className="flex items-center justify-between border-b border-line bg-mist px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="rounded bg-mint/10 px-2 py-0.5 text-[10px] font-extrabold uppercase text-emerald">
                  {selectedZone.name}
                </div>
                <h2 className="font-display text-sm font-bold text-ink">Delivery Rates</h2>
              </div>
              <button
                type="button"
                onClick={() => setMode('rate')}
                className="text-xs font-bold text-emerald hover:underline"
              >
                Add Rate
              </button>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line text-[11px] font-extrabold uppercase text-muted">
                <tr>
                  <th className="px-5 py-3">Order Range (KSh)</th>
                  <th className="px-4 py-3">Delivery Fee</th>
                  <th className="px-4 py-3">COD</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rates.map((r) => (
                  <tr key={r.id} className="hover:bg-mist/40">
                    <td className="px-5 py-3 font-mono font-bold text-ink">
                      KSh {r.min_order.toLocaleString()}
                      {r.max_order !== null ? ` – KSh ${r.max_order.toLocaleString()}` : ' +'}
                    </td>
                    <td className="px-4 py-3 font-bold text-ink">KSh {Number(r.rate_kes).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                          r.cod_eligible ? 'bg-mint text-tealdeep' : 'bg-mist text-muted'
                        }`}
                      >
                        {r.cod_eligible ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                          r.is_active ? 'bg-mint text-tealdeep' : 'bg-mist text-muted'
                        }`}
                      >
                        {r.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right flex gap-1">
                      <button type="button" onClick={() => {
                        setEditingRateId(r.id)
                        setRateForm({ min_order: String(r.min_order), max_order: r.max_order === null ? '' : String(r.max_order), rate_kes: String(r.rate_kes), cod_eligible: r.cod_eligible, is_active: r.is_active })
                      }} className="text-xs font-bold text-teal hover:underline">Edit</button>
                      <button
                        type="button"
                        onClick={() => toggleRateActive(r)}
                        className="text-muted hover:text-teal"
                        aria-label={r.is_active ? 'Disable rate' : 'Enable rate'}
                      >
                        {r.is_active ? (
                          <ToggleRight className="h-5 w-5 text-teal" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-muted" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteRate(r)}
                        className="text-muted hover:text-error"
                        aria-label="Delete rate"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {rates.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-muted text-[12px]">
                      No rates configured. Add a rate to enable delivery fee calculation for this zone.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {hasOverlappingRates && <p className="border-t border-amber/30 bg-amber/5 px-5 py-3 text-xs text-amberdeep">Active order ranges overlap. Checkout will refuse orders covered by more than one active rate; edit or deactivate the overlapping rates.</p>}

            <div className="border-t border-line pt-5 px-5 py-4">
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-muted mb-3">{editingRateId ? 'Edit Delivery Rate' : 'Add New Rate'}</h3>
              <form onSubmit={handleRateCreate} className="grid gap-3 sm:grid-cols-4 items-end">
                <div>
                  <label className="block text-[10px] font-bold text-muted mb-1">Min Order</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={rateForm.min_order}
                    onChange={(e) => setRateForm({ ...rateForm, min_order: e.target.value })}
                    placeholder="0"
                    className="input mt-1 w-full text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted mb-1">Max Order</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={rateForm.max_order}
                    onChange={(e) => setRateForm({ ...rateForm, max_order: e.target.value })}
                    placeholder="optional"
                    className="input mt-1 w-full text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted mb-1">Fee (KSh)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={rateForm.rate_kes}
                    onChange={(e) => setRateForm({ ...rateForm, rate_kes: e.target.value })}
                    placeholder="0"
                    className="input mt-1 w-full text-[11px]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rateForm.cod_eligible}
                    onChange={(e) => setRateForm({ ...rateForm, cod_eligible: e.target.checked })}
                    className="rounded border-input bg-background text-emerald focus:ring-emerald"
                  />
                  <label className="text-[10px] font-bold text-muted cursor-pointer">COD</label>
                </div>
                <button
                  type="submit"
                  disabled={savingRate}
                  className="btn btn-emerald !h-9 text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  {editingRateId ? 'Save' : 'Add'}
                </button>
                {editingRateId && (
                  <button type="button" onClick={() => { setEditingRateId(null); setRateForm({ min_order: '', max_order: '', rate_kes: '', cod_eligible: false, is_active: true }) }} className="btn btn-outline !h-9 text-xs">Cancel</button>
                )}
              </form>
            </div>
          </div>
        )}

        {/* Empty state prompt */}
        {!selectedZone && (
          <div className="h-fit rounded-xl border border-line bg-card p-6 shadow-xs flex flex-col items-center gap-3 text-center">
            <MapPin className="h-8 w-8 text-muted" />
            <h3 className="font-display text-sm font-bold text-ink">Select a delivery zone</h3>
            <p className="text-xs text-muted">Click a zone above to manage its delivery rates and COD eligibility.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
