import { Link } from 'react-router-dom'
import { ArrowRight, Calendar, Clock } from 'lucide-react'
import type { BlogArticle } from '@/lib/domain'
import { articleExcerpt, formatDateShort, readingMinutes } from '@/lib/blog'

interface ArticleCardProps {
  article: BlogArticle
  variant?: 'default' | 'featured' | 'compact'
}

export default function ArticleCard({ article, variant = 'default' }: ArticleCardProps) {
  const href = `/blog/${article.slug}`
  const minutes = readingMinutes(article.content, article.reading_minutes)
  const date = formatDateShort(article.published_at || article.created_at)
  const categoryName = article.category?.name || 'Technology'

  if (variant === 'featured') {
    return (
      <article className="group overflow-hidden rounded-2xl border border-line bg-card shadow-xs">
        <div className="grid gap-0 md:grid-cols-2">
          <Link to={href} className="relative block aspect-[16/10] overflow-hidden bg-mist md:aspect-auto md:min-h-[320px]">
            {article.featured_image_url ? (
              <img
                src={article.featured_image_url}
                alt={article.featured_image_alt || article.title}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                loading="eager"
                decoding="async"
              />
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center text-xs font-bold text-muted">
                {article.title}
              </div>
            )}
            <span className="absolute left-3 top-3 rounded-full bg-emerald px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">
              Featured
            </span>
          </Link>
          <div className="flex flex-col justify-center p-5 sm:p-7">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-emerald">{categoryName}</p>
            <Link to={href}>
              <h2 className="mt-2 font-display text-xl font-bold leading-snug text-ink transition group-hover:text-emerald md:text-2xl">
                {article.title}
              </h2>
            </Link>
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
              {articleExcerpt(article.excerpt, article.content, 220)}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-muted">
              <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {date}</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {minutes} min read</span>
            </div>
            <Link
              to={href}
              className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-lg bg-emerald px-3.5 py-2 text-xs font-bold text-white transition hover:bg-emeralddeep"
            >
              Read the guide <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </article>
    )
  }

  if (variant === 'compact') {
    return (
      <article className="group flex gap-3">
        {article.featured_image_url && (
          <Link to={href} className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-mist">
            <img
              src={article.featured_image_url}
              alt={article.featured_image_alt || article.title}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </Link>
        )}
        <div className="min-w-0">
          <Link to={href}>
            <h3 className="line-clamp-2 text-xs font-bold leading-snug text-ink transition group-hover:text-emerald">
              {article.title}
            </h3>
          </Link>
          <p className="mt-1 text-[10px] font-semibold text-muted">{date} · {minutes} min</p>
        </div>
      </article>
    )
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-card shadow-xs transition hover:border-emerald hover:shadow-sm">
      <Link to={href} className="block aspect-[16/10] overflow-hidden bg-mist">
        {article.featured_image_url ? (
          <img
            src={article.featured_image_url}
            alt={article.featured_image_alt || article.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-[11px] font-bold text-muted">
            {article.title}
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[10px] font-extrabold uppercase tracking-wide text-emerald">{categoryName}</p>
        <Link to={href}>
          <h2 className="mt-1.5 line-clamp-2 font-display text-base font-bold leading-snug text-ink transition group-hover:text-emerald">
            {article.title}
          </h2>
        </Link>
        <p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-muted">
          {articleExcerpt(article.excerpt, article.content, 130)}
        </p>
        <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-[10px] font-semibold text-muted">
          <span>{date}</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {minutes} min</span>
        </div>
      </div>
    </article>
  )
}
