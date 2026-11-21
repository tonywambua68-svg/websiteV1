import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import { useBlogStore } from '@/store/blogStore'
import { applySeo } from '@/lib/seo'
import { formatArticleDate, readingMinutes } from '@/lib/blog'
import ArticleBody from '@/components/blog/ArticleBody'
import ProductMentions from '@/components/blog/ProductMentions'
import type { BlogArticle } from '@/lib/domain'
import { ArrowLeft, Eye, ExternalLink, Loader2 } from 'lucide-react'

export default function AdminBlogPreview() {
  const { id } = useParams<{ id: string }>()
  const { fetchArticleById } = useBlogStore()
  const [article, setArticle] = useState<BlogArticle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    fetchArticleById(id).then((found) => {
      if (!cancelled) {
        setArticle(found)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [id, fetchArticleById])

  useEffect(() => {
    applySeo({
      title: article ? `Preview: ${article.title} · OREMITECH` : 'Article preview · OREMITECH',
      description: article?.seo_description || article?.excerpt || 'Internal article preview.',
      canonicalPath: article ? `/blog/${article.slug}` : '/admin/blog',
      robots: 'noindex,nofollow',
    })
  }, [article])

  return (
    <AdminLayout
      title="Article Preview"
      subtitle={article ? article.title : 'Review before publishing'}
      actions={
        article ? (
          <div className="flex flex-wrap gap-2">
            <Link to={`/admin/blog/edit/${article.id}`} className="btn btn-outline !h-9 text-xs font-bold">
              <ArrowLeft className="h-4 w-4" /> Back to editor
            </Link>
            {article.publication_status === 'published' && (
              <a
                href={`/blog/${article.slug}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-emerald !h-9 text-xs font-bold"
              >
                <ExternalLink className="h-4 w-4" /> Open live page
              </a>
            )}
          </div>
        ) : undefined
      }
    >
      <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber/40 bg-amber/5 p-3 text-[11px] font-bold text-amberdeep">
        <Eye className="mt-0.5 h-4 w-4 shrink-0" />
        This preview is private and excluded from search engines. Drafts, scheduled and archived articles are never
        public until explicitly published.
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm font-bold text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading article…
        </div>
      ) : !article ? (
        <div className="rounded-xl border border-error/30 bg-error/10 p-4 text-sm font-bold text-error">
          This article could not be found.
        </div>
      ) : (
        <article className="mx-auto max-w-3xl">
          {article.category && (
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-emerald">{article.category.name}</p>
          )}
          <h1 className="mt-1 font-display text-2xl font-bold text-ink md:text-3xl">{article.title}</h1>
          <p className="mt-1 text-[11px] font-semibold text-muted">
            {article.author_name || 'OREMITECH Editorial'} · {formatArticleDate(article.published_at || article.created_at)} ·{' '}
            {readingMinutes(article.content, article.reading_minutes)} min read · status: {article.publication_status}
          </p>
          {article.excerpt && <p className="mt-3 text-sm leading-relaxed text-muted">{article.excerpt}</p>}

          {article.featured_image_url && (
            <figure className="mt-4 overflow-hidden rounded-2xl border border-line bg-card">
              <img
                src={article.featured_image_url}
                alt={article.featured_image_alt || article.title}
                className="aspect-[16/9] w-full object-cover"
              />
              {article.featured_image_alt && (
                <figcaption className="px-3 py-2 text-[10px] text-muted">{article.featured_image_alt}</figcaption>
              )}
            </figure>
          )}

          <div className="mt-4 rounded-2xl border border-line bg-card p-5 shadow-xs sm:p-8">
            <ArticleBody html={article.content} />
            {article.faq.length > 0 && (
              <section className="mt-8 border-t border-line pt-6">
                <h2 className="font-display text-base font-bold text-ink">Frequently asked questions</h2>
                <div className="mt-3 space-y-3">
                  {article.faq.map((entry, index) => (
                    <div key={index}>
                      <p className="text-sm font-bold text-ink">{entry.question}</p>
                      <p className="mt-1 text-sm text-muted">{entry.answer}</p>
                    </div>
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
        </article>
      )}
    </AdminLayout>
  )
}
