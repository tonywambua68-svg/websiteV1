import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import type { Brand, Category } from '@/lib/domain'

export interface MenuColumn {
  title: string
  links: Array<{ label: string; to: string }>
}

export interface MenuItem {
  label: string
  to: string
  columns: MenuColumn[]
}

export function buildMenu(categories: Category[], brands: Brand[]): MenuItem[] {
  const brandLinks = brands.map((brand) => ({ label: brand.name, to: `/shop?brand=${brand.slug}` }))
  const laptopBrands = brands
    .filter((brand) => ['hp', 'dell', 'lenovo', 'apple', 'acer', 'asus'].includes(brand.slug))
    .map((brand) => ({ label: brand.name, to: `/shop?category=laptops&brand=${brand.slug}` }))
  const byUse = categories
    .filter((category) => category.menu_group === 'use' && category.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((category) => ({ label: category.name, to: `/shop?category=${category.slug}` }))
  const accessories = categories
    .filter((category) => category.menu_group === 'accessories' && category.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((category) => ({ label: category.name, to: `/shop?category=${category.slug}` }))

  return [
    {
      label: 'Laptops',
      to: '/shop?category=laptops',
      columns: [{ title: 'Brands', links: laptopBrands.length ? laptopBrands : [{ label: 'All laptops', to: '/shop?category=laptops' }] }],
    },
    {
      label: 'By use',
      to: '/shop?category=laptops',
      columns: [{ title: 'Shop by use', links: byUse }],
    },
    {
      label: 'Accessories',
      to: '/shop?category=computer-accessories',
      columns: [{ title: 'Accessories', links: accessories }],
    },
    { label: 'Brands', to: '/shop', columns: [{ title: 'All brands', links: brandLinks }] },
    { label: 'Offers', to: '/shop?offers=1', columns: [] },
    { label: 'Blog', to: '/blog', columns: [] },
  ]
}

export function useCatalogueMenu() {
  const [items, setItems] = useState<MenuItem[]>(() => buildMenu([], []))
  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase) return
    Promise.all([
      supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('brands').select('*').eq('is_active', true).order('sort_order'),
    ]).then(([categories, brands]) => {
      setItems(buildMenu((categories.data ?? []) as Category[], (brands.data ?? []) as Brand[]))
    })
  }, [])
  return items
}

export default function MegaMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <nav className="hidden border-b border-line bg-card lg:block" aria-label="Catalogue">
      <ul className="wrap flex h-11 items-center gap-1">
        {items.map((item) => (
          <li
            key={item.label}
            className="relative"
            onMouseEnter={() => setOpen(item.columns.length ? item.label : null)}
            onMouseLeave={() => setOpen(null)}
          >
            <Link to={item.to} className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-[13px] font-bold text-ink hover:text-teal">
              {item.label}
              {item.columns.length > 0 && <ChevronDown className="h-3.5 w-3.5" />}
            </Link>
            {open === item.label && (
              <div className="absolute left-0 top-full z-40 min-w-64 rounded-b-xl border border-line bg-card p-4 shadow-lg">
                {item.columns.map((column) => (
                  <div key={column.title}>
                    <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-muted">{column.title}</p>
                    <ul className="grid gap-1">
                      {column.links.map((link) => (
                        <li key={link.to + link.label}>
                          <Link to={link.to} className="block rounded px-2 py-1.5 text-sm font-semibold hover:bg-mint" onClick={() => setOpen(null)}>
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
