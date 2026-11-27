import { Link } from 'react-router-dom'
import { useCompareStore } from '@/store/compareStore'
import { useProductStore } from '@/store/productStore'
import { useCartStore } from '@/store/cartStore'
import type { CatalogueProduct } from '@/lib/domain'
import { formatKES, availabilityLabel, conditionLabel } from '@/lib/commerce'
import { Scale, Trash2, ShoppingCart, Check, ArrowLeft, Plus } from 'lucide-react'
import { useState } from 'react'

const PLACEHOLDER = '/images/products/laptop-placeholder.svg'

export default function Compare() {
  const ids = useCompareStore((s) => s.ids)
  const remove = useCompareStore((s) => s.remove)
  const clear = useCompareStore((s) => s.clear)
  const allProducts = useProductStore((s) => s.allProducts)
  const addItem = useCartStore((s) => s.addItem)
  const [addedId, setAddedId] = useState<string | null>(null)

  const products = ids
    .map((id) => allProducts.find((p) => p.id === id || p.slug === id))
    .filter((p): p is CatalogueProduct => Boolean(p))

  const handleAddToCart = async (product: CatalogueProduct) => {
    const ok = await addItem(product, 1)
    if (ok) {
      setAddedId(product.id)
      setTimeout(() => setAddedId(null), 2000)
    }
  }

  if (products.length === 0) {
    return (
      <div className="wrap py-16 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-blue-50 text-primary">
          <Scale className="h-10 w-10" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold text-ink md:text-3xl">
          Hardware Comparison
        </h1>
        <p className="mt-2 text-sm text-muted max-w-md mx-auto">
          You haven&rsquo;t selected any laptops or hardware to compare yet. Browse our catalog and click &ldquo;Compare&rdquo; to compare specifications side-by-side.
        </p>
        <div className="mt-6">
          <Link to="/shop" className="btn btn-primary !h-11 px-6 text-sm font-bold shadow-md">
            Browse Laptops &amp; Accessories →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="wrap py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/shop" className="inline-flex items-center gap-1 text-xs font-bold text-muted hover:text-ink">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Shop
            </Link>
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold text-ink md:text-3xl">
            Compare Hardware Specifications
          </h1>
          <p className="mt-1 text-xs text-muted">
            Side-by-side technical specification comparison for Kenyan technology buyers ({products.length} of 4 max)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/shop" className="btn btn-outline !h-9 text-xs font-bold">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add More
          </Link>
          <button
            type="button"
            onClick={clear}
            className="btn btn-outline !h-9 text-xs font-bold text-error hover:bg-red-50 hover:border-error"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear All
          </button>
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="mt-8 overflow-x-auto rounded-xl border border-line bg-white shadow-sm">
        <table className="w-full min-w-[700px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-slate-50">
              <th className="w-48 p-4 text-xs font-extrabold uppercase tracking-wider text-muted">
                Product
              </th>
              {products.map((p) => (
                <th key={p.id} className="p-4 align-top min-w-[200px]">
                  <div className="relative flex flex-col items-center text-center">
                    <button
                      type="button"
                      onClick={() => remove(p.id)}
                      className="absolute -top-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-slate-200 text-slate-600 hover:bg-error hover:text-white transition-colors"
                      title="Remove product"
                      aria-label={`Remove ${p.name}`}
                    >
                      ×
                    </button>
                    <img
                      src={p.image_url || PLACEHOLDER}
                      alt={p.name}
                      className="h-28 w-28 rounded-lg object-contain bg-white p-2 border border-slate-100"
                      onError={(e) => {
                        e.currentTarget.src = PLACEHOLDER
                      }}
                    />
                    <Link
                      to={`/product/${p.slug}`}
                      className="mt-2 line-clamp-2 text-xs font-bold text-ink hover:text-primary transition-colors"
                    >
                      {p.name}
                    </Link>
                    <p className="mt-1 text-sm font-extrabold text-primary">
                      {formatKES(p.selling_price)}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleAddToCart(p)}
                      className={`btn btn-sm mt-2.5 w-full !h-8 text-[11px] font-bold ${
                        addedId === p.id ? 'bg-success text-white' : 'btn-primary'
                      }`}
                    >
                      {addedId === p.id ? (
                        <>
                          <Check className="h-3 w-3 mr-1" /> Added
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-3 w-3 mr-1" /> Add to Cart
                        </>
                      )}
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-xs">
            {/* Brand */}
            <tr>
              <td className="p-3.5 font-bold text-muted bg-slate-50/50">Brand</td>
              {products.map((p) => (
                <td key={p.id} className="p-3.5 font-semibold text-ink">
                  {p.brand_name || 'Generic'}
                </td>
              ))}
            </tr>

            {/* Model */}
            <tr>
              <td className="p-3.5 font-bold text-muted bg-slate-50/50">Model</td>
              {products.map((p) => (
                <td key={p.id} className="p-3.5 text-ink font-medium">
                  {p.model || '—'}
                </td>
              ))}
            </tr>

            {/* Availability */}
            <tr>
              <td className="p-3.5 font-bold text-muted bg-slate-50/50">Stock Status</td>
              {products.map((p) => (
                <td key={p.id} className="p-3.5">
                  <span className={`font-bold ${p.availability === 'unavailable' ? 'text-error' : 'text-success'}`}>
                    {availabilityLabel(p.availability)}
                  </span>
                </td>
              ))}
            </tr>

            {/* Condition */}
            <tr>
              <td className="p-3.5 font-bold text-muted bg-slate-50/50">Condition</td>
              {products.map((p) => (
                <td key={p.id} className="p-3.5 text-ink font-medium">
                  {conditionLabel(p.laptop_condition)}
                </td>
              ))}
            </tr>

            {/* Processor */}
            <tr>
              <td className="p-3.5 font-bold text-muted bg-slate-50/50">Processor (CPU)</td>
              {products.map((p) => (
                <td key={p.id} className="p-3.5 font-bold text-ink">
                  {p.processor_model || '—'}
                </td>
              ))}
            </tr>

            {/* RAM */}
            <tr>
              <td className="p-3.5 font-bold text-muted bg-slate-50/50">RAM Memory</td>
              {products.map((p) => (
                <td key={p.id} className="p-3.5 font-bold text-ink">
                  {p.ram ? `${p.ram} ${p.ram_type || ''}` : '—'}
                </td>
              ))}
            </tr>

            {/* Storage */}
            <tr>
              <td className="p-3.5 font-bold text-muted bg-slate-50/50">Storage Capacity</td>
              {products.map((p) => (
                <td key={p.id} className="p-3.5 font-bold text-ink">
                  {p.storage_capacity ? `${p.storage_capacity} ${p.storage_type || ''}` : '—'}
                </td>
              ))}
            </tr>

            {/* Screen Size & Display */}
            <tr>
              <td className="p-3.5 font-bold text-muted bg-slate-50/50">Display Screen</td>
              {products.map((p) => (
                <td key={p.id} className="p-3.5 text-ink">
                  {p.screen_size || '—'} {p.screen_resolution ? `(${p.screen_resolution})` : ''}
                </td>
              ))}
            </tr>

            {/* Graphics */}
            <tr>
              <td className="p-3.5 font-bold text-muted bg-slate-50/50">Graphics GPU</td>
              {products.map((p) => (
                <td key={p.id} className="p-3.5 text-ink">
                  {p.graphics || 'Intel / Integrated HD'}
                </td>
              ))}
            </tr>

            {/* Operating System */}
            <tr>
              <td className="p-3.5 font-bold text-muted bg-slate-50/50">Operating System</td>
              {products.map((p) => (
                <td key={p.id} className="p-3.5 text-ink">
                  {p.operating_system || 'Windows 10 / 11 Pro Ready'}
                </td>
              ))}
            </tr>

            {/* Warranty */}
            <tr>
              <td className="p-3.5 font-bold text-muted bg-slate-50/50">Warranty</td>
              {products.map((p) => (
                <td key={p.id} className="p-3.5 text-ink font-medium">
                  {p.warranty || 'Not specified'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
