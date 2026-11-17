import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { getSupabase } from '@/lib/supabase'
import Logo from '@/components/Logo'
import Guard from '@/components/Guard'
import {
  CheckSquare,
  Clock,
  LogOut,
  Compass,
  Boxes,
  ShoppingCart,
  Plus,
  Shield,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'

export default function EmployeeLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const [tasks, setTasks] = useState<any[]>([
    {
      id: 'tsk-1',
      title: 'Conduct physical battery & display test on 3 HP EliteBook 840 G8 units',
      description: 'Check display for dead pixels, run battery health command, test webcam and audio.',
      status: 'pending',
      due_date: '2026-11-20',
      created_at: new Date().toISOString(),
    },
    {
      id: 'tsk-2',
      title: 'Update supplier catalog prices for Tom Mboya Street wholesale partner',
      description: 'Confirm current pricing on 16GB DDR4 and 512GB NVMe drives.',
      status: 'completed',
      due_date: '2026-11-17',
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ])

  const [discoveryOpen, setDiscoveryOpen] = useState(false)
  const [discoveryForm, setDiscoveryForm] = useState({
    title: '',
    source: '',
    advertised_price: '',
    notes: '',
  })

  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const loadTasks = async () => {
    const supabase = getSupabase()
    if (!supabase || !user?.id) return
    const { data } = await supabase
      .from('employee_tasks')
      .select('*')
      .or(`assigned_to.eq.${user.id},assigned_to.is.null`)
      .order('created_at', { ascending: false })
    if (data && data.length > 0) setTasks(data)
  }

  useEffect(() => {
    loadTasks()
  }, [user])

  const toggleTaskStatus = async (task: any) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed'
    const supabase = getSupabase()

    if (supabase) {
      await supabase.from('employee_tasks').update({ status: nextStatus }).eq('id', task.id)
      loadTasks()
    } else {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)))
    }
    setMessage(`Task marked as ${nextStatus}!`)
  }

  const handleLogDiscovery = async (e: FormEvent) => {
    e.preventDefault()
    if (!discoveryForm.title.trim()) return

    setLoading(true)
    const supabase = getSupabase()
    const record = {
      title: discoveryForm.title.trim(),
      source: discoveryForm.source.trim() || 'Staff Field Research',
      advertised_price: Number(discoveryForm.advertised_price) || 0,
      status: 'NEEDS_PHYSICAL_VERIFICATION',
      notes: `${discoveryForm.notes} (Submitted by staff: ${user?.full_name})`,
    }

    if (supabase) {
      const { error } = await supabase.from('research_listings').insert(record)
      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setMessage('Research listing logged for physical verification!')
        setDiscoveryOpen(false)
        setDiscoveryForm({ title: '', source: '', advertised_price: '', notes: '' })
      }
    } else {
      setMessage('Listing submitted for verification queue.')
      setDiscoveryOpen(false)
      setDiscoveryForm({ title: '', source: '', advertised_price: '', notes: '' })
    }
    setLoading(false)
  }

  return (
    <Guard roles={['owner', 'manager', 'product_researcher', 'inventory_assistant', 'sales_assistant']}>
      <div className="min-h-screen bg-mist text-ink">
        {/* Employee Header */}
        <header className="sticky top-0 z-30 border-b border-line bg-card/95 px-6 py-3.5 backdrop-blur">
          <div className="wrap flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo compact />
              <span className="rounded-full bg-teal/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-teal">
                Staff Portal
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="text-right hidden sm:block">
                <p className="font-bold text-ink">{user?.full_name}</p>
                <p className="text-[10px] uppercase font-extrabold text-teal">
                  Role: {user?.role?.replace(/_/g, ' ')}
                </p>
              </div>

              {(user?.role === 'owner' || user?.role === 'manager') && (
                <Link to="/admin" className="btn btn-emerald !h-8 text-xs font-bold">
                  Owner Dashboard
                </Link>
              )}

              <button
                type="button"
                onClick={() => logout().then(() => navigate('/login'))}
                className="btn btn-outline !h-8 px-2.5 text-xs font-bold"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="wrap py-8">
          {message && (
            <div className="mb-6 rounded-lg border border-teal/30 bg-mint/50 p-3 text-xs font-bold text-tealdeep flex items-center justify-between">
              <span>{message}</span>
              <button type="button" onClick={() => setMessage(null)} className="text-muted hover:text-ink">
                ✕
              </button>
            </div>
          )}

          {/* Role Status & Quick Action Banner */}
          <div className="rounded-2xl border border-line bg-card p-6 shadow-xs">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="font-display text-xl font-bold text-ink">
                  Welcome, {user?.full_name?.split(' ')[0] || 'Staff Member'}
                </h1>
                <p className="mt-1 text-xs text-muted">
                  Assigned permissions: <span className="font-bold text-teal capitalize">{user?.role?.replace(/_/g, ' ')}</span> · Physical inspection and quality control workspace
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setDiscoveryOpen(true)}
                  className="btn btn-emerald !h-9 text-xs font-bold shadow-xs"
                >
                  <Plus className="h-4 w-4" /> Submit Discovered Listing
                </button>
                <Link to="/" target="_blank" className="btn btn-outline !h-9 text-xs font-bold">
                  <ExternalLink className="h-3.5 w-3.5" /> View Storefront
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Discovered Listing Modal */}
          {discoveryOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
              <div className="w-full max-w-md rounded-2xl border border-line bg-card p-6 shadow-xl">
                <h3 className="font-display text-base font-bold text-ink">Submit Laptop Sourcing Lead</h3>
                <p className="mt-1 text-xs text-muted">
                  Log a discovered laptop model found in the market. The item will be placed in the physical verification queue.
                </p>

                <form onSubmit={handleLogDiscovery} className="mt-4 space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-muted">Product / Model Name *</label>
                    <input
                      type="text"
                      required
                      value={discoveryForm.title}
                      onChange={(e) => setDiscoveryForm({ ...discoveryForm, title: e.target.value })}
                      placeholder="e.g. ThinkPad X1 Carbon Gen 8 Core i7"
                      className="input mt-1.5 w-full text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-muted">Supplier / Location Shop</label>
                    <input
                      type="text"
                      value={discoveryForm.source}
                      onChange={(e) => setDiscoveryForm({ ...discoveryForm, source: e.target.value })}
                      placeholder="e.g. Stall B12, Nairobi CBD"
                      className="input mt-1.5 w-full text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-muted">Advertised Price (KSh) *</label>
                    <input
                      type="number"
                      required
                      value={discoveryForm.advertised_price}
                      onChange={(e) => setDiscoveryForm({ ...discoveryForm, advertised_price: e.target.value })}
                      placeholder="65000"
                      className="input mt-1.5 w-full text-xs font-bold text-teal"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-muted">Specifications & Initial Inspection Notes</label>
                    <textarea
                      rows={3}
                      value={discoveryForm.notes}
                      onChange={(e) => setDiscoveryForm({ ...discoveryForm, notes: e.target.value })}
                      placeholder="RAM, storage, cosmetic condition, charger present."
                      className="input mt-1.5 w-full py-2 text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 border-t border-line pt-4">
                    <button
                      type="button"
                      onClick={() => setDiscoveryOpen(false)}
                      className="btn btn-outline !h-9 text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button type="submit" disabled={loading} className="btn btn-emerald !h-9 text-xs font-bold shadow-xs">
                      Submit Lead
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Assigned Tasks Grid */}
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
            {/* Left: Delegated Tasks */}
            <div className="rounded-xl border border-line bg-card p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <h2 className="font-display text-base font-bold text-ink flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-teal" /> Your Assigned Tasks ({tasks.length})
                </h2>
                <span className="text-xs text-muted">Tap checkmark to toggle status</span>
              </div>

              <div className="mt-4 space-y-3">
                {tasks.map((task) => {
                  const completed = task.status === 'completed'
                  return (
                    <div
                      key={task.id}
                      className={`flex items-start gap-3 rounded-xl border p-4 transition ${
                        completed ? 'border-line/60 bg-mist/40 opacity-70' : 'border-line bg-card shadow-xs'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleTaskStatus(task)}
                        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border transition ${
                          completed ? 'border-teal bg-teal text-white' : 'border-muted hover:border-teal'
                        }`}
                        aria-label="Toggle task completed"
                      >
                        {completed && <CheckCircle2 className="h-4 w-4" />}
                      </button>

                      <div className="min-w-0 flex-1 text-xs">
                        <p className={`font-bold ${completed ? 'line-through text-muted' : 'text-ink'}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="mt-1 text-[11px] text-muted leading-relaxed">{task.description}</p>
                        )}
                        <div className="mt-2 flex items-center gap-3 text-[10px] text-muted">
                          {task.due_date && <span>Target: {task.due_date}</span>}
                          <span className={`font-extrabold uppercase ${completed ? 'text-teal' : 'text-amberdeep'}`}>
                            {task.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right: Operational Guidelines & Responsibilities */}
            <div className="space-y-6">
              <div className="rounded-xl border border-line bg-card p-6 shadow-xs text-xs">
                <h3 className="font-display text-sm font-bold text-ink flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-teal" /> Standard Verification Rules
                </h3>
                <ul className="mt-3 space-y-2 text-muted leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-teal">1.</span>
                    <span>Never confirm supplier stock without testing physical power and ports in person.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-teal">2.</span>
                    <span>Verify screen for dead pixels and keyboard key functionality using test software.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-teal">3.</span>
                    <span>Products remain in Draft/Verification status until the business owner approves publication.</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-xl border border-line bg-card p-6 shadow-xs text-xs">
                <h3 className="font-display text-sm font-bold text-ink">Support & Dispatch Desk</h3>
                <p className="mt-1 text-muted">
                  For Nairobi field logistics, contact the logistics coordinator via official team WhatsApp.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </Guard>
  )
}

