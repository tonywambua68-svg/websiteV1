import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useBlogStore } from '@/store/blogStore'
import { trackEvent } from '@/components/Analytics'
import {
  applySeo,
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
} from '@/lib/seo'
import { articleExcerpt, formatArticleDate, isUpdated, readingMinutes } from '@/lib/blog'
import ArticleBody from '@/components/blog/ArticleBody'
import ProductMentions from '@/components/blog/ProductMentions'
import ArticleCard from '@/components/blog/ArticleCard'
import type { BlogArticle } from '@/lib/domain'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  ChevronRight,
  Clock,
  Mail,
  RefreshCw,
  Share2,
  Tag,
  User,
} from 'lucide-react'

export default function BlogArticlePage() {
  const { slug } = useParams<{ slug?: string }>()
  const { fetchArticleBySlug, fetchRelatedArticles } = useBlogStore()
  const [article, setArticle] = useState<BlogArticle | null>(null)
  const [related, setRelated] = useState<BlogArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) {
      setLoading(false)
      setNotFound(true)
      return
    }
    let cancelled = false
    setLoading(true)
    setNotFound(false)
    setArticle(null)
    setRelated([])
    fetchArticleBySlug(slug).then((found) => {
      if (cancelled) return
      if (!found || found.publication_status !== 'published') {
        setNotFound(true)
        setLoading(false)
        return
      }
      setArticle(found)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [slug, fetchArticleBySlug])

  useEffect(() => {
    if (!article) return
    let cancelled = false
    fetchRelatedArticles(article, 3).then((rows) => {
      if (!cancelled) setRelated(rows)
    })
    return () => {
      cancelled = true
    }
  }, [article, fetchRelatedArticles])

  const minutes = useMemo(
    () => (article ? readingMinutes(article.content, article.reading_minutes) : 1),
    [article],
  )

  useEffect(() => {
    if (!slug) return
    if (!article) {
      if (notFound) {
        applySeo({
          title: 'Article not found · OREMITECH',
          description: 'The article you requested could not be found.',
          canonicalPath: `/blog/${slug}`,
          robots: 'noindex,follow',
        })
      }
      return
    }

    const description = articleExcerpt(
      article.seo_description || article.excerpt,
      article.content,
      158,
    )
    const title = article.seo_title || `${article.title} · OREMITECH Knowledge Centre`
    const faq = (article.faq || []).filter((entry) => entry.question.trim() && entry.answer.trim())
    const faqSchema = buildFaqJsonLd(faq)

    applySeo({
      title,
      description,
      canonicalPath: `/blog/${article.slug}`,
      robots: 'index,follow',
      type: 'article',
      image: article.featured_image_url,
      publishedAt: article.published_at || article.created_at,
      modifiedAt: article.updated_at,
      authorName: article.author_name || 'OREMITECH Editorial',
      section: article.category?.name || null,
      tags: article.tags,
      jsonLd: [
        buildArticleJsonLd({
          title: article.title,
          description,
          slug: article.slug,
          image: article.featured_image_url,
          publishedAt: article.published_at || article.created_at,
          modifiedAt: article.updated_at,
          authorName: article.author_name || 'OREMITECH Editorial',
          section: article.category?.name || null,
          tags: article.tags,
        }),
        buildBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Knowledge Centre', path: '/blog' },
          ...(article.category
            ? [{ name: article.category.name, path: `/blog?category=${article.category.slug}` }]
            : []),
          { name: article.title, path: `/blog/${article.slug}` },
        ]),
        ...(faqSchema ? [faqSchema] : []),
      ],
    })

    trackEvent('article_view', {
      article_slug: article.slug,
      article_title: article.title,
      article_category: article.category?.name || 'uncategorised',
      author: article.author_name || 'OREMITECH Editorial',
      reading_minutes: minutes,
    })
  }, [article, slug, notFound, minutes])

  if (loading) {
    return (
      <div className="wrap py-20 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-teal border-t-transparent" />
        <p className="mt-4 text-sm font-semibold text-muted">Loading article…</p>
      </div>
    )
  }

  if (notFound || !article) {
    return (
      <div className="wrap py-20 text-center">
        <p className="text-[11px] font-extrabold uppercase tracking-wide text-emerald">Knowledge Centre</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-ink">Article not found</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          This article may have moved or been unpublished. Browse the Knowledge Centre for current guides.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Link to="/blog" className="btn btn-emerald btn-sm text-xs font-bold">
            <ArrowLeft className="h-3.5 w-3.5" /> Knowledge Centre
          </Link>
          <Link to="/shop" className="btn btn-outline btn-sm text-xs font-bold">
            Shop products
          </Link>
        </div>
      </div>
    )
  }

  const publishedDate = formatArticleDate(article.published_at || article.created_at)
  const updatedDate = formatArticleDate(article.updated_at)
  const updatedLater = isUpdated(article.published_at || article.created_at, article.updated_at)
  const shareUrl = `${window.location.origin}/blog/${article.slug}`

  return (
    <div className="bg-mist pb-14">
      <div className="wrap pt-5 md:pt-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-[11px] font-semibold text-muted">
          <Link to="/" className="hover:text-emerald">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/blog" className="hover:text-emerald">Knowledge Centre</Link>
          {article.category && (
            <>
              <ChevronRight className="h-3 w-3" />
              <Link to={`/blog?category=${article.category.slug}`} className="hover:text-emerald">
                {article.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="h-3 w-3" />
          <span className="line-clamp-1 max-w-[55vw] text-ink">{article.title}</span>
        </nav>

        <article className="mx-auto mt-4 max-w-3xl">
          <header className="rounded-2xl border border-line bg-card p-5 shadow-xs sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              {article.category && (
                <Link
                  to={`/blog?category=${article.category.slug}`}
                  className="rounded-full bg-emerald/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-emeralddeep"
                >
                  {article.category.name}
                </Link>
              )}
              {article.is_featured && (
                <span className="rounded-full bg-amber/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-amberdeep">
                  Featured guide
                </span>
              )}
            </div>

            <h1 className="mt-3 font-display text-2xl font-bold leading-tight text-ink sm:text-3xl md:text-[2.35rem]">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">{article.excerpt}</p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-[11px] font-semibold text-muted">
              <span className="inline-flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> {article.author_name || 'OREMITECH Editorial'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> {publishedDate}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> {minutes} min read
              </span>
              {updatedLater && (
                <span className="inline-flex items-center gap-1.5 text-tealdeep">
                  <RefreshCw className="h-3.5 w-3.5" /> Updated {updatedDate}
                </span>
              )}
            </div>
          </header>

          {article.featured_image_url && (
            <figure className="mt-4 overflow-hidden rounded-2xl border border-line bg-card">
              <img
                src={article.featured_image_url}
                alt={article.featured_image_alt || article.title}
                className="aspect-[16/9] w-full object-cover"
                loading="eager"
                decoding="async"
              />
              {article.featured_image_alt && (
                <figcaption className="px-4 py-2 text-[10px] text-muted">{article.featured_image_alt}</figcaption>
              )}
            </figure>
          )}

          <div className="mt-4 rounded-2xl border border-line bg-card p-5 shadow-xs sm:p-8">
            <ArticleBody html={article.content} />

            {article.tags.length > 0 && (
              <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                <Tag className="h-3.5 w-3.5 text-muted" />
                {article.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/blog?q=${encodeURIComponent(tag)}`}
                    className="rounded-full border border-line px-2.5 py-1 text-[10px] font-bold text-muted transition hover:border-emerald hover:text-emerald"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}

            {article.faq.length > 0 && (
              <section className="mt-8 border-t border-line pt-6">
                <h2 className="font-display text-base font-bold text-ink">Frequently asked questions</h2>
                <div className="mt-3 divide-y divide-line">
                  {article.faq.map((entry, index) => (
                    <details key={index} className="group py-3">
                      <summary className="cursor-pointer list-none text-sm font-bold text-ink marker:hidden">
                        <span className="flex items-start justify-between gap-3">
                          {entry.question}
                          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted transition group-open:rotate-90" />
                        </span>
                      </summary>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{entry.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </div>

          <ProductMentions
            productIds={article.related_product_ids}
            articleSlug={article.slug}
            categorySlug={article.category?.slug}
            categoryName={article.category?.name}
          />

          <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-line bg-card p-5 shadow-xs sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-bold text-ink">Was this guide useful?</p>
              <p className="mt-1 text-xs text-muted">
                Share it with someone comparing laptops, or ask us a question before you buy.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: article.title, url: shareUrl })
                  } else {
                    navigator.clipboard.writeText(shareUrl)
                  }
                  trackEvent('article_share', { article_slug: article.slug })
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-[11px] font-bold text-ink transition hover:border-emerald hover:text-emerald"
              >
                <Share2 className="h-3.5 w-3.5" /> Share
              </button>
              <a
                href={`mailto:?subject=${encodeURIComponent(article.title)}&body=${encodeURIComponent(shareUrl)}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-[11px] font-bold text-ink transition hover:border-emerald hover:text-emerald"
              >
                <Mail className="h-3.5 w-3.5" /> Email
              </a>
              <Link to="/contact" className="inline-flex items-center gap-1.5 rounded-lg bg-emerald px-3 py-2 text-[11px] font-bold text-white transition hover:bg-emeralddeep">
                Ask a question <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </article>

        {related.length > 0 && (
          <section className="mx-auto mt-10 max-w-5xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-ink">Related guides</h2>
              <Link to="/blog" className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald hover:text-emeralddeep">
                All guides <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <ArticleCard key={item.id} article={item} />
              ))}
            </div>
          </section>
        )}

        <div className="mx-auto mt-8 max-w-5xl">
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-emerald">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to the Knowledge Centre
          </Link>
        </div>
      </div>
    </div>
  )
}
