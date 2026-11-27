import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useProductStore } from '@/store/productStore'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useAuthStore } from '@/store/authStore'
import { usePageMeta } from '@/components/Analytics'
import { useSettingsStore } from '@/store/settingsStore'
import type { CatalogueProduct } from '@/lib/domain'
import { getSupabase } from '@/lib/supabase'
import ProductCard from '@/components/ProductCard'
import ProductImageGallery from '@/components/ProductImageGallery'
import RecentlyViewed, { recordRecentlyViewed } from '@/components/RecentlyViewed'
import { useCompareStore } from '@/store/compareStore'
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
  Star,
  User,
  Send,
  Clock,
  Edit2,
} from 'lucide-react'

const PLACEHOLDER = '/images/products/laptop-placeholder.svg'

export default function ProductDetail() {
  const supportPhone = useSettingsStore((state) => state.settings.whatsapp_e164)
  const { user } = useAuthStore()
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

  // Reviews
  const [reviews, setReviews] = useState<Array<{ id: string; rating: number; body: string; created_at: string; profiles?: { full_name: string | null } | null }>>([])
  const [avgRating, setAvgRating] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)
  const [userReview, setUserReview] = useState<{ id: string; rating: number; body: string; status: string } | null>(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewBody, setReviewBody] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewFeedback, setReviewFeedback] = useState<string | null>(null)
  // null = not yet checked / check unavailable; true = verified purchaser; false = not eligible
  const [canReview, setCanReview] = useState<boolean | null>(null)

  // Enquire / request a call
  const [enqName, setEnqName] = useState('')
  const [enqPhone, setEnqPhone] = useState('')
  const [enqMessage, setEnqMessage] = useState('')
  const [submittingEnq, setSubmittingEnq] = useState(false)
  const [enqFeedback, setEnqFeedback] = useState<string | null>(null)

  // Tabs
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description')

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
    fetchProductBySlug(identifier).then(async (found) => {
      if (!isMounted) return
      setProduct(found)
      if (found) {
        recordRecentlyViewed(found.id)
        fetchRelated(found).then((rel) => {
          if (isMounted) setRelated(rel)
        })
        await loadReviews(found.id)
      }
      setLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [identifier, fetchProductBySlug, fetchRelated])

  const loadReviews = async (productId: string) => {
    const supabase = getSupabase()
    if (!supabase) return
    try {
      const [publishedRes, ownRes] = await Promise.all([
        supabase
          .from('product_reviews')
          .select(`id, rating, body, created_at, profiles(full_name)`)
          .eq('product_id', productId)
          .eq('status', 'published')
          .order('created_at', { ascending: false }),
        user
          ? supabase.from('product_reviews').select('id, rating, body, status').eq('product_id', productId).eq('user_id', user.id).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ])
      if (publishedRes.error) throw publishedRes.error
      const rows = (publishedRes.data ?? []) as unknown as Array<{ id: string; rating: number; body: string; created_at: string; profiles?: { full_name: string | null } | null }>
      setReviews(rows)
      setReviewCount(rows.length)
      setAvgRating(rows.length > 0 ? Math.round((rows.reduce((s, r) => s + r.rating, 0) / rows.length) * 10) / 10 : 0)
      if (ownRes && !ownRes.error && ownRes.data) setUserReview(ownRes.data as { id: string; rating: number; body: string; status: string })
      // Purchase verification: only verified buyers may review (graceful fallback if RPC not yet deployed)
      if (user) {
        const { data: eligible, error: eligErr } = await supabase.rpc('has_purchased_product', {
          p_product_id: productId,
        })
        if (!eligErr) setCanReview(Boolean(eligible))
      }
    } catch (err: any) {
      setReviewFeedback(`Could not load reviews: ${err.message}`)
    }
  }

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
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setReviewFeedback('Please sign in to leave a review.')
      return
    }
    if (userReview) {
      setReviewFeedback('You have already submitted a review for this product.')
      return
    }
    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      setReviewFeedback('Please select a rating between 1 and 5 stars.')
      return
    }
    if (!reviewBody || reviewBody.trim().length < 2) {
      setReviewFeedback('Please write a short review (2+ characters).')
      return
    }
    const supabase = getSupabase()
    if (!supabase) return
    setSubmittingReview(true)
    setReviewFeedback(null)
    try {
      const { error } = await supabase.from('product_reviews').insert({
        product_id: product!.id,
        user_id: user.id,
        rating: reviewRating,
        body: reviewBody.trim(),
      })
      if (error) throw error
      setReviewFeedback('Thanks! Your review is pending approval before it appears.')
      setReviewRating(0)
      setReviewBody('')
      setUserReview({ id: '', rating: reviewRating, body: reviewBody.trim(), status: 'pending' })
      await loadReviews(product!.id)
    } catch (err: any) {
      setReviewFeedback(`Could not submit review: ${err.message}`)
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleSubmitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!enqName || enqName.trim().length < 2) {
      setEnqFeedback('Please enter your name.')
      return
    }
    if (!enqMessage || enqMessage.trim().length < 5) {
      setEnqFeedback('Please write a short message (5+ characters).')
      return
    }
    const supabase = getSupabase()
    if (!supabase) return
    setSubmittingEnq(true)
    setEnqFeedback(null)
    try {
      const { error } = await supabase.from('customer_inquiries').insert({
        name: enqName.trim(),
        phone: enqPhone.trim() || null,
        message: enqMessage.trim(),
        product_id: product!.id,
      })
      if (error) throw error
      setEnqFeedback('Your enquiry has been logged. We’ll contact you shortly.')
      setEnqName('')
      setEnqPhone('')
      setEnqMessage('')
    } catch (err: any) {
      setEnqFeedback(`Could not log enquiry: ${err.message}`)
    } finally {
      setSubmittingEnq(false)
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
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-primary"
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
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-primary">
              {product.brand_name || 'Verified Tech'}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-muted">
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
          <div className="mt-5 flex items-baseline gap-3 rounded-xl border border-line bg-white p-4 shadow-xs">
            <span className="font-display text-3xl font-extrabold text-ink">
              {formatKES(product.selling_price)}
            </span>
            {product.comparison_price && product.comparison_price > product.selling_price && (
              <span className="text-base text-muted line-through">
                {formatKES(product.comparison_price)}
              </span>
            )}
            <span className="ml-auto text-xs font-bold text-success flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Genuine Price
            </span>
          </div>

          {/* Availability Status */}
          <div className="mt-4 flex items-center gap-2 text-xs">
            <CheckCircle2 className={`h-4 w-4 ${isAvailable ? 'text-success' : 'text-error'}`} />
            <span className={`font-bold ${isAvailable ? 'text-success' : 'text-error'}`}>
              {availabilityLabel(product.availability)}
            </span>
            {isAvailable && (
              <span className="text-muted">
                ({product.owned_available > 0 ? `${product.owned_available} units in Nairobi stock` : 'Fulfilled from verified supplier'})
              </span>
            )}
          </div>

          {/* Quantity and Actions */}
          <div className="mt-6 space-y-3 border-t border-line pt-5">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-muted">Quantity:</span>
              <div className="flex items-center rounded-lg border border-line bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => clampQuantity(q - 1, maxStock))}
                  disabled={quantity <= 1}
                  className="grid h-9 w-9 place-items-center hover:bg-slate-100 disabled:opacity-40"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center font-bold text-ink">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => clampQuantity(q + 1, maxStock))}
                  disabled={quantity >= maxStock}
                  className="grid h-9 w-9 place-items-center hover:bg-slate-100 disabled:opacity-40"
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
                className="btn btn-primary !h-12 w-full font-bold shadow-sm disabled:opacity-50"
              >
                <ShoppingCart className="h-4 w-4" /> Add to Cart
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!isAvailable}
                className="btn btn-dark !h-12 w-full font-bold shadow-sm disabled:opacity-50"
              >
                Buy Now
              </button>
            </div>

            {feedback && (
              <div className="rounded-lg border border-primary/20 bg-blue-50 p-3 text-center text-xs font-bold text-primary animate-fade">
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
                <Phone className="h-4 w-4 text-success" /> Inquire via WhatsApp
              </a>
            )}

            {/* Enquire / request a call — logged so the team can follow up */}
            <form onSubmit={handleSubmitEnquiry} className="mt-3 border rounded-xl p-3 space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted">Request a call or enquire</h4>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  type="text"
                  value={enqName}
                  onChange={(e) => setEnqName(e.target.value)}
                  placeholder="Your name"
                  className="input text-xs"
                  required
                />
                <input
                  type="tel"
                  value={enqPhone}
                  onChange={(e) => setEnqPhone(e.target.value)}
                  placeholder="Phone (WhatsApp)"
                  className="input text-xs"
                />
              </div>
              <textarea
                value={enqMessage}
                onChange={(e) => setEnqMessage(e.target.value)}
                rows={2}
                placeholder="What would you like to know about this product?"
                className="input w-full text-xs"
                required
              />
              {enqFeedback && (
                <p className={`text-xs font-bold ${enqFeedback.startsWith('Your enquiry') ? 'text-tealdeep' : 'text-error'}`}>{enqFeedback}</p>
              )}
              <button
                type="submit"
                disabled={submittingEnq}
                className="btn btn-primary !h-9 w-full text-xs font-bold shadow-xs disabled:opacity-50"
              >
                {submittingEnq ? 'Logging…' : 'Send Enquiry'}
              </button>
            </form>
          </div>

          {/* Guarantees */}
          <div className="mt-8 grid grid-cols-2 gap-3 rounded-xl border border-line bg-white p-4 text-xs shadow-xs">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary shrink-0" />
              <span>Delivery options shown at checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-success shrink-0" />
              <span>{product.warranty || 'See specifications for warranty details'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications Table */}
      <section className="mt-14 rounded-xl border border-line bg-white p-6 shadow-xs">
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

      {/* Description / Reviews tabs */}
      <section className="mt-14 rounded-xl border border-line bg-white shadow-xs overflow-hidden">
        <div className="border-b border-line flex bg-slate-50/50">
          <button
            type="button"
            onClick={() => setActiveTab('description')}
            className={`-mb-px border-b-2 px-6 py-3.5 text-xs sm:text-sm font-bold transition-colors ${activeTab === 'description' ? 'border-primary text-primary bg-white' : 'border-transparent text-slate-500 hover:text-ink'}`}
          >
            Product Description
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`-mb-px border-b-2 px-6 py-3.5 text-xs sm:text-sm font-bold transition-colors ${activeTab === 'reviews' ? 'border-primary text-primary bg-white' : 'border-transparent text-slate-500 hover:text-ink'}`}
          >
            Customer Reviews ({reviewCount})
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'description' && (
            <div className="prose prose-sm text-ink/80 max-w-none">
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
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-ink">{avgRating.toFixed(1)}</span>
                  <span className="text-lg text-muted">({reviewCount} review{reviewCount === 1 ? '' : 's'})</span>
                </div>
                <div className="mt-3 max-w-sm space-y-1.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviews.filter((r) => r.rating === star).length
                    const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0
                    return (
                      <div key={star} className="flex items-center gap-2 text-[11px]">
                        <span className="flex w-9 items-center gap-0.5 font-semibold text-muted">
                          {star} <Star className="h-3 w-3 fill-current text-amber-400" />
                        </span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-6 text-right font-semibold text-muted">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="border rounded-xl p-4">
                <h3 className="text-sm font-bold text-ink mb-3">Customer Reviews</h3>
                {reviews.length === 0 ? (
                  <p className="text-sm text-muted">No reviews yet. Be the first to share your experience.</p>
                ) : (
                  reviews.map((r) => (
                    <div key={r.id} className="pb-4 border-b border-line/60 last:border-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-ink">{r.profiles?.full_name || 'A customer'}</span>
                        <span className="text-xs text-muted">{r.created_at.slice(0, 10)}</span>
                      </div>
                      <div className="flex gap-1 text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`h-4 w-4 ${s <= r.rating ? 'fill-current' : 'text-muted'}`} />
                        ))}
                      </div>
                      <p className="mt-1 text-sm text-ink/90">{r.body}</p>
                    </div>
                  ))
                )}
              </div>

              {user ? (
                userReview ? (
                  <div className="rounded-xl border border-teal/30 bg-mint/50 p-3 text-xs">
                    <p className="font-bold text-tealdeep">Your review (pending approval)</p>
                    <p className="mt-1 text-tealdeep/90">{userReview.body}</p>
                    <div className="mt-2 flex gap-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`h-4 w-4 ${s <= userReview.rating ? 'fill-current' : 'text-muted'}`} />
                      ))}
                    </div>
                  </div>
                ) : canReview === false ? (
                  <div className="rounded-xl border border-line bg-mist p-4 text-center">
                    <p className="text-sm font-bold text-ink">Verified purchase required</p>
                    <p className="mt-1 text-xs text-muted">
                      You can review this product once you have a delivered order for it. This keeps reviews genuine.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview} className="border rounded-xl p-4 space-y-3">
                    <h3 className="text-sm font-bold text-ink">Leave a Review</h3>
                    <div>
                      <label className="block text-xs font-bold text-muted mb-1">Your rating</label>
                      <div className="flex gap-1" role="radiogroup" aria-label="Star rating">
                        {[5, 4, 3, 2, 1].map((s) => (
                          <button
                            type="button"
                            key={s}
                            onClick={() => setReviewRating(s)}
                            aria-label={`Rate ${s} stars`}
                            className={`rounded p-1 ${reviewRating === s ? 'text-amber-400' : 'text-muted hover:text-amber-400'}`}
                          >
                            <Star className="h-5 w-5" />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted mb-1">Your review</label>
                      <textarea
                        value={reviewBody}
                        onChange={(e) => setReviewBody(e.target.value)}
                        rows={3}
                        placeholder="Share your experience with this laptop…"
                        className="input w-full text-xs"
                      />
                    </div>
                    {reviewFeedback && (
                      <p className={`text-xs font-bold ${reviewFeedback.startsWith('Thanks') || reviewFeedback.startsWith('You') ? 'text-tealdeep' : 'text-error'}`}>{reviewFeedback}</p>
                    )}
                    <button
                      type="submit"
                      disabled={submittingReview || !reviewRating || !reviewBody.trim()}
                      className="btn btn-emerald !h-9 text-xs font-bold shadow-xs disabled:opacity-50"
                    >
                      {submittingReview ? 'Submitting…' : 'Submit Review'}
                    </button>
                  </form>
                )
              ) : (
                <div className="rounded-xl border border-line bg-mist p-4 text-center">
                  <p className="text-sm font-bold text-ink">Sign in to leave a review</p>
                  <p className="mt-1 text-xs text-muted">Reviews are reviewed before they appear.</p>
                  <Link to="/login" className="mt-3 inline-block btn btn-emerald !h-9 text-xs font-bold shadow-xs">
                    <User className="h-3.5 w-3.5 mr-1" /> Sign in
                  </Link>
                </div>
              )}
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

      {/* Recently Viewed Products */}
      <RecentlyViewed currentProductId={product.id} />
    </div>
  )
}

