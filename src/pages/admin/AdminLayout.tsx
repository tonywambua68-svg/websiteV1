import { ReactNode, useState } from 'react'
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
  MapPin,
  UploadCloud,
  Rocket,
  Percent,
  BookOpen,
  Megaphone,
  Star,
  LayoutTemplate,
  Flag,
  ChevronDown,
} from 'lucide-react'

interface AdminLayoutProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}

interface NavGroup {
  group: string
  items: Array<{
    label: string
    to: string
    icon: any
    badge?: string
    ownerOnly?: boolean
  }>
}

const NAV_GROUPS: NavGroup[] = [
  {
    group: 'Core Business',
    items: [
      { label: 'Overview', to: '/admin', icon: LayoutDashboard },
      { label: 'Sales Analytics', to: '/admin/sales-insights', icon: DollarSign },
      { label: 'Orders', to: '/admin/orders', icon: ShoppingCart },
      { label: 'Customers', to: '/admin/employees', icon: Users },
      { label: 'Inventory', to: '/admin/inventory', icon: Boxes },
    ],
  },
  {
    group: 'Catalogue',
    items: [
      { label: 'Products', to: '/admin/products', icon: Package },
      { label: 'Categories', to: '/admin/categories', icon: Layers },
      { label: 'Brands', to: '/admin/brands', icon: Tags },
      { label: 'Product Reports', to: '/admin/product-reports', icon: Flag },
      { label: 'Suppliers', to: '/admin/suppliers', icon: Building2 },
      { label: 'Product Import', to: '/admin/product-import', icon: UploadCloud, badge: 'Scraper' },
      { label: 'Batch Publishing', to: '/admin/product-publishing', icon: Rocket },
      { label: 'Pricing Rules', to: '/admin/pricing-rules', icon: Percent },
    ],
  },
  {
    group: 'Store Management',
    items: [
      { label: 'Homepage Sections', to: '/admin/homepage-sections', icon: LayoutTemplate },
      { label: 'Marketing & Promotions', to: '/admin/marketing', icon: Megaphone, badge: 'Offers' },
    ],
  },
  {
    group: 'Customer Experience',
    items: [
      { label: 'Review Moderation', to: '/admin/reviews', icon: Star },
      { label: 'Knowledge Centre', to: '/admin/blog', icon: BookOpen, badge: 'Blog' },
      { label: 'Product Research', to: '/admin/research', icon: Compass },
    ],
  },
  {
    group: 'Finance',
    items: [
      { label: 'Finance & P&L', to: '/admin/finance', icon: DollarSign, ownerOnly: true },
    ],
  },
  {
    group: 'Operations',
    items: [
      { label: 'Delivery Zones', to: '/admin/delivery-zones', icon: MapPin },
      { label: 'Staff Management', to: '/admin/employees', icon: Users },
    ],
  },
  {
    group: 'Settings',
    items: [
      { label: 'Business Settings', to: '/admin/settings', icon: Settings, ownerOnly: true },
    ],
  },
]

export default function AdminLayout({ title, subtitle, actions, children }: AdminLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const isOwner = user?.role === 'owner'
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  return (
    <Guard roles={['owner', 'manager']}>
      <div className="flex min-h-screen bg-mist text-ink">
        {/* Fixed Desktop Sidebar */}
        <aside className="hidden w-64 flex-col border-r border-line bg-card lg:flex">
          <div className="flex h-16 items-center justify-between border-b border-line px-5">
            <Logo compact />
            <span className="rounded bg-emerald/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald">
              Admin
            </span>
          </div>

          <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
            {NAV_GROUPS.map((group) => {
              const visibleItems = group.items.filter((item) => !item.ownerOnly || isOwner)
              if (visibleItems.length === 0) return null
              return (
                <div key={group.group}>
                  <button
                    type="button"
                    onClick={() => setCollapsed((prev) => ({ ...prev, [group.group]: !prev[group.group] }))}
                    className="flex w-full items-center justify-between px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-muted hover:text-ink"
                    aria-expanded={!collapsed[group.group]}
                  >
                    {group.group}
                    <ChevronDown className={`h-3 w-3 transition-transform ${collapsed[group.group] ? '-rotate-90' : ''}`} />
                  </button>
                  {!collapsed[group.group] && (
                  <div className="space-y-0.5">
                    {visibleItems.map((item) => {
                      const Icon = item.icon
                      const active = location.pathname === item.to || (item.to !== '/admin' && location.pathname.startsWith(item.to))
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-bold transition ${
                            active
                              ? 'bg-emerald text-white shadow-xs'
                              : 'text-muted hover:bg-mist hover:text-ink'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-muted'}`} />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className={`rounded px-1.5 py-0.2 text-[9px] font-extrabold uppercase ${
                              active ? 'bg-white/20 text-white' : 'bg-emerald/10 text-emerald'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* User info & Store quick link */}
          <div className="border-t border-line p-4 text-xs bg-mist/30">
            <div className="flex items-center justify-between pb-3">
              <div className="truncate">
                <p className="font-bold text-ink truncate">{user?.full_name || 'Administrator'}</p>
                <p className="text-[10px] font-extrabold uppercase text-emerald">{user?.role}</p>
              </div>
              <button
                type="button"
                onClick={() => logout().then(() => navigate('/login'))}
                className="text-muted hover:text-error p-1 rounded hover:bg-card transition"
                aria-label="Logout"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
            <Link
              to="/"
              target="_blank"
              className="flex items-center justify-center gap-1.5 rounded-lg border border-line bg-card py-2 text-center font-bold text-ink hover:border-emerald hover:text-emerald transition shadow-xs text-xs"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View Storefront
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
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

          {/* Mobile Navigation Horizontal Bar */}
          <nav className="flex gap-1 overflow-x-auto border-b border-line bg-card px-3 sm:px-4 py-2 lg:hidden" aria-label="Admin navigation">
            {NAV_GROUPS.flatMap((g) => g.items)
              .filter((item) => !item.ownerOnly || isOwner)
              .map((item) => {
                const Icon = item.icon
                const active = location.pathname === item.to || (item.to !== '/admin' && location.pathname.startsWith(item.to))
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${
                      active ? 'bg-emerald text-white' : 'text-muted hover:bg-mist hover:text-ink'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
          </nav>

          {/* Page Body */}
          <main className="min-w-0 flex-1 overflow-x-hidden p-3 sm:p-5">{children}</main>
        </div>
      </div>
    </Guard>
  )
}
