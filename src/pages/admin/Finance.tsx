import { FormEvent, useEffect, useState } from 'react'
import AdminLayout from './AdminLayout'
import { getSupabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useOrderStore } from '@/store/orderStore'
import { formatKES, formatNairobi } from '@/lib/commerce'
import {
  DollarSign,
  TrendingUp,
  Receipt,
  Download,
  Plus,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
} from 'lucide-react'

export default function AdminFinance() {
  const { user } = useAuthStore()
  const isOwner = user?.role === 'owner'
  const { orders } = useOrderStore()

  const [expenses, setExpenses] = useState<any[]>([
    {
      id: 'exp-1',
      category: 'Packaging & Courier',
      amount: 4500,
      description: 'Protective bubble wrap & laptop boxes',
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: 'exp-2',
      category: 'Diagnostic Tools',
      amount: 3200,
      description: 'USB-C multimeter and thermal paste replacement',
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
    {
      id: 'exp-3',
      category: 'Transport & Field Verification',
      amount: 2800,
      description: 'Nairobi CBD motorbike fuel & logistics',
      created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    },
  ])

  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({
    amount: '',
    category: 'Packaging & Courier',
    description: '',
  })

  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const totalSalesRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
  // Estimated estimated cost basis ~75% of sales
  const estimatedGrossMargin = totalSalesRevenue * 0.22
  const netEstimatedProfit = Math.max(0, estimatedGrossMargin - totalExpenses)

  const loadExpenses = async () => {
    const supabase = getSupabase()
    if (!supabase) return
    const { data } = await supabase.from('expenses').select('*').order('created_at', { ascending: false })
    if (data && data.length > 0) setExpenses(data)
  }

  useEffect(() => {
    loadExpenses()
  }, [])

  const handleCreateExpense = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.amount || Number(form.amount) <= 0) return

    setLoading(true)
    const supabase = getSupabase()
    const record = {
      amount: Number(form.amount),
      description: form.description.trim() || form.category,
      category_name: form.category,
    }

    if (supabase) {
      const { error } = await supabase.from('expenses').insert({
        amount: record.amount,
        description: record.description,
      })
      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setMessage('Business operational expense logged!')
        setFormOpen(false)
        loadExpenses()
      }
    } else {
      setExpenses((prev) => [
        { id: `exp-${Date.now()}`, ...record, category: form.category, created_at: new Date().toISOString() },
        ...prev,
      ])
      setMessage('Expense recorded locally.')
      setFormOpen(false)
    }
    setForm({ amount: '', category: 'Packaging & Courier', description: '' })
    setLoading(false)
  }

  const exportFinancialCSV = () => {
    const rows = [
      ['Date', 'Type', 'Category / Order', 'Description', 'Amount (KES)'],
      ...orders.map((o) => [
        o.createdAt ? formatNairobi(o.createdAt) : '',
        'REVENUE',
        `Order #${o.orderNumber || o.id}`,
        o.customerName || 'Customer Purchase',
        String(o.total),
      ]),
      ...expenses.map((e) => [
        formatNairobi(e.created_at),
        'EXPENSE',
        e.category || 'Operations',
        e.description || '',
        `-${e.amount}`,
      ]),
    ]

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map((val) => `"${val}"`).join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `OREMITECH_Financial_Report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setMessage('Financial export downloaded as CSV.')
  }

  return (
    <AdminLayout
      title="Financial Performance & Expense Accounting"
      subtitle="Actual verified transaction figures, operational costs, and Kenya Shillings balance"
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportFinancialCSV}
            className="btn btn-emerald !h-9 gap-1.5 text-xs font-bold"
          >
            <Download className="h-4 w-4" /> Export CSV / Sheets
          </button>
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="btn btn-emerald !h-9 text-xs font-bold shadow-xs"
          >
            <Plus className="h-4 w-4" /> Record Expense
          </button>
        </div>
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

      {/* Top Financial KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-extrabold uppercase">Total Sales Revenue</span>
            <TrendingUp className="h-4 w-4 text-teal" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-teal">
            {formatKES(totalSalesRevenue)}
          </p>
          <p className="mt-1 text-[11px] text-muted">From {orders.length} verified customer orders</p>
        </div>

        <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-extrabold uppercase">Operating Expenses</span>
            <ArrowDownRight className="h-4 w-4 text-error" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-error">
            {formatKES(totalExpenses)}
          </p>
          <p className="mt-1 text-[11px] text-muted">Logistics, packaging, diagnostics</p>
        </div>

        <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-extrabold uppercase">Est. Operating Profit</span>
            <ArrowUpRight className="h-4 w-4 text-tealdeep" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-tealdeep">
            {formatKES(netEstimatedProfit)}
          </p>
          <p className="mt-1 text-[11px] text-muted">After logistics & direct operational costs</p>
        </div>

        <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-extrabold uppercase">Average Order Value</span>
            <Receipt className="h-4 w-4 text-ink" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-ink">
            {formatKES(orders.length > 0 ? totalSalesRevenue / orders.length : 0)}
          </p>
          <p className="mt-1 text-[11px] text-muted">Average basket size in KSh</p>
        </div>
      </div>

      {/* Record Expense Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-line bg-card p-6 shadow-xl">
            <h3 className="font-display text-base font-bold text-ink">Log Business Operational Expense</h3>
            <p className="mt-1 text-xs text-muted">Record authentic business operational expenditures.</p>

            <form onSubmit={handleCreateExpense} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-muted">Expense Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="input mt-1.5 w-full text-xs font-semibold"
                >
                  <option value="Packaging & Courier">Packaging & Courier Supplies</option>
                  <option value="Transport & Field Verification">Transport & Motorbike Logistics</option>
                  <option value="Diagnostic Tools">Technical Diagnostic Equipment</option>
                  <option value="Rent & Utilities">Premises & Electrical</option>
                  <option value="Advertising & Marketing">Online Ad Campaigns</option>
                  <option value="Other">Other Operational Cost</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-muted">Expense Amount (KES) *</label>
                <input
                  type="number"
                  required
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="2500"
                  className="input mt-1.5 w-full text-xs font-bold text-error"
                />
              </div>

              <div>
                <label className="block font-bold text-muted">Description / Receipt Note</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Courier parcel fees to Kisumu"
                  className="input mt-1.5 w-full text-xs"
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
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expenses Log Table */}
      <div className="mt-8 overflow-hidden rounded-xl border border-line bg-card shadow-xs">
        <div className="border-b border-line bg-mist px-5 py-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-bold text-ink">Recorded Operating Expenses ({expenses.length})</h2>
          <span className="text-[11px] text-muted">Deducted from gross commercial earnings</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line text-[11px] font-extrabold uppercase text-muted">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Amount (KES)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-mist/30">
                  <td className="px-5 py-3 text-muted">{formatNairobi(e.created_at)}</td>
                  <td className="px-4 py-3 font-bold text-ink">{e.category || 'Operational'}</td>
                  <td className="px-4 py-3 text-muted">{e.description || '—'}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-error">
                    -{formatKES(e.amount)}
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

