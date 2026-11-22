import { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import Logo from '@/components/Logo'
import Guard from '@/components/Guard'
import {
  LayoutDashboard,
  Package,
  Boxes,
  Compass,
  Building2,
  ShoppingCart,
  Users,
  DollarSign,
  Settings,
  Tags,
  Layers,
  LogOut,
  ExternalLink,
  ShieldCheck,
  MapPin,
  UploadCloud,
  Rocket,
  Percent,
  BookOpen,
} from 'lucide-react'

interface AdminLayoutProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}

const NAV_ITEMS = [
  { label: 'Overview', to: '/admin', icon: LayoutDashboard },
  { label: 'All Products', to: '/admin/products', icon: Package },
  { label: 'Categories', to: '/admin/categories', icon: Layers },
  { label: 'Brands', to: '/admin/brands', icon: Tags },
  { label: 'Inventory', to: '/admin/inventory', icon: Boxes },
  { label: 'Product Research', to: '/admin/research', icon: Compass },
  { label: 'Suppliers', to: '/admin/suppliers', icon: Building2 },
  { label: 'Import Center', to: '/admin/product-import', icon: UploadCloud },
  { label: 'Publishing', to: '/admin/product-publishing', icon: Rocket },
  { label: 'Pricing Rules', to: '/admin/pricing-rules', icon: Percent },
  { label: 'Knowledge Centre', to: '/admin/blog', icon: BookOpen },
  { label: 'Sales & Orders', to: '/admin/orders', icon: ShoppingCart },
  { label: 'Staff & Tasks', to: '/admin/employees', icon: Users },
  { label: 'Finance & P&L', to: '/admin/finance', icon: DollarSign },
  { label: 'Delivery Zones', to: '/admin/delivery-zones', icon: MapPin },
  { label: 'Business Settings', to: '/admin/settings', icon: Settings },
]

export default function AdminLayout({ title, subtitle, actions, children }: AdminLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const visibleNavItems = NAV_ITEMS.filter((item) => !['/admin/settings', '/admin/finance'].includes(item.to) || user?.role === 'owner')

  return (
    <Guard roles={['owner', 'manager']}>
      <div className="flex min-h-screen bg-mist text-ink">
        {/* Fixed Desktop Sidebar */}
        <aside className="hidden w-64 flex-col border-r border-line bg-card lg:flex">
          <div className="flex h-16 items-center gap-2 border-b border-line px-6">
            <Logo compact />
            <span className="rounded bg-emerald/10 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald">
              Admin
            </span>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {visibleNavItems.map((item) => {
              const Icon = item.icon
              const active = location.pathname === item.to || (item.to !== '/admin' && location.pathname.startsWith(item.to))
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-bold transition ${
                    active
                      ? 'bg-emerald text-white shadow-xs'
                      : 'text-muted hover:bg-mist hover:text-ink'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-muted'}`} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* User info & Store quick link */}
          <div className="border-t border-line p-4 text-xs">
            <div className="flex items-center justify-between pb-3">
              <div>
                <p className="font-bold text-ink">{user?.full_name || 'Administrator'}</p>
                <p className="text-[11px] font-extrabold uppercase text-emerald">{user?.role}</p>
              </div>
              <button
                type="button"
                onClick={() => logout().then(() => navigate('/login'))}
                className="text-muted hover:text-error"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
            <Link
              to="/"
              target="_blank"
              className="flex items-center justify-center gap-1.5 rounded-lg border border-line bg-mist py-2 text-center font-bold text-ink hover:border-emerald hover:text-emerald"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View Storefront
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-x-hidden">
          {/* Top Bar */}
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-card/90 px-4 sm:px-6 backdrop-blur">
            <div>
              <h1 className="font-display text-base sm:text-xl font-bold text-ink truncate">{title}</h1>
              {subtitle && <p className="text-[10px] sm:text-xs text-muted truncate">{subtitle}</p>}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {actions}
              <Link to="/employee" className="btn btn-outline !h-8 sm:!h-9 text-[10px] sm:text-xs font-bold px-2 sm:px-3 lg:hidden">
                Staff
              </Link>
            </div>
          </header>

          <nav className="flex gap-1 overflow-x-auto border-b border-line bg-card px-3 sm:px-4 py-2 lg:hidden" aria-label="Admin navigation">
            {visibleNavItems.map((item) => {
              const Icon = item.icon
              const active = location.pathname === item.to || (item.to !== '/admin' && location.pathname.startsWith(item.to))
              return <Link key={item.to} to={item.to} className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[10px] sm:text-[11px] font-bold ${active ? 'bg-emerald text-white' : 'text-muted hover:bg-mist hover:text-ink'}`}><Icon className="h-3.5 w-3.5" />{item.label}</Link>
            })}
          </nav>

          {/* Page Body */}
          <main className="flex-1 p-3 sm:p-4">{children}</main>
        </div>
      </div>
    </Guard>
  )
}

