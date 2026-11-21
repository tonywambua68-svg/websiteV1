import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSupabase } from '@/lib/supabase'
import { formatKES } from '@/lib/commerce'
import { trackEvent } from '@/components/Analytics'
import { ArrowRight, Package } from 'lucide-react'

interface MentionedProduct {
  id: string
  slug: string
  name: string
  selling_price: number | null
  image_url: string | null
  brand_name: string | null
  availability: string | null
}

interface ProductMentionsProps {
  productIds: string[]
  articleSlug: string
  categorySlug?: string | null
  categoryName?: string | null
}

/**
 * Shows only published products that the article explicitly references.
 * Copies are deliberately neutral: no claim about stock is invented here.
 */
export default function ProductMentions({ productIds, articleSlug, categorySlug, categoryName }: ProductMentionsProps) {
  const [products, setProducts] = useState<MentionedProduct[]>([])

  useEffect(() => {
    const ids = (productIds || []).filter(Boolean)
    if (ids.length === 0) {
      setProducts([])
      return
    }
    const supabase = getSupabase()
    if (!supabase) return
    let cancelled = false
    supabase
      .from('catalogue_products')
      .select('id, slug, name, selling_price, image_url, brand_name, availability')
      .in('id', ids)
      .then(({ data }) => {
        if (cancelled) return
        const rows = ((data || []) as MentionedProduct[]).filter((product) => product && product.slug)
        setProducts(rows)
      })
    return () => {
      cancelled = true
    }
  }, [productIds])

  if (products.length === 0 && !categorySlug) return null

  return (
    <section className="mt-10 rounded-2xl border border-line bg-card p-5 shadow-xs sm:p-6">
      <div className="flex items-start gap-2">
        <Package className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />
        <div>
          <h2 className="font-display text-base font-bold text-ink">
            {products.length > 0 ? 'Products mentioned in this guide' : 'Explore the catalogue'}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {products.length > 0
              ? 'These items are listed on OREMITECH. Open a product to see its current specifications and price.'
              : 'Browse related products and confirm current specifications and price before ordering.'}
          </p>
        </div>
      </div>

      {products.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.slug}`}
              onClick={() => trackEvent('article_product_click', { article: articleSlug, product: product.slug })}
              className="group flex items-center gap-3 rounded-xl border border-line bg-mist/40 p-3 transition hover:border-emerald hover:bg-mist"
            >
              <div className="h-14 w-16 shrink-0 overflow-hidden rounded-lg bg-white">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[9px] font-bold text-muted">OREMITECH</div>
                )}
              </div>
              <div className="min-w-0">
                <p className="line-clamp-2 text-xs font-bold text-ink group-hover:text-emerald">{product.name}</p>
                <p className="mt-0.5 text-[11px] text-muted">
                  {product.brand_name ? `${product.brand_name} · ` : ''}
                  {product.selling_price != null ? formatKES(Number(product.selling_price)) : 'See listing'}
                </p>
              </div>
              <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 text-muted group-hover:text-emerald" />
            </Link>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {categorySlug && (
          <Link
            to={`/shop?category=${categorySlug}`}
            onClick={() => trackEvent('article_category_click', { article: articleSlug, category: categorySlug })}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-[11px] font-bold text-ink transition hover:border-emerald hover:text-emerald"
          >
            Browse {categoryName || 'related products'} <ArrowRight className="h-3 w-3" />
          </Link>
        )}
        <Link
          to="/shop"
          onClick={() => trackEvent('article_shop_click', { article: articleSlug })}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald px-3 py-2 text-[11px] font-bold text-white transition hover:bg-emeralddeep"
        >
          View the full catalogue <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </section>
  )
}
