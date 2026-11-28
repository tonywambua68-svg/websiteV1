import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import ProductCard, { type ProductRowItem } from './ProductCard'
import { useCartStore } from '@/store/cartStore'
import { useProductStore } from '@/store/productStore'

export interface ProductRowConfig {
  title: string
  subtitle?: string
  color: 'blue' | 'green'
  see_all_link: string
  products: ProductRowItem[]
}

const TINT = {
  blue: {
    section: 'bg-blue-50/60 border-primary/15',
    title: 'text-primary',
    pill: 'text-primary border-primary/30 hover:bg-primary hover:text-white',
  },
  green: {
    section: 'bg-emerald-50/60 border-success/20',
    title: 'text-success',
    pill: 'text-success border-success/30 hover:bg-success hover:text-white',
  },
} as const

export default function ProductRow({ config }: { config: ProductRowConfig }) {
  const tint = TINT[config.color]
  const addItem = useCartStore((s) => s.addItem)
  const allProducts = useProductStore((s) => s.allProducts)

  const handleQuickAdd = (item: ProductRowItem) => {
    const real = item.id ? allProducts.find((p) => p.id === item.id) : undefined
    if (real) void addItem(real, 1)
  }

  if (config.products.length === 0) return null

  return (
    <section className={`rounded-2xl border p-4 shadow-xs sm:p-5 ${tint.section}`}>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className={`font-display text-lg font-extrabold sm:text-xl ${tint.title}`}>{config.title}</h2>
          {config.subtitle && <p className="mt-0.5 text-xs text-muted">{config.subtitle}</p>}
        </div>
        <Link
          to={config.see_all_link}
          className={`inline-flex shrink-0 items-center gap-1 rounded-full border bg-white px-3 py-1.5 text-xs font-bold transition-colors ${tint.pill}`}
        >
          See All <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="product-row-track mt-4">
        {config.products.map((item, idx) => (
          <div key={item.id ?? `${item.link}-${idx}`} className="product-row-card">
            <ProductCard product={item} onQuickAdd={handleQuickAdd} />
          </div>
        ))}
      </div>
    </section>
  )
}