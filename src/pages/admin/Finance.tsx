import { FormEvent, useEffect, useState } from 'react'
import AdminLayout from './AdminLayout'
import { getSupabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
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
  const [expenses, setExpenses] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [expenseCategories, setExpenseCategories] = useState<string[]>([])
  const [knownProductCost, setKnownProductCost] = useState(0)

  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({
    amount: '',
    category: 'Other',
    description: '',
  })

  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const paidOrders = orders.filter((order) => order.status !== 'refunded'
    && order.payment_records?.some((payment: any) => payment.status === 'confirmed')
    && !order.payment_records?.some((payment: any) => payment.status === 'refunded'))
  const totalSalesRevenue = paidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
  const estimatedGrossMargin = totalSalesRevenue - knownProductCost
  const netEstimatedProfit = estimatedGrossMargin - totalExpenses

  const loadFinance = async () => {
    const supabase = getSupabase()
    if (!supabase) {
      setExpenses([])
      setOrders([])
      setMessage('Financial records cannot be loaded because the store database is not configured.')
      return
    }
    setLoading(true)
    try {
      const [expensesResult, categoriesResult, ordersResult, financeResult] = await Promise.all([
        supabase.from('expenses').select('*, expense_categories(name)').order('created_at', { ascending: false }),
        supabase.from('expense_categories').select('name').order('name'),
        supabase.from('orders').select('id, order_number, guest_name, total, status, created_at, payment_records(status)'),
        supabase.rpc('finance_summary'),
      ])
      const failed = [expensesResult.error, categoriesResult.error, ordersResult.error, financeResult.error].find(Boolean)
      if (failed) throw failed
      setExpenses((expensesResult.data ?? []).map((expense: any) => ({
        ...expense,
        category: expense.expense_categories?.name || 'Other',
        description: expense.notes || '',
      })))
      setExpenseCategories((categoriesResult.data ?? []).map((category: any) => category.name))
      setOrders(ordersResult.data ?? [])
      setKnownProductCost(Number(financeResult.data?.known_product_cost || 0))
    } catch (error: any) {
      setMessage(`Could not load financial records: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOwner) void loadFinance()
  }, [])

  const handleCreateExpense = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.amount || Number(form.amount) <= 0) return

    setLoading(true)
    const supabase = getSupabase()
    if (!supabase || !user?.id) {
      setMessage('The expense was not saved because the store database is unavailable.')
      setLoading(false)
      return
    }
    try {
      const { data: category, error: categoryError } = await supabase.from('expense_categories')
        .upsert({ name: form.category }, { onConflict: 'name' }).select('id').single()
      if (categoryError) throw categoryError
      const { error } = await supabase.from('expenses').insert({
        category_id: category.id,
        amount: Number(form.amount),
        notes: form.description.trim() || null,
        created_by: user.id,
      })
      if (error) throw error
      setMessage('Business expense saved to PostgreSQL.')
      setFormOpen(false)
      setForm({ amount: '', category: expenseCategories[0] || 'Other', description: '' })
      await loadFinance()
    } catch (error: any) {
      setMessage(`Expense was not saved: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const exportFinancialCSV = () => {
    const rows = [
      ['Date', 'Type', 'Category / Order', 'Description', 'Amount (KES)'],
      ...paidOrders.map((o) => [
        o.created_at ? formatNairobi(o.created_at) : '',
        'REVENUE',
        `Order #${o.order_number || o.id}`,
        o.guest_name || 'Customer Purchase',
        String(o.total),
      ]),
      ...expenses.map((e) => [
        formatNairobi(e.incurred_on || e.created_at),
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

  if (!isOwner) {
    return <AdminLayout title="Financial Performance" subtitle="Owner access required"><div className="rounded-xl border border-amber/30 bg-amber/10 p-5 text-sm font-semibold text-amberdeep">Sign in with the active Owner account to view confidential costs and financial records.</div></AdminLayout>
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
          <p className="mt-1 text-[11px] text-muted">From {paidOrders.length} orders with confirmed payments</p>
        </div>

        <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-extrabold uppercase">Operating Expenses</span>
            <ArrowDownRight className="h-4 w-4 text-error" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-error">
            {formatKES(totalExpenses)}
          </p>
          <p className="mt-1 text-[11px] text-muted">From saved expense records</p>
        </div>

        <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-extrabold uppercase">Net Profit Estimate</span>
            <ArrowUpRight className="h-4 w-4 text-tealdeep" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-tealdeep">
            {formatKES(netEstimatedProfit)}
          </p>
          <p className="mt-1 text-[11px] text-muted">Sales less known costs and expenses</p>
        </div>

        <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-extrabold uppercase">Average Order Value</span>
            <Receipt className="h-4 w-4 text-ink" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-ink">
            {formatKES(paidOrders.length > 0 ? totalSalesRevenue / paidOrders.length : 0)}
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
                  {expenseCategories.map((category) => <option key={category} value={category}>{category}</option>)}
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

