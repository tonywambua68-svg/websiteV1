import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useBlogStore } from '@/store/blogStore'
import { trackEvent } from '@/components/Analytics'
import { applySeo, buildBlogListingJsonLd, buildBreadcrumbJsonLd } from '@/lib/seo'
import { matchesQuery } from '@/lib/blog'
import ArticleCard from '@/components/blog/ArticleCard'
import { ArrowRight, BookOpen, Clock, Search, X } from 'lucide-react'

export default function BlogListing() {
  const { articles, categories, loading, error, fetchArticles, fetchCategories } = useBlogStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')

  const categorySlug = searchParams.get('category') || ''
  const activeCategory = useMemo(
    () => categories.find((category) => category.slug === categorySlug) || null,
    [categories, categorySlug],
  )

  useEffect(() => {
    fetchCategories()
    fetchArticles({ status: 'published', limit: 60 })
  }, [fetchCategories, fetchArticles])

  useEffect(() => {
    setQuery(searchParams.get('q') || '')
  }, [searchParams])

  const published = useMemo(
    () => articles.filter((article) => article.publication_status === 'published'),
    [articles],
  )

  const byCategory = useMemo(
    () => (categorySlug ? published.filter((article) => article.category?.slug === categorySlug) : published),
    [published, categorySlug],
  )

  const filtered = useMemo(
    () => byCategory.filter((article) => matchesQuery(article, query)),
    [byCategory, query],
  )

  const featured = useMemo(() => {
    if (query) return null
    const candidates = byCategory
    return candidates.find((article) => article.is_featured) || candidates[0] || null
  }, [byCategory, query])

  const latest = useMemo(
    () => filtered.filter((article) => article.id !== featured?.id),
    [filtered, featured],
  )

  const title = activeCategory
    ? `${activeCategory.name} · OREMITECH Knowledge Centre`
    : 'OREMITECH Knowledge Centre · Laptop & Computer Guides for Kenya'
  const description = activeCategory
    ? activeCategory.seo_description || `Practical ${activeCategory.name.toLowerCase()} articles for Kenyan buyers from OREMITECH.`
    : 'Practical, accurate guides on laptops, computer accessories, maintenance and technology buying decisions for Kenyan customers.'

  useEffect(() => {
    applySeo({
      title,
      description,
      canonicalPath: categorySlug ? `/blog?category=${categorySlug}` : '/blog',
      robots: query ? 'noindex,follow' : 'index,follow',
      jsonLd: [
        buildBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Knowledge Centre', path: '/blog' },
        ]),
        ...(query
          ? []
          : [buildBlogListingJsonLd(title, description, categorySlug ? `/blog?category=${categorySlug}` : '/blog', filtered)]),
      ],
    })
  }, [title, description, categorySlug, query, filtered])

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next, { replace: true })
  }

  const handleSearch = (value: string) => {
    setQuery(value)
    const next = new URLSearchParams(searchParams)
    if (value.trim()) next.set('q', value.trim())
    else next.delete('q')
    setSearchParams(next, { replace: true })
    if (value.trim().length >= 3) trackEvent('blog_search', { search_term: value.trim() })
  }

  return (
    <div className="bg-mist pb-14">
      {/* Hero */}
      <section className="border-b border-line bg-card">
        <div className="wrap py-8 md:py-12">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-emerald">
            <BookOpen className="h-4 w-4" /> OREMITECH Knowledge Centre
          </div>
          <h1 className="mt-3 max-w-3xl font-display text-2xl font-bold leading-tight text-ink md:text-4xl">
            Practical guides for buying, using and maintaining computers in Kenya
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
            Clear explanations, honest comparisons and step-by-step advice — written for real buyers, not search engines.
            Every guide is reviewed before it is published.
          </p>

          <div className="mt-6 flex max-w-xl items-center gap-2 rounded-xl border border-line bg-mist/60 px-3 py-2 focus-within:border-emerald">
            <Search className="h-4 w-4 shrink-0 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => handleSearch(event.target.value)}
              placeholder="Search guides, for example SSD or RAM"
              aria-label="Search articles"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
            />
            {query && (
              <button type="button" onClick={() => handleSearch('')} aria-label="Clear search" className="text-muted hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="wrap pt-6 md:pt-8">
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => updateParam('category', '')}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
              !categorySlug ? 'border-ink bg-ink text-white' : 'border-line bg-card text-muted hover:border-emerald hover:text-emerald'
            }`}
          >
            All topics
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => updateParam('category', category.slug === categorySlug ? '' : category.slug)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
                category.slug === categorySlug
                  ? 'border-ink bg-ink text-white'
                  : 'border-line bg-card text-muted hover:border-emerald hover:text-emerald'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {loading && published.length === 0 && (
          <div className="py-16 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-teal border-t-transparent" />
            <p className="mt-4 text-sm font-semibold text-muted">Loading guides…</p>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-error/30 bg-error/10 p-4 text-xs font-bold text-error">
            {error}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-line bg-card p-10 text-center">
            <h2 className="font-display text-lg font-bold text-ink">
              {query ? `No guides match “${query}”` : 'No articles published yet'}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {query
                ? 'Try a broader term such as “laptop”, “SSD” or “battery”.'
                : 'New guides are added regularly. Browse the shop in the meantime.'}
            </p>
            <div className="mt-4 flex justify-center gap-2">
              {query && (
                <button type="button" onClick={() => handleSearch('')} className="btn btn-outline btn-sm text-xs font-bold">
                  Clear search
                </button>
              )}
              <Link to="/shop" className="btn btn-emerald btn-sm text-xs font-bold">
                Browse products
              </Link>
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            {featured && (
              <div className="mb-8">
                <ArticleCard article={featured} variant="featured" />
              </div>
            )}

            {filtered.length > 0 && (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold text-ink">
                    {query ? `Results for “${query}”` : featured ? 'Latest guides' : 'All guides'}
                  </h2>
                  <span className="text-[11px] font-semibold text-muted">{filtered.length} article{filtered.length === 1 ? '' : 's'}</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {latest.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <section className="rounded-xl border border-line bg-card p-4 shadow-xs">
              <h2 className="font-display text-sm font-bold text-ink">Browse by topic</h2>
              <ul className="mt-3 space-y-1.5">
                {categories.map((category) => {
                  const count = published.filter((article) => article.category?.slug === category.slug).length
                  return (
                    <li key={category.id}>
                      <Link
                        to={`/blog?category=${category.slug}`}
                        className="flex items-start justify-between gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-muted transition hover:bg-mist hover:text-emerald"
                      >
                        <span>{category.name}</span>
                        <span className="shrink-0 text-[10px] text-muted">{count}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>

            {published.length > 0 && (
              <section className="rounded-xl border border-line bg-card p-4 shadow-xs">
                <h2 className="flex items-center gap-1.5 font-display text-sm font-bold text-ink">
                  <Clock className="h-3.5 w-3.5 text-emerald" /> Recently published
                </h2>
                <div className="mt-3 space-y-3">
                  {published.slice(0, 5).map((article) => (
                    <ArticleCard key={article.id} article={article} variant="compact" />
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-xl border border-line bg-emerald p-4 text-white shadow-xs">
              <h2 className="font-display text-sm font-bold">Need help choosing?</h2>
              <p className="mt-1.5 text-[11px] leading-relaxed text-white/85">
                Tell us what you will use the computer for and a realistic budget. We will point you to suitable options
                without pressure.
              </p>
              <Link
                to="/contact"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[11px] font-extrabold text-emerald transition hover:bg-mint"
              >
                Ask OREMITECH <ArrowRight className="h-3 w-3" />
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
