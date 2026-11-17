import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useBlogStore } from '@/store/blogStore'
import { usePageMeta } from '@/components/Analytics'
import type { BlogCategory } from '@/lib/domain'
import { ArrowRight, Calendar, User, MessageSquare } from 'lucide-react'

const READ_TIME_PER_WORD = 200

function readTime(content: string): number {
  const words = content.split(/\s+/).filter(Boolean).length
  return Math.ceil(words / READ_TIME_PER_WORD) || 1
}

function formatDate(dateString: string | null): string {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function BlogListing() {
  const { articles, categories, loading, error, fetchArticles, fetchCategories } = useBlogStore()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const categorySlug = searchParams.get('category')
  const [activeCategory, setActiveCategory] = useState<BlogCategory | null>(null)

  useEffect(() => {
    fetchCategories()
    fetchArticles({
      status: 'published',
      categoryId: categorySlug ? undefined : undefined,
    })
  }, [fetchArticles, fetchCategories, categorySlug])

  useEffect(() => {
    if (categorySlug) {
      const cat = categories.find((c) => c.slug === categorySlug)
      setActiveCategory(cat || null)
    } else {
      setActiveCategory(null)
    }
  }, [categorySlug, categories])

  const pageTitle = activeCategory
    ? `${activeCategory.name} · OREMITECH Blog`
    : 'OREMITECH Blog · Verified Laptops & Electronics in Kenya'
  const pageDescription = activeCategory
    ? activeCategory.seo_description || `Read about ${activeCategory.name} at OREMITECH Kenya.`
    : 'OREMITECH blog — helpful guides on laptops, computers, and electronics in Kenya. Verified specs, buying advice, and local delivery.'

  usePageMeta(pageTitle, pageDescription)

  const filteredArticles = articles.filter((a) =>
    categorySlug ? a.category?.slug === categorySlug : true
  )

  return (
    <div className="bg-mist pb-12">
      <section className="wrap pt-6 md:pt-10">
        <div className="flex items-center justify-between border-b border-line pb-6 md:pb-10">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink md:text-3xl">
              {activeCategory ? activeCategory.name : 'Blog'}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {activeCategory
                ? activeCategory.seo_description || `Articles about ${activeCategory.name}.`
                : 'Helpful guides on laptops, computers, and electronics in Kenya. Verified specifications and buying advice.'}
            </p>
          </div>
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald hover:text-emeralddeep underline underline-offset-4"
          >
            All articles <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Category filter chips */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                const params = new URLSearchParams(searchParams)
                if (cat.slug === categorySlug) params.delete('category')
                else params.set('category', cat.slug)
                const newSearch = params.toString()
                const newPath = newSearch ? `?${newSearch}` : ''
                window.history.pushState({}, '', location.pathname + newPath)
                fetchArticles({ status: 'published', categoryId: cat.id })
                setActiveCategory(cat.slug === categorySlug ? null : cat)
              }}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition ${
                cat.slug === categorySlug
                  ? 'bg-ink border-ink text-white'
                  : 'bg-card border-line text-muted hover:bg-emerald hover:border-emerald hover:text-emerald'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {loading && (
          <div className="wrap py-16 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-teal border-t-transparent" />
            <p className="mt-4 font-display text-sm font-semibold text-muted">Loading articles…</p>
          </div>
        )}

        {!loading && filteredArticles.length === 0 && (
          <div className="wrap py-16 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-mist/50 flex items-center justify-center text-muted">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h2 className="mt-4 font-display text-lg font-bold text-ink">No articles yet</h2>
            <p className="mt-1 text-sm text-muted">
              {activeCategory ? `No published articles in ${activeCategory.name} yet.` : 'Check back soon for new guides.'}
            </p>
          </div>
        )}

        {!loading && filteredArticles.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map((article) => (
              <article
                key={article.id}
                className="group rounded-xl border border-line bg-card p-5 hover:border-emerald hover:shadow-sm transition"
              >
                {article.featured_image_url && (
                  <div className="mb-4 rounded-lg overflow-hidden bg-mist">
                    <img
                      src={article.featured_image_url}
                      alt={article.featured_image_alt || article.title}
                      className="w-full h-40 object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2 text-xs text-muted">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDate(article.published_at)}</span>
                  <span className="mx-1">·</span>
                  <User className="h-3.5 w-3.5" />
                  <span>{article.category?.name || 'General'}</span>
                </div>
                <Link
                  to={`/blog/${article.slug}`}
                  className="block mb-2"
                >
                  <h2 className="font-display text-lg font-bold text-ink group-hover:text-emerald transition line-clamp-2">
                    {article.title}
                  </h2>
                </Link>
                <p className="mt-1 text-sm text-[#4a6b5c] line-clamp-2">
                  {article.excerpt || article.content.slice(0, 160) + '…'}
                </p>
                <div className="mt-4 flex items-center justify-between gap-3 text-xs font-bold text-muted">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {readTime(article.content)} min read
                  </span>
                  <span className="flex items-center gap-1 text-emerald">
                    Read more <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
