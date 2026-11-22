import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { X, Search, ChevronRight, ChevronDown, Menu, Laptop, Monitor, HardDrive, Cpu, Phone, ShieldCheck, Truck, User } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { Category, Brand } from '@/lib/domain'

interface CategoryDrawerProps {
  isOpen: boolean
  onClose: () => void
}

const FOUR_LINE_MENU = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
  >
    <line x1="3" y1="4" x2="17" y2="4" />
    <line x1="3" y1="7" x2="17" y2="7" />
    <line x1="3" y1="10" x2="17" y2="10" />
    <line x1="3" y1="13" x2="17" y2="13" />
    <line x1="3" y1="16" x2="17" y2="16" />
  </svg>
)

function CategoryIcon({ name }: { name: string }) {
  const lower = name.toLowerCase()
  if (lower.includes('laptop') || lower.includes('computer')) return <Laptop className="h-4 w-4" />
  if (lower.includes('monitor') || lower.includes('screen')) return <Monitor className="h-4 w-4" />
  if (lower.includes('storage') || lower.includes('ssd') || lower.includes('drive')) return <HardDrive className="h-4 w-4" />
  if (lower.includes('workstation') || lower.includes('processor') || lower.includes('cpu')) return <Cpu className="h-4 w-4" />
  if (lower.includes('accessory') || lower.includes('charger') || lower.includes('cable')) return <Phone className="h-4 w-4" />
  return <ShieldCheck className="h-4 w-4" />
}

export default function CategoryDrawer({ isOpen, onClose }: CategoryDrawerProps) {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuthStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase || !isOpen) return
    Promise.all([
      supabase.from('categories').select('*').eq('is_active', true).order('menu_group', { ascending: true }).order('sort_order', { ascending: true }),
      supabase.from('brands').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
    ]).then(([catRes, brandRes]) => {
      if (catRes.data) setCategories(catRes.data as Category[])
      if (brandRes.data) setBrands(brandRes.data as Brand[])
    })
  }, [isOpen])

  const filteredCategories = categories.filter((c) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
  })

  const groups = useCallback(() => {
    const map = new Map<string, Category[]>()
    filteredCategories.forEach((c) => {
      const group = c.menu_group || 'catalogue'
      if (!map.has(group)) map.set(group, [])
      map.get(group)!.push(c)
    })
    return Array.from(map.entries())
  }, [filteredCategories])

  const toggleGroup = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const isGroupExpanded = (key: string) => expanded.has(key)

  const brandLinks = brands.map((b) => ({
    label: b.name,
    to: `/shop?brand=${b.slug}`,
  }))

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop — clicking outside closes */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
      />
      {/* Drawer panel */}
      <div
        className="absolute right-0 top-0 h-full w-full md:w-[420px] bg-card border-l border-line shadow-2xl flex flex-col animate-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line bg-card p-4 shrink-0">
          <h2 className="font-display text-lg font-bold text-ink">Categories</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg border border-line hover:bg-mist"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search within categories */}
        <div className="p-3 border-b border-line bg-mist/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories…"
              className="input !h-9 w-full pl-9 text-xs"
              aria-label="Search categories"
            />
          </div>
        </div>

        {/* Scrollable category list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {groups().length === 0 ? (
            <div className="text-center py-10 text-xs text-muted">
              No categories available yet.
            </div>
          ) : (
            groups().map(([groupName, groupCats]) => (
              <div key={groupName} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(groupName)}
                  className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg border border-line text-left font-bold text-ink uppercase tracking-wider text-[10px] hover:bg-mist"
                >
                  <span>{groupName.replace(/_/g, ' ')}</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${isGroupExpanded(groupName) ? 'rotate-180' : ''}`}
                  aria-expanded={isGroupExpanded(groupName)}
                  aria-controls={`group-${groupName}`}
                  style={{ transform: isGroupExpanded(groupName) ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  role="button"
                />
                </button>
              </div>
            ))
          )}
          {/* Render expanded groups inline */}
          {groups().map(([groupName, groupCats]) => (
            <div key={groupName} className={`pl-3 space-y-0.5 ${isGroupExpanded(groupName) ? '' : 'hidden'}`} id={`group-${groupName}`}>
              {groupCats.map((cat) => {
                const subCategories = categories.filter((c) => c.parent_id === cat.id && c.is_active)
                const hasSub = subCategories.length > 0
                return (
                  <div key={cat.id} className="overflow-hidden rounded-lg border border-line bg-mist/30">
                    <button
                      type="button"
                      onClick={() => {
                        navigate(`/shop?category=${cat.slug}`)
                        onClose()
                      }}
                      className="flex items-center justify-between w-full px-3 py-2 text-left text-sm font-semibold text-ink hover:bg-card transition"
                    >
                      <CategoryIcon name={cat.name} />
                      <span className="flex-1 min-w-0 truncate ml-2">{cat.name}</span>
                      <ChevronRight className="h-3 w-3 text-muted shrink-0" />
                    </button>
                    {hasSub && (
                      <div className="border-t border-line/50 pl-4 space-y-0.5">
                        {subCategories.map((sub) => (
                          <Link
                            key={sub.id}
                            to={`/shop?category=${sub.slug}`}
                            onClick={onClose}
                            className="block px-3 py-1.5 text-left text-xs text-muted hover:bg-card hover:text-teal border-l-2 border-transparent hover:border-teal"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
              {/* Brand links under accessories group */}
              {groupName === 'accessories' && brandLinks.length > 0 && (
                <div className="border-t border-line/50 pt-3">
                  <p className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wide text-muted">Laptop Brands</p>
                  {brandLinks.map((b) => (
                    <Link
                      key={b.to}
                      to={b.to}
                      onClick={onClose}
                      className="block px-3 py-1.5 text-left text-xs text-muted hover:bg-card hover:text-teal border-l-2 border-transparent hover:border-teal"
                    >
                      {b.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          {/* Quick links footer */}
          <div className="border-t border-line mt-3 pt-3 space-y-1">
            <Link to="/shop" onClick={onClose} className="block px-3 py-2 text-left text-sm font-bold text-teal hover:bg-mist">
              Browse All Products
            </Link>
            <Link to="/order-tracking" onClick={onClose} className="block px-3 py-2 text-left text-sm font-bold text-teal hover:bg-mist">
              Track Your Order
            </Link>
            <div className="border-t border-line/50 pt-3">
              {isAuthenticated ? (
                <>
                  <Link to="/account" onClick={onClose} className="block px-3 py-2 text-left text-sm font-bold text-ink hover:bg-mist">
                    {user?.full_name?.split(' ')[0] || 'My Account'}
                  </Link>
                  <button
                    type="button"
                    onClick={() => { logout().then(() => navigate('/')) } }
                    className="block w-full text-left px-3 py-2 text-sm font-bold text-error hover:bg-mist/50"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link to="/login" onClick={onClose} className="block px-3 py-2 text-left text-sm font-bold text-ink hover:bg-mist">
                  <User className="h-3.5 w-3.5 shrink-0 mr-2" />
                  Login / Create Account
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
