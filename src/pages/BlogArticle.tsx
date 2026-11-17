import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useBlogStore } from '@/store/blogStore'
import { usePageMeta } from '@/components/Analytics'
import DOMPurify from 'dompurify'
import parse from 'html-react-parser'
import { Calendar, User, ArrowLeft, Mail, Phone, Share2 } from 'lucide-react'
import type { BlogArticle } from '@/lib/domain'

function formatDate(dateString: string | null): string {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function BlogArticlePage() {
  const { slug } = useParams<{ slug?: string }>()
  const navigate = useNavigate()
  const { fetchArticleBySlug, articles } = useBlogStore()
  const [article, setArticle] = useState<BlogArticle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) {
      setLoading(false)
      return
    }
    const existing = articles.find((a) => a.slug === slug)
    if (existing) {
      setArticle(existing)
      setLoading(false)
      return
    }
    setLoading(true)
    fetchArticleBySlug(slug).then((found) => {
      setArticle(found)
      setLoading(false)
    })
  }, [slug, fetchArticleBySlug, articles])

  // SEO meta tags + structured data
  useEffect(() => {
    if (!article) return

    const head = document.head
    const baseUrl = window.location.origin
    const articleUrl = `${baseUrl}/blog/${article.slug}`
    const title = article.seo_title || `${article.title} · OREMITECH Blog`
    const description = article.seo_description || article.excerpt || ''
    const socialTitle = article.seo_social_title || article.seo_title || article.title
    const socialDescription = article.seo_social_description || article.seo_description || article.excerpt || ''
    const imageUrl = article.featured_image_url || ''

    head.querySelectorAll('[data-seo]').forEach((el) => el.remove())

    document.title = title

    const canonical = document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    canonical.setAttribute('href', articleUrl)
    canonical.setAttribute('data-seo', 'true')
    head.appendChild(canonical)

    const addMeta = (name: string, content: string, property?: boolean) => {
      const meta = document.createElement('meta')
      meta.setAttribute('data-seo', 'true')
      if (property) meta.setAttribute('property', name)
      else meta.setAttribute('name', name)
      meta.setAttribute('content', content)
      head.appendChild(meta)
    }

    addMeta('description', description)
    addMeta('robots', 'index,follow')

    // Open Graph
    addMeta('og:type', 'article', true)
    addMeta('og:title', socialTitle, true)
    addMeta('og:description', socialDescription, true)
    addMeta('og:url', articleUrl, true)
    if (imageUrl) addMeta('og:image', imageUrl, true)
    addMeta('og:site_name', 'OREMITECH', true)
    addMeta('article:published_time', article.published_at || article.created_at, true)
    addMeta('article:modified_time', article.updated_at, true)
    if (article.category) addMeta('article:section', article.category.name, true)

    // JSON-LD BlogPosting
    const jsonLd = document.createElement('script')
    jsonLd.setAttribute('type', 'application/ld+json')
    jsonLd.setAttribute('data-seo', 'true')
    const structuredData: Record<string, unknown> = {
      '@context': 'https://schema.org/',
      '@type': 'BlogPosting',
      headline: article.title,
      description: description,
      image: imageUrl ? [{ '@type': 'ImageObject', url: imageUrl }] : null,
      datePublished: article.published_at || article.created_at,
      dateModified: article.updated_at,
      author: {
        '@type': 'Person',
        name: 'OREMITECH Team',
      },
      publisher: {
        '@type': 'Organization',
        name: 'OREMITECH',
        url: baseUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${baseUrl}/logo.png`,
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': articleUrl,
      },
      url: articleUrl,
    }
    if (article.category) {
      structuredData['articleSection'] = article.category.name
    }
    jsonLd.textContent = JSON.stringify(structuredData)
    head.appendChild(jsonLd)

    return () => {
      head.querySelectorAll('[data-seo]').forEach((el) => el.remove())
    }
  }, [article])

  if (loading) {
    return (
      <div className="wrap py-16 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-teal border-t-transparent" />
        <p className="mt-4 font-display text-sm font-semibold text-muted">Loading article…</p>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="wrap py-16 text-center">
        <h1 className="font-display text-xl font-bold text-ink">Article not found</h1>
        <p className="mt-2 text-sm text-muted">The article you requested does not exist.</p>
        <Link to="/blog" className="mt-4 inline-block btn btn-emerald btn-sm">
          Return to blog
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-mist pb-12">
      <section className="wrap pt-6 md:pt-10">
        {/* Breadcrumb */}
        <nav className="mb-6 text-xs text-muted">
          <Link to="/blog" className="hover:text-emerald">Blog</Link>
          {article.category && (
            <>
              <span className="mx-1">/</span>
              <Link to={`/blog?category=${article.category.slug}`} className="hover:text-emerald">
                {article.category.name}
              </Link>
            </>
          )}
          <span className="mx-1">/</span>
          <span className="text-ink">{article.title}</span>
        </nav>

        <article className="max-w-3xl mx-auto bg-card rounded-xl border border-line p-6 md:p-10 shadow-sm">
          {article.featured_image_url && (
            <div className="mb-6 rounded-lg overflow-hidden bg-mist">
              <img
                src={article.featured_image_url}
                alt={article.featured_image_alt || article.title}
                className="w-full h-64 object-cover"
                loading="eager"
              />
            </div>
          )}

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs text-muted">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(article.published_at)}</span>
            </div>
            <span className="inline-flex items-center gap-1 rounded bg-emerald/10 px-2 py-0.5 text-[10px] font-bold text-emeralddeep">
              {article.category?.name || 'General'}
            </span>
          </div>

          <h1 className="font-display text-2xl font-bold text-ink mb-4 md:text-3xl">
            {article.title}
          </h1>

          <div className="prose prose-invert text-[#4a6b5c] leading-relaxed mb-8 max-w-none">
            {parse(DOMPurify.sanitize(article.content), {
              replace: (domNode: any) => {
                if (domNode.nodeName === 'IMG') {
                  return {
                    ...domNode,
                    attribs: {
                      ...domNode.attribs,
                      class: 'rounded-lg mb-4',
                      loading: 'lazy',
                    },
                  }
                }
                return domNode
              },
            })}
          </div>

          <div className="border-t border-line pt-6 mt-8 flex items-center justify-between">
            <div>
              <h3 className="font-display text-sm font-bold text-ink mb-2">Share this article</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: article.title,
                        url: `${window.location.origin}/blog/${article.slug}`,
                      })
                    } else {
                      navigator.clipboard.writeText(`${window.location.origin}/blog/${article.slug}`)
                    }
                  }}
                  className="p-2 rounded-lg border border-line hover:bg-mist transition"
                  aria-label="Share"
                >
                  <Share2 className="h-4 w-4" />
                </button>
                <a
                  href={`mailto:?subject=${encodeURIComponent(article.title)}&body=${encodeURIComponent(`${window.location.origin}/blog/${article.slug}`)}`}
                  className="p-2 rounded-lg border border-line hover:bg-mist transition"
                  aria-label="Email"
                >
                  <Mail className="h-4 w-4" />
                </a>
              </div>
            </div>
            <Link
              to="/blog"
              className="btn btn-emerald btn-sm"
            >
              <ArrowLeft className="h-3 w-3 mr-2" /> Back to blog
            </Link>
          </div>
        </article>
      </section>
    </div>
  )
}
