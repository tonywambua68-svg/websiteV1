import { create } from 'zustand'
import { getSupabase } from '@/lib/supabase'
import type { PublicSettings } from '@/lib/domain'

const fallback: PublicSettings = {
  business_name: 'OREMITECH',
  tagline: 'Verified laptops and computer accessories in Kenya',
  currency: 'KES',
  timezone: 'Africa/Nairobi',
  whatsapp_e164: '',
  store_email: '',
  store_location: '',
  ga_measurement_id: '',
  gsc_verification: '',
}

interface SettingsState {
  settings: PublicSettings
  loaded: boolean
  load: () => Promise<void>
  setSettings: (settings: PublicSettings) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: fallback,
  loaded: false,
  setSettings: (settings) => set({ settings: { ...fallback, ...settings }, loaded: true }),
  load: async () => {
    const supabase = getSupabase()
    if (!supabase) {
      set({ loaded: true })
      return
    }
    const { data, error } = await supabase.rpc('public_business_settings')
    if (error || !data) {
      set({ loaded: true })
      return
    }
    set({ settings: { ...fallback, ...(data as PublicSettings) }, loaded: true })
  },
}))
