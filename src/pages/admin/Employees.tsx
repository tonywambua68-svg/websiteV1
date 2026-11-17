import { FormEvent, useEffect, useState } from 'react'
import AdminLayout from './AdminLayout'
import { getSupabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { StaffRole } from '@/lib/domain'
import { formatNairobi } from '@/lib/commerce'
import { Users, Plus, Shield, CheckCircle2, UserCheck, AlertCircle, Clock, CheckSquare } from 'lucide-react'

export default function AdminEmployees() {
  const { user } = useAuthStore()
  const isOwner = user?.role === 'owner'

  const [staff, setStaff] = useState<any[]>([
    {
      id: 'emp-1',
      full_name: 'Lead Business Owner',
      email: 'owner@oremitech.co.ke',
      phone: '+254 700 000 001',
      role: 'owner',
      account_status: 'active',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'emp-2',
      full_name: 'Kevin Mutua',
      email: 'kevin.research@oremitech.co.ke',
      phone: '+254 711 223 344',
      role: 'product_researcher',
      account_status: 'active',
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
    {
      id: 'emp-3',
      full_name: 'Mercy Achieng',
      email: 'mercy.inventory@oremitech.co.ke',
      phone: '+254 722 334 455',
      role: 'inventory_assistant',
      account_status: 'active',
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
  ])

  const [tasks, setTasks] = useState<any[]>([
    {
      id: 'tsk-1',
      title: 'Verify 3 HP EliteBook 840 G8 units at CBD Supplier',
      assigned_to_name: 'Kevin Mutua',
      status: 'in_progress',
      due_date: '2026-11-20',
      created_at: new Date().toISOString(),
    },
    {
      id: 'tsk-2',
      title: 'Conduct weekly cycle count on NVMe SSD inventory',
      assigned_to_name: 'Mercy Achieng',
      status: 'completed',
      due_date: '2026-11-16',
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ])

  const [taskModal, setTaskModal] = useState(false)
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assigned_to: '',
    due_date: '',
  })

  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    const supabase = getSupabase()
    if (!supabase) return
    const [profilesRes, tasksRes] = await Promise.all([
      supabase.from('profiles').select('*').in('role', ['owner', 'manager', 'product_researcher', 'inventory_assistant', 'sales_assistant']),
      supabase.from('employee_tasks').select('*').order('created_at', { ascending: false }),
    ])
    if (profilesRes.data && profilesRes.data.length > 0) setStaff(profilesRes.data)
    if (tasksRes.data && tasksRes.data.length > 0) setTasks(tasksRes.data)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateTask = async (e: FormEvent) => {
    e.preventDefault()
    if (!taskForm.title.trim()) return

    setLoading(true)
    const supabase = getSupabase()
    const taskRecord = {
      title: taskForm.title.trim(),
      description: taskForm.description.trim(),
      assigned_to: taskForm.assigned_to || null,
      due_date: taskForm.due_date || null,
      status: 'pending',
    }

    if (supabase) {
      const { error } = await supabase.from('employee_tasks').insert(taskRecord)
      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setMessage('Task assigned successfully!')
        setTaskModal(false)
        loadData()
      }
    } else {
      setTasks((prev) => [
        {
          id: `tsk-${Date.now()}`,
          ...taskRecord,
          assigned_to_name: staff.find((s) => s.id === taskForm.assigned_to)?.full_name || 'Staff',
          created_at: new Date().toISOString(),
        },
        ...prev,
      ])
      setMessage('Task recorded locally.')
      setTaskModal(false)
    }
    setLoading(false)
  }

  const handleToggleStatus = async (staffMember: any) => {
    if (!isOwner) {
      setMessage('Permission Denied: Only the business owner can suspend or activate staff accounts.')
      return
    }

    const next = staffMember.account_status === 'active' ? 'suspended' : 'active'
    const supabase = getSupabase()

    if (supabase) {
      await supabase.from('profiles').update({ account_status: next }).eq('id', staffMember.id)
      loadData()
    } else {
      setStaff((prev) => prev.map((s) => (s.id === staffMember.id ? { ...s, account_status: next } : s)))
    }
    setMessage(`Account for ${staffMember.full_name} is now ${next}.`)
  }

  return (
    <AdminLayout
      title="Staff Accounts & Task Delegations"
      subtitle="Role-based permissions enforcement (Owner, Manager, Researcher, Inventory, Sales)"
      actions={
        <button
          type="button"
          onClick={() => setTaskModal(true)}
          className="btn btn-emerald !h-9 text-xs font-bold shadow-xs"
        >
          <Plus className="h-4 w-4" /> Assign Staff Task
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

      {!isOwner && (
        <div className="mb-6 rounded-xl border border-line bg-card p-4 text-xs font-semibold text-muted flex items-center gap-2">
          <Shield className="h-4 w-4 text-teal" />
          <span>Notice: You are signed in as a Manager. Role elevating and employee terminations require Owner credentials.</span>
        </div>
      )}

      {/* Task Creation Modal */}
      {taskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-line bg-card p-6 shadow-xl">
            <h3 className="font-display text-base font-bold text-ink">Assign Delegation Task</h3>
            <p className="mt-1 text-xs text-muted">
              Delegated tasks appear on the employee's personal dashboard portal.
            </p>

            <form onSubmit={handleCreateTask} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-muted">Task Headline *</label>
                <input
                  type="text"
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. Inspect 5 Dell Latitude 5420 laptops"
                  className="input mt-1.5 w-full text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-muted">Assign To Employee</label>
                <select
                  value={taskForm.assigned_to}
                  onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                  className="input mt-1.5 w-full text-xs font-semibold"
                >
                  <option value="">Unassigned (Open Queue)</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-muted">Target Completion Date</label>
                <input
                  type="date"
                  value={taskForm.due_date}
                  onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                  className="input mt-1.5 w-full text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-muted">Instructions & Checklist</label>
                <textarea
                  rows={3}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Detailed verification requirements, serial numbers, checklist."
                  className="input mt-1.5 w-full py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-line pt-4">
                <button
                  type="button"
                  onClick={() => setTaskModal(false)}
                  className="btn btn-outline !h-9 text-xs font-bold"
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn btn-emerald !h-9 text-xs font-bold shadow-xs">
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Accounts Table */}
      <div className="overflow-hidden rounded-xl border border-line bg-card shadow-xs">
        <div className="border-b border-line bg-mist px-5 py-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-bold text-ink">Staff Accounts ({staff.length})</h2>
          <span className="text-[11px] text-muted">PostgreSQL profiles with auth.users link</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line text-[11px] font-extrabold uppercase text-muted">
              <tr>
                <th className="px-5 py-3">Employee Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {staff.map((s) => (
                <tr key={s.id} className="hover:bg-mist/30">
                  <td className="px-5 py-3">
                    <p className="font-bold text-ink">{s.full_name}</p>
                    <p className="text-[11px] text-muted">{s.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-teal/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-teal">
                      {s.role?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-muted">{s.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                        s.account_status === 'active' ? 'bg-mint text-tealdeep' : 'bg-error/15 text-error'
                      }`}
                    >
                      {s.account_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isOwner && s.role !== 'owner' && (
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(s)}
                        className="text-xs font-bold text-muted hover:text-error"
                      >
                        {s.account_status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delegated Tasks Queue */}
      <div className="mt-8 overflow-hidden rounded-xl border border-line bg-card shadow-xs">
        <div className="border-b border-line bg-mist px-5 py-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-bold text-ink">Delegated Staff Tasks ({tasks.length})</h2>
          <span className="text-[11px] text-muted">Live employee work tracking</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line text-[11px] font-extrabold uppercase text-muted">
              <tr>
                <th className="px-5 py-3">Task Details</th>
                <th className="px-4 py-3">Assignee</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {tasks.map((t) => (
                <tr key={t.id} className="hover:bg-mist/30">
                  <td className="px-5 py-3 font-bold text-ink">{t.title}</td>
                  <td className="px-4 py-3 font-semibold text-muted">{t.assigned_to_name || 'Staff'}</td>
                  <td className="px-4 py-3 text-muted">{t.due_date || 'No deadline'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                        t.status === 'completed' ? 'bg-mint text-tealdeep' : 'bg-amber/15 text-amberdeep'
                      }`}
                    >
                      {t.status?.replace(/_/g, ' ')}
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

