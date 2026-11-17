import { supabaseConfigured } from '@/lib/supabase'

export default function SetupNotice() {
  if (supabaseConfigured()) return null
  return (
    <div className="bg-amber/20 text-ink">
      <p className="wrap py-2 text-sm font-semibold">
        The shop database is not connected. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then apply supabase/migrations.
      </p>
    </div>
  )
}
