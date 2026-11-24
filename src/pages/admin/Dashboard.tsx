import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import { getSupabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { formatKES, formatNairobi } from '@/lib/commerce'
import {
  Package,
  Boxes,
  Compass,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Truck,
  Clock,
  CreditCard,
  Users,
  User,
  RefreshCw,
  Download,
  UploadCloud,
  Sparkles,
  BookOpen,
} from 'lucide-react'
import { downloadCsv } from '@/lib/csv'

type OrderRow = {
  id: string
  order_number: string
  guest_name: string
  guest_phone: string
  total: number
  status: string
  created_at: string
  user_id: string | null
}

type DateRange = 'today' | '7d' | '30d' | 'month' | 'custom'

export default function AdminDashboard() {
  const { user } = useAuthStore()
  const isOwner = user?.role === 'owner'
  const canViewSales = user?.role === 'owner' || user?.role === 'manager' || user?.role === 'sales_assistant'
  const navigate = useNavigate()

  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const [stats, setStats] = useState({
    totalProducts: 0,
    publishedProducts: 0,
    pendingApproval: 0,
    ownedStock: 0,
    supplierStock: 0,
    lowStockCount: 0,
    totalOrders: 0,
    ordersToday: 0,
    ordersThisWeek: 0,
    ordersThisMonth: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    knownProductCost: 0,
    expensesTotal: 0,
    grossProfit: 0,
    totalCustomers: 0,
    newCustomers: 0,
    orderTrend: null as number | null,
    revenueTrend: null as number | null,
  })
  const [recentOrders, setRecentOrders] = useState<OrderRow[]>([])
  const [ordersByStatus, setOrdersByStatus] = useState<Record<string, number>>({})
  const [topProducts, setTopProducts] = useState<Array<{ name: string; qty: number; revenue: number }>>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const rangeStart = (() => {
    const now = new Date()
    switch (dateRange) {
      case 'today':
        now.setHours(0, 0, 0, 0)
        return now.toISOString()
      case '7d':
        now.setDate(now.getDate() - 7)
        return now.toISOString()
      case '30d':
        now.setDate(now.getDate() - 30)
        return now.toISOString()
      case 'month':
        now.setDate(1)
        now.setHours(0, 0, 0, 0)
        return now.toISOString()
      case 'custom':
        return customFrom || now.toISOString()
      default:
        return now.toISOString()
    }
  })()

  const loadDashboard = async () => {
    const supabase = getSupabase()
    if (!supabase) {
      setMessage('Dashboard data is unavailable because the store database is not configured.')
      return
    }
    setLoading(true)
    setMessage(null)
    try {
      // Finance summary via RPC (owner only)
      let financeData: any = null
      if (isOwner) {
        const { data, error } = await supabase.rpc('finance_summary')
        if (error) throw error
        financeData = data
      }

      // Products overview
      const [prodRes, invRes, researchRes] = await Promise.all([
        supabase.from('products').select('id, publication_status, deleted_at'),
        supabase.from('inventory_balances').select('product_id, owned_qty, reserved_qty, supplier_qty, supplier_reserved_qty'),
        supabase.from('research_listings').select('id, status'),
      ])
      if (prodRes.error) throw prodRes.error
      if (invRes.error) throw invRes.error
      if (researchRes.error) throw researchRes.error

      const products = prodRes.data ?? []
      const activeProductIds = new Set(products.filter((product) => !product.deleted_at).map((product) => product.id))
      const inventory = (invRes.data ?? []).filter((row) => activeProductIds.has(row.product_id))
      const research = researchRes.data ?? []

      const ownedStock = inventory.reduce((s, r) => s + Math.max(0, (r.owned_qty || 0) - (r.reserved_qty || 0)), 0)
      const supplierStock = inventory.reduce((s, r) => s + Math.max(0, (r.supplier_qty || 0) - (r.supplier_reserved_qty || 0)), 0)
      const lowStock = inventory.filter(
        (r) => Math.max(0, (r.owned_qty || 0) - (r.reserved_qty || 0)) <= 2
      ).length
      const pendingApproval = products.filter(
        (p) => p.publication_status === 'pending_approval' && !p.deleted_at
      ).length
      const publishedProducts = products.filter(
        (p) => p.publication_status === 'published' && !p.deleted_at
      ).length

      // Orders
      const [ordersRes, customersRes] = await Promise.all([
        supabase.from('orders').select('id, order_number, guest_name, guest_phone, total, status, created_at, user_id, payment_records(status)').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, role, created_at, account_status'),
      ])
      if (ordersRes.error) throw ordersRes.error
      if (customersRes.error) throw customersRes.error

      const orders = (ordersRes.data ?? []) as OrderRow[]
      const profiles = customersRes.data ?? []

      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const ordersToday = orders.filter((o) => o.created_at >= todayStart).length
      const ordersThisWeek = orders.filter((o) => o.created_at >= weekStart).length
      const ordersThisMonth = orders.filter((o) => o.created_at >= monthStart).length

      const periodEnd = dateRange === 'custom' && customTo
        ? new Date(`${customTo}T23:59:59.999`).toISOString()
        : now.toISOString()
      const periodOrders = orders.filter((order) => order.created_at >= rangeStart && order.created_at <= periodEnd)
      const periodDuration = Math.max(1, new Date(periodEnd).getTime() - new Date(rangeStart).getTime())
      const previousStart = new Date(new Date(rangeStart).getTime() - periodDuration).toISOString()
      const previousOrders = orders.filter((order) => order.created_at >= previousStart && order.created_at < rangeStart)

      const statusCounts: Record<string, number> = {}
      periodOrders.forEach((o) => {
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1
      })

      const isPaymentConfirmed = (order: any) => order.status !== 'refunded'
        && order.payment_records?.some((payment: any) => payment.status === 'confirmed')
        && !order.payment_records?.some((payment: any) => payment.status === 'refunded')
      const paidPeriodOrders = periodOrders.filter(isPaymentConfirmed)
      const completedOrders = periodOrders.filter((order) => order.status === 'delivered').length
      const pendingOrders = periodOrders.filter((o) => ['pending', 'awaiting_supplier_confirmation', 'confirmed', 'awaiting_payment'].includes(o.status)).length
      const cancelledOrders = periodOrders.filter((o) => o.status === 'cancelled').length

      const revenue = paidPeriodOrders.reduce((s, o) => s + Number(o.total || 0), 0)
      const previousRevenue = previousOrders.filter(isPaymentConfirmed)
        .reduce((sum, order) => sum + Number(order.total || 0), 0)
      const trendPercent = (current: number, previous: number) => previous > 0
        ? Math.round(((current - previous) / previous) * 100)
        : current > 0 ? null : 0
      const aov = paidPeriodOrders.length > 0 ? revenue / paidPeriodOrders.length : 0

      const totalCustomers = profiles.filter((p) => p.role === 'customer').length
      const newCustomers = profiles.filter(
        (p) => p.role === 'customer' && p.created_at >= rangeStart && p.created_at <= periodEnd
      ).length

      setStats({
        totalProducts: products.filter((product) => !product.deleted_at).length,
        publishedProducts,
        pendingApproval,
        ownedStock,
        supplierStock,
        lowStockCount: lowStock,
        totalOrders: periodOrders.length,
        ordersToday,
        ordersThisWeek,
        ordersThisMonth,
        pendingOrders,
        cancelledOrders,
        completedOrders,
        totalRevenue: revenue,
        averageOrderValue: aov,
        knownProductCost: financeData?.known_product_cost ?? 0,
        expensesTotal: financeData?.expenses_total ?? 0,
        grossProfit: financeData ? Number(financeData.gross_profit_estimate || 0) + Number(financeData.expenses_total || 0) : 0,
        totalCustomers,
        newCustomers,
        orderTrend: trendPercent(periodOrders.length, previousOrders.length),
        revenueTrend: trendPercent(revenue, previousRevenue),
      })

      setOrdersByStatus(statusCounts)
      setRecentOrders(periodOrders.slice(0, 10))

      // Top products are based on paid orders in the currently selected period.
      const paidOrderIds = paidPeriodOrders.map((order) => order.id)
      const itemsRes = paidOrderIds.length > 0
        ? await supabase.from('order_items')
          .select('order_id, product_id, product_name, quantity, unit_price, line_total')
          .in('order_id', paidOrderIds)
          .order('line_total', { ascending: false })
          .limit(1000)
        : { data: [], error: null }
      if (itemsRes.error) throw itemsRes.error
      const itemsData = itemsRes.data ?? []
      if (itemsData.length > 0) {
        const productMap: Record<string, { name: string; qty: number; revenue: number }> = {}
        itemsData.forEach((item: any) => {
          const key = item.product_id
          if (!productMap[key]) {
            productMap[key] = { name: item.product_name, qty: 0, revenue: 0 }
          }
          productMap[key].qty += item.quantity
          productMap[key].revenue += Number(item.line_total || 0)
        })
        setTopProducts(Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5))
      } else setTopProducts([])
      setLastUpdated(new Date())
    } catch (err: any) {
      setMessage(`Error loading dashboard: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDashboard()
    const timer = window.setInterval(() => { void loadDashboard() }, 30000)
    return () => window.clearInterval(timer)
  }, [dateRange, customFrom, customTo, isOwner, canViewSales])

  const exportSalesCSV = () => {
    const rows = recentOrders.map((o) => ({
      order_number: o.order_number,
      customer_name: o.guest_name,
      customer_phone: o.guest_phone,
      total: o.total,
      status: o.status,
      created_at: o.created_at,
    }))
    downloadCsv(`OREMITECH_sales_${new Date().toISOString().slice(0, 10)}.csv`, rows)
    setMessage('Sales report exported as CSV.')
  }

  const rangeLabel = (r: DateRange) => {
    const labels: Record<DateRange, string> = {
      today: 'Today',
      '7d': 'Last 7 Days',
      '30d': 'Last 30 Days',
      month: 'This Month',
      custom: 'Custom Range',
    }
    return labels[r]
  }

  const statCard = (
    title: string,
    value: React.ReactNode,
    subtitle: string,
    Icon: React.ElementType,
    colorClass: string,
    link?: string,
    trend?: number | null
  ) => (
    <div className="rounded-xl border border-line bg-card p-5 shadow-xs">
      <div className="flex items-center justify-between text-muted">
        <span className="text-xs font-extrabold uppercase">{title}</span>
        <Icon className={`h-4 w-4 ${colorClass}`} />
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-ink">{value}</p>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
        <span>{subtitle}</span>
        <span className="flex items-center gap-2">
          {trend !== undefined && <span className={`inline-flex items-center gap-0.5 font-bold ${trend === null ? 'text-muted' : trend > 0 ? 'text-emerald-700' : trend < 0 ? 'text-error' : 'text-muted'}`} title="Compared with the previous matching period">
            {trend !== null && (trend > 0 ? <TrendingUp className="h-3 w-3" /> : trend < 0 ? <TrendingDown className="h-3 w-3" /> : null)}
            {trend === null ? 'New' : `${trend > 0 ? '+' : ''}${trend}%`}
          </span>}
          {link && <Link to={link} className="font-bold text-teal hover:underline">View →</Link>}
        </span>
      </div>
    </div>
  )

  return (
    <AdminLayout
      title="Business Performance Dashboard"
      subtitle="Real sales, revenue, and profit figures from Supabase records"
      actions={
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => {
              setDateRange(e.target.value as DateRange)
              setCustomFrom('')
              setCustomTo('')
            }}
            className="input !h-9 text-xs font-bold"
          >
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>
          {dateRange === 'custom' && (
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="input !h-9 text-xs w-32"
              />
              <span className="text-xs text-muted">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="input !h-9 text-xs w-32"
              />
            </div>
          )}
          {canViewSales && (
            <button
              type="button"
              onClick={exportSalesCSV}
              className="btn btn-emerald !h-9 gap-1.5 text-xs font-bold"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
          )}
          <button type="button" onClick={() => void loadDashboard()} disabled={loading} className="btn btn-outline !h-9 gap-1.5 text-xs font-bold disabled:opacity-50" title={lastUpdated ? `Last updated ${lastUpdated.toLocaleTimeString('en-KE')}` : 'Refresh dashboard'}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />Refresh
          </button>
          <Link to="/admin/products/new" className="btn btn-emerald !h-9 text-xs font-bold shadow-xs">
            <Plus className="h-4 w-4" /> Add Product
          </Link>
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

      {/* Date filter note */}
      {dateRange === 'custom' && (!customFrom || !customTo) && (
        <div className="mb-4 rounded-lg border border-amber/30 bg-amber/10 p-3 text-xs font-semibold text-amberdeep">
          Please select both dates for custom range.
        </div>
      )}

      {/* Quick Action Command Center */}
      <div className="mb-6 rounded-2xl border border-line bg-card p-5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
          <div>
            <h2 className="font-display text-base font-bold text-ink flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber" /> OREMITECH Operations & Scraper Hub
            </h2>
            <p className="text-xs text-muted">Direct shortcuts to scrape products, manage live catalog, and run store operations</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald/10 px-2.5 py-1 text-[11px] font-extrabold text-emerald">
              KES Store Currency · Nairobi
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <Link
            to="/admin/product-import"
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-line bg-mist/50 p-3.5 text-center transition hover:border-emerald hover:bg-card hover:shadow-xs"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal/10 text-teal">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-ink">Product Scraper</p>
              <p className="text-[10px] text-muted">Single & Bulk (up to 100)</p>
            </div>
          </Link>

          <Link
            to="/admin/product-import"
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-line bg-mist/50 p-3.5 text-center transition hover:border-emerald hover:bg-card hover:shadow-xs"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber/10 text-amberdeep">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-ink">Search & Auto-Stage</p>
              <p className="text-[10px] text-muted">Google / Keyword discovery</p>
            </div>
          </Link>

          <Link
            to="/admin/product-publishing"
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-line bg-mist/50 p-3.5 text-center transition hover:border-emerald hover:bg-card hover:shadow-xs"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald/10 text-emerald">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-ink">Publishing Hub</p>
              <p className="text-[10px] text-muted">Batch live publishing</p>
            </div>
          </Link>

          <Link
            to="/admin/blog"
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-line bg-mist/50 p-3.5 text-center transition hover:border-emerald hover:bg-card hover:shadow-xs"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky/10 text-sky">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-ink">Knowledge Centre</p>
              <p className="text-[10px] text-muted">SEO articles & guides</p>
            </div>
          </Link>

          <Link
            to="/admin/orders"
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-line bg-mist/50 p-3.5 text-center transition hover:border-emerald hover:bg-card hover:shadow-xs col-span-2 sm:col-span-1"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald/10 text-emerald">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-ink">Orders & Delivery</p>
              <p className="text-[10px] text-muted">Verify payments & dispatch</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {statCard(
          'Catalogue Products',
          stats.totalProducts,
          `${stats.publishedProducts} published · ${stats.pendingApproval} awaiting approval`,
          Package,
          'text-teal',
          '/admin/products'
        )}
        {statCard(
          'Available Stock',
          stats.ownedStock,
          `(+${stats.supplierStock} supplier) · ${stats.lowStockCount} low stock`,
          Boxes,
          'text-teal',
          '/admin/inventory'
        )}
        {statCard(
          'Orders ' + rangeLabel(dateRange),
          canViewSales ? stats.totalOrders : '—',
          `${stats.ordersToday} today · ${stats.pendingOrders} pending · ${stats.cancelledOrders} cancelled`,
          ShoppingCart,
          'text-teal',
          '/admin/orders',
          stats.orderTrend
        )}
        {statCard(
          'Revenue ' + rangeLabel(dateRange),
          canViewSales ? formatKES(stats.totalRevenue) : '—',
          `AOV ${formatKES(stats.averageOrderValue)} · ${stats.completedOrders} completed`,
          TrendingUp,
          'text-tealdeep',
          '/admin/orders',
          stats.revenueTrend
        )}
      </div>

      {/* Revenue & Profit (Owner only) */}
      {isOwner && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {statCard(
            'Gross Profit Estimate (All Time)',
            formatKES(stats.grossProfit),
            'All-time sales less recorded product costs',
            ShieldCheck,
            'text-tealdeep'
          )}
          {statCard(
            'Known Product Cost (All Time)',
            formatKES(stats.knownProductCost),
            'All-time recorded purchase costs',
            CreditCard,
            'text-muted'
          )}
          {statCard(
            'Operating Expenses (All Time)',
            formatKES(stats.expensesTotal),
            'All-time logged business expenses',
            AlertTriangle,
            'text-error'
          )}
          {statCard(
            'Net Operating Profit (All Time)',
            formatKES(stats.grossProfit - stats.expensesTotal),
            'All-time estimate after recorded expenses',
            TrendingUp,
            stats.grossProfit > stats.expensesTotal ? 'text-tealdeep' : 'text-error'
          )}
        </div>
      )}

      {/* Customer Performance */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {statCard(
          'Total Customers',
          stats.totalCustomers,
          'Registered customer accounts',
          Users,
          'text-teal',
          '/account'
        )}
        {statCard(
          'New ' + rangeLabel(dateRange),
          stats.newCustomers,
          'New registrations in period',
          User,
          'text-teal'
        )}
        {statCard(
          'Completed Orders',
          stats.completedOrders,
          'Orders marked delivered in this period',
          CheckCircle2,
          'text-tealdeep',
          '/admin/orders'
        )}
        {statCard(
          'Pending Orders',
          stats.pendingOrders,
          'Awaiting payment or confirmation',
          Clock,
          'text-amberdeep',
          '/admin/orders'
        )}
      </div>

      {/* Main Grid: Charts & Activity */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">

        {/* Orders by Status + Recent Orders */}
        <div className="rounded-xl border border-line bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div>
              <h2 className="font-display text-base font-bold text-ink">Order Monitoring</h2>
              <p className="text-xs text-muted">Recent orders and status distribution</p>
            </div>
            <Link to="/admin/orders" className="text-xs font-bold text-teal hover:underline">
              All Orders →
            </Link>
          </div>

          {/* Status breakdown */}
          <div className="mt-4 space-y-3">
            {Object.entries(ordersByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-xs">
                <span className="text-muted">{status.replace(/_/g, ' ')}</span>
                <div className="flex items-center gap-2">
                  <span className="w-16 bg-mist rounded-full h-2">
                    <span
                      className={`h-2 rounded-full block ${
                        status === 'delivered' || status === 'paid' ? 'bg-mint' : status === 'pending' || status === 'awaiting_payment' ? 'bg-amber' : 'bg-line'
                      }`}
                      style={{ width: `${Math.min(100, (count / Math.max(1, Math.max(...Object.values(ordersByStatus)))) * 100)}%` }}
                    />
                  </span>
                  <span className="font-bold text-ink w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Recent orders table */}
          <div className="mt-6">
            <h3 className="text-xs font-bold uppercase text-muted mb-2">Recent Orders</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-line bg-mist">
                  <tr>
                    <th className="px-4 py-2">Order #</th>
                    <th className="px-4 py-2">Customer</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-mist/30">
                      <td className="px-4 py-2 font-mono font-bold text-ink">#{o.order_number}</td>
                      <td className="px-4 py-2 text-muted">{o.guest_name}</td>
                      <td className="px-4 py-2 font-extrabold text-teal">{formatKES(o.total)}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                            o.status === 'delivered' || o.status === 'paid'
                              ? 'bg-mint text-tealdeep'
                              : o.status === 'pending' || o.status === 'awaiting_payment'
                                ? 'bg-amber/15 text-amberdeep'
                                : o.status === 'cancelled'
                                  ? 'bg-error/15 text-error'
                                  : 'bg-mist text-ink'
                          }`}
                        >
                          {o.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-muted">{formatNairobi(o.created_at)}</td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-muted">
                        No orders yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column: Quick insights */}
        <div className="grid gap-4 lg:grid-cols-1">
          {/* Product Performance */}
          <div className="rounded-xl border border-line bg-card p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <h2 className="font-display text-base font-bold text-ink">Product Performance</h2>
              <Link to="/admin/products" className="text-xs font-bold text-teal hover:underline">
                All Products →
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {topProducts.length > 0 ? (
                topProducts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-ink truncate">{p.name}</p>
                      <p className="text-[10px] text-muted">{p.qty} units sold</p>
                    </div>
                    <span className="font-extrabold text-teal">{formatKES(p.revenue)}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted text-center py-4">No sales data yet.</p>
              )}
              <div className="mt-3 border-t border-line pt-3">
                <p className="text-[10px] font-bold text-muted">Low Stock Alert</p>
                <p className="text-xs text-ink">{stats.lowStockCount} models at 2 units or fewer</p>
                {stats.lowStockCount > 0 && (
                  <Link to="/admin/inventory" className="text-xs font-bold text-teal mt-1 inline-block hover:underline">
                    Manage Stock →
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Research Pipeline */}
          <div className="rounded-xl border border-line bg-card p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <h2 className="font-display text-base font-bold text-ink">Research Queue</h2>
              <Link to="/admin/research" className="text-xs font-bold text-teal hover:underline">
                Research →
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-lg border border-line bg-mist p-3">
                <span className="text-[10px] font-extrabold uppercase text-muted">Pending Verification</span>
                <p className="mt-1 font-display text-lg font-bold text-amberdeep">{stats.pendingApproval}</p>
              </div>
              <div className="rounded-lg border border-line bg-mint p-3">
                <span className="text-[10px] font-extrabold uppercase text-tealdeep">Published Products</span>
                <p className="mt-1 font-display text-lg font-bold text-tealdeep">{stats.publishedProducts}</p>
              </div>
            </div>
          </div>

          {/* Export Section */}
          <div className="rounded-xl border border-line bg-card p-6 shadow-xs">
            <h2 className="font-display text-base font-bold text-ink mb-4">Reports & Exports</h2>
            {canViewSales && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={exportSalesCSV}
                className="btn btn-emerald w-full !h-10 text-xs font-bold flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" /> Export Sales CSV
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/finance')}
                className="btn btn-outline w-full !h-10 text-xs font-bold flex items-center justify-center gap-2 border-amber/30 text-amberdeep"
              >
                  <CreditCard className="h-4 w-4" /> Finance & Expenses
                </button>
              </div>
            )}
            {!canViewSales && (
              <div className="rounded-lg bg-line/30 p-3 text-xs text-muted">
                Manager or Owner role required to view financial data.
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

