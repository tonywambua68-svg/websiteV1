import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useProductStore } from '@/store/productStore'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { usePageMeta } from '@/components/Analytics'
import { useSettingsStore } from '@/store/settingsStore'
import type { CatalogueProduct } from '@/lib/domain'
import ProductCard from '@/components/ProductCard'
import ProductImageGallery from '@/components/ProductImageGallery'
import {
  formatKES,
  availabilityLabel,
  conditionLabel,
  whatsappHref,
  clampQuantity,
  availableUnits,
} from '@/lib/commerce'
import DOMPurify from 'dompurify'
import parse from 'html-react-parser'
import {
  Heart,
  ShoppingCart,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Phone,
  ArrowLeft,
  Minus,
  Plus,
  Share2,
} from 'lucide-react'

const PLACEHOLDER = '/images/products/laptop-placeholder.svg'

export default function ProductDetail() {
  const supportPhone = useSettingsStore((state) => state.settings.whatsapp_e164)
  const { slug, id } = useParams<{ slug?: string; id?: string }>()
  const identifier = slug || id
  const navigate = useNavigate()

  const { fetchProductBySlug, fetchRelated } = useProductStore()
  const addItem = useCartStore((state) => state.addItem)
  const inWishlist = useWishlistStore((state) => (identifier ? state.has(identifier) : false))
  const toggleWishlist = useWishlistStore((state) => state.toggle)

  const [product, setProduct] = useState<CatalogueProduct | null>(null)
  const [related, setRelated] = useState<CatalogueProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // SEO meta tags — updates document head when product data loads
  const pageTitle = product ? (product.seo_title || product.name) : 'Product · OREMITECH'
  const pageDescription = product ? (product.seo_description || product.description || '') : ''
  usePageMeta(pageTitle, pageDescription)

  useEffect(() => {
    let isMounted = true
    window.scrollTo({ top: 0, behavior: 'smooth' })

    if (!identifier) {
      setLoading(false)
      return
    }

    setLoading(true)
    fetchProductBySlug(identifier).then((found) => {
      if (!isMounted) return
      setProduct(found)
      if (found) {
        fetchRelated(found).then((rel) => {
          if (isMounted) setRelated(rel)
        })
      }
      setLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [identifier, fetchProductBySlug, fetchRelated])

  // Inject Open Graph, canonical, and JSON-LD into document head for SEO
  useEffect(() => {
    if (!product) return

    const head = document.head
    const baseUrl = window.location.origin
    const productUrl = `${baseUrl}/product/${product.slug}`
    const title = product.seo_title || `${product.name} · OREMITECH`
    const description = product.seo_description || product.description || ''
    const socialTitle = product.seo_social_title || product.seo_title || product.name
    const socialDescription = product.seo_social_description || product.seo_description || product.description || ''
    const imageUrl = product.images?.[0]?.url || product.image_url || ''
    const altText = product.images?.[0]?.alt || product.name

    // Remove previously injected tags (by data-seo attribute)
    head.querySelectorAll('[data-seo]').forEach((el) => el.remove())

    const addMeta = (name: string, content: string, property?: boolean) => {
      const meta = document.createElement('meta')
      meta.setAttribute('data-seo', 'true')
      if (property) {
        meta.setAttribute('property', name)
      } else {
        meta.setAttribute('name', name)
      }
      meta.setAttribute('content', content)
      head.appendChild(meta)
    }

    // Update document title
    document.title = title

    // Canonical link
    const existingCanonical = head.querySelector('link[rel="canonical"][data-seo]')
    if (!existingCanonical) {
      const link = document.createElement('link')
      link.setAttribute('rel', 'canonical')
      link.setAttribute('href', productUrl)
      link.setAttribute('data-seo', 'true')
      head.appendChild(link)
    }

    // Meta tags
    addMeta('description', description)
    addMeta('robots', 'index,follow')

    // Open Graph
    addMeta('og:type', 'product', true)
    addMeta('og:title', socialTitle, true)
    addMeta('og:description', socialDescription, true)
    addMeta('og:url', productUrl, true)
    if (imageUrl) addMeta('og:image', imageUrl, true)
    addMeta('og:price:amount', String(product.selling_price), true)
    addMeta('og:price:currency', 'KES', true)

    // Product-specific OG
    addMeta('product:price:amount', String(product.selling_price), true)
    addMeta('product:price:currency', 'KES', true)
    addMeta('product:condition', product.laptop_condition, true)
    addMeta('product:availability', product.availability, true)

    // JSON-LD Product structured data
    const jsonLd = document.createElement('script')
    jsonLd.setAttribute('type', 'application/ld+json')
    jsonLd.setAttribute('data-seo', 'true')
    const offerAvailability =
      product.availability === 'in_stock'
        ? 'https://schema.org/InStock'
        : product.availability === 'supplier'
          ? 'https://schema.org/LimitedAvailability'
          : 'https://schema.org/OutOfStock'
    const structuredData: Record<string, unknown> = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: product.name,
      slug: product.slug,
      image: imageUrl || null,
      description: description || null,
      brand: {
        '@type': 'Brand',
        name: product.brand_name || null,
      },
      offers: {
        '@type': 'Offer',
        price: String(product.selling_price),
        priceCurrency: 'KES',
        availability: offerAvailability,
        url: productUrl,
      },
    }
    if (product.comparison_price && product.comparison_price > product.selling_price) {
      structuredData.aggregateOffer = {
        '@type': 'AggregateOffer',
        lowPrice: String(product.selling_price),
        highPrice: String(product.comparison_price),
        priceCurrency: 'KES',
      }
    }
    if (product.model) structuredData.model = product.model
    if (product.weight) structuredData.weight = product.weight
    if (product.colour) structuredData.color = product.colour
    jsonLd.textContent = JSON.stringify(structuredData)
    head.appendChild(jsonLd)

    return () => {
      head.querySelectorAll('[data-seo]').forEach((el) => el.remove())
    }
  }, [product])

  if (loading) {
    return (
      <div className="wrap py-16 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-teal border-t-transparent" />
        <p className="mt-4 font-display text-sm font-semibold text-muted">Loading product specifications…</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="wrap py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">Product Not Found</h1>
        <p className="mt-2 text-sm text-muted">
          The requested product could not be found or may no longer be published.
        </p>
        <Link to="/shop" className="btn btn-emerald mt-6">
          Browse All Products
        </Link>
      </div>
    )
  }

  const maxStock = availableUnits(product.owned_available, product.supplier_available)
  const isAvailable = maxStock > 0

  const handleAddToCart = async () => {
    if (!isAvailable) return
    const success = await addItem(product, quantity)
    if (success) {
      setFeedback(`Added ${quantity} item(s) to your cart!`)
      setTimeout(() => setFeedback(null), 3500)
    } else {
      setFeedback('Unable to add item. Check available stock.')
    }
  }

  const handleBuyNow = async () => {
    if (!isAvailable) return
    const success = await addItem(product, quantity)
    if (success) {
      navigate('/checkout')
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        url: window.location.href,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const waText = `Hello OREMITECH, I am interested in: ${product.name} (Price: ${formatKES(product.selling_price)}). Is it currently available for delivery?`
  const waLink = supportPhone ? whatsappHref(supportPhone, waText) : null

  return (
    <div className="wrap py-6">
      {/* Breadcrumb / Back button */}
      <div className="flex items-center justify-between pb-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Back to catalogue
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-teal"
        >
          <Share2 className="h-3.5 w-3.5" /> {copied ? 'Link copied!' : 'Share product'}
        </button>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Left: Image Gallery */}
        <div className="relative">
          <ProductImageGallery
            images={
              product.images?.length > 0
                ? product.images.map((img) => ({ url: img.url, alt: img.alt || product.name }))
                : [{ url: product.image_url || PLACEHOLDER, alt: product.name }]
            }
          />
          <button
            type="button"
            onClick={() => toggleWishlist(product.id)}
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-line bg-card shadow-sm transition"
          >
            <Heart className={`h-5 w-5 ${inWishlist ? 'fill-current text-error' : 'text-muted hover:text-ink'}`} />
          </button>
        </div>

        {/* Right: Product Details & Actions */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-teal/10 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-teal">
              {product.brand_name || 'Verified Tech'}
            </span>
            <span className="rounded-full bg-mist px-2.5 py-0.5 text-[11px] font-semibold text-muted">
              {conditionLabel(product.laptop_condition)}
            </span>
          </div>

          <h1 className="mt-3 font-display text-2xl font-bold leading-tight text-ink md:text-3xl">
            {product.name}
          </h1>

          <p className="mt-2 text-xs font-semibold text-muted">
            Category: <span className="text-ink">{product.category_name}</span> · Model: <span className="text-ink">{product.model || product.name}</span>
          </p>

          {/* Pricing */}
          <div className="mt-5 flex items-baseline gap-3 rounded-xl border border-line bg-card p-4">
            <span className="font-display text-3xl font-extrabold text-ink">
              {formatKES(product.selling_price)}
            </span>
            {product.comparison_price && product.comparison_price > product.selling_price && (
              <span className="text-base text-muted line-through">
                {formatKES(product.comparison_price)}
              </span>
            )}
            <span className="ml-auto text-xs font-bold text-teal">
              Tax Inclusive
            </span>
          </div>

          {/* Availability Status */}
          <div className="mt-4 flex items-center gap-2 text-xs">
            <CheckCircle2 className={`h-4 w-4 ${isAvailable ? 'text-teal' : 'text-error'}`} />
            <span className={`font-bold ${isAvailable ? 'text-teal' : 'text-error'}`}>
              {availabilityLabel(product.availability)}
            </span>
            {isAvailable && (
              <span className="text-muted">
                ({product.owned_available > 0 ? `${product.owned_available} units at Oremitech` : 'Fulfilled from verified supplier'})
              </span>
            )}
          </div>

          {/* Description */}
          <div className="mt-5 border-t border-line pt-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Overview</h2>
            <div className="mt-1.5 prose prose-sm text-ink/80 max-w-none">
              {product.description ? (
                parse(DOMPurify.sanitize(product.description), {
                  replace: (domNode: any) => {
                    if (domNode.tagName === 'A') {
                      return { ...domNode, target: '_blank', rel: 'noopener noreferrer' }
                    }
                    return domNode
                  },
                })
              ) : (
                <p className="text-sm text-muted">No description available.</p>
              )}
            </div>
          </div>

          {/* Quantity and Actions */}
          <div className="mt-6 space-y-3 border-t border-line pt-5">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-muted">Quantity:</span>
              <div className="flex items-center rounded-lg border border-line bg-card">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => clampQuantity(q - 1, maxStock))}
                  disabled={quantity <= 1}
                  className="grid h-9 w-9 place-items-center hover:bg-mist disabled:opacity-40"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center font-bold text-ink">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => clampQuantity(q + 1, maxStock))}
                  disabled={quantity >= maxStock}
                  className="grid h-9 w-9 place-items-center hover:bg-mist disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="text-[11px] text-muted">Max {Math.min(10, maxStock)} per order</span>
            </div>

            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!isAvailable}
                className="btn btn-amber !h-12 w-full font-bold shadow-sm disabled:opacity-50"
              >
                <ShoppingCart className="h-4 w-4" /> Add to Cart
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!isAvailable}
                className="btn btn-outline !h-12 w-full font-bold shadow-sm disabled:opacity-50"
              >
                Buy Now
              </button>
            </div>

            {feedback && (
              <div className="rounded-lg border border-teal/30 bg-mint/40 p-3 text-center text-xs font-bold text-tealdeep animate-fade">
                {feedback}
              </div>
            )}

            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline !h-11 w-full gap-2 text-xs font-bold"
              >
                <Phone className="h-4 w-4 text-emerald-600" /> Inquire via WhatsApp
              </a>
            )}
          </div>

          {/* Guarantees */}
          <div className="mt-8 grid grid-cols-2 gap-3 rounded-xl border border-line bg-card p-4 text-xs">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-teal shrink-0" />
              <span>Doorstep delivery nationwide in Kenya</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-teal shrink-0" />
              <span>{product.warranty || 'Physical warranty verification included'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications Table */}
      <section className="mt-14 rounded-2xl border border-line bg-card p-6 shadow-sm">
        <h2 className="font-display text-lg font-bold text-ink">Technical Specifications</h2>
        <div className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {product.processor_model && (
            <div className="flex justify-between border-b border-line/60 py-2 text-xs">
              <span className="font-semibold text-muted">Processor</span>
              <span className="font-bold text-ink">{product.processor_model}</span>
            </div>
          )}
          {product.ram && (
            <div className="flex justify-between border-b border-line/60 py-2 text-xs">
              <span className="font-semibold text-muted">RAM</span>
              <span className="font-bold text-ink">{product.ram} {product.ram_type || ''}</span>
            </div>
          )}
          {product.storage_capacity && (
            <div className="flex justify-between border-b border-line/60 py-2 text-xs">
              <span className="font-semibold text-muted">Storage</span>
              <span className="font-bold text-ink">{product.storage_capacity} {product.storage_type || ''}</span>
            </div>
          )}
          {product.screen_size && (
            <div className="flex justify-between border-b border-line/60 py-2 text-xs">
              <span className="font-semibold text-muted">Display</span>
              <span className="font-bold text-ink">{product.screen_size}</span>
            </div>
          )}
          {product.graphics && (
            <div className="flex justify-between border-b border-line/60 py-2 text-xs">
              <span className="font-semibold text-muted">Graphics</span>
              <span className="font-bold text-ink">{product.graphics}</span>
            </div>
          )}
          {product.operating_system && (
            <div className="flex justify-between border-b border-line/60 py-2 text-xs">
              <span className="font-semibold text-muted">Operating System</span>
              <span className="font-bold text-ink">{product.operating_system}</span>
            </div>
          )}
          {product.battery_condition && (
            <div className="flex justify-between border-b border-line/60 py-2 text-xs">
              <span className="font-semibold text-muted">Battery Condition</span>
              <span className="font-bold text-ink">{product.battery_condition}</span>
            </div>
          )}
          {product.keyboard_layout && (
            <div className="flex justify-between border-b border-line/60 py-2 text-xs">
              <span className="font-semibold text-muted">Keyboard</span>
              <span className="font-bold text-ink">{product.keyboard_layout}</span>
            </div>
          )}
          {product.warranty && (
            <div className="flex justify-between border-b border-line/60 py-2 text-xs">
              <span className="font-semibold text-muted">Warranty</span>
              <span className="font-bold text-ink">{product.warranty}</span>
            </div>
          )}
          {product.weight && (
            <div className="flex justify-between border-b border-line/60 py-2 text-xs">
              <span className="font-semibold text-muted">Weight</span>
              <span className="font-bold text-ink">{product.weight}</span>
            </div>
          )}
          {product.colour && (
            <div className="flex justify-between border-b border-line/60 py-2 text-xs">
              <span className="font-semibold text-muted">Colour</span>
              <span className="font-bold text-ink">{product.colour}</span>
            </div>
          )}
        </div>
      </section>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-14 border-t border-line pt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">Related Hardware</h2>
              <p className="mt-1 text-xs text-muted">Similar laptops and complementary equipment.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-xs font-bold text-teal hover:underline"
            >
              View all →
            </button>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

