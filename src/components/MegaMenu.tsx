import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  ChevronDown,
  Laptop,
  Monitor,
  HardDrive,
  Cpu,
  Phone,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useProductStore } from '@/store/productStore'
import type { CatalogueProduct } from '@/lib/domain'
import { formatKES } from '@/lib/commerce'
import { MAIN_CATEGORIES, TOP_NAV_ITEMS } from '@/config/menuConfig'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Laptop,
  Monitor,
  HardDrive,
  Cpu,
  Phone,
  ShieldCheck,
}

interface MegaMenuProps {
  isOpen?: boolean
  onClose?: () => void
}

const MENU_TRANSITION_MS = 180

export default function MegaMenu({ isOpen: propIsOpen, onClose: propOnClose }: MegaMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [panelHovered, setPanelHovered] = useState(false)
  const [popularProducts, setPopularProducts] = useState<CatalogueProduct[]>([])
  const navigate = useNavigate()
  const location = useLocation()
  const menuRef = useRef<HTMLDivElement>(null)

  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isOpen = propIsOpen ?? isMenuOpen
  const onClose = useCallback(() => {
    setIsMenuOpen(false)
    setActiveCategory(null)
    if (propOnClose) propOnClose()
  }, [propOnClose])

  // Automatically dismiss mega menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
    setActiveCategory(null)
  }, [location.pathname, location.search])

  // Click outside and global Escape key listener to smoothly close menu
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    document.addEventListener('keydown', handleDocumentKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleDocumentKeyDown)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    const store = useProductStore.getState()
    store.fetchSection({ featured: '1' }, 3).then((products) => {
      setPopularProducts(products)
    })
  }, [])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  const openWithDelay = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    openTimer.current = setTimeout(() => {
      setIsMenuOpen(true)
    }, MENU_TRANSITION_MS)
  }, [])

  const closeWithDelay = useCallback(() => {
    if (panelHovered) return
    if (openTimer.current) {
      clearTimeout(openTimer.current)
      openTimer.current = null
    }
    closeTimer.current = setTimeout(() => {
      setIsMenuOpen(false)
      setActiveCategory(null)
    }, MENU_TRANSITION_MS)
  }, [panelHovered])

  const handleMouseEnter = useCallback(() => {
    setPanelHovered(false)
    openWithDelay()
  }, [openWithDelay])

  const handleMouseLeave = useCallback(() => {
    if (panelHovered) return
    closeWithDelay()
  }, [closeWithDelay])

  const handlePanelMouseEnter = useCallback(() => {
    setPanelHovered(true)
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])

  const handlePanelMouseLeave = useCallback(() => {
    setPanelHovered(false)
    closeWithDelay()
  }, [closeWithDelay])

  const handleNavClick = useCallback(
    (to: string) => {
      navigate(to)
      onClose()
    },
    [navigate, onClose]
  )

  const activeCategoryItem = activeCategory ? MAIN_CATEGORIES.find((c) => c.label === activeCategory) : undefined

  return (
    <div
      ref={menuRef}
      className="relative lg:block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onClose()
      }}
    >
      <nav className="border-b border-line bg-card hidden lg:block" aria-label="Catalogue navigation">
        <ul className="wrap flex h-11 items-center gap-1">
          <li className="relative group">
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen((prev) => !prev)
                setActiveCategory(null)
              }}
              onFocus={() => setIsMenuOpen(true)}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-bold text-ink hover:bg-amber hover:text-ink transition-colors duration-150"
              aria-expanded={isOpen && activeCategory === null}
              aria-label="All categories"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>All Categories</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </li>

          {TOP_NAV_ITEMS.map((item) => {
            const Icon = ICON_MAP[item.icon ?? 'ShieldCheck'] || ShieldCheck
            return (
              <li key={item.label} className="relative group">
                <Link
                  to={item.to}
                  onClick={() => handleNavClick(item.to)}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-bold transition-colors duration-150 ${
                    item.label === 'Offers' ? 'text-amber font-extrabold' : 'text-ink hover:text-teal'
                  }`}
                  aria-expanded={isOpen && activeCategory === item.label}
                  aria-label={item.label}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                  {item.columns.length > 0 && <ChevronDown className="h-3 w-3" />}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Mega Menu Panel — positioned directly below nav bar, no gap */}
      {isOpen && (
        <div
          onMouseEnter={handlePanelMouseEnter}
          onMouseLeave={handlePanelMouseLeave}
          className="absolute top-full left-0 right-0 z-40 mt-0"
        >
          <div className="wrap mx-auto">
            <div className="rounded-xl border border-line bg-ink/95 shadow-xl transition-all duration-150 ease-in-out">
      {activeCategory === null ? (
        <AllCategoriesPanel
          setActiveCategory={setActiveCategory}
          popularProducts={popularProducts}
          onNavClick={handleNavClick}
          onClose={onClose}
        />
      ) : activeCategoryItem ? (
        <CategoryPanel
          activeCategoryItem={activeCategoryItem}
          setActiveCategory={setActiveCategory}
          popularProducts={popularProducts}
          onNavClick={handleNavClick}
          onClose={onClose}
        />
      ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface CategoryPanelProps {
  activeCategoryItem: typeof MAIN_CATEGORIES[number]
  setActiveCategory: (category: string | null) => void
  popularProducts: CatalogueProduct[]
  onNavClick: (to: string) => void
  onClose: () => void
}

function CategoryPanel({
  activeCategoryItem,
  setActiveCategory,
  popularProducts,
  onNavClick,
  onClose,
}: CategoryPanelProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hoveredItem =
    hoveredCategory
      ? MAIN_CATEGORIES.find((c) => c.label === hoveredCategory) || activeCategoryItem
      : activeCategoryItem

  const showPanel = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])

  const hidePanel = useCallback(() => {
    closeTimer.current = setTimeout(() => {
      setHoveredCategory(null)
    }, MENU_TRANSITION_MS)
  }, [])

  const isPopularVisible = hoveredItem === activeCategoryItem || !hoveredCategory

  return (
    <div className="flex h-full min-h-[420px]">
      <div className="w-72 border-r border-white/10 bg-ink p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber">
              Shop by Category
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-white/60 hover:text-white p-1 rounded hover:bg-white/10"
              aria-label="Close menu"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <Link
            to="/shop"
            onClick={() => { onNavClick('/shop'); onClose() }}
            className="flex items-center justify-between w-full mb-3 px-3 py-2 rounded-lg bg-teal text-white font-bold text-xs shadow-xs hover:bg-tealdeep transition-colors"
          >
            <span>⚡ View All Products</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          <nav className="space-y-1" aria-label="Main categories">
            {MAIN_CATEGORIES.map((cat) => {
              const Icon = ICON_MAP[cat.icon ?? 'ShieldCheck'] || ShieldCheck
              const isActive =
                activeCategoryItem.label === cat.label || hoveredCategory === cat.label
              return (
                <button
                  key={cat.label}
                  type="button"
                  onMouseEnter={() => setHoveredCategory(cat.label)}
                  onFocus={() => setHoveredCategory(cat.label)}
                  onClick={() => setActiveCategory(cat.label)}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-colors duration-150 ${
                    isActive
                      ? 'bg-amber text-ink font-bold'
                      : 'text-[#cbd5d1] hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="font-semibold text-xs">{cat.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="pt-3 border-t border-white/10 text-[11px] text-white/50">
          Click any product or category to browse. Click outside to dismiss.
        </div>
      </div>

      <div className="flex-1 p-6 bg-ink/90 flex flex-col">
        <div className="flex-1 min-w-0">
          {hoveredItem ? (
            <div className="grid gap-8 md:grid-cols-3">
              {hoveredItem.columns.map((column) => (
                <div key={column.title} className="space-y-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-white mb-1">
                    {column.title}
                  </h3>
                  <ul className="space-y-1.5">
                    {column.links.map((link) => (
                      <li key={link.to}>
                        <Link
                          to={link.to}
                          onClick={() => {
                            onNavClick(link.to)
                            onClose()
                          }}
                          className="block rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors duration-150 text-[#cbd5d1] hover:bg-white/10 hover:text-white"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-white mb-1">
                  Popular Right Now
                </h3>
                <div className="space-y-3">
                  {popularProducts.length > 0 ? (
                    popularProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition-colors"
                      >
                        <img
                          src={product.image_url || '/images/products/laptop-placeholder.svg'}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-md bg-white flex-shrink-0"
                          loading="lazy"
                        />
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/product/${product.slug}`}
                            onClick={() => {
                              onNavClick(`/product/${product.slug}`)
                              onClose()
                            }}
                            className="block text-sm font-semibold text-white truncate hover:text-amber"
                            title={product.name}
                          >
                            {product.name}
                          </Link>
                          <div className="mt-1 text-xs font-bold text-amber">
                            {formatKES(product.selling_price)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#8ba19b] italic">
                      Hover over a category to see popular products.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-[#8ba19b] text-sm">
              Hover over a category to view subcategories.
            </div>
          )}
        </div>

        {/* Always-visible featured products strip at the bottom */}
        <div className="border-t border-white/10 pt-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber mb-3">
            Featured Products
          </h3>
          <div className="grid gap-3 md:grid-cols-4">
            {popularProducts.slice(0, 8).map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.slug}`}
                onClick={() => { onNavClick(`/product/${product.slug}`); onClose() }}
                className="flex flex-col items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10 transition-colors"
              >
                <img
                  src={product.image_url || '/images/products/laptop-placeholder.svg'}
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded-md bg-white flex-shrink-0"
                  loading="lazy"
                />
                <span className="text-[11px] font-semibold text-white truncate text-center w-full leading-tight">
                  {product.name}
                </span>
                <span className="text-[11px] font-bold text-amber">
                  {formatKES(product.selling_price)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface AllCategoriesPanelProps {
  setActiveCategory: (category: string | null) => void
  popularProducts: CatalogueProduct[]
  onNavClick: (to: string) => void
  onClose: () => void
}

function AllCategoriesPanel({
  setActiveCategory,
  popularProducts,
  onNavClick,
  onClose,
}: AllCategoriesPanelProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(MAIN_CATEGORIES[0]?.label || 'Laptops')
  const hoveredItem =
    hoveredCategory
      ? MAIN_CATEGORIES.find((c) => c.label === hoveredCategory) || MAIN_CATEGORIES[0]
      : MAIN_CATEGORIES[0]

  return (
    <div className="flex h-full min-h-[420px]">
      <div className="w-72 border-r border-white/10 bg-ink p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber">
              Shop by Category
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-white/60 hover:text-white p-1 rounded hover:bg-white/10"
              aria-label="Close menu"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <Link
            to="/shop"
            onClick={() => { onNavClick('/shop'); onClose() }}
            className="flex items-center justify-between w-full mb-3 px-3 py-2 rounded-lg bg-teal text-white font-bold text-xs shadow-xs hover:bg-tealdeep transition-colors"
          >
            <span>⚡ View All Products</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          <nav className="space-y-1" aria-label="Main categories">
            {MAIN_CATEGORIES.map((cat) => {
              const Icon = ICON_MAP[cat.icon ?? 'ShieldCheck'] || ShieldCheck
              const isActive = (hoveredCategory || MAIN_CATEGORIES[0]?.label) === cat.label
              return (
                <button
                  key={cat.label}
                  type="button"
                  onMouseEnter={() => setHoveredCategory(cat.label)}
                  onFocus={() => setHoveredCategory(cat.label)}
                  onClick={() => setActiveCategory(cat.label)}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-colors duration-150 ${
                    isActive
                      ? 'bg-amber text-ink font-bold'
                      : 'text-[#cbd5d1] hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="font-semibold text-xs">{cat.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="pt-3 border-t border-white/10 text-[11px] text-white/50">
          Click any product or category to browse. Click outside to dismiss.
        </div>
      </div>

      <div className="flex-1 p-6 bg-ink/90 flex flex-col">
        <div className="flex-1 min-w-0">
          {hoveredItem ? (
            <div className="grid gap-8 md:grid-cols-3">
              {hoveredItem.columns.map((column) => (
                <div key={column.title} className="space-y-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-white mb-1">
                    {column.title}
                  </h3>
                  <ul className="space-y-1.5">
                    {column.links.map((link) => (
                      <li key={link.to}>
                        <Link
                          to={link.to}
                          onClick={() => {
                            onNavClick(link.to)
                            onClose()
                          }}
                          className="block rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors duration-150 text-[#cbd5d1] hover:bg-white/10 hover:text-white"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-white mb-1">
                  Popular Right Now
                </h3>
                <div className="space-y-3">
                  {popularProducts.length > 0 ? (
                    popularProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition-colors"
                      >
                        <img
                          src={product.image_url || '/images/products/laptop-placeholder.svg'}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-md bg-white flex-shrink-0"
                          loading="lazy"
                        />
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/product/${product.slug}`}
                            onClick={() => {
                              onNavClick(`/product/${product.slug}`)
                              onClose()
                            }}
                            className="block text-sm font-semibold text-white truncate hover:text-amber"
                            title={product.name}
                          >
                            {product.name}
                          </Link>
                          <div className="mt-1 text-xs font-bold text-amber">
                            {formatKES(product.selling_price)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#8ba19b] italic">
                      Hover over a category to see popular products.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-[#8ba19b] text-sm">
              Hover over a category to view subcategories.
            </div>
          )}
        </div>

        {/* Always-visible featured products strip at the bottom */}
        <div className="border-t border-white/10 pt-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber mb-3">
            Featured Products
          </h3>
          <div className="grid gap-3 md:grid-cols-4">
            {popularProducts.slice(0, 8).map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.slug}`}
                onClick={() => { onNavClick(`/product/${product.slug}`); onClose() }}
                className="flex flex-col items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10 transition-colors"
              >
                <img
                  src={product.image_url || '/images/products/laptop-placeholder.svg'}
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded-md bg-white flex-shrink-0"
                  loading="lazy"
                />
                <span className="text-[11px] font-semibold text-white truncate text-center w-full leading-tight">
                  {product.name}
                </span>
                <span className="text-[11px] font-bold text-amber">
                  {formatKES(product.selling_price)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
